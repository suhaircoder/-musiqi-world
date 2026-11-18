"""Licence decisions. A public page is not permission to copy the file."""

from urllib.parse import urlparse

OFFICIAL_HOSTS = (
    "open.spotify.com",
    "music.apple.com",
    "music.youtube.com",
    "www.youtube.com",
    "youtube.com",
    "youtu.be",
    "wikipedia.org",
    "www.wikidata.org",
    "wikidata.org",
    "musicbrainz.org",
    "archive.org",
)

ARAB_COUNTRIES = {
    "Saudi Arabia", "Yemen", "Egypt", "Lebanon", "Iraq", "Morocco", "Algeria",
    "Tunisia", "Syria", "Palestine", "Jordan", "Kuwait", "UAE", "Oman",
    "Bahrain", "Qatar", "Sudan", "Libya", "Mauritania", "Somalia", "Djibouti",
    "Comoros", "North Africa",
}


def reserved(owner: str, source: str, verified: bool) -> dict:
    return {
        "owner": owner,
        "licence": "all-rights-reserved",
        "licence_url": "",
        "streaming": False,
        "download": False,
        "distribution": False,
        "source": source,
        "verified": verified,
        "audio_url": None,
    }


def granted(owner: str, licence: str, licence_url: str, audio_url: str, source: str) -> dict:
    free = "creativecommons.org" in licence_url or "publicdomain" in licence_url
    allowed = free and audio_url.startswith("https://archive.org/download/")
    return {
        "owner": owner,
        "licence": licence if allowed else "all-rights-reserved",
        "licence_url": licence_url if allowed else "",
        "streaming": allowed,
        "download": allowed,
        "distribution": allowed,
        "source": source,
        "verified": allowed,
        "audio_url": audio_url if allowed else None,
    }


def classify_link(url: str, audio_urls: set[str]) -> dict:
    """Say what the bot may do with an address. It never fetches a restricted file."""
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower().removeprefix("www.")
    if parsed.scheme not in {"http", "https"} or not host:
        return {"action": "reject", "reason": "That is not a music address this catalogue can check."}
    clean = parsed._replace(scheme="https", netloc=parsed.netloc.lower()).geturl()
    if clean in audio_urls or url in audio_urls:
        return {"action": "send-audio", "reason": "This recording is licensed for download.", "audio_url": url}
    if host == "archive.org" or host.endswith(".archive.org"):
        return {"action": "reject", "reason": "This Archive.org file is not in the licensed catalogue."}
    if any(host == item or host.endswith("." + item) for item in OFFICIAL_HOSTS):
        return {"action": "link-only", "reason": "This is an official page. It is not permission to download the file.", "url": url}
    return {"action": "reject", "reason": "This address is not an authorised source. The bot will not download it."}
