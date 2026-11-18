"use client";

import { useEffect, useMemo, useState } from "react";
import raw from "@/data/encyclopedia.json";

export type DirectoryLink = { label: string; url: string };
export type DirectoryWork = { title: string; date: string; mbid: string };

export type DirectoryArtist = {
  id: string;
  nameAr: string;
  nameEn: string;
  aliases: string[];
  country: string;
  yemen: boolean;
  genres: string[];
  styles: string[];
  bioEn: string;
  bioAr: string;
  bioSource: string;
  image: string;
  imageSource: string;
  website: string;
  socials: DirectoryLink[];
  listen: DirectoryLink[];
  albums: DirectoryWork[];
  songs: DirectoryWork[];
  mbid: string;
  wikidata: string;
  verified: boolean;
  licenseNote?: string;
};

export const ARAB_COUNTRIES = [
  "Saudi Arabia",
  "Yemen",
  "Egypt",
  "Lebanon",
  "Iraq",
  "Morocco",
  "Algeria",
  "Tunisia",
  "Syria",
  "Palestine",
  "Jordan",
  "Kuwait",
  "UAE",
  "Oman",
  "Bahrain",
  "Qatar",
  "Sudan",
  "Libya",
  "Mauritania",
  "Somalia",
  "Djibouti",
  "Comoros",
] as const;

export const YEMEN_STYLES = ["sanaani", "lahji", "hadhrami", "adeni", "folk", "traditional", "pop", "instrumental"] as const;

const SEED = (raw as { artists: DirectoryArtist[] }).artists.map((artist) => ({
  ...artist,
  aliases: artist.aliases ?? [],
  genres: artist.genres ?? [],
  styles: artist.styles ?? [],
  socials: artist.socials ?? [],
  listen: artist.listen ?? [],
  albums: artist.albums ?? [],
  songs: artist.songs ?? [],
  wikidata: artist.wikidata ?? "",
  licenseNote: artist.licenseNote ?? "",
}));

type Edits = { removed: string[]; upserts: DirectoryArtist[] };
const STORAGE = "musiqi-encyclopedia";
const EMPTY: Edits = { removed: [], upserts: [] };

export function blankArtist(): DirectoryArtist {
  return {
    id: "",
    nameAr: "",
    nameEn: "",
    aliases: [],
    country: "Yemen",
    yemen: false,
    genres: [],
    styles: [],
    bioEn: "",
    bioAr: "",
    bioSource: "",
    image: "",
    imageSource: "",
    website: "",
    socials: [],
    listen: [],
    albums: [],
    songs: [],
    mbid: "",
    wikidata: "",
    verified: false,
    licenseNote: "All rights reserved. This entry has no licensed audio file.",
  };
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u064b-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayName(artist: DirectoryArtist, locale: string) {
  return locale === "ar" ? artist.nameAr || artist.nameEn : artist.nameEn || artist.nameAr;
}

export function artistText(artist: DirectoryArtist) {
  return [
    artist.nameAr,
    artist.nameEn,
    ...artist.aliases,
    artist.country,
    ...artist.genres,
    ...artist.styles,
    ...artist.albums.map((album) => `${album.title} ${album.date}`),
    ...artist.songs.map((song) => `${song.title} ${song.date}`),
  ].join(" ");
}

export function filterArtists(artists: DirectoryArtist[], filters: { q?: string; country?: string; genre?: string; style?: string; year?: string }) {
  const needle = normalize(filters.q ?? "");
  return artists.filter((artist) => {
    if (filters.country && artist.country !== filters.country) return false;
    if (filters.genre && !artist.genres.some((genre) => genre.toLowerCase() === filters.genre?.toLowerCase())) return false;
    if (filters.style && !artist.styles.includes(filters.style)) return false;
    if (filters.year) {
      const dated = [...artist.albums, ...artist.songs].some((work) => work.date.startsWith(filters.year ?? ""));
      if (!dated) return false;
    }
    if (!needle) return true;
    return normalize(artistText(artist)).includes(needle);
  });
}

function merge(edits: Edits) {
  const removed = new Set(edits.removed);
  const byId = new Map<string, DirectoryArtist>();
  for (const artist of SEED) {
    if (!removed.has(artist.id)) byId.set(artist.id, artist);
  }
  for (const artist of edits.upserts) {
    if (!removed.has(artist.id)) byId.set(artist.id, artist);
  }
  return [...byId.values()];
}

export function useDirectory() {
  const [edits, setEdits] = useState<Edits>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved) setEdits({ ...EMPTY, ...JSON.parse(saved) });
    } catch {
      setEdits(EMPTY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE, JSON.stringify(edits));
  }, [edits, ready]);

  const artists = useMemo(() => merge(edits), [edits]);

  function save(artist: DirectoryArtist) {
    const id = artist.id || slugify(artist.nameEn || artist.nameAr || `artist-${Date.now()}`);
    const next = { ...artist, id, yemen: artist.country === "Yemen" || artist.yemen };
    setEdits((current) => ({
      removed: current.removed.filter((item) => item !== id),
      upserts: [next, ...current.upserts.filter((item) => item.id !== id)],
    }));
    return id;
  }

  function remove(id: string) {
    setEdits((current) => ({
      removed: current.removed.includes(id) ? current.removed : [...current.removed, id],
      upserts: current.upserts.filter((artist) => artist.id !== id),
    }));
  }

  return { artists, ready, save, remove };
}

export function worksFromLines(value: string): DirectoryWork[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, date] = line.split("|").map((part) => part.trim());
      return { title, date: date ?? "", mbid: "" };
    })
    .filter((work) => work.title);
}

export function linesFromWorks(works: DirectoryWork[]) {
  return works.map((work) => (work.date ? `${work.title} | ${work.date}` : work.title)).join("\n");
}
