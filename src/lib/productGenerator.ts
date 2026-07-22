/**
 * Product generator — turns configured garments into the exact set of
 * parent products + variants that will be shown on the Preview page and
 * exported to the BigCommerce CSV. Both consumers call this same module so
 * Preview and the export are guaranteed to match byte-for-byte.
 */
import { buildParentSku, buildVariantSku } from './sku'
import { resolveGarmentSizes } from './sizeTemplates'
import type { ConfiguredGarment } from './types'

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
  parentSku: string
  variants: GeneratedVariant[]
}

/**
 * Generates the full product list for a store project's configured garments
 * against a given club code. Order follows the configured garments' sort
 * order.
 */
export function generateProducts(
  configuredGarments: ConfiguredGarment[],
  clubCode: string,
): GeneratedProduct[] {
  const sorted = [...configuredGarments].sort((a, b) => a.sortOrder - b.sortOrder)

  return sorted.map((cg) => {
    const { garment } = cg
    const productName = cg.customName?.trim() || garment.name

    const sizes = resolveGarmentSizes(garment.sizeTemplate, cg.includeKids, cg.includeAdults)

    const variants: GeneratedVariant[] = sizes.map((size) => ({
      sizeLabel: size.label,
      sizeCode: size.code,
      sku: buildVariantSku(garment, clubCode, size.code),
    }))

    return {
      productId: cg.id,
      storeGarmentId: cg.id,
      garmentId: garment.id,
      productName,
      category: garment.category,
      parentSku: buildParentSku(garment, clubCode),
      variants,
    }
  })
}
