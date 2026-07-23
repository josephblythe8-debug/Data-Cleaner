/**
 * Product generator — turns configured garments into the exact set of
 * parent products + variants that will be shown on the Preview page and
 * exported to the BigCommerce CSV. Both consumers call this same module so
 * Preview and the export are guaranteed to match byte-for-byte.
 *
 * Colour and exact sizing are chosen per club (see StoreGarment), never
 * baked into the garment library — the same "Club Polo" catalogue entry
 * gets a different colour_code for every club. Kids and adults sizing
 * become separate products (never merged), because real pricing differs
 * per age group and BigCommerce needs one product per price point. The
 * parent SKU's size segment reflects that: ADLT/KIDS, or ALL for garments
 * that aren't split by age at all (socks, headwear).
 */
import { buildColourCode } from './colourCode'
import { buildParentSku, buildVariantSku, type ParentSizeSegment } from './sku'
import { resolveGarmentSizeGroups, type SizeGroup } from './sizeTemplates'
import type { Club, ColourName, ConfiguredGarment } from './types'

export interface GeneratedVariant {
  sizeLabel: string
  sizeCode: string
  sku: string
}

export interface GeneratedProduct {
  /** Stable id used to correlate the parent row with its variant rows in the export. */
  productId: string
  storeGarmentId: string
  garmentId: string
  productName: string
  category: string
  ageGroup: SizeGroup['ageGroup']
  colourCode: string
  parentSku: string
  variants: GeneratedVariant[]
}

const AGE_GROUP_LABEL: Record<SizeGroup['ageGroup'], string | null> = {
  adults: 'Adults',
  kids: 'Kids',
  all: null,
}

const AGE_GROUP_SKU_SEGMENT: Record<SizeGroup['ageGroup'], ParentSizeSegment> = {
  adults: 'ADLT',
  kids: 'KIDS',
  all: 'ALL',
}

/**
 * Generates the full product list for a store project's configured garments
 * against a club. `colourNames` is the colour library, used to resolve each
 * store garment's chosen colour names to their 2-letter codes. Order
 * follows the configured garments' sort order; a garment offering both age
 * groups produces its Adults product immediately followed by its Kids
 * product.
 */
export function generateProducts(
  configuredGarments: ConfiguredGarment[],
  club: Pick<Club, 'clubCode' | 'clubName'>,
  colourNames: ColourName[],
): GeneratedProduct[] {
  const abbreviationByName = new Map(colourNames.map((c) => [c.name, c.abbreviation]))
  const sorted = [...configuredGarments].sort((a, b) => a.sortOrder - b.sortOrder)

  return sorted.flatMap((cg) => {
    const { garment } = cg
    const baseLabel = cg.customName?.trim() || garment.name
    const colourCode = buildColourCode(cg.colours.map((name) => abbreviationByName.get(name) ?? ''))

    const groups = resolveGarmentSizeGroups(cg.selectedSizeCodes)
    const effectiveGroups: SizeGroup[] = groups.length > 0 ? groups : [{ ageGroup: 'all', sizes: [] }]

    return effectiveGroups.map((group): GeneratedProduct => {
      const ageSuffix = AGE_GROUP_LABEL[group.ageGroup]
      const productName = `${club.clubName} - ${baseLabel}${ageSuffix ? ` (${ageSuffix})` : ''}`

      const variants: GeneratedVariant[] = group.sizes.map((size) => ({
        sizeLabel: size.label,
        sizeCode: size.code,
        sku: buildVariantSku({ ...garment, colourCode }, club.clubCode, size.code),
      }))

      return {
        productId: `${cg.id}-${group.ageGroup}`,
        storeGarmentId: cg.id,
        garmentId: garment.id,
        productName,
        category: garment.category,
        ageGroup: group.ageGroup,
        colourCode,
        parentSku: buildParentSku({ ...garment, colourCode }, club.clubCode, AGE_GROUP_SKU_SEGMENT[group.ageGroup]),
        variants,
      }
    })
  })
}
