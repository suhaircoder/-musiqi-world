"""MUSIQI WORLD API.

Phase 1 stores accounts and serves one catalogue.
Phase 2 and 3 are the existing website plus this catalogue.
Commercial songs are searchable metadata. Audio is returned only when the licence allows it.
"""

import os
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .accounts import check_password, hash_password, init_db, token_for, user_from_token, _connect
from .catalogue import load_catalogue
from .rights import ARAB_COUNTRIES, classify_link

DB_PATH = os.environ.get("MUSIQI_DB", str(Path(__file__).resolve().parents[1] / "musiqi.db"))


class Credentials(BaseModel):
    email: str
    password: str
    name: str = ""


class PlaylistIn(BaseModel):
    name: str


class LinkIn(BaseModel):
    url: str


def create_app(db_path: str = DB_PATH) -> FastAPI:
    init_db(db_path)
    catalogue = load_catalogue()
    audio_urls = {song["rights"]["audio_url"] for song in catalogue["songs"] if song["rights"]["audio_url"]}
    app = FastAPI(title="MUSIQI WORLD")
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
    app.state.db = db_path
    app.state.catalogue = catalogue
    app.state.audio_urls = audio_urls

    def songs():
        return app.state.catalogue["songs"]

    def artists():
        return app.state.catalogue["artists"]

    def require(header: str | None):
        user = user_from_token(header)
        if not user:
            raise HTTPException(401, "Sign in is required.")
        return user

    @app.get("/health")
    def health():
        licensed = [song for song in songs() if song["rights"]["download"]]
        return {
            "ok": True,
            "artists": len(artists()),
            "songs": len(songs()),
            "licensed_audio": len(licensed),
        }

    @app.get("/countries")
    def countries():
        return {"countries": sorted(ARAB_COUNTRIES)}

    @app.get("/artists")
    def list_artists(q: str = "", country: str = "", yemen: bool = False):
        needle = q.casefold()
        rows = []
        for artist in artists():
            if yemen and not artist["yemen"]:
                continue
            if country and artist["country"] != country:
                continue
            blob = f"{artist['name_en']} {artist['name_ar']}".casefold()
            if needle and needle not in blob:
                continue
            rows.append(artist)
        return {"artists": rows}

    @app.get("/artists/{artist_id}")
    def artist_detail(artist_id: str):
        artist = next((item for item in artists() if item["id"] == artist_id), None)
        if not artist:
            raise HTTPException(404, "That artist is not in the catalogue.")
        return {
            "artist": artist,
            "albums": [album for album in app.state.catalogue["albums"] if album["artist_id"] == artist_id],
            "songs": [song for song in songs() if song["artist_id"] == artist_id],
        }

    @app.get("/albums")
    def list_albums(artist_id: str = ""):
        rows = app.state.catalogue["albums"]
        if artist_id:
            rows = [album for album in rows if album["artist_id"] == artist_id]
        return {"albums": rows}

    @app.get("/search")
    def search(q: str):
        needle = q.casefold()
        found_artists = [
            artist for artist in artists()
            if needle in f"{artist['name_en']} {artist['name_ar']}".casefold()
        ]
        found_songs = [
            song for song in songs()
            if needle in f"{song['title']} {song['title_ar']}".casefold()
        ]
        return {"artists": found_artists[:20], "songs": found_songs[:40]}

    @app.get("/arabic")
    def arabic():
        return {"artists": [artist for artist in artists() if artist["country"] in ARAB_COUNTRIES or artist["yemen"]]}

    @app.get("/yemen")
    def yemen():
        return {"artists": [artist for artist in artists() if artist["yemen"]]}

    @app.post("/links/inspect")
    def inspect_link(body: LinkIn):
        return classify_link(body.url, app.state.audio_urls)

    @app.post("/auth/register")
    def register(body: Credentials):
        if len(body.password) < 4:
            raise HTTPException(400, "Use a longer password.")
        with _connect(db_path) as connection:
            if connection.execute("SELECT id FROM users WHERE email = ?", (body.email.lower(),)).fetchone():
                raise HTTPException(409, "That email is already registered.")
            user_id = body.email.lower().split("@")[0]
            connection.execute(
                "INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
                (user_id, body.email.lower(), body.name or user_id, hash_password(body.password), "listener"),
            )
        return {"token": token_for(user_id, "listener"), "role": "listener"}

    @app.post("/auth/login")
    def login(body: Credentials):
        with _connect(db_path) as connection:
            row = connection.execute("SELECT * FROM users WHERE email = ?", (body.email.lower(),)).fetchone()
        if not row or not check_password(body.password, row["password_hash"]):
            raise HTTPException(401, "Email or password is wrong.")
        return {"token": token_for(row["id"], row["role"]), "role": row["role"], "name": row["name"]}

    @app.get("/me/favourites")
    def favourites(authorization: str | None = Header(default=None)):
        user = require(authorization)
        with _connect(db_path) as connection:
            rows = connection.execute("SELECT song_id FROM favourites WHERE user_id = ?", (user["sub"],)).fetchall()
        ids = {row["song_id"] for row in rows}
        return {"songs": [song for song in songs() if song["id"] in ids]}

    @app.post("/me/favourites/{song_id}")
    def add_favourite(song_id: str, authorization: str | None = Header(default=None)):
        user = require(authorization)
        if not any(song["id"] == song_id for song in songs()):
            raise HTTPException(404, "That song is not in the catalogue.")
        with _connect(db_path) as connection:
            connection.execute(
                "INSERT OR IGNORE INTO favourites (user_id, song_id, created_at) VALUES (?, ?, datetime('now'))",
                (user["sub"], song_id),
            )
        return {"ok": True}

    @app.get("/me/playlists")
    def playlists(authorization: str | None = Header(default=None)):
        user = require(authorization)
        with _connect(db_path) as connection:
            rows = connection.execute("SELECT id, name FROM playlists WHERE user_id = ?", (user["sub"],)).fetchall()
        return {"playlists": [dict(row) for row in rows]}

    @app.post("/me/playlists")
    def create_playlist(body: PlaylistIn, authorization: str | None = Header(default=None)):
        user = require(authorization)
        playlist_id = f"{user['sub']}-{len(body.name)}-{body.name.casefold().replace(' ', '-')[:24]}"
        with _connect(db_path) as connection:
            connection.execute(
                "INSERT INTO playlists (id, user_id, name, created_at) VALUES (?, ?, ?, datetime('now'))",
                (playlist_id, user["sub"], body.name),
            )
        return {"id": playlist_id, "name": body.name}

    @app.get("/admin/stats")
    def stats(authorization: str | None = Header(default=None)):
        user = require(authorization)
        if user["role"] != "admin":
            raise HTTPException(403, "An admin account is required.")
        with _connect(db_path) as connection:
            users = connection.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        return {
            "users": users,
            "artists": len(artists()),
            "songs": len(songs()),
            "licensed_audio": sum(1 for song in songs() if song["rights"]["download"]),
        }

    return app


app = create_app()
