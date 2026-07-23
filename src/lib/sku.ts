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

/**
 * The size segment used on a parent (non-variant) SKU. Per the real
 * ClubHub SKU convention, a parent row's size segment is the AGE GROUP the
 * product belongs to (ADLT/KIDS), since kids and adults get split into
 * separate products. "ALL" is reserved for garments that aren't split by
 * age at all (socks, headwear) or that end up with no sizes selected.
 */
export type ParentSizeSegment = 'ADLT' | 'KIDS' | 'ALL'

/** Joins structured parts into the canonical SKU string. Pure, no lookups. */
export function buildSku(parts: SkuParts): string {
  const { range, style, team, colour, size } = parts
  return [range, style, '0', team, colour, size].join('-')
}

/** Builds a parent product SKU for the given age-group size segment. */
export function buildParentSku(
  garment: SkuSourceGarment,
  clubCode: string,
  sizeSegment: ParentSizeSegment,
): string {
  return buildSku({
    range: garment.rangeCode,
    style: garment.styleCode,
    team: clubCode,
    colour: garment.colourCode,
    size: sizeSegment,
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
      description: 'Club Polo parent SKU (Adults)',
      actual: buildParentSku(clubPolo, clubCode, 'ADLT'),
      expected: 'LINC-061-0-ETDC-MERDXX-ADLT',
    },
    {
      description: 'Club Polo parent SKU (Kids)',
      actual: buildParentSku(clubPolo, clubCode, 'KIDS'),
      expected: 'LINC-061-0-ETDC-MERDXX-KIDS',
    },
    {
      description: 'Club Polo variant SKU (Age 5-6)',
      actual: buildVariantSku(clubPolo, clubCode, '56'),
      expected: 'LINC-061-0-ETDC-MERDXX-56',
    },
    {
      description: 'Playing Shirt SS parent SKU (Adults)',
      actual: buildParentSku(playingShirtSS, clubCode, 'ADLT'),
      expected: 'TEAM-327-0-ETDC-CRRDME-ADLT',
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
