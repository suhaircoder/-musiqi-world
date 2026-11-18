import os
import tempfile

from fastapi.testclient import TestClient

os.environ["MUSIQI_DB"] = os.path.join(tempfile.mkdtemp(), "test.db")

from app.main import create_app
from app.rights import classify_link

client = TestClient(create_app(os.environ["MUSIQI_DB"]))


def test_commercial_songs_have_no_audio():
    found = client.get("/search", params={"q": "Mohammed Abdu"})
    assert found.status_code == 200
    artists = found.json()["artists"]
    assert any("Abdu" in artist["name_en"] or "عبده" in artist["name_ar"] for artist in artists)
    songs = client.get("/artists/mohammed-abdu").json()["songs"]
    assert songs, "Mohammed Abdu should have song titles from the catalogue"
    assert all(song["rights"]["download"] is False for song in songs)
    assert all(song["rights"]["audio_url"] is None for song in songs)


def test_licensed_track_can_download():
    health = client.get("/health").json()
    assert health["licensed_audio"] > 0
    found = client.get("/search", params={"q": "Yatzakkar"}).json()["songs"]
    assert found[0]["rights"]["download"] is True
    assert found[0]["rights"]["audio_url"].startswith("https://archive.org/download/")


def test_youtube_link_is_not_downloaded():
    result = client.post("/links/inspect", json={"url": "https://www.youtube.com/watch?v=example"}).json()
    assert result["action"] == "link-only"
    unknown = classify_link("https://example.com/song.mp3", set())
    assert unknown["action"] == "reject"


def test_account_favourites_and_admin_stats():
    registered = client.post("/auth/register", json={"email": "listener@example.com", "password": "secret", "name": "Listener"})
    token = registered.json()["token"]
    song_id = client.get("/search", params={"q": "Yatzakkar"}).json()["songs"][0]["id"]
    saved = client.post(f"/me/favourites/{song_id}", headers={"Authorization": f"Bearer {token}"})
    assert saved.status_code == 200
    favourites = client.get("/me/favourites", headers={"Authorization": f"Bearer {token}"}).json()["songs"]
    assert favourites[0]["id"] == song_id
    admin = client.post("/auth/login", json={"email": "admin@musiqi.world", "password": "demo"}).json()
    stats = client.get("/admin/stats", headers={"Authorization": f"Bearer {admin['token']}"})
    assert stats.status_code == 200
    assert stats.json()["licensed_audio"] > 0
