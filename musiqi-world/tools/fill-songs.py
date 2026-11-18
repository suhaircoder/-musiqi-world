"""Add song titles from MusicBrainz album track lists. No audio files."""

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

UA = "MusiqiWorldEncyclopedia/1.0 (local metadata seed; https://musicbrainz.org/doc/MusicBrainz_API)"
PATH = Path(__file__).resolve().parents[1] / "src" / "data" / "encyclopedia.json"


def get(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    delay = 2
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return json.loads(response.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as error:
            if error.code not in {429, 503} or attempt == 4:
                raise
            time.sleep(delay)
            delay *= 2
    raise RuntimeError(url)


def tracks_for_group(release_group: str) -> list[dict]:
    query = urllib.parse.urlencode({"release-group": release_group, "inc": "recordings+media", "fmt": "json", "limit": "5"})
    data = get("https://musicbrainz.org/ws/2/release?" + query)
    time.sleep(1.1)
    songs = []
    seen = set()
    for release in data.get("releases") or []:
        for medium in release.get("media") or []:
            for track in medium.get("tracks") or []:
                title = ((track.get("recording") or {}).get("title")) or track.get("title") or ""
                title = title.strip()
                if not title or title.casefold() in seen:
                    continue
                seen.add(title.casefold())
                songs.append({"title": title, "date": release.get("date") or "", "mbid": ((track.get("recording") or {}).get("id")) or ""})
        if songs:
            break
    return songs


def main() -> None:
    payload = json.loads(PATH.read_text(encoding="utf-8"))
    for artist in payload["artists"]:
        if not artist.get("verified"):
            continue
        collected = []
        seen = set()
        for album in (artist.get("albums") or [])[:8]:
            if not album.get("mbid"):
                continue
            try:
                rows = tracks_for_group(album["mbid"])
            except Exception as error:
                print("ERR", artist["nameEn"], album["title"], error)
                continue
            added = 0
            for row in rows:
                key = row["title"].casefold()
                if key in seen:
                    continue
                seen.add(key)
                collected.append(row)
                added += 1
                if len(collected) >= 40:
                    break
            print(artist["nameEn"], "|", album["title"], added)
            if len(collected) >= 40:
                break
        if collected:
            artist["songs"] = collected
        print("TOTAL", artist["nameEn"], len(artist.get("songs") or []))
    PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
