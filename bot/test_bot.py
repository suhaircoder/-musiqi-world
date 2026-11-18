import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
os.environ["MUSIQI_DB"] = os.path.join(tempfile.mkdtemp(), "bot.db")

from fastapi.testclient import TestClient
from app.main import create_app
import musiqi_bot

client = TestClient(create_app(os.environ["MUSIQI_DB"]))


def install_client():
    def get(path, token=""):
        response = client.get(path, headers={"Authorization": f"Bearer {token}"} if token else {})
        response.raise_for_status()
        return response.json()

    def post(path, payload, token=""):
        response = client.post(path, json=payload, headers={"Authorization": f"Bearer {token}"} if token else {})
        response.raise_for_status()
        return response.json()

    musiqi_bot.api_get = get
    musiqi_bot.api_post = post


def test_search_does_not_offer_commercial_audio():
    install_client()
    text = musiqi_bot.reply("/search Mohammed Abdu")
    assert "Mohammed Abdu" in text or "عبده" in text
    assert "archive.org/download" not in text
    assert "no download" in text


def test_youtube_is_refused():
    install_client()
    text = musiqi_bot.reply("/search https://www.youtube.com/watch?v=example")
    assert "not permission" in text
    assert "http" not in text.split("\n")[-1] or "permission" in text


def test_commands_list_catalogue():
    install_client()
    assert "Yemen" in musiqi_bot.reply("/countries")
    assert musiqi_bot.reply("/yemen")
    assert "Licensed" in musiqi_bot.reply("/search Yatzakkar") or "archive.org" in musiqi_bot.reply("/search Yatzakkar")
