-- Seed data matching src/lib/mockData.ts, for a Supabase project running
-- the 0001_init.sql migration. Safe to re-run: it upserts on club_code /
-- colour name, and skips the demo store if it already exists.

insert into public.clubs (club_name, club_code, sport, supplier)
values
  ('Eastern Districts Cricket Club', 'ETDC', 'Cricket', 'O''Neills'),
  ('Western Thunder Cricket Club', 'WTCC', 'Cricket', 'O''Neills')
on conflict (club_code) do nothing;

-- The fixed company colour reference sheet — coordinators pick from this
-- table, they don't add to it.
insert into public.colour_library (name, abbreviation)
values
  ('Amber', 'AM'),
  ('Blue', 'BE'),
  ('Beige', 'BG'),
  ('Black', 'BK'),
  ('Bottle', 'BO'),
  ('Brown', 'BR'),
  ('Dark Grey', 'DG'),
  ('Green', 'GN'),
  ('Gold', 'GO'),
  ('Grey', 'GY'),
  ('Marine', 'ME'),
  ('Maroon', 'MN'),
  ('Multi', 'MU'),
  ('Orange', 'OR'),
  ('Pink', 'PK'),
  ('Purple', 'PP'),
  ('Red', 'RD'),
  ('Royal', 'RO'),
  ('Sky', 'SK'),
  ('Silver', 'SV'),
  ('White', 'WH'),
  ('Yellow', 'YW')
on conflict (name) do nothing;

-- The garment library holds only catalogue-level facts (Range/Style code,
-- category, size template). Colour and sizing are chosen per club below.
insert into public.garments (name, range_code, style_code, category, size_template, allow_kids, allow_adults, active)
values
  ('Club Polo',        'LINC', '061', 'Polo',          'adults', true,  true, true),
  ('Club Hoodie',       'LINC', '112', 'Hoodie',        'adults', true,  true, true),
  ('Training Tee',      'TEAM', '204', 'Tee',           'adults', true,  true, true),
  ('Training Shorts',   'TEAM', '210', 'Shorts',        'adults', true,  true, true),
  ('Playing Shirt SS',  'TEAM', '327', 'Playing Shirt', 'adults', true,  true, true),
  ('Playing Shirt LS',  'TEAM', '328', 'Playing Shirt', 'adults', true,  true, true),
  ('Playing Pants',     'TEAM', '330', 'Pants',         'adults', true,  true, true),
  ('Club Cap',          'LINC', '400', 'Headwear',      'osfa',   false, true, true),
  ('Club Socks',        'LINC', '410', 'Socks',         'socks',  true,  true, true);

-- A fully-configured demo store (mirrors the mock-mode seed) so a fresh
-- Supabase project has something to look at immediately.
with demo_club as (
  select id from public.clubs where club_code = 'ETDC'
),
demo_project as (
  insert into public.store_projects (club_id, project_name)
  select id, 'Eastern Districts Cricket Club Store' from demo_club
  where not exists (select 1 from public.store_projects where project_name = 'Eastern Districts Cricket Club Store')
  returning id
),
-- MERDXX = Marine (ME) + Red (RD) + none (XX); MNGOXX = Maroon (MN) + Gold (GO) + none (XX)
garment_config (name, colours, sizes) as (
  values
    ('Club Polo',       array['Marine', 'Red'],  array['S','M','L','XL','2XL','3XL','4XL','5XL','6XL','56','78','910','1011','13']),
    ('Club Hoodie',      array['Marine', 'Red'],  array['S','M','L','XL','2XL','3XL','4XL','5XL','6XL','56','78','910','1011','13']),
    ('Training Tee',     array['Maroon', 'Gold'], array['S','M','L','XL','2XL','3XL','4XL','5XL','6XL','56','78','910','1011','13']),
    ('Training Shorts',  array['Maroon', 'Gold'], array['S','M','L','XL','2XL','3XL','4XL','5XL','6XL','56','78','910','1011','13']),
    ('Playing Shirt SS', array['Maroon', 'Gold'], array['S','M','L','XL','2XL','3XL','4XL','5XL','6XL','56','78','910','1011','13']),
    ('Playing Shirt LS', array['Maroon', 'Gold'], array['S','M','L','XL','2XL','3XL','4XL','5XL','6XL','56','78','910','1011','13']),
    ('Playing Pants',    array['Maroon', 'Gold'], array['S','M','L','XL','2XL','3XL','4XL','5XL','6XL','56','78','910','1011','13']),
    ('Club Cap',         array['Marine', 'Red'],  array['OS']),
    ('Club Socks',       array['Marine', 'Red'],  array['112','24','47','79','912','1215'])
)
insert into public.store_garments (project_id, garment_id, colours, selected_size_codes, sort_order)
select demo_project.id, garments.id, garment_config.colours, garment_config.sizes, row_number() over () - 1
from demo_project
join garment_config on true
join public.garments on garments.name = garment_config.name;
