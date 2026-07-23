/**
 * In-memory seed data for MOCK_MODE. Mirrors the Supabase schema shape so
 * swapping the data client for a real Supabase-backed one is a drop-in
 * change. Also used as the source for `supabase/seed.sql`.
 */
import type { Blueprint, BlueprintGarment, Club, ColourOption, Garment, StoreGarment, StoreProject } from './types'

// Colour codes are opaque supplier CAD codes (see src/lib/sku.ts) — the
// name/swatch fields here are just a friendly, clickable reference so the
// coordinator doesn't have to remember or retype them for every club.
export const seedColours: ColourOption[] = [
  { id: 'colour_merdxx', code: 'MERDXX', name: 'Maroon / Gold', swatchHex: '#7f1d3d', swatchHex2: '#d4a72c' },
  { id: 'colour_crrdme', code: 'CRRDME', name: 'Crimson / Navy', swatchHex: '#b91c2b', swatchHex2: '#1e2a4a' },
  { id: 'colour_nvywht', code: 'NVYWHT', name: 'Navy / White', swatchHex: '#1e2a4a', swatchHex2: '#f8fafc' },
  { id: 'colour_rylgld', code: 'RYLGLD', name: 'Royal Blue / Gold', swatchHex: '#1d4ed8', swatchHex2: '#d4a72c' },
  { id: 'colour_blkred', code: 'BLKRED', name: 'Black / Red', swatchHex: '#111827', swatchHex2: '#b91c2b' },
  { id: 'colour_grnwht', code: 'GRNWHT', name: 'Green / White', swatchHex: '#166534', swatchHex2: '#f8fafc' },
  { id: 'colour_skyblk', code: 'SKYBLK', name: 'Sky Blue / Black', swatchHex: '#0ea5e9', swatchHex2: '#111827' },
  { id: 'colour_puror', code: 'PURORG', name: 'Purple / Orange', swatchHex: '#6d28d9', swatchHex2: '#ea580c' },
]

export const seedClubs: Club[] = [
  {
    id: 'club_etdc',
    clubName: 'Eastern Districts Cricket Club',
    clubCode: 'ETDC',
    sport: 'Cricket',
    supplier: "O'Neills",
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'club_wtcc',
    clubName: 'Western Thunder Cricket Club',
    clubCode: 'WTCC',
    sport: 'Cricket',
    supplier: "O'Neills",
    createdAt: '2026-02-03T09:00:00.000Z',
  },
]

export const seedGarments: Garment[] = [
  {
    id: 'garment_club_polo',
    name: 'Club Polo',
    rangeCode: 'LINC',
    styleCode: '061',
    colourCode: 'MERDXX',
    category: 'Polo',
    sizeTemplate: 'adults',
    allowKids: true,
    allowAdults: true,
    active: true,
  },
  {
    id: 'garment_club_hoodie',
    name: 'Club Hoodie',
    rangeCode: 'LINC',
    styleCode: '112',
    colourCode: 'MERDXX',
    category: 'Hoodie',
    sizeTemplate: 'adults',
    allowKids: true,
    allowAdults: true,
    active: true,
  },
  {
    id: 'garment_training_tee',
    name: 'Training Tee',
    rangeCode: 'TEAM',
    styleCode: '204',
    colourCode: 'CRRDME',
    category: 'Tee',
    sizeTemplate: 'adults',
    allowKids: true,
    allowAdults: true,
    active: true,
  },
  {
    id: 'garment_training_shorts',
    name: 'Training Shorts',
    rangeCode: 'TEAM',
    styleCode: '210',
    colourCode: 'CRRDME',
    category: 'Shorts',
    sizeTemplate: 'adults',
    allowKids: true,
    allowAdults: true,
    active: true,
  },
  {
    id: 'garment_playing_shirt_ss',
    name: 'Playing Shirt SS',
    rangeCode: 'TEAM',
    styleCode: '327',
    colourCode: 'CRRDME',
    category: 'Playing Shirt',
    sizeTemplate: 'adults',
    allowKids: true,
    allowAdults: true,
    active: true,
  },
  {
    id: 'garment_playing_shirt_ls',
    name: 'Playing Shirt LS',
    rangeCode: 'TEAM',
    styleCode: '328',
    colourCode: 'CRRDME',
    category: 'Playing Shirt',
    sizeTemplate: 'adults',
    allowKids: true,
    allowAdults: true,
    active: true,
  },
  {
    id: 'garment_playing_pants',
    name: 'Playing Pants',
    rangeCode: 'TEAM',
    styleCode: '330',
    colourCode: 'CRRDME',
    category: 'Pants',
    sizeTemplate: 'adults',
    allowKids: true,
    allowAdults: true,
    active: true,
  },
  {
    id: 'garment_club_cap',
    name: 'Club Cap',
    rangeCode: 'LINC',
    styleCode: '400',
    colourCode: 'MERDXX',
    category: 'Headwear',
    sizeTemplate: 'osfa',
    allowKids: false,
    allowAdults: true,
    active: true,
  },
  {
    id: 'garment_club_socks',
    name: 'Club Socks',
    rangeCode: 'LINC',
    styleCode: '410',
    colourCode: 'MERDXX',
    category: 'Socks',
    sizeTemplate: 'socks',
    allowKids: true,
    allowAdults: true,
    active: true,
  },
]

export const seedBlueprints: Blueprint[] = [
  {
    id: 'blueprint_cricket_template',
    name: 'Cricket Template',
    sport: 'Cricket',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
]

export const seedBlueprintGarments: BlueprintGarment[] = seedGarments.map((garment, index) => ({
  id: `bg_${index + 1}`,
  blueprintId: 'blueprint_cricket_template',
  garmentId: garment.id,
  sortOrder: index,
}))

export const seedStoreProjects: StoreProject[] = []

export const seedStoreGarments: StoreGarment[] = []
