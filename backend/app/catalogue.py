"""Load the website seed. Commercial songs stay metadata-only."""

import json
import re
from pathlib import Path
from urllib.parse import quote

from .rights import ARAB_COUNTRIES, granted, reserved

ROOT = Path(__file__).resolve().parents[2]
ENCYCLOPEDIA = ROOT / "musiqi-world" / "src" / "data" / "encyclopedia.json"
CATALOG = ROOT / "musiqi-world" / "src" / "lib" / "catalog.ts"


def audio_url(item: str, file: str) -> str:
    parts = "/".join(quote(part) for part in file.split("/"))
    return f"https://archive.org/download/{quote(item)}/{parts}"


def _field(body: str, name: str) -> str:
    quoted = re.search(rf'{name}:\s*"((?:\\.|[^"\\])*)"', body)
    if quoted:
        return quoted.group(1)
    ident = re.search(rf"{name}:\s*([A-Za-z0-9_]+)", body)
    return ident.group(1) if ident else ""


def licensed_tracks() -> list[dict]:
    text = CATALOG.read_text(encoding="utf-8")
    artists = {}
    for body in re.findall(r"\{\s*id:\s*\"([^\"]+)\"([\s\S]*?)\n\s*\},", text.split("export const ALBUMS")[0]):
        artist_id, rest = body
        artists[artist_id] = {
            "id": artist_id,
            "name_en": _field(rest, "name"),
            "name_ar": _field(rest, "name"),
            "country": _field(rest, "country"),
            "bio": _field(rest, "bio"),
            "image": "",
            "website": "",
            "listen": [],
            "socials": [],
            "yemen": False,
            "genres": [],
            "styles": [],
            "verified": True,
        }
    songs = []
    albums = {}
    for body in re.findall(r"song\(\{([\s\S]*?)\}\)", text):
        item = _field(body, "item")
        file_name = _field(body, "file")
        artist_id = _field(body, "artistId")
        owner = artists.get(artist_id, {}).get("name_en") or artist_id
        licence_url = _field(body, "licenseUrl")
        if licence_url in {"PD", "BY_NC", "BY_NC_ND", "BY_NC_4", "BY_NC_ND_4"}:
            constants = {
                "PD": "https://creativecommons.org/publicdomain/mark/1.0/",
                "BY_NC": "https://creativecommons.org/licenses/by-nc/3.0/",
                "BY_NC_ND": "https://creativecommons.org/licenses/by-nc-nd/3.0/",
                "BY_NC_4": "https://creativecommons.org/licenses/by-nc/4.0/",
                "BY_NC_ND_4": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
            }
            licence_url = constants[licence_url]
        url = audio_url(item, file_name) if item and file_name else ""
        rights = granted(owner, _field(body, "license"), licence_url, url, "Internet Archive netlabel")
        album_id = _field(body, "albumId")
        song = {
            "id": _field(body, "id"),
            "title": _field(body, "title"),
            "title_ar": _field(body, "titleAr"),
            "artist_id": artist_id,
            "album_id": album_id,
            "album": album_id,
            "country": _field(body, "country"),
            "genre": _field(body, "genre"),
            "date": _field(body, "added"),
            "rights": rights,
        }
        if rights["audio_url"]:
            songs.append(song)
            albums.setdefault(album_id, {"id": album_id, "title": album_id, "artist_id": artist_id, "date": song["date"]})
    return list(artists.values()), list(albums.values()), songs


def encyclopedia() -> tuple[list[dict], list[dict], list[dict]]:
    payload = json.loads(ENCYCLOPEDIA.read_text(encoding="utf-8"))
    artists, albums, songs = [], [], []
    for raw in payload.get("artists") or []:
        artist = {
            "id": raw["id"],
            "name_en": raw.get("nameEn") or "",
            "name_ar": raw.get("nameAr") or "",
            "country": raw.get("country") or "",
            "bio": raw.get("bioEn") or raw.get("bioAr") or "",
            "bio_ar": raw.get("bioAr") or "",
            "image": raw.get("image") or "",
            "website": raw.get("website") or "",
            "listen": raw.get("listen") or [],
            "socials": raw.get("socials") or [],
            "yemen": bool(raw.get("yemen") or raw.get("country") == "Yemen"),
            "genres": raw.get("genres") or [],
            "styles": raw.get("styles") or [],
            "verified": bool(raw.get("verified")),
        }
        artists.append(artist)
        for album in raw.get("albums") or []:
            albums.append({
                "id": album.get("mbid") or f"{raw['id']}-{album.get('title')}",
                "title": album.get("title") or "",
                "artist_id": raw["id"],
                "date": album.get("date") or "",
            })
        for song in raw.get("songs") or []:
            songs.append({
                "id": song.get("mbid") or f"{raw['id']}-{song.get('title')}",
                "title": song.get("title") or "",
                "title_ar": "",
                "artist_id": raw["id"],
                "album_id": "",
                "album": "",
                "country": artist["country"],
                "genre": ", ".join(artist["genres"]),
                "date": song.get("date") or "",
                "rights": reserved(artist["name_en"] or artist["name_ar"], "MusicBrainz", artist["verified"]),
            })
    return artists, albums, songs


def load_catalogue() -> dict:
    directory_artists, directory_albums, directory_songs = encyclopedia()
    licensed_artists, licensed_albums, licensed_songs = licensed_tracks()
    artists = {item["id"]: item for item in directory_artists}
    for item in licensed_artists:
        artists.setdefault(item["id"], item)
    return {
        "artists": list(artists.values()),
        "albums": directory_albums + licensed_albums,
        "songs": directory_songs + licensed_songs,
        "countries": sorted(ARAB_COUNTRIES),
    }
