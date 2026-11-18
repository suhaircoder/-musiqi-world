# MUSIQI WORLD

Music player and Arabic artist encyclopedia, with official listening pages for the singers.

The website lets you browse albums, play recordings this project is allowed to host, and open an official Spotify or YouTube page for singers such as Mohammed Abdu and Fairuz. Song files for those commercial singers are not stored here.

## Run the website

You need [Node.js](https://nodejs.org/).

```bash
cd musiqi-world
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On Windows you can double-click `musiqi-world/Start MUSIQI WORLD.bat` instead.

## What you can do

- Press **Arabic**, **New**, **Oud**, or **Gnawa** on the home page to play a collection.
- Open **Player** for the now-playing screen.
- Open **Favourites** for liked songs, albums, playlists, downloads, and recently played.
- Open **Encyclopedia**, search a singer, and use **Listen** when an official page is on record.
- Download a track only when its licence allows it. Those files are public domain or Creative Commons recordings from the Internet Archive.

The interface is available in English, Arabic, French, and Spanish. Arabic uses a right-to-left layout.

## Project layout

| Path | What it is |
| --- | --- |
| `musiqi-world` | The website. This is the app to open. |
| `backend` | Shared API on `http://127.0.0.1:8000`. Start it with `Start Shared API.bat`. |
| `bot` | Telegram bot. It stays idle until `TELEGRAM_TOKEN` is set. |
| `mobile` | Expo phone app. It is not required to use the website. |
| `app.py` and `static` | Older browser for the same licensed recordings. Start it with `Start Free Music.bat` at `http://127.0.0.1:8765`. |

Artist biographies, album titles, and song titles in the encyclopedia come from Wikidata, Wikipedia, and MusicBrainz. Playback of commercial singers uses the official service page already stored for that artist.

## Before you push

Do not commit generated or local folders: `node_modules`, `.next`, `.tools`, `downloads`, `__pycache__`, `.pytest_cache`, `.env`, `.env.local`, or `*.db`.
