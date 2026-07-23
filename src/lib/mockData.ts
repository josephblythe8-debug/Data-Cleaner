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

// MERDXX = Marine (ME) + Red (RD) + none (XX)
const MERDXX_COLOURS = ['Marine', 'Red']
// MNGOXX = Maroon (MN) + Gold (GO) + none (XX)
const MNGOXX_COLOURS = ['Maroon', 'Gold']

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
    colourCode: 'MNGOXX',
    colours: MNGOXX_COLOURS,
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
    colourCode: 'MNGOXX',
    colours: MNGOXX_COLOURS,
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
    colourCode: 'MNGOXX',
    colours: MNGOXX_COLOURS,
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
    colourCode: 'MNGOXX',
    colours: MNGOXX_COLOURS,
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
    colourCode: 'MNGOXX',
    colours: MNGOXX_COLOURS,
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
