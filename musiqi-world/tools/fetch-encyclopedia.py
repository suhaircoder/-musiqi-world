"""Seed the encyclopedia from Wikidata, Wikipedia, and MusicBrainz release groups."""

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

UA = "MusiqiWorldEncyclopedia/1.0 (local metadata seed; https://www.wikidata.org/)"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "encyclopedia.json"

PEOPLE = [
    {"id": "abdul-majeed-abdullah", "nameAr": "عبد المجيد عبد الله", "nameEn": "Abdul Majeed Abdullah", "aliases": ["عبدالمجيد عبدالله"], "country": "Saudi Arabia"},
    {"id": "saad-lamjarred", "nameAr": "سعد لمجرد", "nameEn": "Saad Lamjarred", "aliases": ["سعد المجرد"], "country": "Morocco"},
    {"id": "majed-al-mohandis", "nameAr": "ماجد المهندس", "nameEn": "Majed Al Mohandis", "aliases": ["Majid Al Mohandis"], "country": "Iraq"},
    {"id": "mohammed-abdu", "nameAr": "محمد عبده", "nameEn": "Mohammed Abdu", "aliases": ["Mohamed Abdu"], "country": "Saudi Arabia"},
    {"id": "elissa", "nameAr": "إليسا", "nameEn": "Elissa", "aliases": ["اليسا"], "country": "Lebanon"},
    {"id": "najwa-karam", "nameAr": "نجوى كرم", "nameEn": "Najwa Karam", "aliases": [], "country": "Lebanon"},
    {"id": "fairuz", "nameAr": "فيروز", "nameEn": "Fairuz", "aliases": ["Fairouz", "Fayrouz"], "country": "Lebanon"},
    {"id": "kadim-al-sahir", "nameAr": "كاظم الساهر", "nameEn": "Kadim Al Sahir", "aliases": ["Kazem Al Saher"], "country": "Iraq"},
    {"id": "george-wassouf", "nameAr": "جورج وسوف", "nameEn": "George Wassouf", "aliases": [], "country": "Syria"},
    {"id": "abu-bakr-salem", "nameAr": "أبو بكر سالم", "nameEn": "Abu Bakr Salem", "aliases": ["Abu Baker Salem"], "country": "Yemen", "yemen": True},
    {"id": "ayoub-tarish", "nameAr": "أيوب طارش", "nameEn": "Ayoub Tarish", "aliases": ["Ayoob Tarish"], "country": "Yemen", "yemen": True},
    {"id": "faisal-alawi", "nameAr": "فيصل علوي", "nameEn": "Faisal Alawi", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "mohammed-murshid-naji", "nameAr": "محمد مرشد ناجي", "nameEn": "Mohammed Murshid Naji", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "ali-abdullah-al-simah", "nameAr": "علي عبد الله السمة", "nameEn": "Ali Abdullah Al-Simah", "aliases": ["علي السمة"], "country": "Yemen", "yemen": True},
    {"id": "ali-al-ansi", "nameAr": "علي الآنسي", "nameEn": "Ali Al-Ansi", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "ahmed-al-sunaidar", "nameAr": "أحمد السنيدار", "nameEn": "Ahmed Al-Sunaidar", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "mohammed-saad-abdullah", "nameAr": "محمد سعد عبد الله", "nameEn": "Mohammed Saad Abdullah", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "mohammed-jumaa-khan", "nameAr": "محمد جمعة خان", "nameEn": "Mohammed Jumaa Khan", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "ahmed-fathi", "nameAr": "أحمد فتحي", "nameEn": "Ahmed Fathi", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "fuad-al-kibsi", "nameAr": "فؤاد الكبسي", "nameEn": "Fuad Al-Kibsi", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "abdul-rahman-al-akhfash", "nameAr": "عبد الرحمن الأخفش", "nameEn": "Abdul Rahman Al-Akhfash", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "abdulbaset-al-absi", "nameAr": "عبد الباسط العبسي", "nameEn": "Abdulbaset Al-Absi", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "hussein-moheb", "nameAr": "حسين محب", "nameEn": "Hussein Moheb", "aliases": ["Hussein Muhib"], "country": "Yemen", "yemen": True},
    {"id": "balqees", "nameAr": "بلقيس", "nameEn": "Balqees", "aliases": ["Balqees Fathi"], "country": "Yemen", "yemen": True},
    {"id": "arwa", "nameAr": "أروى", "nameEn": "Arwa", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "fouad-abdulwahed", "nameAr": "فؤاد عبد الواحد", "nameEn": "Fouad Abdulwahed", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "aseel-abu-baker", "nameAr": "أسيل أبو بكر", "nameEn": "Aseel Abu Baker", "aliases": ["Aseel Abu Bakr"], "country": "Yemen", "yemen": True},
    {"id": "ammar-alazaki", "nameAr": "عمار العزكي", "nameEn": "Ammar Alazaki", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "hajar-noman", "nameAr": "هاجر نعمان", "nameEn": "Hajar Noman", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "maria-qahtan", "nameAr": "ماريا قحطان", "nameEn": "Maria Qahtan", "aliases": [], "country": "Yemen", "yemen": True},
    {"id": "fatimah-muthanna", "nameAr": "فاطمة مثنى", "nameEn": "Fatimah Muthanna", "aliases": ["Fatima Muthanna"], "country": "Yemen", "yemen": True},
]

COUNTRY_WORDS = {
    "Saudi Arabia": ["saudi", "سعود"],
    "Morocco": ["moroccan", "مغرب"],
    "Iraq": ["iraqi", "عراق"],
    "Lebanon": ["lebanese", "لبنان"],
    "Syria": ["syrian", "سوري"],
    "Yemen": ["yemeni", "yemen", "يمن"],
}
SINGER_WORDS = ("singer", "musician", "vocalist", "composer", "مطرب", "مغن", "فنان", "ملحن", "شاعر غنائي")
STYLE_RULES = [
    ("sanaani", ["sanaani", "sana'ani", "san'ani", "صنعاني"]),
    ("lahji", ["lahji", "lahj", "لحجي"]),
    ("hadhrami", ["hadhrami", "hadrami", "hadramawt", "حضرمي"]),
    ("adeni", ["adeni", "عدني"]),
    ("folk", ["folk", "شعبي"]),
    ("traditional", ["traditional", "تراثي"]),
    ("pop", ["pop", "بوب"]),
    ("instrumental", ["instrumental"]),
]


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


def wd_search(text: str, lang: str) -> list[dict]:
    query = urllib.parse.urlencode({
        "action": "wbsearchentities",
        "search": text,
        "language": lang,
        "uselang": lang,
        "type": "item",
        "format": "json",
        "limit": "6",
    })
    data = get("https://www.wikidata.org/w/api.php?" + query)
    time.sleep(0.4)
    return data.get("search") or []


def score_hit(hit: dict, person: dict) -> int:
    desc = f"{hit.get('label') or ''} {hit.get('description') or ''}".lower()
    if not any(word in desc for word in SINGER_WORDS):
        return 0
    score = 40
    for word in COUNTRY_WORDS.get(person["country"], []):
        if word in desc:
            score += 40
    label = (hit.get("label") or "").lower()
    if person["nameEn"].split()[0].lower() in label or person["nameAr"] in (hit.get("label") or ""):
        score += 20
    return score


def choose_qid(person: dict) -> str:
    hits = wd_search(person["nameEn"], "en") + wd_search(person["nameAr"], "ar")
    best = ""
    best_score = 0
    seen = set()
    for hit in hits:
        qid = hit.get("id") or ""
        if not qid or qid in seen:
            continue
        seen.add(qid)
        score = score_hit(hit, person)
        if score > best_score:
            best = qid
            best_score = score
            print("  candidate", qid, score, hit.get("label"), "|", hit.get("description"))
    return best if best_score >= 40 else ""


def claim_values(claims: dict, prop: str) -> list:
    values = []
    for claim in claims.get(prop) or []:
        snak = claim.get("mainsnak") or {}
        value = (snak.get("datavalue") or {}).get("value")
        if value:
            values.append(value)
    return values


def string_claims(claims: dict, prop: str) -> list[str]:
    found = []
    for value in claim_values(claims, prop):
        if isinstance(value, str):
            found.append(value)
    return found


def wiki_summary(title: str, lang: str) -> dict | None:
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title.replace(' ', '_'))}"
    try:
        data = get(url)
    except Exception:
        return None
    if data.get("type") == "disambiguation":
        return None
    return data


def styles_from(text: str) -> list[str]:
    haystack = text.lower()
    return [style for style, words in STYLE_RULES if any(word in haystack for word in words)]


def releases(mbid: str) -> tuple[list[dict], list[dict]]:
    query = urllib.parse.urlencode({"artist": mbid, "fmt": "json", "limit": "100"})
    data = get("https://musicbrainz.org/ws/2/release-group?" + query)
    time.sleep(1.1)
    albums, songs = [], []
    for group in data.get("release-groups") or []:
        primary = group.get("primary-type") or ""
        secondary = group.get("secondary-types") or []
        if any(kind in secondary for kind in ("Bootleg", "Live", "Compilation", "Remix", "Mixtape/Street", "Demo", "DJ-mix")):
            continue
        row = {"title": group.get("title") or "", "date": group.get("first-release-date") or "", "mbid": group.get("id") or ""}
        if not row["title"]:
            continue
        if primary in {"Album", "EP"} and len(albums) < 12:
            albums.append(row)
        elif primary == "Single" and len(songs) < 16:
            songs.append(row)
    return albums, songs


def build(person: dict) -> dict:
    print("ARTIST", person["nameEn"])
    entry = {
        "id": person["id"],
        "nameAr": person["nameAr"],
        "nameEn": person["nameEn"],
        "aliases": person["aliases"],
        "country": person["country"],
        "yemen": bool(person.get("yemen")),
        "genres": [],
        "styles": [],
        "bioEn": "",
        "bioAr": "",
        "bioSource": "",
        "image": "",
        "imageSource": "",
        "website": "",
        "socials": [],
        "listen": [],
        "albums": [],
        "songs": [],
        "mbid": "",
        "wikidata": "",
        "verified": False,
    }
    qid = choose_qid(person)
    if not qid:
        print("  NO WIKIDATA")
        return entry
    entity = get(f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json")
    time.sleep(0.3)
    record = (entity.get("entities") or {}).get(qid) or {}
    if not record or record.get("id") != qid:
        return entry
    entry["wikidata"] = f"https://www.wikidata.org/wiki/{qid}"
    entry["verified"] = True
    label_ar = (((record.get("labels") or {}).get("ar") or {}).get("value")) or ""
    label_en = (((record.get("labels") or {}).get("en") or {}).get("value")) or ""
    if label_ar:
        entry["nameAr"] = label_ar
    if label_en:
        entry["nameEn"] = label_en
    claims = record.get("claims") or {}
    websites = string_claims(claims, "P856")
    if websites:
        entry["website"] = websites[0]
    for handle in string_claims(claims, "P2002"):
        entry["socials"].append({"label": "X", "url": f"https://x.com/{handle}"})
    for handle in string_claims(claims, "P2003"):
        entry["socials"].append({"label": "Instagram", "url": f"https://www.instagram.com/{handle}"})
    for handle in string_claims(claims, "P2013"):
        entry["socials"].append({"label": "Facebook", "url": f"https://www.facebook.com/{handle}"})
    for channel in string_claims(claims, "P2397"):
        entry["listen"].append({"label": "YouTube", "url": f"https://www.youtube.com/channel/{channel}"})
    for artist_id in string_claims(claims, "P1902"):
        entry["listen"].append({"label": "Spotify", "url": f"https://open.spotify.com/artist/{artist_id}"})
    for artist_id in string_claims(claims, "P2850"):
        entry["listen"].append({"label": "Apple Music", "url": f"https://music.apple.com/artist/{artist_id}"})
    genre_ids = []
    for value in claim_values(claims, "P136"):
        if isinstance(value, dict) and value.get("id"):
            genre_ids.append(value["id"])
    if genre_ids:
        genres = get("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode({
            "action": "wbgetentities",
            "ids": "|".join(genre_ids[:6]),
            "props": "labels",
            "languages": "en",
            "format": "json",
        }))
        time.sleep(0.3)
        for genre_id in genre_ids[:6]:
            label = ((((genres.get("entities") or {}).get(genre_id) or {}).get("labels") or {}).get("en") or {}).get("value")
            if label:
                entry["genres"].append(label)
    mbids = string_claims(claims, "P434")
    if mbids:
        entry["mbid"] = mbids[0]
        try:
            entry["albums"], entry["songs"] = releases(entry["mbid"])
        except Exception as error:
            print("  RELEASES", error)
    sitelinks = record.get("sitelinks") or {}
    en_title = ((sitelinks.get("enwiki") or {}).get("title")) or ""
    ar_title = ((sitelinks.get("arwiki") or {}).get("title")) or ""
    text = ""
    if en_title:
        summary = wiki_summary(en_title, "en")
        if summary and summary.get("extract"):
            entry["bioEn"] = summary["extract"]
            entry["bioSource"] = ((summary.get("content_urls") or {}).get("desktop") or {}).get("page") or ""
            text += summary["extract"]
            thumb = ((summary.get("thumbnail") or {}).get("source")) or ""
            if thumb:
                entry["image"] = thumb
                entry["imageSource"] = entry["bioSource"]
    if ar_title:
        summary = wiki_summary(ar_title, "ar")
        if summary and summary.get("extract"):
            entry["bioAr"] = summary["extract"]
            text += " " + summary["extract"]
            if not entry["bioSource"]:
                entry["bioSource"] = ((summary.get("content_urls") or {}).get("desktop") or {}).get("page") or ""
            if not entry["image"]:
                thumb = ((summary.get("thumbnail") or {}).get("source")) or ""
                if thumb:
                    entry["image"] = thumb
                    entry["imageSource"] = entry["bioSource"]
    if person.get("yemen"):
        entry["styles"] = styles_from(text)
    print("  OK", entry["nameEn"], "albums", len(entry["albums"]), "bio", bool(entry["bioEn"] or entry["bioAr"]), "styles", entry["styles"])
    return entry


def main() -> None:
    artists = [build(person) for person in PEOPLE]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"source": "Wikidata, Wikipedia, and MusicBrainz", "artists": artists}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("WROTE", len(artists), "verified", sum(1 for artist in artists if artist["verified"]))


if __name__ == "__main__":
    main()
