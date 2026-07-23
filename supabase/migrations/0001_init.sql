-- Teamwear Store Builder — Phase 2 schema
-- Mirrors the shape of src/lib/mockData.ts / src/lib/types.ts exactly, so
-- switching MOCK_MODE off is a drop-in change for the hooks in src/hooks/.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- clubs
-- ---------------------------------------------------------------------------
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  club_name text not null,
  club_code text not null unique,
  sport text not null,
  supplier text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- colour_library — named colours (e.g. "Marine") mapped to the 2-letter
-- abbreviation used to build a garment's colour_code (e.g. "ME"). Not a
-- foreign key from garments.colours: garments store the chosen names as
-- plain text, matching src/lib/mockData.ts.
-- ---------------------------------------------------------------------------
create table if not exists public.colour_library (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  abbreviation text not null check (char_length(abbreviation) = 2)
);

-- ---------------------------------------------------------------------------
-- garments
-- ---------------------------------------------------------------------------
create type public.size_template as enum ('kids', 'adults', 'socks', 'osfa');

create table if not exists public.garments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  range_code text not null,
  style_code text not null,
  -- The COLOUR segment of the SKU (e.g. "MERDXX"), always derived client-side
  -- from `colours` via buildColourCode() — never typed by hand.
  colour_code text not null,
  -- Up to 3 colour names, in order (main / secondary / trim), e.g.
  -- ARRAY['Marine', 'Red']. Source of truth for colour_code.
  colours text[] not null default '{}',
  category text not null,
  size_template public.size_template not null,
  allow_kids boolean not null default false,
  allow_adults boolean not null default true,
  active boolean not null default true,
  constraint garments_colours_max_3 check (array_length(colours, 1) is null or array_length(colours, 1) <= 3)
);

-- ---------------------------------------------------------------------------
-- blueprints
-- ---------------------------------------------------------------------------
create table if not exists public.blueprints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.blueprint_garments (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references public.blueprints (id) on delete cascade,
  garment_id uuid not null references public.garments (id) on delete cascade,
  sort_order integer not null default 0
);

create index if not exists blueprint_garments_blueprint_id_idx on public.blueprint_garments (blueprint_id);

-- ---------------------------------------------------------------------------
-- store_projects
-- ---------------------------------------------------------------------------
create table if not exists public.store_projects (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  project_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists store_projects_club_id_idx on public.store_projects (club_id);

-- ---------------------------------------------------------------------------
-- store_garments
-- ---------------------------------------------------------------------------
create table if not exists public.store_garments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.store_projects (id) on delete cascade,
  garment_id uuid not null references public.garments (id) on delete restrict,
  custom_name text,
  include_kids boolean not null default false,
  include_adults boolean not null default true,
  sort_order integer not null default 0
);

create index if not exists store_garments_project_id_idx on public.store_garments (project_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This is a single-tenant internal tool for an eCommerce coordinator team:
-- any authenticated user may read/write everything. Tighten these policies
-- (e.g. scope by an org_id column) if the app grows multi-tenant.
-- ---------------------------------------------------------------------------
alter table public.clubs enable row level security;
alter table public.colour_library enable row level security;
alter table public.garments enable row level security;
alter table public.blueprints enable row level security;
alter table public.blueprint_garments enable row level security;
alter table public.store_projects enable row level security;
alter table public.store_garments enable row level security;

create policy "Authenticated users can read clubs" on public.clubs
  for select to authenticated using (true);
create policy "Authenticated users can write clubs" on public.clubs
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can read colour_library" on public.colour_library
  for select to authenticated using (true);
create policy "Authenticated users can write colour_library" on public.colour_library
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can read garments" on public.garments
  for select to authenticated using (true);
create policy "Authenticated users can write garments" on public.garments
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can read blueprints" on public.blueprints
  for select to authenticated using (true);
create policy "Authenticated users can write blueprints" on public.blueprints
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can read blueprint_garments" on public.blueprint_garments
  for select to authenticated using (true);
create policy "Authenticated users can write blueprint_garments" on public.blueprint_garments
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can read store_projects" on public.store_projects
  for select to authenticated using (true);
create policy "Authenticated users can write store_projects" on public.store_projects
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can read store_garments" on public.store_garments
  for select to authenticated using (true);
create policy "Authenticated users can write store_garments" on public.store_garments
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Storage — bucket for garment reference images / uploaded artwork
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('garment-assets', 'garment-assets', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload garment assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'garment-assets');

create policy "Authenticated users can update garment assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'garment-assets');

create policy "Authenticated users can delete garment assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'garment-assets');

create policy "Anyone can view garment assets"
  on storage.objects for select
  using (bucket_id = 'garment-assets');
