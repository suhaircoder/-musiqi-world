"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { TRACKS, trackById } from "@/lib/catalog";
import { getSupabase } from "@/lib/supabase";
import { storedAudio } from "@/lib/audioStore";
import type { Locale, Playlist, Role, SessionUser, Submission, Track } from "@/lib/types";
import { translate } from "@/lib/i18n";

const SEED: SessionUser[] = [
  { id: "user-leila", email: "leila@musiqi.world", name: "Leila", role: "listener" },
  { id: "user-karim", email: "karim@musiqi.world", name: "Karim", role: "artist" },
  { id: "user-admin", email: "admin@musiqi.world", name: "Admin", role: "admin" },
];

type Registered = SessionUser & { hash: string };

type UiValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  t: (key: string) => string;
};

type AuthValue = {
  user: SessionUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (name: string, email: string, password: string, artist: boolean) => Promise<string>;
  signOut: () => void;
};

type LibraryValue = {
  playlists: Playlist[];
  favorites: string[];
  history: { trackId: string; at: string }[];
  downloads: { trackId: string; at: string }[];
  submissions: Submission[];
  createPlaylist: (name: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  removePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
  noteListen: (trackId: string) => void;
  noteDownload: (trackId: string) => void;
  submit: (submission: Submission) => void;
  review: (id: string, status: Submission["status"]) => void;
  tracks: Track[];
};

type PlayerValue = {
  queue: string[];
  current: Track | null;
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  playTrack: (id: string, queue?: string[]) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  setShuffle: (value: boolean) => void;
  cycleRepeat: () => void;
  addToQueue: (id: string) => void;
  removeFromQueue: (id: string) => void;
};

const UiContext = createContext<UiValue | null>(null);
const AuthContext = createContext<AuthValue | null>(null);
const LibraryContext = createContext<LibraryValue | null>(null);
const PlayerContext = createContext<PlayerValue | null>(null);

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useUi() {
  const value = useContext(UiContext);
  if (!value) throw new Error("UI missing");
  return value;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Auth missing");
  return value;
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("Library missing");
  return value;
}

export function usePlayer() {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("Player missing");
  return value;
}

function submissionTrack(submission: Submission): Track {
  return {
    id: submission.id,
    title: submission.title,
    artistId: `local-${submission.ownerId}`,
    albumId: `local-album-${submission.id}`,
    genre: submission.genre,
    country: submission.country,
    language: submission.language,
    region: submission.region,
    duration: 0,
    license: submission.license,
    licenseUrl: "",
    canDownload: submission.status === "approved",
    audioUrl: storedAudio(submission.id),
    artwork: "",
    added: submission.createdAt.slice(0, 10),
    popularity: 1,
    submission: true,
    credit: submission.artistName,
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<{ trackId: string; at: string }[]>([]);
  const [downloads, setDownloads] = useState<{ trackId: string; at: string }[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [libraryReady, setLibraryReady] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastListen = useRef("");
  const loadedId = useRef("");

  useEffect(() => {
    const savedLocale = localStorage.getItem("musiqi-locale");
    const savedTheme = localStorage.getItem("musiqi-theme");
    if (savedLocale === "ar" || savedLocale === "en" || savedLocale === "fr" || savedLocale === "es") {
      setLocaleState(savedLocale);
    }
    if (savedTheme === "light" || savedTheme === "dark") setThemeState(savedTheme);
    const sessionId = localStorage.getItem("musiqi-session");
    const registered = readJson<Registered[]>("musiqi-users", []);
    const found = [...SEED, ...registered].find((person) => person.id === sessionId) ?? null;
    setUser(found);
    setAuthReady(true);
    const supabase = getSupabase();
    if (supabase) {
      void supabase.auth.getSession().then(({ data }) => {
        const account = data.session?.user;
        if (!account) return;
        setUser({
          id: account.id,
          email: account.email ?? "",
          name: String(account.user_metadata?.name ?? account.email ?? "Listener"),
          role: (account.user_metadata?.role as Role) || "listener",
        });
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.classList.toggle("locale-ar", locale === "ar");
    localStorage.setItem("musiqi-locale", locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("musiqi-theme", theme);
  }, [theme]);

  useEffect(() => {
    setLibraryReady(false);
    const key = user ? `musiqi-library-${user.id}` : "musiqi-library-guest";
    const saved = readJson<{
      playlists: Playlist[];
      favorites: string[];
      history: { trackId: string; at: string }[];
      downloads: { trackId: string; at: string }[];
      submissions: Submission[];
    } | null>(key, null);
    setPlaylists(saved?.playlists ?? []);
    setFavorites(saved?.favorites ?? []);
    setHistory(saved?.history ?? []);
    setDownloads(saved?.downloads ?? []);
    setSubmissions(saved?.submissions ?? readJson<Submission[]>("musiqi-submissions", []));
    setLibraryReady(true);
  }, [user?.id]);

  useEffect(() => {
    if (!libraryReady) return;
    const key = user ? `musiqi-library-${user.id}` : "musiqi-library-guest";
    const payload = { playlists, favorites, history, downloads, submissions };
    localStorage.setItem(key, JSON.stringify(payload));
    localStorage.setItem("musiqi-submissions", JSON.stringify(submissions));
    const supabase = getSupabase();
    if (supabase && user) {
      void supabase.from("favorites").upsert(favorites.map((trackId) => ({ user_id: user.id, track_id: trackId })));
    }
  }, [playlists, favorites, history, downloads, submissions, libraryReady, user]);

  const tracks = useMemo(() => {
    const extra = submissions
      .filter((submission) => submission.status === "approved" || submission.ownerId === user?.id)
      .map(submissionTrack)
      .filter((track) => track.audioUrl || track.submission);
    return [...TRACKS, ...extra];
  }, [submissions, user?.id]);

  const current = queue[index] ? trackById(queue[index], tracks) ?? null : null;

  function noteListen(trackId: string) {
    setHistory((items) => [{ trackId, at: new Date().toISOString() }, ...items.filter((item) => item.trackId !== trackId)].slice(0, 40));
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    if (loadedId.current !== current.id) {
      loadedId.current = current.id;
      audio.src = current.audioUrl;
      setProgress(0);
    }
    if (playing) {
      void audio.play().catch(() => setPlaying(false));
      if (lastListen.current !== current.id) {
        lastListen.current = current.id;
        noteListen(current.id);
      }
    } else {
      audio.pause();
    }
  }, [current?.id, current?.audioUrl, playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.code === "Space") {
        event.preventDefault();
        setPlaying((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function step(direction: number) {
    if (!queue.length) return;
    if (shuffle && queue.length > 1) {
      let nextIndex = index;
      while (nextIndex === index) nextIndex = Math.floor(Math.random() * queue.length);
      setIndex(nextIndex);
      setPlaying(true);
      return;
    }
    const nextIndex = index + direction;
    if (nextIndex >= queue.length) {
      if (repeat === "all") setIndex(0);
      else setPlaying(false);
      return;
    }
    if (nextIndex < 0) {
      setIndex(queue.length - 1);
      setPlaying(true);
      return;
    }
    setIndex(nextIndex);
    setPlaying(true);
  }

  const ui: UiValue = {
    locale,
    setLocale: setLocaleState,
    theme,
    setTheme: setThemeState,
    t: (key) => translate(locale, key),
  };

  const auth: AuthValue = {
    user,
    ready: authReady,
    async signIn(email, password) {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) return "auth.bad";
        setUser({
          id: data.user.id,
          email: data.user.email ?? email,
          name: String(data.user.user_metadata?.name ?? email),
          role: (data.user.user_metadata?.role as Role) || "listener",
        });
        return "";
      }
      const registered = readJson<Registered[]>("musiqi-users", []);
      const account = registered.find((person) => person.email.toLowerCase() === email.toLowerCase());
      if (account && account.hash === (await sha256(password))) {
        setUser(account);
        localStorage.setItem("musiqi-session", account.id);
        return "";
      }
      const seed = SEED.find((person) => person.email.toLowerCase() === email.toLowerCase());
      if (seed && password === "demo") {
        setUser(seed);
        localStorage.setItem("musiqi-session", seed.id);
        return "";
      }
      return "auth.bad";
    },
    async signUp(name, email, password, artist) {
      const cleanEmail = email.trim().toLowerCase();
      if (!name.trim() || !cleanEmail.includes("@") || password.length < 4) return "auth.bad";
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { name: name.trim(), role: artist ? "artist" : "listener" } },
        });
        return error ? "auth.bad" : "";
      }
      const registered = readJson<Registered[]>("musiqi-users", []);
      if ([...SEED, ...registered].some((person) => person.email === cleanEmail)) return "auth.bad";
      const account: Registered = {
        id: crypto.randomUUID(),
        email: cleanEmail,
        name: name.trim(),
        role: artist ? "artist" : "listener",
        hash: await sha256(password),
      };
      localStorage.setItem("musiqi-users", JSON.stringify([...registered, account]));
      setUser(account);
      localStorage.setItem("musiqi-session", account.id);
      return "";
    },
    signOut() {
      setUser(null);
      localStorage.removeItem("musiqi-session");
      void getSupabase()?.auth.signOut();
    },
  };

  const library: LibraryValue = {
    playlists,
    favorites,
    history,
    downloads,
    submissions,
    tracks,
    createPlaylist(name) {
      const trimmed = name.trim();
      if (!trimmed) return;
      setPlaylists((items) => [{ id: crypto.randomUUID(), name: trimmed, trackIds: [] }, ...items]);
    },
    renamePlaylist(id, name) {
      setPlaylists((items) => items.map((playlist) => (playlist.id === id ? { ...playlist, name: name.trim() || playlist.name } : playlist)));
    },
    removePlaylist(id) {
      setPlaylists((items) => items.filter((playlist) => playlist.id !== id));
    },
    addToPlaylist(playlistId, trackId) {
      setPlaylists((items) =>
        items.map((playlist) =>
          playlist.id === playlistId && !playlist.trackIds.includes(trackId)
            ? { ...playlist, trackIds: [...playlist.trackIds, trackId] }
            : playlist,
        ),
      );
    },
    removeFromPlaylist(playlistId, trackId) {
      setPlaylists((items) =>
        items.map((playlist) =>
          playlist.id === playlistId ? { ...playlist, trackIds: playlist.trackIds.filter((id) => id !== trackId) } : playlist,
        ),
      );
    },
    toggleFavorite(trackId) {
      setFavorites((items) => (items.includes(trackId) ? items.filter((id) => id !== trackId) : [trackId, ...items]));
    },
    isFavorite: (trackId) => favorites.includes(trackId),
    noteListen,
    noteDownload(trackId) {
      setDownloads((items) => [{ trackId, at: new Date().toISOString() }, ...items.filter((item) => item.trackId !== trackId)]);
    },
    submit(submission) {
      setSubmissions((items) => [submission, ...items]);
    },
    review(id, status) {
      setSubmissions((items) => items.map((submission) => (submission.id === id ? { ...submission, status } : submission)));
    },
  };

  const player: PlayerValue = {
    queue,
    current,
    playing,
    progress,
    duration,
    volume,
    shuffle,
    repeat,
    playTrack(id, nextQueue) {
      const list = nextQueue?.length ? nextQueue : [id];
      setQueue(list);
      setIndex(Math.max(0, list.indexOf(id)));
      setPlaying(true);
    },
    toggle: () => setPlaying((value) => !value),
    next: () => step(1),
    previous: () => step(-1),
    seek(seconds) {
      if (audioRef.current) audioRef.current.currentTime = seconds;
      setProgress(seconds);
    },
    setVolume: setVolumeState,
    setShuffle,
    cycleRepeat() {
      setRepeat((value) => (value === "off" ? "all" : value === "all" ? "one" : "off"));
    },
    addToQueue(id) {
      setQueue((items) => (items.includes(id) ? items : [...items, id]));
    },
    removeFromQueue(id) {
      setQueue((items) => {
        const position = items.indexOf(id);
        const nextItems = items.filter((item) => item !== id);
        if (position >= 0 && position < index) setIndex((value) => Math.max(0, value - 1));
        if (position === index) setIndex((value) => Math.min(value, Math.max(0, nextItems.length - 1)));
        return nextItems;
      });
    },
  };

  return (
    <UiContext.Provider value={ui}>
      <AuthContext.Provider value={auth}>
        <LibraryContext.Provider value={library}>
          <PlayerContext.Provider value={player}>
            {children}
            <audio
              ref={audioRef}
              preload="none"
              onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
              onEnded={() => {
                if (repeat === "one" && audioRef.current) {
                  audioRef.current.currentTime = 0;
                  void audioRef.current.play();
                  return;
                }
                step(1);
              }}
            />
          </PlayerContext.Provider>
        </LibraryContext.Provider>
      </AuthContext.Provider>
    </UiContext.Provider>
  );
}
