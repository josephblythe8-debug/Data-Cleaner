import type { AgeGroup, SizeTemplateKey } from './sizeTemplates'

export interface Club {
  id: string
  clubName: string
  clubCode: string
  sport: string
  supplier: string
  createdAt: string
}

/** A named colour from the colour library — e.g. Marine, abbreviated "ME". */
export interface ColourName {
  id: string
  name: string
  /** Exactly 2 letters, uppercase — the segment used to build a colour code. */
  abbreviation: string
}

/**
 * A garment's catalogue identity — Range Code + Style Code are fixed,
 * supplier-assigned facts about the product itself, the same for every
 * club. Colour and sizing vary per club, so they live on StoreGarment
 * instead, chosen when a garment is added to a specific club's store.
 */
export interface Garment {
  id: string
  name: string
  rangeCode: string
  /** Human-readable name of the range (e.g. "Lincoln") — display only, never part of a SKU. */
  rangeName: string
  styleCode: string
  category: string
  sizeTemplate: SizeTemplateKey
  allowKids: boolean
  allowAdults: boolean
  active: boolean
}

export interface StoreProject {
  id: string
  clubId: string
  projectName: string
  createdAt: string
}

export interface StoreGarment {
  id: string
  projectId: string
  garmentId: string
  customName: string | null
  /** Up to 3 colour names, in order (main / secondary / trim), e.g. ["Marine", "Red"]. */
  colours: string[]
  /** Exact size codes this club needs, e.g. ["S", "M", "L"] — never a blanket toggle. */
  selectedSizeCodes: string[]
  /**
   * Sell price per age-group product this garment generates (a garment
   * split into Adults + Kids products commonly sells at two different
   * price points). Optional — a product with no price yet still exports,
   * just with a blank Price column and a non-blocking warning.
   */
  priceByAgeGroup: Partial<Record<AgeGroup, number>>
  sortOrder: number
}

/** A store garment joined with its source garment, as the UI/engines consume it. */
export interface ConfiguredGarment extends StoreGarment {
  garment: Garment
}
