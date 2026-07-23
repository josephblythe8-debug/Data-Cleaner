import type { SizeTemplateKey } from './sizeTemplates'

export interface Club {
  id: string
  clubName: string
  clubCode: string
  sport: string
  supplier: string
  createdAt: string
}

/**
 * A supplier colourway — a CAD (colour-and-design) card the coordinator
 * can click instead of typing a colour code by hand. Garments reference
 * a colour by its `code`, since different clubs frequently need the same
 * garment in a different colourway.
 */
export interface ColourOption {
  id: string
  code: string
  name: string
  /** Primary swatch colour, as a CSS colour (hex). */
  swatchHex: string
  /** Optional secondary/trim swatch colour, for two-tone colourways. */
  swatchHex2?: string
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
