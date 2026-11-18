"""Local downloader for music released under a free license.

Searches Internet Archive collections of netlabel and open audio, keeps only
items with a Creative Commons or public-domain license, and saves those
files into the downloads folder. It does not accept arbitrary web addresses.
"""

from __future__ import annotations

import json
import os
import re
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, unquote, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
DOWNLOADS = ROOT / "downloads"
LIBRARY_PATH = ROOT / "library.json"

HOST = "127.0.0.1"
DEFAULT_PORT = 8765
MAX_DOWNLOAD_BYTES = 80 * 1024 * 1024
USER_AGENT = "FreeMusicLocal/1.0 (personal player for Creative Commons audio)"

AUDIO_FORMATS = {
    "mp3": "MP3",
    "vbr mp3": "MP3",
    "128kbps mp3": "MP3",
    "64kbps mp3": "MP3",
    "ogg vorbis": "Ogg",
    "vbr ogg vorbis": "Ogg",
    "flac": "FLAC",
    "24bit flac": "FLAC",
    "wave": "WAV",
    "aiff": "AIFF",
    "m4a": "M4A",
    "aac": "AAC",
    "shorten": "SHN",
}

PREFERRED_FORMATS = {"MP3", "M4A", "AAC", "Ogg"}
LIBRARY_LOCK = threading.Lock()

LICENSE_NOTES = (
    ("by-nc-nd", "Creative Commons BY-NC-ND", "Free to download. Don't sell it or change it."),
    ("by-nc-sa", "Creative Commons BY-NC-SA", "Free to download. Don't sell it."),
    ("by-nd", "Creative Commons BY-ND", "Free to download. Don't change it."),
    ("by-nc", "Creative Commons BY-NC", "Free to download. Don't sell it."),
    ("by-sa", "Creative Commons BY-SA", "Free to download and share."),
    ("by", "Creative Commons BY", "Free to download. Credit the artist if you share it."),
)


class CatalogError(Exception):
    def __init__(self, message: str, status: int = 502) -> None:
        super().__init__(message)
        self.status = status


def as_text(value) -> str:
    if isinstance(value, list):
        return ", ".join(str(item).strip() for item in value if str(item).strip())
    if value is None:
        return ""
    return str(value).strip()


def license_info(metadata: dict) -> dict | None:
    raw = ""
    for field in ("licenseurl", "license", "rights"):
        candidate = as_text(metadata.get(field))
        if candidate:
            raw = candidate
            break
    lowered = raw.lower()
    if not lowered:
        return None
    if any(token in lowered for token in ("publicdomain/zero", "/cc0", "creativecommons.org/publicdomain/zero")):
        return {
            "label": "Public domain (CC0)",
            "note": "Free to download and use.",
            "url": raw,
        }
    if "publicdomain" in lowered or "/noc-" in lowered or "/nkc" in lowered:
        return {
            "label": "Public domain",
            "note": "Free to download and use.",
            "url": raw,
        }
    if "creativecommons.org" not in lowered:
        return None
    for key, label, note in LICENSE_NOTES:
        if f"/{key}/" in lowered or lowered.rstrip("/").endswith(f"/{key}"):
            return {"label": label, "note": note, "url": raw}
    return {
        "label": "Creative Commons",
        "note": "Free to download under the license on this recording.",
        "url": raw,
    }


def lucene_phrase(text: str) -> str:
    cleaned = re.sub(r'["\\]', " ", text).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned[:120]


def lucene_term(word: str) -> str:
    if word.upper() in {"AND", "OR", "NOT"}:
        return f'"{word}"'
    return re.sub(r"([+\-!(){}\[\]^\"~*?:\\/])", r"\\\1", word)


def singer_clause(phrase: str) -> str:
    """Match each word in the singer name, the song title, or the subject."""
    terms = [lucene_term(word) for word in phrase.split(" ") if word]
    required = []
    for term in terms:
        required.append(
            f"(creator:{term}^5 OR artist:{term}^5 OR title:{term} OR subject:{term})"
        )
    return " AND ".join(required)


ARABIC_BROWSE = {"arabic", "عربي", "عربية", "موسيقى عربية", "arabic music"}
ARABIC_MATCH = '(arabic OR oud OR maqam OR tarab OR "middle east" OR "middle eastern")'


def base_query() -> str:
    # Netlabels are music releases the label published under a free license.
    return (
        "collection:netlabels AND mediatype:audio AND format:MP3 "
        "AND (licenseurl:*creativecommons* OR licenseurl:*publicdomain*)"
    )


def search_catalog(query: str, page: int) -> dict:
    page = min(max(page, 1), 40)
    phrase = lucene_phrase(query)
    q = base_query()
    if phrase.casefold() in ARABIC_BROWSE:
        q = f"{ARABIC_MATCH} AND {q}"
    elif phrase:
        q = f"({singer_clause(phrase)}) AND {q}"
    params = [
        ("q", q),
        ("rows", "12"),
        ("page", str(page)),
        ("output", "json"),
        ("sort[]", "downloads desc"),
    ]
    for field in ("identifier", "title", "creator", "artist", "licenseurl", "year", "downloads"):
        params.append(("fl[]", field))
    url = "https://archive.org/advancedsearch.php?" + "&".join(
        f"{quote(key)}={quote(value)}" for key, value in params
    )
    payload = fetch_json(url, timeout=35)
    response = payload.get("response") or {}
    albums = []
    for doc in response.get("docs") or []:
        info = license_info(doc)
        identifier = as_text(doc.get("identifier"))
        if not info or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,199}", identifier):
            continue
        albums.append(
            {
                "identifier": identifier,
                "title": as_text(doc.get("title")) or identifier,
                "creator": as_text(doc.get("creator")) or as_text(doc.get("artist")) or "Unknown artist",
                "year": as_text(doc.get("year")),
                "license": info,
            }
        )
    total = int(response.get("numFound") or 0)
    return {"query": phrase, "page": page, "total": total, "albums": albums}


def fetch_json(url: str, timeout: int) -> dict:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urlopen(request, timeout=timeout) as response:
            if not host_allowed(response.geturl()):
                raise CatalogError("The catalog returned an unexpected address.")
            return json.loads(response.read().decode("utf-8", errors="replace"))
    except HTTPError as error:
        raise CatalogError("The free-music catalog could not complete that search.", 502) from error
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise CatalogError(
            "The free-music catalog did not respond. Check your connection and try again.",
            502,
        ) from error


def host_allowed(url: str) -> bool:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    return parsed.scheme == "https" and (host == "archive.org" or host.endswith(".archive.org"))


def format_duration(length) -> str:
    if length is None or length == "":
        return ""
    text = str(length)
    if ":" in text:
        return text
    try:
        seconds = int(float(text))
    except ValueError:
        return ""
    minutes, secs = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


def format_size(size) -> str:
    try:
        amount = int(size)
    except (TypeError, ValueError):
        return ""
    if amount < 1024:
        return f"{amount} B"
    if amount < 1024 * 1024:
        return f"{amount / 1024:.0f} KB"
    return f"{amount / (1024 * 1024):.1f} MB"


def audio_kind(entry: dict) -> str | None:
    name = as_text(entry.get("name")).lower()
    file_format = as_text(entry.get("format")).lower()
    if not name or name.endswith((".xml", ".jpg", ".jpeg", ".png", ".gif", ".torrent", ".zip", ".gz", ".txt", ".json")):
        return None
    if any(word in file_format for word in ("spectrogram", "metadata", "torrent", "png", "jpeg", "text", "checksum")):
        return None
    if file_format in AUDIO_FORMATS:
        return AUDIO_FORMATS[file_format]
    for extension, label in (
        (".mp3", "MP3"),
        (".m4a", "M4A"),
        (".aac", "AAC"),
        (".ogg", "Ogg"),
        (".flac", "FLAC"),
        (".wav", "WAV"),
    ):
        if name.endswith(extension):
            return label
    return None


def safe_archive_name(name: str) -> str:
    cleaned = name.replace("\\", "/").strip()
    parts = [part for part in cleaned.split("/") if part not in ("", ".", "..")]
    if not parts or len(parts) != len([part for part in cleaned.split("/") if part]):
        raise CatalogError("That track is not available.", 400)
    if any(len(part) > 180 for part in parts):
        raise CatalogError("That track is not available.", 400)
    return "/".join(parts)


def song_key(filename: str) -> str:
    stem = Path(filename).stem.lower()
    return re.sub(r"_(64|96|128|192|256)kb$|_vbr$", "", stem)


def best_copy(tracks: list[dict]) -> list[dict]:
    grouped: dict[str, list[dict]] = {}
    for track in tracks:
        grouped.setdefault(song_key(track["file"]), []).append(track)
    chosen = []
    for group in grouped.values():
        chosen.append(sorted(group, key=track_rank)[0])
    chosen.sort(key=track_sort_key)
    return chosen


def track_rank(track: dict) -> tuple:
    name = track["file"].lower()
    low_bitrate = 1 if re.search(r"_(64|96)kb\.", name) else 0
    derivative = 1 if re.search(r"_(64|96|128|192|256)kb\.|_vbr\.", name) else 0
    kind_rank = {"MP3": 0, "M4A": 1, "AAC": 2, "Ogg": 3, "FLAC": 4, "WAV": 5}.get(track["format"], 9)
    return (low_bitrate, derivative, kind_rank, -(track.get("bytes") or 0))


def track_number(value: str) -> str:
    match = re.match(r"\s*(\d+)", value or "")
    if not match:
        return ""
    return match.group(1).zfill(2)


def track_sort_key(track: dict) -> tuple:
    number = track.get("number") or ""
    try:
        numeric = int(re.search(r"\d+", str(number)).group())  # type: ignore[union-attr]
    except (AttributeError, ValueError):
        numeric = 10_000
    return (numeric, track.get("title") or "")


def get_release(identifier: str) -> dict:
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,199}", identifier):
        raise CatalogError("That release is not available.", 404)
    payload = fetch_json(f"https://archive.org/metadata/{quote(identifier)}", timeout=35)
    metadata = payload.get("metadata") or {}
    mediatype = as_text(metadata.get("mediatype")).lower()
    if mediatype and mediatype != "audio":
        raise CatalogError("That item is not music audio.", 404)
    info = license_info(metadata)
    if not info:
        raise CatalogError("That recording does not have a free license.", 403)
    tracks = []
    others = []
    for entry in payload.get("files") or []:
        kind = audio_kind(entry)
        if not kind:
            continue
        try:
            filename = safe_archive_name(as_text(entry.get("name")))
        except CatalogError:
            continue
        try:
            size = int(entry.get("size") or 0)
        except (TypeError, ValueError):
            size = 0
        if size > MAX_DOWNLOAD_BYTES:
            continue
        title = as_text(entry.get("title")) or Path(filename).stem.replace("_", " ")
        track = {
            "file": filename,
            "title": title,
            "creator": as_text(entry.get("creator")) or as_text(metadata.get("creator")) or "Unknown artist",
            "album": as_text(entry.get("album")) or as_text(metadata.get("title")) or identifier,
            "number": track_number(as_text(entry.get("track"))),
            "duration": format_duration(entry.get("length")),
            "bytes": size,
            "size": format_size(size),
            "format": kind,
            "url": archive_download_url(identifier, filename),
        }
        if kind in PREFERRED_FORMATS:
            tracks.append(track)
        else:
            others.append(track)
    chosen = best_copy(tracks + others)
    if not chosen:
        raise CatalogError("That release has no downloadable audio file.", 404)
    car_formats = {"MP3", "M4A", "AAC"}
    return {
        "identifier": identifier,
        "title": as_text(metadata.get("title")) or identifier,
        "creator": as_text(metadata.get("creator")) or as_text(metadata.get("artist")) or "Unknown artist",
        "year": as_text(metadata.get("year")),
        "license": info,
        "tracks": [track for track in chosen if track["format"] in car_formats],
        "others": [track for track in chosen if track["format"] not in car_formats],
    }


def archive_download_url(identifier: str, filename: str) -> str:
    encoded = "/".join(quote(part) for part in filename.split("/"))
    return f"https://archive.org/download/{quote(identifier)}/{encoded}"


def windows_name(value: str) -> str:
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', " ", value)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .")
    return cleaned[:80] or "track"


def unique_path(filename: str) -> Path:
    candidate = DOWNLOADS / filename
    if not candidate.exists():
        return candidate
    stem = candidate.stem
    suffix = candidate.suffix
    number = 2
    while True:
        candidate = DOWNLOADS / f"{stem} ({number}){suffix}"
        if not candidate.exists():
            return candidate
        number += 1


def read_library() -> list[dict]:
    if not LIBRARY_PATH.exists():
        return []
    try:
        data = json.loads(LIBRARY_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    if not isinstance(data, list):
        return []
    kept = []
    for item in data:
        path = Path(str(item.get("path") or ""))
        if path.is_file():
            kept.append(item)
    return kept


def write_library(items: list[dict]) -> None:
    LIBRARY_PATH.write_text(json.dumps(items, indent=2), encoding="utf-8")


def find_saved(identifier: str, filename: str) -> dict | None:
    for item in read_library():
        if item.get("identifier") == identifier and item.get("file") == filename:
            if Path(str(item.get("path") or "")).is_file():
                return item
    return None


def prepend_id3(path: Path, title: str, artist: str, album: str) -> None:
    if path.suffix.lower() != ".mp3":
        return
    original = path.read_bytes()
    if original.startswith(b"ID3") or original.startswith(b"RIFF"):
        return

    def frame(frame_id: str, text: str) -> bytes:
        data = b"\x01" + text[:180].encode("utf-16")
        return frame_id.encode("ascii") + len(data).to_bytes(4, "big") + b"\x00\x00" + data

    frames = b"".join(
        frame(key, value)
        for key, value in (("TIT2", title), ("TPE1", artist), ("TALB", album))
        if value
    )
    if not frames:
        return
    size = len(frames)
    synchsafe = bytes(
        ((size >> 21) & 0x7F, (size >> 14) & 0x7F, (size >> 7) & 0x7F, size & 0x7F)
    )
    path.write_bytes(b"ID3" + bytes((3, 0, 0)) + synchsafe + frames + original)


def download_track(identifier: str, filename: str) -> dict:
    filename = safe_archive_name(filename)
    release = get_release(identifier)
    match = next(
        (track for track in release["tracks"] + release["others"] if track["file"] == filename),
        None,
    )
    if match is None:
        raise CatalogError("That track is not part of a free release.", 404)
    existing = find_saved(identifier, filename)
    if existing:
        existing["alreadySaved"] = True
        return existing

    extension = Path(filename).suffix.lower()
    if extension not in {".mp3", ".m4a", ".aac", ".ogg", ".flac", ".wav"}:
        extension = ".mp3" if match["format"] == "MP3" else ""
    number = windows_name(match["number"])
    prefix = f"{int(number):02d} " if number.isdigit() else ""
    nice_name = windows_name(
        f"{prefix}{match['creator']} - {match['title']}"
    )
    destination = unique_path(f"{nice_name}{extension or '.mp3'}")
    partial = destination.with_suffix(destination.suffix + ".part")
    url = archive_download_url(identifier, filename)
    request = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(request, timeout=180) as response:
            final_url = response.geturl()
            if not host_allowed(final_url):
                raise CatalogError("The download address was not from the free catalog.")
            content_type = (response.headers.get("Content-Type") or "").lower()
            if content_type.startswith("text/"):
                raise CatalogError("The catalog did not return an audio file.")
            declared = response.headers.get("Content-Length")
            if declared and int(declared) > MAX_DOWNLOAD_BYTES:
                raise CatalogError("That file is too large to save for the car.", 400)
            DOWNLOADS.mkdir(parents=True, exist_ok=True)
            written = 0
            with partial.open("wb") as handle:
                while True:
                    chunk = response.read(64 * 1024)
                    if not chunk:
                        break
                    written += len(chunk)
                    if written > MAX_DOWNLOAD_BYTES:
                        raise CatalogError("That file is too large to save for the car.", 400)
                    handle.write(chunk)
    except CatalogError:
        partial.unlink(missing_ok=True)
        raise
    except (URLError, TimeoutError, OSError, ValueError) as error:
        partial.unlink(missing_ok=True)
        raise CatalogError("The song could not be saved. Try again.", 502) from error

    if written < 1024:
        partial.unlink(missing_ok=True)
        raise CatalogError("The catalog returned an empty file.", 502)
    partial.replace(destination)
    try:
        prepend_id3(destination, match["title"], match["creator"], match["album"])
    except OSError:
        pass

    item = {
        "identifier": identifier,
        "file": filename,
        "title": match["title"],
        "creator": match["creator"],
        "album": match["album"],
        "license": release["license"]["label"],
        "path": str(destination),
        "bytes": destination.stat().st_size,
        "size": format_size(destination.stat().st_size),
    }
    with LIBRARY_LOCK:
        library = [entry for entry in read_library() if entry.get("path") != item["path"]]
        library.insert(0, item)
        write_library(library)
    item["alreadySaved"] = False
    return item


class Handler(BaseHTTPRequestHandler):
    server_version = "FreeMusicLocal/1.0"

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        print(f"[{self.log_date_time_string()}] {format % args}")

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/":
                self.serve_file(STATIC / "index.html", "text/html; charset=utf-8")
            elif parsed.path.startswith("/static/"):
                self.serve_static(parsed.path)
            elif parsed.path == "/api/search":
                query = parse_qs(parsed.query)
                text = unquote((query.get("q") or [""])[0])
                page = int((query.get("page") or ["1"])[0] or "1")
                self.send_json(search_catalog(text, page))
            elif parsed.path.startswith("/api/items/"):
                identifier = unquote(parsed.path.removeprefix("/api/items/"))
                self.send_json(get_release(identifier))
            elif parsed.path == "/api/library":
                self.send_json({"folder": str(DOWNLOADS), "items": read_library()})
            else:
                self.send_json({"error": "Not found."}, 404)
        except CatalogError as error:
            self.send_json({"error": str(error)}, error.status)
        except (ValueError, OSError):
            self.send_json({"error": "That request could not be completed."}, 400)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/download":
                payload = self.read_json()
                item = download_track(str(payload.get("identifier") or ""), str(payload.get("file") or ""))
                self.send_json(item)
            elif parsed.path == "/api/open-folder":
                DOWNLOADS.mkdir(parents=True, exist_ok=True)
                if not hasattr(os, "startfile"):
                    raise CatalogError("Open the folder path shown on this page.", 400)
                os.startfile(DOWNLOADS)  # type: ignore[attr-defined]
                self.send_json({"ok": True, "folder": str(DOWNLOADS)})
            else:
                self.send_json({"error": "Not found."}, 404)
        except CatalogError as error:
            self.send_json({"error": str(error)}, error.status)
        except (ValueError, OSError, KeyError):
            self.send_json({"error": "That song could not be saved."}, 400)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0 or length > 8192:
            raise CatalogError("The request was empty.", 400)
        payload = json.loads(self.rfile.read(length).decode("utf-8"))
        if not isinstance(payload, dict):
            raise CatalogError("The request could not be read.", 400)
        return payload

    def serve_static(self, path: str) -> None:
        relative = unquote(path.removeprefix("/static/"))
        file_path = (STATIC / relative).resolve()
        if not file_path.is_relative_to(STATIC.resolve()) or not file_path.is_file():
            self.send_json({"error": "Not found."}, 404)
            return
        content_type = {
            ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".html": "text/html; charset=utf-8",
        }.get(file_path.suffix, "application/octet-stream")
        self.serve_file(file_path, content_type)

    def serve_file(self, path: Path, content_type: str) -> None:
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, payload: dict | list, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def serve(open_browser: bool) -> None:
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
    server = None
    for port in range(DEFAULT_PORT, DEFAULT_PORT + 10):
        try:
            server = ThreadingHTTPServer((HOST, port), Handler)
            break
        except OSError:
            continue
    if server is None:
        raise SystemExit("No free local port was available.")
    url = f"http://{HOST}:{server.server_address[1]}"
    print(f"Free Music is running at {url}", flush=True)
    print(f"Songs are saved to {DOWNLOADS}", flush=True)
    if open_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()


def main() -> None:
    serve(open_browser="--no-browser" not in sys.argv)


if __name__ == "__main__":
    main()
