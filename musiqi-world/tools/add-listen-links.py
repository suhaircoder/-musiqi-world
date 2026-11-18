"""Add official Spotify, YouTube, and Apple Music links already recorded on Wikidata."""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

PATH = Path(__file__).resolve().parents[1] / "src" / "data" / "encyclopedia.json"
UA = {"User-Agent": "MusiqiWorldEncyclopedia/1.0 (official listening links)", "Accept": "application/json"}


def claims(record: dict, prop: str) -> list[str]:
    found = []
    for claim in (record.get("claims") or {}).get(prop) or []:
        value = ((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value")
        if isinstance(value, str):
            found.append(value)
    return found


def main() -> None:
    payload = json.loads(PATH.read_text(encoding="utf-8"))
    ids = []
    for artist in payload["artists"]:
        link = artist.get("wikidata") or ""
        if "/Q" in link:
            ids.append(link.rstrip("/").split("/")[-1])
    query = urllib.parse.urlencode({
        "action": "wbgetentities",
        "ids": "|".join(ids),
        "props": "claims",
        "format": "json",
    })
    request = urllib.request.Request("https://www.wikidata.org/w/api.php?" + query, headers=UA)
    data = json.loads(urllib.request.urlopen(request, timeout=60).read().decode())
    entities = data.get("entities") or {}
    for artist in payload["artists"]:
        qid = (artist.get("wikidata") or "").rstrip("/").split("/")[-1]
        record = entities.get(qid) or {}
        links = list(artist.get("listen") or [])
        known = {item["url"] for item in links}
        for spotify in claims(record, "P1902"):
            url = f"https://open.spotify.com/artist/{spotify}"
            if url not in known:
                links.append({"label": "Spotify", "url": url})
                known.add(url)
        for channel in claims(record, "P2397"):
            url = f"https://www.youtube.com/channel/{channel}"
            if url not in known:
                links.append({"label": "YouTube", "url": url})
                known.add(url)
        for apple in claims(record, "P2850"):
            url = f"https://music.apple.com/artist/{apple}"
            if url not in known:
                links.append({"label": "Apple Music", "url": url})
                known.add(url)
        artist["listen"] = links
        print(artist["nameEn"], [item["label"] for item in links])
        time.sleep(0.05)
    PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
