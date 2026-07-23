-- Seed data matching src/lib/mockData.ts, for a Supabase project running
-- the 0001_init.sql migration. Safe to re-run: it upserts on club_code.

insert into public.clubs (club_name, club_code, sport, supplier)
values
  ('Eastern Districts Cricket Club', 'ETDC', 'Cricket', 'O''Neills'),
  ('Western Thunder Cricket Club', 'WTCC', 'Cricket', 'O''Neills')
on conflict (club_code) do nothing;

insert into public.garments (name, range_code, style_code, colour_code, category, size_template, allow_kids, allow_adults, active, swatches)
values
  ('Club Polo',        'LINC', '061', 'MERDXX', 'Polo',          'adults', true,  true, true, array['#7f1d3d', '#d4a72c']),
  ('Club Hoodie',       'LINC', '112', 'MERDXX', 'Hoodie',        'adults', true,  true, true, array['#7f1d3d', '#d4a72c']),
  ('Training Tee',      'TEAM', '204', 'CRRDME', 'Tee',           'adults', true,  true, true, array['#b91c2b', '#1e2a4a']),
  ('Training Shorts',   'TEAM', '210', 'CRRDME', 'Shorts',        'adults', true,  true, true, array['#b91c2b', '#1e2a4a']),
  ('Playing Shirt SS',  'TEAM', '327', 'CRRDME', 'Playing Shirt', 'adults', true,  true, true, array['#b91c2b', '#1e2a4a']),
  ('Playing Shirt LS',  'TEAM', '328', 'CRRDME', 'Playing Shirt', 'adults', true,  true, true, array['#b91c2b', '#1e2a4a']),
  ('Playing Pants',     'TEAM', '330', 'CRRDME', 'Pants',         'adults', true,  true, true, array['#b91c2b', '#1e2a4a']),
  ('Club Cap',          'LINC', '400', 'MERDXX', 'Headwear',      'osfa',   false, true, true, array['#7f1d3d', '#d4a72c']),
  ('Club Socks',        'LINC', '410', 'MERDXX', 'Socks',         'socks',  true,  true, true, array['#7f1d3d', '#d4a72c']);

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
