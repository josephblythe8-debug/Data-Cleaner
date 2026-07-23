/**
 * CSV export engine — turns generated products into a BigCommerce import
 * file. This reads from the exact same `generateProducts` output the
 * Preview page renders, so what you see in Preview matches the exported
 * file byte-for-byte.
 */
import type { GeneratedProduct } from './productGenerator'
import type { Club } from './types'

export const CSV_HEADERS = [
  'Item Type',
  'Product ID',
  'Product Name',
  'Product Type',
  'Product Code/SKU',
  'Price',
  'Product Weight',
  'Allow Purchases',
  'Track Inventory',
  'Category',
  'Brand Name',
] as const

export interface ExportRow {
  itemType: 'Product' | 'SKU'
  productId: string
  productName: string
  productType: string
  sku: string
  price: string
  weight: string
  allowPurchases: string
  trackInventory: string
  category: string
  brandName: string
}

// Pricing/weight are not yet part of the data model (no price field on
// garments or store_garments), so parent rows export these as placeholder
// defaults the coordinator fills in during BigCommerce review.
const DEFAULT_PRICE = '0.00'
const DEFAULT_WEIGHT = '0.00'

/**
 * Builds the flat row list (parent + variant rows) for a set of generated
 * products, in BigCommerce import order: each parent row is immediately
 * followed by its variant rows, and a parent shares Product ID with its
 * variants.
 */
export function buildExportRows(products: GeneratedProduct[], club: Club | undefined): ExportRow[] {
  const brandName = club?.supplier ?? ''
  // BigCommerce category is the club's category folder ("STRU - Southport
  // Tigers Rugby League"), not the garment type — every product in a club's
  // shop shares it. garment.category (Polo/Hoodie/...) is a separate,
  // internal-only classification used for search/grouping in the app.
  const category = club ? `${club.clubCode} - ${club.clubName}` : ''
  const rows: ExportRow[] = []

  products.forEach((product, index) => {
    const productId = String(index + 1)

    rows.push({
      itemType: 'Product',
      productId,
      productName: product.productName,
      productType: 'Physical',
      sku: product.parentSku,
      price: DEFAULT_PRICE,
      weight: DEFAULT_WEIGHT,
      allowPurchases: 'Y',
      trackInventory: 'Y',
      category,
      brandName,
    })

    for (const variant of product.variants) {
      rows.push({
        itemType: 'SKU',
        productId,
        productName: '',
        productType: '',
        sku: variant.sku,
        price: '',
        weight: '',
        allowPurchases: '',
        trackInventory: '',
        category: '',
        brandName: '',
      })
    }
  })

  return rows
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function rowToCsvLine(row: ExportRow): string {
  return [
    row.itemType,
    row.productId,
    row.productName,
    row.productType,
    row.sku,
    row.price,
    row.weight,
    row.allowPurchases,
    row.trackInventory,
    row.category,
    row.brandName,
  ]
    .map(csvEscape)
    .join(',')
}

/** Renders the full BigCommerce import CSV, header included. */
export function renderCsv(products: GeneratedProduct[], club: Club | undefined): string {
  const rows = buildExportRows(products, club)
  const lines = [CSV_HEADERS.join(','), ...rows.map(rowToCsvLine)]
  return lines.join('\n')
}
