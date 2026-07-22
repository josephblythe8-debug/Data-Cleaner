/**
 * Zero-setup terminal test: no dev server, no browser, no Supabase.
 * Run with `npm run test:sku`.
 *
 *   1. Asserts the six SKU examples from the spec produce exact strings.
 *   2. Builds the Cricket Template blueprint for club ETDC and prints every
 *      generated parent + variant SKU.
 *   3. Prints a sample BigCommerce CSV (first ~15 rows).
 */
import { runSkuAssertions } from '../src/lib/sku'
import { applyBlueprint } from '../src/lib/blueprintEngine'
import { generateProducts } from '../src/lib/productGenerator'
import { renderCsv } from '../src/lib/csvExport'
import { validateStoreProject } from '../src/lib/validation'
import {
  seedBlueprintGarments,
  seedBlueprints,
  seedClubs,
  seedGarments,
} from '../src/lib/mockData'
import type { ConfiguredGarment } from '../src/lib/types'

function section(title: string) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(title)
  console.log('='.repeat(70))
}

let exitCode = 0

// ---------------------------------------------------------------------------
// 1. SKU assertions
// ---------------------------------------------------------------------------
section('1. SKU builder assertions')

const assertions = runSkuAssertions()
for (const a of assertions) {
  const pass = a.actual === a.expected
  const icon = pass ? 'PASS' : 'FAIL'
  console.log(`[${icon}] ${a.description}`)
  console.log(`       expected: ${a.expected}`)
  console.log(`       actual:   ${a.actual}`)
  if (!pass) exitCode = 1
}

if (exitCode !== 0) {
  console.error('\nSKU assertions FAILED. Aborting before blueprint/CSV steps.')
  process.exit(exitCode)
}
console.log('\nAll SKU assertions passed.')

// ---------------------------------------------------------------------------
// 2. Build Cricket Template blueprint for club ETDC
// ---------------------------------------------------------------------------
section('2. Cricket Template blueprint applied to club ETDC')

const club = seedClubs.find((c) => c.clubCode === 'ETDC')
if (!club) {
  console.error('Seed club ETDC not found.')
  process.exit(1)
}

const blueprint = seedBlueprints.find((b) => b.name === 'Cricket Template')
if (!blueprint) {
  console.error('Seed blueprint "Cricket Template" not found.')
  process.exit(1)
}

const garmentsById = new Map(seedGarments.map((g) => [g.id, g]))
const storeGarments = applyBlueprint('project_demo', blueprint, seedBlueprintGarments, garmentsById)

const configuredGarments: ConfiguredGarment[] = storeGarments.map((sg) => ({
  ...sg,
  garment: garmentsById.get(sg.garmentId)!,
}))

const products = generateProducts(configuredGarments, club.clubCode)

for (const product of products) {
  console.log(`\n${product.productName} (${product.category})`)
  console.log(`  Parent SKU: ${product.parentSku}`)
  if (product.variants.length === 0) {
    console.log('  Variants:   (none — no sizes selected)')
  } else {
    for (const variant of product.variants) {
      console.log(`  Variant SKU: ${variant.sku}  [${variant.sizeLabel}]`)
    }
  }
}

const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0)
console.log(`\nGenerated ${products.length} parent products, ${totalVariants} variant SKUs.`)

// ---------------------------------------------------------------------------
// Validation sanity check
// ---------------------------------------------------------------------------
section('Validation')
const validation = validateStoreProject(club, configuredGarments, products)
console.log(`Errors:   ${validation.errors.length}`)
console.log(`Warnings: ${validation.warnings.length}`)
for (const w of validation.warnings) console.log(`  [warn] ${w.message}`)
for (const e of validation.errors) console.log(`  [error] ${e.message}`)
if (!validation.isValid) {
  console.error('\nValidation FAILED on demo data — this should never happen for clean seed data.')
  exitCode = 1
}

// ---------------------------------------------------------------------------
// 3. Sample CSV
// ---------------------------------------------------------------------------
section('3. Sample BigCommerce CSV (first 15 rows)')
const csv = renderCsv(products, club)
const lines = csv.split('\n')
console.log(lines.slice(0, 15).join('\n'))
console.log(`\n... (${lines.length - 1} total data rows + 1 header row)`)

section(exitCode === 0 ? 'RESULT: ALL CHECKS PASSED' : 'RESULT: FAILED')
process.exit(exitCode)
