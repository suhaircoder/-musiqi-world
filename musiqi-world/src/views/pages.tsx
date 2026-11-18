"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ALBUMS, ARTISTS, COUNTRIES, GENRES, LANGUAGES, TRACKS, albumById, artistById, displayTitle, formatTime, slugify, tracksForAlbum, tracksForArtist } from "@/lib/catalog";
import { rememberAudio, validateAudioFile } from "@/lib/audioStore";
import type { LicenseCode, Region, Submission, Track } from "@/lib/types";
import { AlbumGrid, AlbumRail, Cover, PageIntro, TrackList } from "@/components/Music";
import { DirectoryMatches, EncyclopediaAdmin } from "@/views/encyclopedia";
import { displayName, useDirectory } from "@/lib/directory";
import { useAuth, useLibrary, usePlayer, useUi } from "@/context/store";

function byPopularity<T extends { popularity: number }>(items: T[]) {
  return [...items].sort((a, b) => b.popularity - a.popularity);
}

const SINGER_IDS = ["mohammed-abdu", "fairuz", "abdul-majeed-abdullah", "saad-lamjarred", "majed-al-mohandis", "elissa", "najwa-karam", "kadim-al-sahir", "george-wassouf"];

export function HomePage() {
  const { t, locale } = useUi();
  const { tracks } = useLibrary();
  const player = usePlayer();
  const { artists } = useDirectory();
  const arabic = byPopularity(tracks.filter((track) => track.region === "arabic"));
  const newest = [...tracks].sort((a, b) => b.added.localeCompare(a.added));
  const oud = tracks.filter((track) => track.genre === "Oud");
  const gnawa = tracks.filter((track) => track.genre === "Gnawa");
  const albums = [...ALBUMS].sort((a, b) => b.year - a.year).slice(0, 8);
  const singers = SINGER_IDS.map((id) => artists.find((artist) => artist.id === id)).filter((artist) => artist !== undefined);
  const cards = [
    { key: "arabic", tracks: arabic, title: t("home.arabicCard"), hint: t("home.arabicHint"), art: arabic[0]?.artwork, className: "stage-arabic" },
    { key: "new", tracks: newest, title: t("home.newCard"), hint: t("home.newHint"), art: newest[0]?.artwork, className: "stage-new" },
    { key: "oud", tracks: oud, title: t("home.oudCard"), hint: t("home.oudHint"), art: oud[0]?.artwork, className: "stage-oud" },
    { key: "gnawa", tracks: gnawa, title: t("home.gnawaCard"), hint: t("home.gnawaHint"), art: gnawa[0]?.artwork, className: "stage-gnawa" },
  ].filter((card) => card.tracks.length);

  function play(list: Track[]) {
    if (list[0]) player.playTrack(list[0].id, list.map((track) => track.id));
  }

  return (
    <>
      <section className="stage">
        {cards.map((card) => (
          <button key={card.key} className={`stage-card ${card.className}`} type="button" onClick={() => play(card.tracks)}>
            {card.art ? <img src={card.art} alt="" /> : null}
            <span>{card.hint}</span>
            <strong>{card.title}</strong>
          </button>
        ))}
      </section>
      <section className="mb-8">
        <h2 className="mb-3 font-display text-3xl">{t("home.newMusic")}</h2>
        <AlbumRail albums={albums} />
      </section>
      <section className="mb-8">
        <h2 className="mb-3 font-display text-3xl">{t("home.playable")}</h2>
        <div className="song-rail">
          {byPopularity(tracks).slice(0, 12).map((track) => (
            <button key={track.id} className="song-card" type="button" onClick={() => player.playTrack(track.id, byPopularity(tracks).slice(0, 12).map((item) => item.id))}>
              <Cover src={track.artwork} title={displayTitle(track, locale)} />
              <p className="mt-2 truncate font-semibold" dir="auto">{displayTitle(track, locale)}</p>
              <p className="truncate text-sm text-muted">{artistById(track.artistId)?.name}</p>
            </button>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl">{t("home.singers")}</h2>
          <Link className="text-sm text-gold" href="/encyclopedia">{t("nav.encyclopedia")}</Link>
        </div>
        <div className="row-scroll">
          {singers.map((artist) => (
            <Link key={artist.id} href={`/encyclopedia/artist/${artist.id}`} className="block">
              <Cover src={artist.image} title={displayName(artist, locale)} />
              <p className="mt-2 truncate font-semibold" dir="auto">{displayName(artist, locale)}</p>
              <p className="truncate text-sm text-muted">{t("home.singerHint")}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export function ExplorePage() {
  const { t } = useUi();
  return (
    <>
      <PageIntro title={t("nav.explore")} text={t("home.lead")} />
      <AlbumGrid albums={ALBUMS} />
      <div className="mt-8 flex flex-wrap gap-2">
        {GENRES.map((genre) => <Link key={genre} className="btn" href={`/genres/${slugify(genre)}`}>{t(`genre.${genre}`)}</Link>)}
      </div>
    </>
  );
}

export function RegionPage({ region }: { region: "arabic" | "international" }) {
  const { t } = useUi();
  const { tracks } = useLibrary();
  const list = tracks.filter((track) => track.region === region);
  return (
    <>
      <PageIntro title={t(region === "arabic" ? "nav.arabic" : "nav.international")} text={t("app.footer")} />
      <TrackList tracks={list} />
    </>
  );
}

export function CountriesPage() {
  const { t } = useUi();
  return (
    <>
      <PageIntro title={t("nav.countries")} />
      <div className="grid gap-3 md:grid-cols-3">
        {COUNTRIES.map((country) => (
          <Link key={country} href={`/countries/${slugify(country)}`} className="panel p-5 font-display text-3xl">{t(`country.${country}`)}</Link>
        ))}
      </div>
    </>
  );
}

export function CountryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useUi();
  const country = COUNTRIES.find((item) => slugify(item) === slug);
  const tracks = TRACKS.filter((track) => slugify(track.country) === slug);
  if (!country) return <PageIntro title={t("common.notFound")} />;
  return (
    <>
      <PageIntro title={t(`country.${country}`)} />
      <TrackList tracks={tracks} />
    </>
  );
}

export function GenresPage() {
  const { t } = useUi();
  return (
    <>
      <PageIntro title={t("nav.genres")} />
      <div className="grid gap-3 md:grid-cols-3">
        {GENRES.map((genre) => <Link key={genre} className="panel p-5 font-display text-3xl" href={`/genres/${slugify(genre)}`}>{t(`genre.${genre}`)}</Link>)}
      </div>
    </>
  );
}

export function GenrePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useUi();
  const genre = GENRES.find((item) => slugify(item) === slug);
  if (!genre) return <PageIntro title={t("common.notFound")} />;
  return (
    <>
      <PageIntro title={t(`genre.${genre}`)} />
      <TrackList tracks={TRACKS.filter((track) => track.genre === genre)} />
    </>
  );
}

export function ArtistsPage() {
  const { t } = useUi();
  return (
    <>
      <PageIntro title={t("nav.artists")} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {ARTISTS.map((artist) => (
          <Link key={artist.id} href={`/artists/${artist.id}`} className="panel p-3">
            <img className="cover" src={artist.image} alt="" />
            <p className="mt-3 font-semibold">{artist.name}</p>
            <p className="text-sm text-muted">{t(`country.${artist.country}`)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

export function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useUi();
  const artist = artistById(id);
  if (!artist) return <PageIntro title={t("common.notFound")} />;
  const albums = ALBUMS.filter((album) => album.artistId === artist.id);
  return (
    <>
      <PageIntro kicker={t("common.singer")} title={artist.name} text={artist.bio} />
      <p className="mb-4 text-muted">{t(`country.${artist.country}`)}</p>
      <div className="mb-6 flex flex-wrap gap-3">
        {artist.links.map((link) => <a key={link.url} className="btn" href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
      </div>
      <AlbumGrid albums={albums} />
      <div className="mt-8"><TrackList tracks={tracksForArtist(artist.id)} /></div>
    </>
  );
}

export function AlbumsPage() {
  const { t } = useUi();
  return (
    <>
      <PageIntro title={t("nav.albums")} />
      <AlbumGrid albums={ALBUMS} />
    </>
  );
}

export function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useUi();
  const album = albumById(id);
  if (!album) return <PageIntro title={t("common.notFound")} />;
  const artist = artistById(album.artistId);
  return (
    <>
      <PageIntro kicker={artist?.name} title={album.title} text={`${album.year}`} />
      <TrackList tracks={tracksForAlbum(album.id)} />
    </>
  );
}

export function SearchPage() {
  const params = useSearchParams();
  const { t } = useUi();
  const { tracks } = useLibrary();
  const [song, setSong] = useState(params.get("song") ?? "");
  const [artist, setArtist] = useState(params.get("artist") ?? "");
  const [album, setAlbum] = useState("");
  const [country, setCountry] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const results = useMemo(() => tracks.filter((track) => {
    const singer = artistById(track.artistId)?.name ?? track.credit ?? "";
    const albumTitle = albumById(track.albumId)?.title ?? "";
    const blob = `${track.title} ${track.titleAr ?? ""} ${singer}`.toLowerCase();
    return (!song || blob.includes(song.toLowerCase()))
      && (!artist || singer.toLowerCase().includes(artist.toLowerCase()) || (track.titleAr ?? "").includes(artist))
      && (!album || albumTitle.toLowerCase().includes(album.toLowerCase()))
      && (!country || track.country === country)
      && (!genre || track.genre === genre)
      && (!language || track.language === language);
  }), [tracks, song, artist, album, country, genre, language]);
  return (
    <>
      <PageIntro title={t("nav.search")} text={t("search.lead")} />
      <form className="mb-6 grid gap-3 md:grid-cols-3" onSubmit={(event) => event.preventDefault()}>
        <input className="field" dir="auto" placeholder={t("search.song")} value={song} onChange={(event) => setSong(event.target.value)} />
        <input className="field" dir="auto" placeholder={t("search.artist")} value={artist} onChange={(event) => setArtist(event.target.value)} />
        <input className="field" dir="auto" placeholder={t("search.album")} value={album} onChange={(event) => setAlbum(event.target.value)} />
        <select className="field" value={country} onChange={(event) => setCountry(event.target.value)}>
          <option value="">{t("search.country")}: {t("search.any")}</option>
          {COUNTRIES.map((item) => <option key={item} value={item}>{t(`country.${item}`)}</option>)}
        </select>
        <select className="field" value={genre} onChange={(event) => setGenre(event.target.value)}>
          <option value="">{t("search.genre")}: {t("search.any")}</option>
          {GENRES.map((item) => <option key={item} value={item}>{t(`genre.${item}`)}</option>)}
        </select>
        <select className="field" value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="">{t("search.language")}: {t("search.any")}</option>
          {LANGUAGES.map((item) => <option key={item} value={item}>{t(`lang.${item}`)}</option>)}
        </select>
      </form>
      <DirectoryMatches query={[song, artist, album].filter(Boolean).join(" ")} />
      <p className="mb-3 text-sm text-muted">{results.length} {t("common.results")}</p>
      {results.length ? <TrackList tracks={results} /> : <p>{t("search.none")}</p>}
    </>
  );
}

export function PlayerPage() {
  const { t, locale } = useUi();
  const player = usePlayer();
  const library = useLibrary();
  const track = player.current;
  const artist = track ? artistById(track.artistId) : null;
  const queued = player.queue.map((id) => library.tracks.find((item) => item.id === id)).filter((item) => item !== undefined);
  return (
    <div className="now">
      <div className="now-art">
        {track ? <Cover src={track.artwork} title={displayTitle(track, locale)} /> : <div className="cover" />}
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-display text-4xl" dir="auto">{track ? displayTitle(track, locale) : t("player.empty")}</h1>
          <p className="mt-1 text-lg text-muted">{artist?.name}</p>
        </div>
        {track ? (
          <button className="btn" type="button" onClick={() => library.toggleFavorite(track.id)} aria-label={t("action.favourite")}>
            {library.isFavorite(track.id) ? "♥" : "♡"}
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm text-muted">
        <span>{formatTime(player.progress)}</span>
        <input className="w-full" type="range" min={0} max={player.duration || track?.duration || 0} step={0.1} value={Math.min(player.progress, player.duration || 0)} aria-label={t("player.progress")} onChange={(event) => player.seek(Number(event.target.value))} />
        <span>{formatTime(player.duration || track?.duration || 0)}</span>
      </div>
      <div className="now-controls">
        <button className="btn" type="button" onClick={() => player.setShuffle(!player.shuffle)} aria-pressed={player.shuffle}>{t("action.shuffle")}</button>
        <button className="btn" type="button" onClick={player.previous}>{t("action.previous")}</button>
        <button className="play-orb" type="button" onClick={player.toggle}>{player.playing ? t("action.pause") : t("action.play")}</button>
        <button className="btn" type="button" onClick={player.next}>{t("action.next")}</button>
        <button className="btn" type="button" onClick={player.cycleRepeat} aria-pressed={player.repeat !== "off"}>{t("action.repeat")}</button>
      </div>
      <h2 className="mb-3 mt-8 font-display text-3xl">{t("player.queue")}</h2>
      <div className="panel">
        {queued.map((item) => (
          <div key={item.id} className="track">
            <div className="min-w-0 md:col-span-2">
              <button className="font-semibold" type="button" onClick={() => player.playTrack(item.id, player.queue)}>{displayTitle(item, locale)}</button>
            </div>
            <button className="btn" type="button" onClick={() => player.removeFromQueue(item.id)}>{t("action.remove")}</button>
          </div>
        ))}
        {!queued.length ? <p className="p-4 text-muted">{t("player.empty")}</p> : null}
      </div>
    </div>
  );
}

export function PlaylistsPage() {
  const { t } = useUi();
  const library = useLibrary();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(library.playlists[0]?.id ?? "");
  const playlist = library.playlists.find((item) => item.id === selected) ?? library.playlists[0];
  const songs = (playlist?.trackIds ?? []).map((id) => library.tracks.find((track) => track.id === id)).filter((track) => track !== undefined);
  return (
    <>
      <PageIntro title={t("nav.playlists")} />
      <form className="mb-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); library.createPlaylist(name); setName(""); }}>
        <input className="field" dir="auto" placeholder={t("playlist.name")} value={name} onChange={(event) => setName(event.target.value)} />
        <button className="btn-gold" type="submit">{t("action.create")}</button>
      </form>
      {!library.playlists.length ? <p className="text-muted">{t("playlist.empty")}</p> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {library.playlists.map((item) => (
          <button key={item.id} className={item.id === playlist?.id ? "btn-gold" : "btn"} type="button" onClick={() => setSelected(item.id)}>{item.name}</button>
        ))}
      </div>
      {playlist ? (
        <>
          <form className="mb-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); library.renamePlaylist(playlist.id, String(data.get("name") ?? "")); }}>
            <input className="field" name="name" dir="auto" defaultValue={playlist.name} key={playlist.id} />
            <button className="btn" type="submit">{t("action.rename")}</button>
            <button className="btn" type="button" onClick={() => library.removePlaylist(playlist.id)}>{t("action.remove")}</button>
          </form>
          {songs.length ? <TrackList tracks={songs} /> : <p className="text-muted">{t("playlist.missing")}</p>}
        </>
      ) : null}
    </>
  );
}

export function FavouritesPage() {
  const { t } = useUi();
  const library = useLibrary();
  const songs = library.favorites.map((id) => library.tracks.find((track) => track.id === id)).filter((track) => track !== undefined);
  const recent = library.history.map((item) => library.tracks.find((track) => track.id === item.trackId)).filter((track) => track !== undefined);
  const rows = [
    { href: "/favourites", label: t("library.liked"), count: songs.length },
    { href: "/albums", label: t("library.albums"), count: ALBUMS.length },
    { href: "/artists", label: t("library.artists"), count: ARTISTS.length },
    { href: "/playlists", label: t("library.playlists"), count: library.playlists.length },
    { href: "/downloads", label: t("library.downloads"), count: library.downloads.length },
  ];
  return (
    <>
      <PageIntro title={t("nav.favourites")} />
      <div className="panel mb-8 overflow-hidden">
        {rows.map((row) => (
          <Link key={row.href} href={row.href} className="library-row">
            <span>{row.label}</span>
            <span className="text-muted">{row.count}</span>
          </Link>
        ))}
      </div>
      <h2 className="mb-3 font-display text-3xl">{t("library.liked")}</h2>
      {songs.length ? <TrackList tracks={songs} /> : <p className="mb-8 text-muted">{t("fav.empty")}</p>}
      <h2 className="mb-3 mt-8 font-display text-3xl">{t("library.recent")}</h2>
      {recent.length ? <TrackList tracks={recent} /> : <p className="text-muted">{t("player.empty")}</p>}
    </>
  );
}

export function DownloadsPage() {
  const { t } = useUi();
  const library = useLibrary();
  const songs = library.downloads.map((item) => library.tracks.find((track) => track.id === item.trackId)).filter((track) => track !== undefined);
  return (
    <>
      <PageIntro title={t("nav.downloads")} text={t("app.footer")} />
      {songs.length ? <TrackList tracks={songs} /> : <p className="text-muted">{t("downloads.empty")}</p>}
    </>
  );
}

export function ProfilePage() {
  const { t } = useUi();
  const { user, signOut } = useAuth();
  const { history, tracks } = useLibrary();
  const songs = history.map((item) => tracks.find((track) => track.id === item.trackId)).filter((track) => track !== undefined);
  if (!user) return <PageIntro title={t("nav.profile")} text={t("auth.required")} />;
  return (
    <>
      <PageIntro kicker={user.role} title={user.name} text={user.email} />
      <button className="btn mb-6" type="button" onClick={signOut}>{t("action.signOut")}</button>
      {songs.length ? <TrackList tracks={songs} /> : <p className="text-muted">{t("history.empty")}</p>}
    </>
  );
}

export function SettingsPage() {
  const { t, locale, setLocale, theme, setTheme } = useUi();
  return (
    <>
      <PageIntro title={t("nav.settings")} />
      <div className="panel grid max-w-xl gap-4 p-5">
        <label className="grid gap-2">{t("settings.language")}
          <select className="field" value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button className={theme === "dark" ? "btn-gold" : "btn"} type="button" onClick={() => setTheme("dark")}>{t("settings.dark")}</button>
          <button className={theme === "light" ? "btn-gold" : "btn"} type="button" onClick={() => setTheme("light")}>{t("settings.light")}</button>
        </div>
      </div>
    </>
  );
}

export function LoginPage() {
  const { t } = useUi();
  const auth = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const message = mode === "in"
      ? await auth.signIn(email, password)
      : await auth.signUp(String(data.get("name") ?? ""), email, password, data.get("artist") === "on");
    setError(message);
  }
  return (
    <>
      <PageIntro title={t("auth.title")} text={t("auth.demo")} />
      <form className="panel grid max-w-md gap-3 p-5" onSubmit={onSubmit}>
        {mode === "up" ? <input className="field" name="name" placeholder={t("auth.name")} required /> : null}
        <input className="field" name="email" type="email" placeholder={t("auth.email")} required />
        <input className="field" name="password" type="password" placeholder={t("auth.password")} required />
        {mode === "up" ? <label className="flex gap-2 text-sm"><input name="artist" type="checkbox" /> {t("auth.artist")}</label> : null}
        <button className="btn-gold" type="submit">{mode === "in" ? t("nav.signin") : t("auth.create")}</button>
        <button className="btn" type="button" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? t("auth.create") : t("auth.have")}</button>
        {error ? <p className="text-sm text-gold">{t(error)}</p> : null}
      </form>
    </>
  );
}

export function DashboardPage() {
  const { t } = useUi();
  const { user } = useAuth();
  const library = useLibrary();
  const [message, setMessage] = useState("");
  if (!user || (user.role !== "artist" && user.role !== "admin")) {
    return <PageIntro title={t("nav.dashboard")} text={t("artist.need")} />;
  }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File)) return;
    const problem = validateAudioFile(file);
    if (problem || data.get("confirm") !== "on") {
      setMessage(problem || "artist.confirm");
      return;
    }
    const id = crypto.randomUUID();
    rememberAudio(id, file);
    const submission: Submission = {
      id,
      ownerId: user!.id,
      title: String(data.get("title") ?? ""),
      artistName: user!.name,
      albumTitle: String(data.get("album") ?? "Single"),
      genre: String(data.get("genre") ?? "Arabic"),
      country: String(data.get("country") ?? "International"),
      language: String(data.get("language") ?? "ar"),
      region: (data.get("region") as Region) || "arabic",
      license: data.get("license") as LicenseCode,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    library.submit(submission);
    setMessage("artist.pending");
    form.reset();
  }
  return (
    <>
      <PageIntro title={t("nav.dashboard")} text={t("artist.lead")} />
      <form className="panel grid max-w-2xl gap-3 p-5" onSubmit={onSubmit}>
        <input className="field" name="title" dir="auto" placeholder={t("search.song")} required />
        <input className="field" name="album" dir="auto" placeholder={t("search.album")} />
        <select className="field" name="license" defaultValue="artist">
          <option value="artist">{t("license.artist")}</option>
          <option value="pd">{t("license.pd")}</option>
          <option value="cc-by-nc">{t("license.cc-by-nc")}</option>
          <option value="cc-by-nc-nd">{t("license.cc-by-nc-nd")}</option>
        </select>
        <select className="field" name="region" defaultValue="arabic">
          <option value="arabic">{t("nav.arabic")}</option>
          <option value="international">{t("nav.international")}</option>
        </select>
        <input className="field" name="country" placeholder={t("search.country")} defaultValue="Libya" />
        <input className="field" name="language" placeholder={t("search.language")} defaultValue="ar" />
        <input className="field" name="genre" placeholder={t("search.genre")} defaultValue="Arabic" />
        <label className="text-sm">{t("artist.file")}<input className="field mt-2" name="file" type="file" accept="audio/*" required /></label>
        <label className="flex gap-2 text-sm"><input name="confirm" type="checkbox" required /> {t("artist.confirm")}</label>
        <button className="btn-gold" type="submit">{t("action.submit")}</button>
        {message ? <p className="text-sm text-gold">{t(message) === message ? message : t(message)}</p> : null}
      </form>
    </>
  );
}

export function AdminPage() {
  const { t } = useUi();
  const { user } = useAuth();
  const library = useLibrary();
  if (user?.role !== "admin") return <PageIntro title={t("nav.admin")} text={t("admin.need")} />;
  return (
    <>
      <PageIntro title={t("nav.admin")} text={t("admin.lead")} />
      <div className="panel mb-8">
        {library.submissions.map((submission) => (
          <article key={submission.id} className="track">
            <div>
              <p className="font-semibold" dir="auto">{submission.title}</p>
              <p className="text-sm text-muted">{submission.artistName} · {submission.status} · {t(`license.${submission.license}`)}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn" type="button" onClick={() => library.review(submission.id, "approved")}>{t("action.approve")}</button>
              <button className="btn" type="button" onClick={() => library.review(submission.id, "rejected")}>{t("action.reject")}</button>
            </div>
          </article>
        ))}
        {!library.submissions.length ? <p className="p-4 text-muted">{t("search.none")}</p> : null}
      </div>
      <TrackList tracks={library.tracks.filter((track) => !track.submission)} />
      <EncyclopediaAdmin />
    </>
  );
}
