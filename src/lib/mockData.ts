/**
 * In-memory seed data for MOCK_MODE. Mirrors the Supabase schema shape so
 * swapping the data client for a real Supabase-backed one is a drop-in
 * change. Also used as the source for `supabase/seed.sql`.
 */
import type {
  Blueprint,
  BlueprintGarment,
  Club,
  ColourName,
  Garment,
  StoreGarment,
  StoreProject,
} from './types'

// The colour library: name -> 2-letter abbreviation used to build the
// COLOUR segment of a SKU (see src/lib/colourCode.ts). Extensible via
// "+ New colour" in the garment form — this is just the starter set.
export const seedColourNames: ColourName[] = [
  { id: 'colour_marine', name: 'Marine', abbreviation: 'ME' },
  { id: 'colour_red', name: 'Red', abbreviation: 'RD' },
  { id: 'colour_cream', name: 'Cream', abbreviation: 'CR' },
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

// MERDXX = Marine (ME) + Red (RD) + none (XX)
const MERDXX_COLOURS = ['Marine', 'Red']
// CRRDME = Cream (CR) + Red (RD) + Marine (ME)
const CRRDME_COLOURS = ['Cream', 'Red', 'Marine']

export const seedGarments: Garment[] = [
  {
    id: 'garment_club_polo',
    name: 'Club Polo',
    rangeCode: 'LINC',
    styleCode: '061',
    colourCode: 'MERDXX',
    colours: MERDXX_COLOURS,
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
    colours: MERDXX_COLOURS,
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
    colours: CRRDME_COLOURS,
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
    colours: CRRDME_COLOURS,
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
    colours: CRRDME_COLOURS,
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
    colours: CRRDME_COLOURS,
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
    colours: CRRDME_COLOURS,
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
    colours: MERDXX_COLOURS,
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
    colours: MERDXX_COLOURS,
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
