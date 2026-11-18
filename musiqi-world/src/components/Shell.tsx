"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { artistById, displayTitle, formatTime } from "@/lib/catalog";
import { useAuth, usePlayer, useUi } from "@/context/store";
import { Cover } from "./Music";

const LINKS = [
  ["/", "nav.home"],
  ["/explore", "nav.explore"],
  ["/arabic", "nav.arabic"],
  ["/encyclopedia", "nav.encyclopedia"],
  ["/international", "nav.international"],
  ["/countries", "nav.countries"],
  ["/genres", "nav.genres"],
  ["/artists", "nav.artists"],
  ["/albums", "nav.albums"],
  ["/search", "nav.search"],
  ["/player", "nav.player"],
  ["/playlists", "nav.playlists"],
  ["/favourites", "nav.favourites"],
  ["/downloads", "nav.downloads"],
  ["/dashboard", "nav.dashboard"],
  ["/profile", "nav.profile"],
  ["/settings", "nav.settings"],
  ["/admin", "nav.admin"],
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { t, locale, setLocale, theme, setTheme } = useUi();
  const { user } = useAuth();
  const player = usePlayer();
  const [open, setOpen] = useState(false);
  const artist = player.current ? artistById(player.current.artistId) : null;

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    router.push(`/search?artist=${encodeURIComponent(String(data.get("q") ?? ""))}`);
  }

  const links = LINKS.filter(([href]) => {
    if (href === "/admin") return user?.role === "admin";
    if (href === "/dashboard") return user?.role === "artist" || user?.role === "admin";
    return true;
  });

  return (
    <div className="shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <Link href="/" className="wordmark mb-6 block" onClick={() => setOpen(false)}>MUSIQI</Link>
        <nav className="grid gap-1">
          {links.map(([href, key]) => (
            <Link key={href} href={href} className={path === href || (href !== "/" && path.startsWith(`${href}/`)) ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>
              {t(key)}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="main">
        <div className="topbar">
          <button className="btn menu-button" type="button" onClick={() => setOpen((value) => !value)}>{t("action.menu")}</button>
          <form onSubmit={onSearch} className="flex min-w-0 flex-1 gap-2">
            <input className="field" name="q" dir="auto" placeholder={t("search.artist")} aria-label={t("search.artist")} />
            <button className="btn-gold" type="submit">{t("action.search")}</button>
          </form>
          <select className="field w-auto" value={locale} aria-label={t("settings.language")} onChange={(event) => setLocale(event.target.value as typeof locale)}>
            <option value="en">EN</option>
            <option value="ar">AR</option>
            <option value="fr">FR</option>
            <option value="es">ES</option>
          </select>
          <button className="btn" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? t("settings.light") : t("settings.dark")}
          </button>
          {user ? <span className="hidden text-sm md:inline">{user.name}</span> : <Link className="btn" href="/login">{t("nav.signin")}</Link>}
        </div>
        {children}
        <p className="mx-auto mt-10 max-w-3xl text-sm text-muted">{t("app.footer")}</p>
      </div>
      <footer className="player">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-14 w-14 shrink-0">{player.current ? <Cover src={player.current.artwork} title={player.current.title} /> : <div className="cover" />}</div>
          <Link href="/player" className="min-w-0">
            <p className="truncate font-semibold" dir="auto">{player.current ? displayTitle(player.current, locale) : t("player.empty")}</p>
            <p className="truncate text-sm text-muted">{artist?.name}</p>
          </Link>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-center gap-2">
            <button className="btn" type="button" onClick={player.previous} aria-label={t("action.previous")}>⏮</button>
            <button className="play-orb play-orb-sm" type="button" onClick={player.toggle}>{player.playing ? t("action.pause") : t("action.play")}</button>
            <button className="btn" type="button" onClick={player.next} aria-label={t("action.next")}>⏭</button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{formatTime(player.progress)}</span>
            <input className="w-full" type="range" min={0} max={player.duration || 0} step={0.1} value={Math.min(player.progress, player.duration || 0)} aria-label={t("player.progress")} onChange={(event) => player.seek(Number(event.target.value))} />
            <span>{formatTime(player.duration || player.current?.duration || 0)}</span>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          {t("player.volume")}
          <input type="range" min={0} max={1} step={0.01} value={player.volume} aria-label={t("player.volume")} onChange={(event) => player.setVolume(Number(event.target.value))} />
        </label>
      </footer>
    </div>
  );
}
