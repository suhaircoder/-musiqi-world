"""MUSIQI WORLD BOT.

Commands read the shared API. Audio is sent only when that API marks the file as licensed.
A YouTube or unknown link is never downloaded.
"""

import json
import os
import urllib.parse
import urllib.request

API = os.environ.get("MUSIQI_API", "http://127.0.0.1:8000")
TOKEN = os.environ.get("TELEGRAM_TOKEN", "")


def api_get(path: str, token: str = "") -> dict:
    request = urllib.request.Request(API + path, headers={"Authorization": f"Bearer {token}"} if token else {})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode())


def api_post(path: str, payload: dict, token: str = "") -> dict:
    data = json.dumps(payload).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(API + path, data=data, headers=headers)
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode())


def reply(text: str, token: str = "") -> str:
    command, _, argument = text.strip().partition(" ")
    command = command.split("@")[0].lower()
    if command in {"/start", "/help"}:
        return (
            "MUSIQI WORLD BOT\n"
            "/search name\n/artists\n/albums\n/countries\n/arabic\n/yemen\n"
            "/favorites\n/login email password\n/help\n"
            "Commercial songs return official links only. Audio is sent only for a licensed file."
        )
    if command == "/countries":
        names = api_get("/countries")["countries"]
        return "\n".join(names)
    if command == "/arabic":
        rows = api_get("/arabic")["artists"][:15]
        return "\n".join(f"{row['name_ar']} — {row['name_en']}" for row in rows) or "No artists."
    if command == "/yemen":
        rows = api_get("/yemen")["artists"][:20]
        return "\n".join(f"{row['name_ar']} — {row['name_en']}" for row in rows) or "No Yemeni artists."
    if command == "/artists":
        rows = api_get("/artists?q=" + urllib.parse.quote(argument))["artists"][:15]
        return "\n".join(f"{row['name_ar']} — {row['name_en']} ({row['country']})" for row in rows) or "No artist matched."
    if command == "/albums":
        if not argument:
            return "Use /albums artist name"
        found = api_get("/search?q=" + urllib.parse.quote(argument))["artists"]
        if not found:
            return "No artist matched."
        albums = api_get(f"/albums?artist_id={urllib.parse.quote(found[0]['id'])}")["albums"][:15]
        return "\n".join(album["title"] for album in albums) or "No albums stored for that artist."
    if command == "/search":
        if not argument:
            return "Use /search song or singer"
        if argument.startswith("http://") or argument.startswith("https://"):
            checked = api_post("/links/inspect", {"url": argument})
            if checked["action"] == "send-audio":
                return f"Licensed file:\n{checked['audio_url']}"
            return checked["reason"]
        result = api_get("/search?q=" + urllib.parse.quote(argument))
        lines = []
        for artist in result["artists"][:3]:
            lines.append(f"Artist: {artist['name_ar']} / {artist['name_en']}")
            for link in artist.get("listen") or []:
                lines.append(link["url"])
            detail = api_get("/artists/" + urllib.parse.quote(artist["id"]))
            for song in detail["songs"][:8]:
                rights = song["rights"]
                if rights["download"] and rights["audio_url"]:
                    lines.append(f"Licensed: {song['title']}\n{rights['audio_url']}")
                else:
                    lines.append(f"Song: {song['title']} — no download, rights are {rights['licence']}")
        for song in result["songs"][:8]:
            rights = song["rights"]
            if rights["download"] and rights["audio_url"]:
                lines.append(f"Licensed: {song['title']}\n{rights['audio_url']}")
            else:
                lines.append(f"Song: {song['title']} — no download, rights are {rights['licence']}")
        return "\n".join(lines) or "Nothing matched."
    if command == "/login":
        email, _, password = argument.partition(" ")
        if not email or not password:
            return "Use /login email password"
        result = api_post("/auth/login", {"email": email, "password": password})
        return f"TOKEN {result['token']}"
    if command == "/favorites":
        if not token:
            return "Use /login email password first."
        rows = api_get("/me/favourites", token)["songs"]
        return "\n".join(row["title"] for row in rows) or "No favourites yet."
    return "Unknown command. Use /help."


def main() -> None:
    if not TOKEN:
        raise SystemExit("Set TELEGRAM_TOKEN before starting the bot.")
    offset = 0
    sessions: dict[int, str] = {}
    while True:
        url = f"https://api.telegram.org/bot{TOKEN}/getUpdates?timeout=30&offset={offset}"
        with urllib.request.urlopen(url, timeout=40) as response:
            updates = json.loads(response.read().decode()).get("result") or []
        for update in updates:
            offset = update["update_id"] + 1
            message = update.get("message") or {}
            chat = (message.get("chat") or {}).get("id")
            text = message.get("text") or ""
            if not chat or not text:
                continue
            try:
                answer = reply(text, sessions.get(chat, ""))
            except Exception as error:
                answer = f"The catalogue did not answer: {error}"
            if answer.startswith("TOKEN "):
                sessions[chat] = answer.removeprefix("TOKEN ")
                answer = "Signed in. /favorites now uses your MUSIQI WORLD account."
            payload = json.dumps({"chat_id": chat, "text": answer[:4000]}).encode()
            request = urllib.request.Request(
                f"https://api.telegram.org/bot{TOKEN}/sendMessage",
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            urllib.request.urlopen(request, timeout=20).read()


if __name__ == "__main__":
    main()
