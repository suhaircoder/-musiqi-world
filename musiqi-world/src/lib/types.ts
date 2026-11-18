export type LicenseCode =
  | "pd"
  | "cc-by"
  | "cc-by-sa"
  | "cc-by-nc"
  | "cc-by-nc-sa"
  | "cc-by-nc-nd"
  | "artist";

export type Region = "arabic" | "international";

export type Track = {
  id: string;
  title: string;
  titleAr?: string;
  artistId: string;
  albumId: string;
  genre: string;
  country: string;
  language: string;
  region: Region;
  duration: number;
  license: LicenseCode;
  licenseUrl: string;
  canDownload: boolean;
  audioUrl: string;
  artwork: string;
  added: string;
  popularity: number;
  recommended?: boolean;
  submission?: boolean;
  credit?: string;
};

export type Artist = {
  id: string;
  name: string;
  country: string;
  bio: string;
  image: string;
  links: { label: string; url: string }[];
};

export type Album = {
  id: string;
  title: string;
  artistId: string;
  year: number;
  artwork: string;
  country: string;
};

export type Role = "listener" | "artist" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
};

export type Submission = {
  id: string;
  ownerId: string;
  title: string;
  artistName: string;
  albumTitle: string;
  genre: string;
  country: string;
  language: string;
  region: Region;
  license: LicenseCode;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type Locale = "en" | "ar" | "fr" | "es";
