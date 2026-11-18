"use client";

import Link from "next/link";
import { useState } from "react";
import { ALBUMS, artistById, albumById, displayTitle, formatTime, slugify } from "@/lib/catalog";
import type { Album, Track } from "@/lib/types";
import { useLibrary, usePlayer, useUi } from "@/context/store";

export function Cover({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className="cover grid place-items-center p-4 text-center font-display text-2xl">{title.slice(0, 1)}</div>;
  }
  return <img className="cover" src={src} alt="" onError={() => setFailed(true)} />;
}

export function AlbumRail({ albums }: { albums: Album[] }) {
  const { locale, t } = useUi();
  return (
    <div className="row-scroll">
      {albums.map((album) => {
        const artist = artistById(album.artistId);
        return (
          <Link key={album.id} href={`/albums/${album.id}`} className="block">
            <Cover src={album.artwork} title={album.title} />
            <p className="mt-3 font-semibold" dir="auto">{album.title}</p>
            <p className="text-sm text-muted">{locale === "ar" ? t(`country.${album.country}`) : artist?.name}</p>
          </Link>
        );
      })}
    </div>
  );
}

export function TrackList({ tracks }: { tracks: Track[] }) {
  const { t, locale } = useUi();
  const player = usePlayer();
  const library = useLibrary();
  return (
    <div className="panel overflow-hidden">
      {tracks.map((track) => {
        const artist = artistById(track.artistId);
        const singer = artist?.name ?? track.credit ?? track.title;
        const active = player.current?.id === track.id;
        return (
          <article key={track.id} className="track">
            <Cover src={track.artwork} title={track.title} />
            <div className="min-w-0">
              <button className="block max-w-full truncate text-start font-semibold" dir="auto" onClick={() => (active ? player.toggle() : player.playTrack(track.id, tracks.map((item) => item.id)))}>
                {displayTitle(track, locale)}
              </button>
              <p className="truncate text-sm text-muted" dir="auto">{singer} · {t(`genre.${track.genre}`)} · {formatTime(track.duration)}</p>
            </div>
            <p className="text-sm text-muted" dir="auto">{t(`license.${track.license}`)}</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={() => (active ? player.toggle() : player.playTrack(track.id, tracks.map((item) => item.id)))}>{active && player.playing ? t("action.pause") : t("action.play")}</button>
              <button className="btn" onClick={() => library.toggleFavorite(track.id)}>{library.isFavorite(track.id) ? "♥" : t("action.favourite")}</button>
              {track.canDownload && track.audioUrl ? (
                <a className="btn" href={track.submission ? track.audioUrl : `/api/download/${track.id}`} download onClick={() => library.noteDownload(track.id)}>{t("action.download")}</a>
              ) : null}
              {library.playlists.length ? (
                <select className="field w-auto" defaultValue="" aria-label={t("action.add")} onChange={(event) => { if (event.target.value) library.addToPlaylist(event.target.value, track.id); event.target.value = ""; }}>
                  <option value="">{t("action.add")}</option>
                  {library.playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name}</option>)}
                </select>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function PageIntro({ kicker, title, text }: { kicker?: string; title: string; text?: string }) {
  return (
    <header className="mb-6">
      {kicker ? <p className="text-sm font-bold uppercase tracking-[0.16em] text-gold">{kicker}</p> : null}
      <h1 className="font-display text-4xl leading-none md:text-6xl" dir="auto">{title}</h1>
      {text ? <p className="mt-3 max-w-2xl text-lg text-muted">{text}</p> : null}
    </header>
  );
}

export function AlbumGrid({ albums }: { albums: Album[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {albums.map((album) => {
        const artist = artistById(album.artistId);
        return (
          <Link key={album.id} href={`/albums/${album.id}`} className="panel p-3">
            <Cover src={album.artwork} title={album.title} />
            <p className="mt-3 font-semibold" dir="auto">{album.title}</p>
            <p className="text-sm text-muted">{artist?.name} · {album.year}</p>
          </Link>
        );
      })}
    </div>
  );
}

export { ALBUMS, artistById, albumById, slugify };
