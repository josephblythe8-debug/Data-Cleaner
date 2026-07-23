-- Seed data matching src/lib/mockData.ts, for a Supabase project running
-- the 0001_init.sql migration. Safe to re-run: it upserts on club_code.

insert into public.clubs (club_name, club_code, sport, supplier)
values
  ('Eastern Districts Cricket Club', 'ETDC', 'Cricket', 'O''Neills'),
  ('Western Thunder Cricket Club', 'WTCC', 'Cricket', 'O''Neills')
on conflict (club_code) do nothing;

insert into public.colour_library (name, abbreviation)
values
  ('Marine', 'ME'),
  ('Red', 'RD'),
  ('Cream', 'CR')
on conflict (name) do nothing;

-- MERDXX = Marine (ME) + Red (RD) + none (XX)
-- CRRDME = Cream (CR) + Red (RD) + Marine (ME)
insert into public.garments (name, range_code, style_code, colour_code, colours, category, size_template, allow_kids, allow_adults, active)
values
  ('Club Polo',        'LINC', '061', 'MERDXX', array['Marine', 'Red'],          'Polo',          'adults', true,  true, true),
  ('Club Hoodie',       'LINC', '112', 'MERDXX', array['Marine', 'Red'],          'Hoodie',        'adults', true,  true, true),
  ('Training Tee',      'TEAM', '204', 'CRRDME', array['Cream', 'Red', 'Marine'], 'Tee',           'adults', true,  true, true),
  ('Training Shorts',   'TEAM', '210', 'CRRDME', array['Cream', 'Red', 'Marine'], 'Shorts',        'adults', true,  true, true),
  ('Playing Shirt SS',  'TEAM', '327', 'CRRDME', array['Cream', 'Red', 'Marine'], 'Playing Shirt', 'adults', true,  true, true),
  ('Playing Shirt LS',  'TEAM', '328', 'CRRDME', array['Cream', 'Red', 'Marine'], 'Playing Shirt', 'adults', true,  true, true),
  ('Playing Pants',     'TEAM', '330', 'CRRDME', array['Cream', 'Red', 'Marine'], 'Pants',         'adults', true,  true, true),
  ('Club Cap',          'LINC', '400', 'MERDXX', array['Marine', 'Red'],          'Headwear',      'osfa',   false, true, true),
  ('Club Socks',        'LINC', '410', 'MERDXX', array['Marine', 'Red'],          'Socks',         'socks',  true,  true, true);

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
