import type { Album, Artist, Track } from "./types";

const audio = (id: string, file: string) =>
  `https://archive.org/download/${encodeURIComponent(id)}/${file.split("/").map((part) => encodeURIComponent(part)).join("/")}`;

const cover = (id: string) => `https://archive.org/services/img/${id}`;

const PD = "https://creativecommons.org/publicdomain/mark/1.0/";
const BY_NC = "https://creativecommons.org/licenses/by-nc/3.0/";
const BY_NC_ND = "https://creativecommons.org/licenses/by-nc-nd/3.0/";
const BY_NC_4 = "https://creativecommons.org/licenses/by-nc/4.0/";
const BY_NC_ND_4 = "https://creativecommons.org/licenses/by-nc-nd/4.0/";

export const ARTISTS: Artist[] = [
  {
    id: "scott-joplin",
    name: "Scott Joplin",
    country: "United States",
    bio: "Composer of Maple Leaf Rag. The recording in this catalog is marked public domain.",
    image: cover("MapleLeafRag"),
    links: [{ label: "Archive.org", url: "https://archive.org/details/MapleLeafRag" }],
  },
  {
    id: "intoxicated-piano",
    name: "Intoxicated Piano",
    country: "International",
    bio: "Piano pieces from the Vice Versa release, shared under Creative Commons BY-NC.",
    image: cover("MIXG031"),
    links: [{ label: "Archive.org", url: "https://archive.org/details/MIXG031" }],
  },
  {
    id: "proleter",
    name: "ProleteR",
    country: "France",
    bio: "Producer whose netlabel albums are shared under Creative Commons BY-NC-ND.",
    image: cover("DWK123"),
    links: [{ label: "Archive.org", url: "https://archive.org/details/DWK123" }],
  },
  {
    id: "kaazim-zareb",
    name: "Kaazim Zareb",
    country: "North Africa",
    bio: "Miraaya is a netlabel release with Arabic titles, shared under Creative Commons BY-NC-ND.",
    image: cover("wh062"),
    links: [{ label: "Archive.org", url: "https://archive.org/details/wh062" }],
  },
  {
    id: "miranda",
    name: "Miranda Shvangiradze",
    country: "International",
    bio: "Talk to Me EP, released on a netlabel under Creative Commons BY-NC-ND.",
    image: cover("Vkrsnl038MirandaShvangiradzeTalkToMeEp"),
    links: [{ label: "Archive.org", url: "https://archive.org/details/Vkrsnl038MirandaShvangiradzeTalkToMeEp" }],
  },
  {
    id: "abu-ama",
    name: "Abu Ama + Bedouin Drone",
    country: "Libya",
    bio: "Dawlat Lībiyyā, a collaboration shared under Creative Commons BY-NC.",
    image: cover("mhrk370"),
    links: [{ label: "Archive.org", url: "https://archive.org/details/mhrk370" }],
  },
  {
    id: "aziz-arradi",
    name: "Maalem Aziz Arradi",
    country: "Morocco",
    bio: "Gnawa maalem from Marrakech. Lila was recorded for Ayan Records and shared under Creative Commons BY-NC-ND.",
    image: cover("ar151-maalem-aziz-arradi-gnawa-lila-vol.2"),
    links: [{ label: "Archive.org", url: "https://archive.org/details/ar151-maalem-aziz-arradi-gnawa-lila-vol.2" }],
  },
  {
    id: "maalem-amam",
    name: "Maalem Amam",
    country: "Morocco",
    bio: "Guembri and voice recorded in Casablanca and released by Ayan Records under Creative Commons BY-NC-ND.",
    image: cover("GuembriMusicFromMorroccoMaalemAmamar52"),
    links: [{ label: "Archive.org", url: "https://archive.org/details/GuembriMusicFromMorroccoMaalemAmamar52" }],
  },
  {
    id: "maalem-kouyou",
    name: "Maalem Kouyou",
    country: "Morocco",
    bio: "Gnawa recorded on Jemaa el-Fna in Marrakech and shared by Ayan Records under Creative Commons BY-NC-ND.",
    image: cover("gnawadjfna"),
    links: [{ label: "Archive.org", url: "https://archive.org/details/gnawadjfna" }],
  },
  {
    id: "timtaj",
    name: "TimTaj",
    country: "International",
    bio: "Oud and desert instrumentals released on Jamendo under Creative Commons BY-NC-ND.",
    image: cover("jamendo-499772"),
    links: [{ label: "Archive.org", url: "https://archive.org/details/jamendo-499772" }],
  },
];

export const ALBUMS: Album[] = [
  { id: "maple-leaf-rag", title: "Maple Leaf Rag", artistId: "scott-joplin", year: 1899, artwork: cover("MapleLeafRag"), country: "United States" },
  { id: "vice-versa", title: "Vice Versa", artistId: "intoxicated-piano", year: 2013, artwork: cover("MIXG031"), country: "International" },
  { id: "curses", title: "Curses From Past Times", artistId: "proleter", year: 2012, artwork: cover("DWK123"), country: "France" },
  { id: "feeding", title: "Feeding The Lions", artistId: "proleter", year: 2014, artwork: cover("DWK226"), country: "France" },
  { id: "miraaya", title: "Miraaya", artistId: "kaazim-zareb", year: 2011, artwork: cover("wh062"), country: "North Africa" },
  { id: "talk-to-me", title: "Talk to Me", artistId: "miranda", year: 2016, artwork: cover("Vkrsnl038MirandaShvangiradzeTalkToMeEp"), country: "International" },
  { id: "dawlat", title: "Dawlat Lībiyyā", artistId: "abu-ama", year: 2020, artwork: cover("mhrk370"), country: "Libya" },
  { id: "totem", title: "TOTEM", artistId: "abu-ama", year: 2021, artwork: cover("mhrk292"), country: "Libya" },
  { id: "gnawa-lila", title: "Gnawa Lila, Vol. 2", artistId: "aziz-arradi", year: 2026, artwork: cover("ar151-maalem-aziz-arradi-gnawa-lila-vol.2"), country: "Morocco" },
  { id: "guembri", title: "Guembri", artistId: "maalem-amam", year: 2012, artwork: cover("GuembriMusicFromMorroccoMaalemAmamar52"), country: "Morocco" },
  { id: "jemaa", title: "Jemaa el-Fna", artistId: "maalem-kouyou", year: 2025, artwork: cover("gnawadjfna"), country: "Morocco" },
  { id: "arabian-oud", title: "Arabian Oud", artistId: "timtaj", year: 2022, artwork: cover("jamendo-499772"), country: "International" },
  { id: "middle-east-desert", title: "Middle East Desert", artistId: "timtaj", year: 2020, artwork: cover("jamendo-439495"), country: "International" },
  { id: "desert-secrets", title: "Desert Secrets", artistId: "timtaj", year: 2023, artwork: cover("jamendo-518918"), country: "International" },
];

function song(partial: Omit<Track, "canDownload" | "artwork" | "audioUrl"> & { item: string; file: string; artworkId?: string }): Track {
  const { item, file, artworkId, ...rest } = partial;
  return {
    ...rest,
    canDownload: true,
    artwork: cover(artworkId ?? item),
    audioUrl: audio(item, file),
  };
}

export const TRACKS: Track[] = [
  song({ id: "joplin-maple", title: "Maple Leaf Rag", artistId: "scott-joplin", albumId: "maple-leaf-rag", genre: "Ragtime", country: "United States", language: "instrumental", region: "international", duration: 154, license: "pd", licenseUrl: PD, added: "2008-06-01", popularity: 88, recommended: true, item: "MapleLeafRag", file: "MapleLeafRag.mp3" }),
  song({ id: "piano-animosity", title: "Animosity", artistId: "intoxicated-piano", albumId: "vice-versa", genre: "Piano", country: "International", language: "instrumental", region: "international", duration: 151, license: "cc-by-nc", licenseUrl: BY_NC, added: "2013-01-15", popularity: 64, recommended: true, item: "MIXG031", file: "01_Intoxicated_Piano_-_Animosity.mp3" }),
  song({ id: "piano-dreams", title: "In My Dreams", artistId: "intoxicated-piano", albumId: "vice-versa", genre: "Piano", country: "International", language: "instrumental", region: "international", duration: 223, license: "cc-by-nc", licenseUrl: BY_NC, added: "2013-01-15", popularity: 58, item: "MIXG031", file: "02_Intoxicated_Piano_-_In_My_Dreams.mp3" }),
  song({ id: "piano-girl", title: "Independent Girl", artistId: "intoxicated-piano", albumId: "vice-versa", genre: "Piano", country: "International", language: "instrumental", region: "international", duration: 252, license: "cc-by-nc", licenseUrl: BY_NC, added: "2013-01-15", popularity: 52, item: "MIXG031", file: "03_Intoxicated_Piano_-_Independent_Girl.mp3" }),
  song({ id: "piano-rains", title: "Mr. & Mrs. Rains", artistId: "intoxicated-piano", albumId: "vice-versa", genre: "Piano", country: "International", language: "instrumental", region: "international", duration: 215, license: "cc-by-nc", licenseUrl: BY_NC, added: "2013-01-15", popularity: 49, item: "MIXG031", file: "04_Intoxicated_Piano_-_Mr_and_Mrs_Rains.mp3" }),
  song({ id: "pro-april", title: "April Showers", artistId: "proleter", albumId: "curses", genre: "Jazz", country: "France", language: "fr", region: "international", duration: 269, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2012-03-01", popularity: 91, recommended: true, item: "DWK123", file: "ProleteR_-_01_-_April_Showers.mp3" }),
  song({ id: "pro-irony", title: "Downtown Irony", artistId: "proleter", albumId: "curses", genre: "Jazz", country: "France", language: "fr", region: "international", duration: 261, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2012-03-01", popularity: 77, item: "DWK123", file: "ProleteR_-_02_-_Downtown_Irony.mp3" }),
  song({ id: "pro-soul", title: "Soul Key", artistId: "proleter", albumId: "curses", genre: "Jazz", country: "France", language: "fr", region: "international", duration: 303, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2012-03-01", popularity: 73, item: "DWK123", file: "ProleteR_-_03_-_Soul_Key.mp3" }),
  song({ id: "pro-thing", title: "It Don't Mean A Thing", artistId: "proleter", albumId: "feeding", genre: "Jazz", country: "France", language: "fr", region: "international", duration: 218, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2014-02-01", popularity: 70, item: "DWK226", file: "ProleteR_-_01_-_It_Dont_Mean_A_Thing.mp3" }),
  song({ id: "pro-valentine", title: "Valentine's Day", artistId: "proleter", albumId: "feeding", genre: "Jazz", country: "France", language: "fr", region: "international", duration: 340, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2014-02-01", popularity: 66, item: "DWK226", file: "ProleteR_-_02_-_Valentines_Day.mp3" }),
  song({ id: "pro-sometimes", title: "Sometimes", artistId: "proleter", albumId: "feeding", genre: "Jazz", country: "France", language: "fr", region: "international", duration: 95, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2014-02-01", popularity: 48, item: "DWK226", file: "ProleteR_-_03_-_Sometimes_Int.mp3" }),
  song({ id: "kz-yatzakkar", title: "Yatzakkar", titleAr: "يتذكر", artistId: "kaazim-zareb", albumId: "miraaya", genre: "Arabic", country: "North Africa", language: "ar", region: "arabic", duration: 277, license: "cc-by-nc-nd", licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/us/", added: "2011-08-01", popularity: 84, recommended: true, item: "wh062", file: "wh062_01_Kaazim_Yatzakkar.mp3" }),
  song({ id: "kz-depths", title: "In Depths", artistId: "kaazim-zareb", albumId: "miraaya", genre: "Ambient", country: "North Africa", language: "ar", region: "arabic", duration: 515, license: "cc-by-nc-nd", licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/us/", added: "2011-08-01", popularity: 61, item: "wh062", file: "wh062_02_Kaazim_In_Depths.mp3" }),
  song({ id: "kz-hadeeqa", title: "al-Hadeeqa", titleAr: "الحديقة", artistId: "kaazim-zareb", albumId: "miraaya", genre: "Arabic", country: "North Africa", language: "ar", region: "arabic", duration: 467, license: "cc-by-nc-nd", licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/3.0/us/", added: "2011-08-01", popularity: 69, item: "wh062", file: "wh062_03_Kaazim_al_Hadeeqa.mp3" }),
  song({ id: "mi-rain", title: "Rainy Thoughts", artistId: "miranda", albumId: "talk-to-me", genre: "Indie", country: "International", language: "en", region: "international", duration: 209, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2016-04-01", popularity: 57, item: "Vkrsnl038MirandaShvangiradzeTalkToMeEp", file: "1RainyThoughts.mp3" }),
  song({ id: "mi-talk", title: "Talk to Me", artistId: "miranda", albumId: "talk-to-me", genre: "Indie", country: "International", language: "en", region: "international", duration: 290, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2016-04-01", popularity: 63, recommended: true, item: "Vkrsnl038MirandaShvangiradzeTalkToMeEp", file: "2TalkToMe.mp3" }),
  song({ id: "mi-trip", title: "Ready for the Trip", artistId: "miranda", albumId: "talk-to-me", genre: "Indie", country: "International", language: "en", region: "international", duration: 269, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2016-04-01", popularity: 54, item: "Vkrsnl038MirandaShvangiradzeTalkToMeEp", file: "3ReadyForTheTrip.mp3" }),
  song({ id: "abu-sabah", title: "Sabah", titleAr: "صباح", artistId: "abu-ama", albumId: "dawlat", genre: "Arabic", country: "Libya", language: "ar", region: "arabic", duration: 341, license: "cc-by-nc", licenseUrl: BY_NC_4, added: "2020-09-01", popularity: 79, recommended: true, item: "mhrk370", file: "Abu Ama + BedouinDrone - Dawlat Lībiyyā - 01 Sabah.mp3" }),
  song({ id: "abu-kaset", title: "Eski Türk Kaseti", artistId: "abu-ama", albumId: "dawlat", genre: "Ambient", country: "Libya", language: "ar", region: "arabic", duration: 521, license: "cc-by-nc", licenseUrl: BY_NC_4, added: "2020-09-01", popularity: 60, item: "mhrk370", file: "Abu Ama + BedouinDrone - Dawlat Lībiyyā - 02 Eski Türk Kaseti.mp3" }),
  song({ id: "abu-idris", title: "Idris", titleAr: "إدريس", artistId: "abu-ama", albumId: "dawlat", genre: "Arabic", country: "Libya", language: "ar", region: "arabic", duration: 405, license: "cc-by-nc", licenseUrl: BY_NC_4, added: "2020-09-01", popularity: 67, item: "mhrk370", file: "Abu Ama + BedouinDrone - Dawlat Lībiyyā - 03 Idris.mp3" }),
  song({ id: "abu-days", title: "Da'il Ayyaam", titleAr: "دع الأيام", artistId: "abu-ama", albumId: "totem", genre: "Arabic", country: "Libya", language: "ar", region: "arabic", duration: 219, license: "cc-by-nc", licenseUrl: BY_NC_4, added: "2021-12-24", popularity: 86, recommended: true, item: "mhrk292", file: "Abu Ama - TOTEM - 21 Da'il Ayyaam دع الأيام (blue tulip version with BedouinDrone).mp3" }),
  song({ id: "abu-lebanon", title: "LiBANoN", titleAr: "لبنان", artistId: "abu-ama", albumId: "totem", genre: "Arabic", country: "Libya", language: "ar", region: "arabic", duration: 289, license: "cc-by-nc", licenseUrl: BY_NC_4, added: "2021-12-24", popularity: 72, item: "mhrk292", file: "Abu Ama - TOTEM - 15 LiBANoN (version).mp3" }),
  song({ id: "abu-majnun", title: "Majnun", titleAr: "مجنون", artistId: "abu-ama", albumId: "totem", genre: "Arabic", country: "Libya", language: "ar", region: "arabic", duration: 308, license: "cc-by-nc", licenseUrl: BY_NC_4, added: "2021-12-24", popularity: 70, item: "mhrk292", file: "Abu Ama - TOTEM - 19 Majnun (version 2).mp3" }),
  song({ id: "abu-izmir", title: "Izmir", artistId: "abu-ama", albumId: "totem", genre: "Arabic", country: "Libya", language: "ar", region: "arabic", duration: 288, license: "cc-by-nc", licenseUrl: BY_NC_4, added: "2021-12-24", popularity: 64, item: "mhrk292", file: "Abu Ama - TOTEM - 03 Izmir.mp3" }),
  song({ id: "abu-amameem", title: "Amameem", artistId: "abu-ama", albumId: "totem", genre: "Arabic", country: "Libya", language: "ar", region: "arabic", duration: 173, license: "cc-by-nc", licenseUrl: BY_NC_4, added: "2021-12-24", popularity: 60, item: "mhrk292", file: "Abu Ama - TOTEM - 11 Amameem.mp3" }),
  song({ id: "aziz-lila-1", title: "Lila, Part 1", titleAr: "ليلة، الجزء ١", artistId: "aziz-arradi", albumId: "gnawa-lila", genre: "Gnawa", country: "Morocco", language: "ar", region: "arabic", duration: 389, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND_4, added: "2026-05-09", popularity: 92, recommended: true, item: "ar151-maalem-aziz-arradi-gnawa-lila-vol.2", file: "Maalem Aziz Arradi-Gnawa Lila Vol.2/1 Maalem Aziz Arradi-Gnawa Lila Vol. 2.mp3" }),
  song({ id: "aziz-lila-2", title: "Lila, Part 2", titleAr: "ليلة، الجزء ٢", artistId: "aziz-arradi", albumId: "gnawa-lila", genre: "Gnawa", country: "Morocco", language: "ar", region: "arabic", duration: 320, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND_4, added: "2026-05-09", popularity: 80, item: "ar151-maalem-aziz-arradi-gnawa-lila-vol.2", file: "Maalem Aziz Arradi-Gnawa Lila Vol.2/2 Maalem Aziz Arradi-Gnawa Lila Vol. 2.mp3" }),
  song({ id: "amam-guembri", title: "Guembri Solo", titleAr: "غيمبري", artistId: "maalem-amam", albumId: "guembri", genre: "Gnawa", country: "Morocco", language: "ar", region: "arabic", duration: 604, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2012-01-01", popularity: 90, recommended: true, item: "GuembriMusicFromMorroccoMaalemAmamar52", file: "01MaalemAmam-guembriSolo.mp3" }),
  song({ id: "amam-luksa", title: "Luksa", titleAr: "اللكسة", artistId: "maalem-amam", albumId: "guembri", genre: "Gnawa", country: "Morocco", language: "ar", region: "arabic", duration: 423, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2012-01-01", popularity: 78, item: "GuembriMusicFromMorroccoMaalemAmamar52", file: "03MaalemAmam-luksa.mp3" }),
  song({ id: "amam-bouala", title: "Bouala", titleAr: "بوعلاء", artistId: "maalem-amam", albumId: "guembri", genre: "Gnawa", country: "Morocco", language: "ar", region: "arabic", duration: 656, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2012-01-01", popularity: 76, item: "GuembriMusicFromMorroccoMaalemAmamar52", file: "06MaalemAmam-bouala.mp3" }),
  song({ id: "kouyou-square", title: "Jemaa el-Fna", titleAr: "جامع الفنا", artistId: "maalem-kouyou", albumId: "jemaa", genre: "Gnawa", country: "Morocco", language: "ar", region: "arabic", duration: 556, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND_4, added: "2025-03-01", popularity: 74, item: "gnawadjfna", file: "Gnawa Music From Jemaa El Fna Marrakesh/07 Maalem Kouyou team 2.mp3" }),
  song({ id: "kouyou-call", title: "Jemaa el-Fna II", titleAr: "جامع الفنا ٢", artistId: "maalem-kouyou", albumId: "jemaa", genre: "Gnawa", country: "Morocco", language: "ar", region: "arabic", duration: 193, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND_4, added: "2025-03-01", popularity: 88, recommended: true, item: "gnawadjfna", file: "Gnawa Music From Jemaa El Fna Marrakesh/16 Maallem Kouyou team 10.mp3" }),
  song({ id: "tim-oud", title: "Arabian Oud", titleAr: "عود عربي", artistId: "timtaj", albumId: "arabian-oud", genre: "Oud", country: "International", language: "instrumental", region: "arabic", duration: 147, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2022-10-10", popularity: 84, recommended: true, item: "jamendo-499772", file: "01-1980054-TimTaj-Arabian Oud.mp3" }),
  song({ id: "tim-desert", title: "Middle East Desert", titleAr: "صحراء الشرق", artistId: "timtaj", albumId: "middle-east-desert", genre: "Oud", country: "International", language: "instrumental", region: "arabic", duration: 147, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2020-09-05", popularity: 66, item: "jamendo-439495", file: "01-1791933-TimTaj-Middle East Desert.mp3" }),
  song({ id: "tim-secrets", title: "Desert Secrets", titleAr: "أسرار الصحراء", artistId: "timtaj", albumId: "desert-secrets", genre: "Oud", country: "International", language: "instrumental", region: "arabic", duration: 156, license: "cc-by-nc-nd", licenseUrl: BY_NC_ND, added: "2023-04-27", popularity: 62, item: "jamendo-518918", file: "01-2027110-TimTaj-Desert Secrets.mp3" }),
];

export const GENRES = [...new Set(TRACKS.map((track) => track.genre))];
export const COUNTRIES = [...new Set(TRACKS.map((track) => track.country))];
export const LANGUAGES = [...new Set(TRACKS.map((track) => track.language))];

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function artistById(id: string) {
  return ARTISTS.find((artist) => artist.id === id);
}

export function albumById(id: string) {
  return ALBUMS.find((album) => album.id === id);
}

export function trackById(id: string, extra: Track[] = []) {
  return [...TRACKS, ...extra].find((track) => track.id === id);
}

export function tracksForArtist(id: string) {
  return TRACKS.filter((track) => track.artistId === id);
}

export function tracksForAlbum(id: string) {
  return TRACKS.filter((track) => track.albumId === id);
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function displayTitle(track: Track, locale: string) {
  return locale === "ar" && track.titleAr ? track.titleAr : track.title;
}
