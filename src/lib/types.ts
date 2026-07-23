import type { SizeTemplateKey } from './sizeTemplates'

export interface Club {
  id: string
  clubName: string
  clubCode: string
  sport: string
  supplier: string
  createdAt: string
}

export interface Garment {
  id: string
  name: string
  rangeCode: string
  styleCode: string
  colourCode: string
  category: string
  sizeTemplate: SizeTemplateKey
  allowKids: boolean
  allowAdults: boolean
  active: boolean
  /**
   * Up to 3 manually-picked swatch colours (hex), purely a visual reference
   * for the garment card — not used in SKU generation, which always reads
   * `colourCode`.
   */
  swatches: string[]
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
