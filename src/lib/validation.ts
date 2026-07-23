/**
 * Validation engine — checks a store project is safe to export.
 * Blocking errors prevent export; warnings do not.
 */
import type { GeneratedProduct } from './productGenerator'
import type { Club, ConfiguredGarment } from './types'

export interface ValidationIssue {
  code: string
  message: string
  /** id of the store_garment this issue relates to, if any */
  storeGarmentId?: string
}

export interface ValidationResult {
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  isValid: boolean
}

export function validateStoreProject(
  club: Club | undefined,
  configuredGarments: ConfiguredGarment[],
  products: GeneratedProduct[],
): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  if (!club || !club.clubCode.trim()) {
    errors.push({ code: 'MISSING_CLUB_CODE', message: 'Club code is missing.' })
  }

  for (const cg of configuredGarments) {
    const label = cg.customName?.trim() || cg.garment.name
    if (!cg.garment.rangeCode.trim()) {
      errors.push({
        code: 'MISSING_RANGE',
        message: `"${label}" is missing a Range code.`,
        storeGarmentId: cg.id,
      })
    }
    if (!cg.garment.styleCode.trim()) {
      errors.push({
        code: 'MISSING_STYLE',
        message: `"${label}" is missing a Style code.`,
        storeGarmentId: cg.id,
      })
    }
    if (cg.colours.length === 0) {
      errors.push({
        code: 'MISSING_COLOUR',
        message: `"${label}" has no colour selected.`,
        storeGarmentId: cg.id,
      })
    }
  }

  // Duplicate SKU detection across parent + variant SKUs of every product.
  const skuOwners = new Map<string, string[]>()
  for (const product of products) {
    const allSkus = [product.parentSku, ...product.variants.map((v) => v.sku)]
    for (const sku of allSkus) {
      const owners = skuOwners.get(sku) ?? []
      owners.push(product.productName)
      skuOwners.set(sku, owners)
    }
  }
  for (const [sku, owners] of skuOwners) {
    if (owners.length > 1) {
      errors.push({
        code: 'DUPLICATE_SKU',
        message: `Duplicate SKU "${sku}" is used by: ${owners.join(', ')}.`,
      })
    }
  }

  // Zero-size garments are a non-blocking warning: they simply produce no variants.
  for (const product of products) {
    if (product.variants.length === 0) {
      warnings.push({
        code: 'NO_SIZES_SELECTED',
        message: `"${product.productName}" has no sizes selected and will produce no variants.`,
        storeGarmentId: product.storeGarmentId,
      })
    }
  }

  return { errors, warnings, isValid: errors.length === 0 }
}
