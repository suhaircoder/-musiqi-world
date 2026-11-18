-- Run this in the Supabase SQL editor after creating a project.
-- The app works locally without these tables. When the public env vars
-- are set, sign-in uses Supabase Auth and library changes are mirrored here.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null default 'listener' check (role in ('listener', 'artist', 'admin'))
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  track_id text not null,
  position integer not null default 0,
  primary key (playlist_id, track_id)
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table if not exists public.listens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id text not null,
  played_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  artist_name text not null,
  license text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.favorites enable row level security;
alter table public.listens enable row level security;
alter table public.submissions enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own playlists" on public.playlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own playlist tracks" on public.playlist_tracks
  for all using (
    exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
  );

create policy "own favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own listens" on public.listens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own submissions" on public.submissions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
