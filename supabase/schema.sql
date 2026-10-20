-- ─── NESCI DATABASE SCHEMA ──────────────────────────────────────────────────
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run more than once.

-- One row per user: what they're into and where they usually are.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  interests text[] not null default '{}',
  home_city text,
  created_at timestamptz not null default now()
);

-- If profiles was created earlier without these columns, add them.
-- Existing columns (e.g. email, display_name) and any sign-up trigger are left alone.
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists home_city text;

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Events people submit (networking, underground, free…).
-- New submissions are hidden until you set approved = true.
create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null check (
    category in ('dining', 'networking', 'underground', 'free', 'music', 'sports', 'arts')
  ),
  venue text not null,
  lat double precision not null,
  lng double precision not null,
  starts_at timestamptz, -- empty when the date isn't known yet
  is_free boolean not null default false,
  url text,
  submitted_by uuid references auth.users (id) on delete set null default auth.uid(),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- For databases created before dates became optional
alter table public.community_events alter column starts_at drop not null;

alter table public.community_events enable row level security;

drop policy if exists "Anyone reads approved events" on public.community_events;
create policy "Anyone reads approved events" on public.community_events
  for select using (approved);

drop policy if exists "Signed-in users submit events" on public.community_events;
create policy "Signed-in users submit events" on public.community_events
  for insert to authenticated
  with check (submitted_by = auth.uid() and approved = false);
