"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Cover, PageIntro } from "@/components/Music";
import { useAuth, useUi } from "@/context/store";
import {
  ARAB_COUNTRIES,
  YEMEN_STYLES,
  blankArtist,
  displayName,
  filterArtists,
  linesFromWorks,
  slugify,
  useDirectory,
  worksFromLines,
  type DirectoryArtist,
} from "@/lib/directory";

function ArtistCard({ artist }: { artist: DirectoryArtist }) {
  const { locale, t } = useUi();
  const name = displayName(artist, locale);
  return (
    <Link href={`/encyclopedia/artist/${artist.id}`} className="panel block p-4">
      <div className="mb-3 h-28 w-28">
        <Cover src={artist.image} title={name} />
      </div>
      <p className="font-semibold" dir="auto">{name}</p>
      <p className="text-sm text-muted" dir="auto">{locale === "ar" ? artist.nameEn : artist.nameAr}</p>
      <p className="mt-2 text-sm text-gold">{t(`country.${artist.country}`)}</p>
      {artist.songs.slice(0, 3).map((song) => (
        <p key={song.mbid || song.title} className="truncate text-sm text-muted" dir="auto">{song.title}</p>
      ))}
    </Link>
  );
}

function ArtistGrid({ artists }: { artists: DirectoryArtist[] }) {
  const { t } = useUi();
  if (!artists.length) return <p className="text-muted">{t("enc.empty")}</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {artists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
    </div>
  );
}

export function EncyclopediaPage() {
  const params = useSearchParams();
  const { t } = useUi();
  const { artists } = useDirectory();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [country, setCountry] = useState(params.get("country") ?? "");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const genres = useMemo(() => [...new Set(artists.flatMap((artist) => artist.genres))].sort(), [artists]);
  const results = filterArtists(artists, { q, country, genre, year });
  return (
    <>
      <PageIntro title={t("nav.encyclopedia")} text={t("enc.lead")} />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link className="btn-gold" href="/encyclopedia/yemen">{t("enc.yemen")}</Link>
        {ARAB_COUNTRIES.map((item) => (
          <Link key={item} className="btn" href={`/encyclopedia/country/${slugify(item)}`}>{t(`country.${item}`)}</Link>
        ))}
      </div>
      <form className="mb-6 grid gap-3 md:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
        <input className="field md:col-span-2" dir="auto" value={q} placeholder={t("enc.search")} aria-label={t("enc.search")} onChange={(event) => setQ(event.target.value)} />
        <select className="field" value={country} aria-label={t("search.country")} onChange={(event) => setCountry(event.target.value)}>
          <option value="">{t("search.country")}: {t("search.any")}</option>
          {ARAB_COUNTRIES.map((item) => <option key={item} value={item}>{t(`country.${item}`)}</option>)}
        </select>
        <select className="field" value={genre} aria-label={t("search.genre")} onChange={(event) => setGenre(event.target.value)}>
          <option value="">{t("search.genre")}: {t("search.any")}</option>
          {genres.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="field" inputMode="numeric" value={year} placeholder={t("enc.year")} aria-label={t("enc.year")} onChange={(event) => setYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))} />
      </form>
      <p className="mb-3 text-sm text-muted">{results.length} {t("common.results")}</p>
      <ArtistGrid artists={results} />
    </>
  );
}

export function YemenPage() {
  const params = useSearchParams();
  const { t } = useUi();
  const { artists } = useDirectory();
  const style = params.get("style") ?? "";
  const yemeni = artists.filter((artist) => artist.country === "Yemen" || artist.yemen);
  const results = style ? yemeni.filter((artist) => artist.styles.includes(style)) : yemeni;
  return (
    <>
      <PageIntro title={t("enc.yemen")} text={t("enc.yemenLead")} />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link className={style ? "btn" : "btn-gold"} href="/encyclopedia/yemen">{t("search.any")}</Link>
        {YEMEN_STYLES.map((item) => (
          <Link key={item} className={style === item ? "btn-gold" : "btn"} href={`/encyclopedia/yemen?style=${item}`}>{t(`style.${item}`)}</Link>
        ))}
      </div>
      {style && !results.length ? <p className="mb-4 text-muted">{t("enc.emptyStyle")}</p> : null}
      <ArtistGrid artists={results} />
    </>
  );
}

export function CountryDirectoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useUi();
  const { artists } = useDirectory();
  const country = ARAB_COUNTRIES.find((item) => slugify(item) === slug);
  if (!country) return <PageIntro title={t("common.notFound")} />;
  const results = artists.filter((artist) => artist.country === country);
  return (
    <>
      <PageIntro title={t(`country.${country}`)} text={t("enc.countryLead")} />
      <ArtistGrid artists={results} />
    </>
  );
}

function officialPlayer(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "open.spotify.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const kind = parts[0] === "embed" ? parts[1] : parts[0];
    const id = parts[0] === "embed" ? parts[2] : parts[1];
    if (kind === "artist" && id && /^[A-Za-z0-9]{22}$/.test(id)) {
      return { src: `https://open.spotify.com/embed/artist/${id}`, title: "Spotify" };
    }
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const channel = parsed.pathname.match(/^\/channel\/(UC[\w-]{20,})$/);
    if (channel) {
      return { src: `https://www.youtube.com/embed/videoseries?list=UU${channel[1].slice(2)}`, title: "YouTube" };
    }
  }
  return null;
}

function WorkList({ title, works, empty }: { title: string; works: { title: string; date: string; mbid?: string }[]; empty: string }) {
  const { t } = useUi();
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-3xl">{title}</h2>
      {works.length ? (
        <div className="panel">
          {works.map((work) => (
            <div key={work.mbid || `${work.title}-${work.date}`} className="track">
              <p className="font-semibold" dir="auto">{work.title}</p>
              <p className="text-sm text-muted">{work.date || t("enc.noDate")}</p>
            </div>
          ))}
        </div>
      ) : <p className="text-muted">{empty}</p>}
    </section>
  );
}

export function EncyclopediaArtistPage() {
  const { id } = useParams<{ id: string }>();
  const { locale, t } = useUi();
  const { artists } = useDirectory();
  const artist = artists.find((item) => item.id === id);
  if (!artist) return <PageIntro title={t("common.notFound")} />;
  const name = displayName(artist, locale);
  const bio = locale === "ar" ? artist.bioAr || artist.bioEn : artist.bioEn || artist.bioAr;
  const players = artist.listen.map((link) => officialPlayer(link.url)).filter((player): player is { src: string; title: string } => Boolean(player));
  const shown = players.filter((player, index) => players.findIndex((item) => item.title === player.title) === index);
  return (
    <>
      <div className="mb-8 grid items-start gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="h-44 w-44">
          <Cover src={artist.image} title={name} />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-gold">{t(`country.${artist.country}`)}</p>
          <h1 className="font-display text-5xl" dir="auto">{name}</h1>
          <p className="mt-2 text-lg text-muted" dir="auto">{locale === "ar" ? artist.nameEn : artist.nameAr}</p>
          <p className="mt-3 text-sm text-muted">{artist.verified ? t("enc.verified") : t("enc.unverified")}</p>
          {artist.genres.length ? <p className="mt-3 text-sm">{artist.genres.join(" · ")}</p> : null}
          {artist.styles.length ? <p className="mt-2 text-sm">{artist.styles.map((style) => t(`style.${style}`)).join(" · ")}</p> : null}
        </div>
      </div>
      <section className="mb-8 max-w-3xl">
        <h2 className="mb-3 font-display text-3xl">{t("enc.bio")}</h2>
        {bio ? <p dir="auto">{bio}</p> : <p className="text-muted">{t("enc.noBio")}</p>}
        {artist.bioSource ? <p className="mt-3 text-sm"><a className="text-gold" href={artist.bioSource} target="_blank" rel="noreferrer">{t("enc.source")}</a></p> : null}
      </section>
      <section className="mb-8">
        <h2 className="mb-3 font-display text-3xl">{t("enc.listen")}</h2>
        <p className="mb-3 max-w-3xl text-sm text-muted">{shown.length ? t("enc.noAudio") : t("enc.noPlayer")}</p>
        <div className="mb-4 grid gap-4">
          {shown.map((player) => (
            <iframe
              key={player.src}
              className="h-[380px] w-full max-w-3xl rounded-xl border border-line bg-elev"
              src={player.src}
              title={`${name} — ${player.title}`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {artist.website ? <a className="btn" href={artist.website} target="_blank" rel="noreferrer">{t("enc.website")}</a> : null}
          {artist.listen.map((link) => <a key={link.url} className="btn-gold" href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
          {artist.socials.map((link) => <a key={link.url} className="btn" href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
        </div>
        {!artist.website && !artist.listen.length && !artist.socials.length ? <p className="text-muted">{t("enc.noLinks")}</p> : null}
        {artist.licenseNote ? <p className="mt-3 text-sm text-muted">{artist.licenseNote}</p> : null}
      </section>
      <WorkList title={t("enc.songs")} works={artist.songs} empty={t("enc.noSongs")} />
      <WorkList title={t("enc.albums")} works={artist.albums} empty={t("enc.noAlbums")} />
    </>
  );
}

export function DirectoryMatches({ query }: { query: string }) {
  const { t } = useUi();
  const { artists } = useDirectory();
  const results = query.trim() ? filterArtists(artists, { q: query }).slice(0, 8) : [];
  if (!results.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-3xl">{t("nav.encyclopedia")}</h2>
      <ArtistGrid artists={results} />
    </section>
  );
}

export function EncyclopediaAdmin() {
  const { t } = useUi();
  const { user } = useAuth();
  const { artists, save, remove } = useDirectory();
  const [current, setCurrent] = useState<DirectoryArtist>(blankArtist());
  const [albums, setAlbums] = useState("");
  const [songs, setSongs] = useState("");
  const [listenUrl, setListenUrl] = useState("");
  const [message, setMessage] = useState("");

  if (user?.role !== "admin") return null;

  function load(id: string) {
    const artist = artists.find((item) => item.id === id) ?? blankArtist();
    setCurrent(artist);
    setAlbums(linesFromWorks(artist.albums));
    setSongs(linesFromWorks(artist.songs));
    setListenUrl(artist.listen[0]?.url ?? "");
    setMessage("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const listen = listenUrl.trim() ? [{ label: "Listen", url: listenUrl.trim() }, ...current.listen.filter((link) => link.url !== listenUrl.trim())] : current.listen;
    const id = save({
      ...current,
      genres: current.genres.length ? current.genres : [],
      albums: worksFromLines(albums),
      songs: worksFromLines(songs),
      listen,
      verified: current.verified,
    });
    setMessage(id);
  }

  return (
    <section className="mt-10">
      <h2 className="mb-3 font-display text-3xl">{t("nav.encyclopedia")}</h2>
      <p className="mb-4 max-w-3xl text-sm text-muted">{t("enc.admin")}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button className="btn" type="button" onClick={() => load("")}>{t("enc.new")}</button>
        {artists.map((artist) => (
          <button key={artist.id} className="btn" type="button" onClick={() => load(artist.id)}>{artist.nameEn}</button>
        ))}
      </div>
      <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <input className="field" dir="auto" required placeholder={t("enc.nameAr")} value={current.nameAr} onChange={(event) => setCurrent({ ...current, nameAr: event.target.value })} />
        <input className="field" required placeholder={t("enc.nameEn")} value={current.nameEn} onChange={(event) => setCurrent({ ...current, nameEn: event.target.value })} />
        <select className="field" value={current.country} onChange={(event) => setCurrent({ ...current, country: event.target.value })}>
          {ARAB_COUNTRIES.map((country) => <option key={country} value={country}>{t(`country.${country}`)}</option>)}
        </select>
        <input className="field" placeholder={t("enc.genres")} value={current.genres.join(", ")} onChange={(event) => setCurrent({ ...current, genres: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
        <textarea className="field min-h-28 md:col-span-2" dir="auto" placeholder={t("enc.bio")} value={current.bioEn} onChange={(event) => setCurrent({ ...current, bioEn: event.target.value, bioSource: current.bioSource || "Admin entry" })} />
        <textarea className="field min-h-28 md:col-span-2" dir="rtl" placeholder={t("enc.bioAr")} value={current.bioAr} onChange={(event) => setCurrent({ ...current, bioAr: event.target.value })} />
        <input className="field" placeholder={t("enc.website")} value={current.website} onChange={(event) => setCurrent({ ...current, website: event.target.value })} />
        <input className="field" placeholder={t("enc.listenUrl")} value={listenUrl} onChange={(event) => setListenUrl(event.target.value)} />
        <textarea className="field min-h-28" dir="auto" placeholder={t("enc.albumLines")} value={albums} onChange={(event) => setAlbums(event.target.value)} />
        <textarea className="field min-h-28" dir="auto" placeholder={t("enc.songLines")} value={songs} onChange={(event) => setSongs(event.target.value)} />
        <input className="field md:col-span-2" placeholder={t("enc.license")} value={current.licenseNote ?? ""} onChange={(event) => setCurrent({ ...current, licenseNote: event.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={current.verified} onChange={(event) => setCurrent({ ...current, verified: event.target.checked })} /> {t("enc.markVerified")}</label>
        <div className="flex gap-2">
          <button className="btn-gold" type="submit">{t("action.save")}</button>
          {current.id ? <button className="btn" type="button" onClick={() => { remove(current.id); load(""); }}>{t("action.remove")}</button> : null}
        </div>
        {message ? <p className="text-sm text-gold md:col-span-2">{t("enc.saved")}</p> : null}
      </form>
    </section>
  );
}
