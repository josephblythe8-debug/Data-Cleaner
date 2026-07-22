/**
 * SKU engine — pure, side-effect-free functions only.
 *
 * SKUs are built ONLY from structured supplier codes:
 *   {RANGE}-{STYLE}-0-{TEAM}-{COLOUR}-{SIZE}
 *
 * Never derive a SKU from a garment/product display name. If you find
 * yourself slugifying a name into a SKU, that is a bug.
 */

export interface SkuParts {
  range: string
  style: string
  team: string
  colour: string
  size: string
}

export interface SkuSourceGarment {
  rangeCode: string
  styleCode: string
  colourCode: string
}

/** The literal size segment used on parent (non-variant) SKUs. */
export const PARENT_SIZE_SEGMENT = 'ALL'

/** Joins structured parts into the canonical SKU string. Pure, no lookups. */
export function buildSku(parts: SkuParts): string {
  const { range, style, team, colour, size } = parts
  return [range, style, '0', team, colour, size].join('-')
}

/** Builds the parent product SKU (size segment is literally "ALL"). */
export function buildParentSku(garment: SkuSourceGarment, clubCode: string): string {
  return buildSku({
    range: garment.rangeCode,
    style: garment.styleCode,
    team: clubCode,
    colour: garment.colourCode,
    size: PARENT_SIZE_SEGMENT,
  })
}

/** Builds a variant SKU for a specific size code. */
export function buildVariantSku(
  garment: SkuSourceGarment,
  clubCode: string,
  sizeCode: string,
): string {
  return buildSku({
    range: garment.rangeCode,
    style: garment.styleCode,
    team: clubCode,
    colour: garment.colourCode,
    size: sizeCode,
  })
}

// ---------------------------------------------------------------------------
// Self-test block, used by `npm run test:sku`.
// ---------------------------------------------------------------------------

interface SkuAssertion {
  description: string
  actual: string
  expected: string
}

export function runSkuAssertions(): SkuAssertion[] {
  const clubPolo: SkuSourceGarment = { rangeCode: 'LINC', styleCode: '061', colourCode: 'MERDXX' }
  const playingShirtSS: SkuSourceGarment = { rangeCode: 'TEAM', styleCode: '327', colourCode: 'CRRDME' }
  const clubCode = 'ETDC'

  return [
    {
      description: 'Club Polo parent SKU',
      actual: buildParentSku(clubPolo, clubCode),
      expected: 'LINC-061-0-ETDC-MERDXX-ALL',
    },
    {
      description: 'Club Polo variant SKU (Age 5-6)',
      actual: buildVariantSku(clubPolo, clubCode, '56'),
      expected: 'LINC-061-0-ETDC-MERDXX-56',
    },
    {
      description: 'Club Polo variant SKU (Age 7-8)',
      actual: buildVariantSku(clubPolo, clubCode, '78'),
      expected: 'LINC-061-0-ETDC-MERDXX-78',
    },
    {
      description: 'Playing Shirt SS parent SKU',
      actual: buildParentSku(playingShirtSS, clubCode),
      expected: 'TEAM-327-0-ETDC-CRRDME-ALL',
    },
    {
      description: 'Playing Shirt SS variant SKU (Small)',
      actual: buildVariantSku(playingShirtSS, clubCode, 'S'),
      expected: 'TEAM-327-0-ETDC-CRRDME-S',
    },
    {
      description: 'Playing Shirt SS variant SKU (X-Large)',
      actual: buildVariantSku(playingShirtSS, clubCode, 'XL'),
      expected: 'TEAM-327-0-ETDC-CRRDME-XL',
    },
  ]
}
