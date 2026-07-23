/**
 * In-memory seed data for MOCK_MODE. Mirrors the Supabase schema shape so
 * swapping the data client for a real Supabase-backed one is a drop-in
 * change. Also used as the source for `supabase/seed.sql`.
 */
import type { Blueprint, BlueprintGarment, Club, Garment, StoreGarment, StoreProject } from './types'

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

const MERDXX_SWATCHES = ['#7f1d3d', '#d4a72c']
const CRRDME_SWATCHES = ['#b91c2b', '#1e2a4a']

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
    swatches: MERDXX_SWATCHES,
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
    swatches: MERDXX_SWATCHES,
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
    swatches: CRRDME_SWATCHES,
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
    swatches: CRRDME_SWATCHES,
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
    swatches: CRRDME_SWATCHES,
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
    swatches: CRRDME_SWATCHES,
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
    swatches: CRRDME_SWATCHES,
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
    swatches: MERDXX_SWATCHES,
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
    swatches: MERDXX_SWATCHES,
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
