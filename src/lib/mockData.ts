/**
 * In-memory seed data for MOCK_MODE. Mirrors the Supabase schema shape so
 * swapping the data client for a real Supabase-backed one is a drop-in
 * change. Also used as the source for `supabase/seed.sql`.
 */
import { getAvailableSizes } from './sizeTemplates'
import type { Club, ColourName, Garment, StoreGarment, StoreProject } from './types'

// The colour library: name -> 2-letter abbreviation used to build the
// COLOUR segment of a SKU (see src/lib/colourCode.ts). This is the fixed
// company colour reference sheet — coordinators pick from it, they don't
// add to it.
export const seedColourNames: ColourName[] = [
  { id: 'colour_amber', name: 'Amber', abbreviation: 'AM' },
  { id: 'colour_blue', name: 'Blue', abbreviation: 'BE' },
  { id: 'colour_beige', name: 'Beige', abbreviation: 'BG' },
  { id: 'colour_black', name: 'Black', abbreviation: 'BK' },
  { id: 'colour_bottle', name: 'Bottle', abbreviation: 'BO' },
  { id: 'colour_brown', name: 'Brown', abbreviation: 'BR' },
  { id: 'colour_dark_grey', name: 'Dark Grey', abbreviation: 'DG' },
  { id: 'colour_green', name: 'Green', abbreviation: 'GN' },
  { id: 'colour_gold', name: 'Gold', abbreviation: 'GO' },
  { id: 'colour_grey', name: 'Grey', abbreviation: 'GY' },
  { id: 'colour_marine', name: 'Marine', abbreviation: 'ME' },
  { id: 'colour_maroon', name: 'Maroon', abbreviation: 'MN' },
  { id: 'colour_multi', name: 'Multi', abbreviation: 'MU' },
  { id: 'colour_orange', name: 'Orange', abbreviation: 'OR' },
  { id: 'colour_pink', name: 'Pink', abbreviation: 'PK' },
  { id: 'colour_purple', name: 'Purple', abbreviation: 'PP' },
  { id: 'colour_red', name: 'Red', abbreviation: 'RD' },
  { id: 'colour_royal', name: 'Royal', abbreviation: 'RO' },
  { id: 'colour_sky', name: 'Sky', abbreviation: 'SK' },
  { id: 'colour_silver', name: 'Silver', abbreviation: 'SV' },
  { id: 'colour_white', name: 'White', abbreviation: 'WH' },
  { id: 'colour_yellow', name: 'Yellow', abbreviation: 'YW' },
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

// The garment library holds only the catalogue-level facts that never
// change per club: Range Code + Style Code (supplier-assigned), category,
// and which size template/age brackets the style is cut in. Colour and
// exact sizing are chosen per club when the garment is added to a store
// (see seedStoreGarments below) — every club needs different colours.
export const seedGarments: Garment[] = [
  {
    id: 'garment_club_polo',
    name: 'Club Polo',
    rangeCode: 'LINC',
    styleCode: '061',
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
    category: 'Socks',
    sizeTemplate: 'socks',
    allowKids: true,
    allowAdults: true,
    active: true,
  },
]

export const seedStoreProjects: StoreProject[] = [
  {
    id: 'project_demo_etdc',
    clubId: 'club_etdc',
    projectName: 'Eastern Districts Cricket Club Store',
    createdAt: '2026-01-20T09:00:00.000Z',
  },
]

// MERDXX = Marine (ME) + Red (RD) + none (XX)
const MERDXX_COLOURS = ['Marine', 'Red']
// MNGOXX = Maroon (MN) + Gold (GO) + none (XX)
const MNGOXX_COLOURS = ['Maroon', 'Gold']

function allSizeCodes(garment: Garment): string[] {
  return getAvailableSizes(garment.sizeTemplate, garment.allowKids, garment.allowAdults).map((s) => s.code)
}

const garmentsById = new Map(seedGarments.map((g) => [g.id, g]))
function garment(id: string): Garment {
  const g = garmentsById.get(id)
  if (!g) throw new Error(`Unknown seed garment id: ${id}`)
  return g
}

// A fully-configured demo store, so mock mode has something to look at
// (Dashboard, Preview, CSV export) without requiring a click-through first.
export const seedStoreGarments: StoreGarment[] = [
  'garment_club_polo',
  'garment_club_hoodie',
  'garment_training_tee',
  'garment_training_shorts',
  'garment_playing_shirt_ss',
  'garment_playing_shirt_ls',
  'garment_playing_pants',
  'garment_club_cap',
  'garment_club_socks',
].map((garmentId, index) => {
  const g = garment(garmentId)
  const colours = g.rangeCode === 'TEAM' ? MNGOXX_COLOURS : MERDXX_COLOURS
  return {
    id: `sg_demo_${index + 1}`,
    projectId: 'project_demo_etdc',
    garmentId,
    customName: null,
    colours,
    selectedSizeCodes: allSizeCodes(g),
    sortOrder: index,
  }
})
