import type { SizeTemplateKey } from './sizeTemplates'

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
  /** Exactly 2 letters, uppercase — the segment used to build colourCode. */
  abbreviation: string
}

export interface Garment {
  id: string
  name: string
  rangeCode: string
  styleCode: string
  /**
   * The COLOUR segment of the SKU (e.g. "MERDXX"), always derived from
   * `colours` via buildColourCode() — never typed by hand.
   */
  colourCode: string
  /** Up to 3 colour names, in order (main / secondary / trim), e.g. ["Marine", "Red"]. */
  colours: string[]
  category: string
  sizeTemplate: SizeTemplateKey
  allowKids: boolean
  allowAdults: boolean
  active: boolean
}

export interface Blueprint {
  id: string
  name: string
  sport: string
  createdAt: string
}

export interface BlueprintGarment {
  id: string
  blueprintId: string
  garmentId: string
  sortOrder: number
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
  includeKids: boolean
  includeAdults: boolean
  sortOrder: number
}

/** A store garment joined with its source garment, as the UI/engines consume it. */
export interface ConfiguredGarment extends StoreGarment {
  garment: Garment
}
