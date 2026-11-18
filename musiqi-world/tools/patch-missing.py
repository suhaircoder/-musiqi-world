"""Fill artists the first pass missed, and retag Yemeni styles with word boundaries."""

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

UA = "MusiqiWorldEncyclopedia/1.0 (local metadata seed)"
PATH = Path(__file__).resolve().parents[1] / "src" / "data" / "encyclopedia.json"
EXTRA = {
    "ayoub-tarish": ["أيوب طارش", "Ayoob Tarish"],
    "ali-al-ansi": ["علي الآنسي", "Ali Al Ansi"],
    "abdul-rahman-al-akhfash": ["عبدالرحمن الأخفش", "الأخفش"],
    "abdulbaset-al-absi": ["عبدالباسط العبسي", "العبسي"],
    "aseel-abu-baker": ["أسيل أبوبكر", "Aseel Abu Bakr"],
    "hajar-noman": ["هاجر نعمان"],
    "maria-qahtan": ["ماريا قحطان"],
    "fatimah-muthanna": ["فاطمة مثنى"],
}
SINGER = ("singer", "musician", "vocalist", "composer", "oud", "مطرب", "مغن", "فنان", "ملحن")
STYLE_RULES = [
    ("sanaani", [r"sanaani", r"sana'ani", r"صنعاني"]),
    ("lahji", [r"lahji", r"lahiji", r"لحجي", r"لحج"]),
    ("hadhrami", [r"hadhrami", r"hadrami", r"حضرمي"]),
    ("adeni", [r"\badeni\b", r"عدني"]),
    ("folk", [r"\bfolk\b", r"شعبي"]),
    ("traditional", [r"\btraditional\b", r"تراثي"]),
    ("pop", [r"\bpop\b", r"بوب"]),
    ("instrumental", [r"\binstrumental\b"]),
]


def get(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    delay = 3
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


def styles_from(text: str) -> list[str]:
    return [style for style, patterns in STYLE_RULES if any(re.search(pattern, text, re.I) for pattern in patterns)]


def search(text: str, lang: str) -> list[dict]:
    query = urllib.parse.urlencode({
        "action": "wbsearchentities", "search": text, "language": lang, "uselang": lang,
        "type": "item", "format": "json", "limit": "5",
    })
    data = get("https://www.wikidata.org/w/api.php?" + query)
    time.sleep(1.1)
    return data.get("search") or []


def main() -> None:
    payload = json.loads(PATH.read_text(encoding="utf-8"))
    by_id = {artist["id"]: artist for artist in payload["artists"]}
    for artist_id, terms in EXTRA.items():
        entry = by_id[artist_id]
        if entry.get("verified"):
            continue
        chosen = None
        for term in terms:
            for hit in search(term, "ar") + search(term, "en"):
                desc = f"{hit.get('description') or ''}"
                if any(word in desc.lower() for word in SINGER):
                    chosen = hit
                    break
            if chosen:
                break
        if not chosen:
            print("STILL MISSING", entry["nameEn"])
            continue
        print("FOUND", entry["nameEn"], chosen.get("id"), chosen.get("label"), chosen.get("description"))
        qid = chosen["id"]
        entity = get(f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json")
        time.sleep(0.3)
        record = (entity.get("entities") or {}).get(qid) or {}
        labels = record.get("labels") or {}
        if (labels.get("ar") or {}).get("value"):
            entry["nameAr"] = labels["ar"]["value"]
        if (labels.get("en") or {}).get("value"):
            entry["nameEn"] = labels["en"]["value"]
        entry["wikidata"] = f"https://www.wikidata.org/wiki/{qid}"
        entry["verified"] = True
        sitelinks = record.get("sitelinks") or {}
        text = ""
        for lang, key in (("en", "enwiki"), ("ar", "arwiki")):
            title = ((sitelinks.get(key) or {}).get("title")) or ""
            if not title:
                continue
            summary = get(f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title.replace(' ', '_'))}")
            extract = summary.get("extract") or ""
            if lang == "en":
                entry["bioEn"] = extract
            else:
                entry["bioAr"] = extract
            text += " " + extract
            if not entry.get("bioSource"):
                entry["bioSource"] = ((summary.get("content_urls") or {}).get("desktop") or {}).get("page") or ""
            if not entry.get("image"):
                thumb = ((summary.get("thumbnail") or {}).get("source")) or ""
                if thumb:
                    entry["image"] = thumb
                    entry["imageSource"] = entry["bioSource"]
        entry["styles"] = styles_from(text)
        entry["yemen"] = True
    for artist in payload["artists"]:
        if artist.get("yemen") or artist.get("country") == "Yemen":
            artist["styles"] = styles_from(f"{artist.get('bioEn') or ''} {artist.get('bioAr') or ''}")
    PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print("verified", sum(1 for artist in payload["artists"] if artist["verified"]))


if __name__ == "__main__":
    main()
