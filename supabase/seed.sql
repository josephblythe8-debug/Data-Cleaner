-- Seed data matching src/lib/mockData.ts, for a Supabase project running
-- the 0001_init.sql migration. Safe to re-run: it upserts on club_code.

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

-- MERDXX = Marine (ME) + Red (RD) + none (XX)
-- MNGOXX = Maroon (MN) + Gold (GO) + none (XX)
insert into public.garments (name, range_code, style_code, colour_code, colours, category, size_template, allow_kids, allow_adults, active)
values
  ('Club Polo',        'LINC', '061', 'MERDXX', array['Marine', 'Red'], 'Polo',          'adults', true,  true, true),
  ('Club Hoodie',       'LINC', '112', 'MERDXX', array['Marine', 'Red'], 'Hoodie',        'adults', true,  true, true),
  ('Training Tee',      'TEAM', '204', 'MNGOXX', array['Maroon', 'Gold'], 'Tee',           'adults', true,  true, true),
  ('Training Shorts',   'TEAM', '210', 'MNGOXX', array['Maroon', 'Gold'], 'Shorts',        'adults', true,  true, true),
  ('Playing Shirt SS',  'TEAM', '327', 'MNGOXX', array['Maroon', 'Gold'], 'Playing Shirt', 'adults', true,  true, true),
  ('Playing Shirt LS',  'TEAM', '328', 'MNGOXX', array['Maroon', 'Gold'], 'Playing Shirt', 'adults', true,  true, true),
  ('Playing Pants',     'TEAM', '330', 'MNGOXX', array['Maroon', 'Gold'], 'Pants',         'adults', true,  true, true),
  ('Club Cap',          'LINC', '400', 'MERDXX', array['Marine', 'Red'], 'Headwear',      'osfa',   false, true, true),
  ('Club Socks',        'LINC', '410', 'MERDXX', array['Marine', 'Red'], 'Socks',         'socks',  true,  true, true);

with blueprint as (
  insert into public.blueprints (name, sport)
  values ('Cricket Template', 'Cricket')
  returning id
),
ordered_garments as (
  select id, row_number() over (order by array_position(
    array['Club Polo','Club Hoodie','Training Tee','Training Shorts','Playing Shirt SS',
          'Playing Shirt LS','Playing Pants','Club Cap','Club Socks'],
    name
  )) - 1 as sort_order
  from public.garments
  where name in ('Club Polo','Club Hoodie','Training Tee','Training Shorts','Playing Shirt SS',
                  'Playing Shirt LS','Playing Pants','Club Cap','Club Socks')
)
insert into public.blueprint_garments (blueprint_id, garment_id, sort_order)
select blueprint.id, ordered_garments.id, ordered_garments.sort_order
from blueprint, ordered_garments;
