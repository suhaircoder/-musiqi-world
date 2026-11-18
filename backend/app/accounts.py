"""Listener accounts shared by the website, mobile app, and bot."""

import hashlib
import hmac
import json
import secrets
import sqlite3
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode
from pathlib import Path

SCHEMA = Path(__file__).resolve().parents[1] / "schema.sql"
SECRET = secrets.token_bytes(32)


def _connect(path: str) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}${digest.hex()}"


def check_password(password: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split("$", 1)
    candidate = hash_password(password, bytes.fromhex(salt_hex))
    return hmac.compare_digest(candidate, f"{salt_hex}${digest_hex}")


def init_db(path: str) -> None:
    with _connect(path) as connection:
        script = SCHEMA.read_text(encoding="utf-8")
        script = script.replace("REFERENCES users(id)", "").replace("REFERENCES playlists(id)", "")
        connection.executescript(script)
        existing = connection.execute("SELECT id FROM users WHERE email = ?", ("admin@musiqi.world",)).fetchone()
        if not existing:
            connection.execute(
                "INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                ("admin", "admin@musiqi.world", "Admin", hash_password("demo"), "admin", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
            )


def token_for(user_id: str, role: str) -> str:
    payload = urlsafe_b64encode(json.dumps({"sub": user_id, "role": role, "exp": int(time.time()) + 7 * 86400}).encode()).decode()
    signature = hmac.new(SECRET, payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"


def user_from_token(header: str | None) -> dict | None:
    if not header or not header.startswith("Bearer "):
        return None
    token = header.removeprefix("Bearer ")
    payload, _, signature = token.partition(".")
    expected = hmac.new(SECRET, payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None
    data = json.loads(urlsafe_b64decode(payload.encode()))
    if data.get("exp", 0) < time.time():
        return None
    return data
