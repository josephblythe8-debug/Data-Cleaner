/**
 * Zero-setup terminal test for the brief-import engine.
 * Run with `npm run test:import`.
 *
 *   1. Asserts the brief parser extracts product names/prices correctly
 *      and skips header/blank lines.
 *   2. Asserts the garment matcher matches real garments (even with
 *      qualifiers or reordered words) and flags unrelated products.
 *   3. Runs a full sample brief against the demo garment library and
 *      prints matched vs flagged lines.
 */
import { parseBrief, runBriefParserAssertions } from '../src/lib/briefParser'
import { matchBriefLines, runMatcherAssertions } from '../src/lib/garmentMatcher'
import { seedGarments } from '../src/lib/mockData'

function section(title: string) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(title)
  console.log('='.repeat(70))
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

let exitCode = 0

function runAssertions(title: string, assertions: { description: string; actual: unknown; expected: unknown }[]) {
  section(title)
  for (const a of assertions) {
    const pass = deepEqual(a.actual, a.expected)
    const icon = pass ? 'PASS' : 'FAIL'
    console.log(`[${icon}] ${a.description}`)
    console.log(`       expected: ${JSON.stringify(a.expected)}`)
    console.log(`       actual:   ${JSON.stringify(a.actual)}`)
    if (!pass) exitCode = 1
  }
}

runAssertions('1. Brief parser assertions', runBriefParserAssertions())
runAssertions('2. Garment matcher assertions', runMatcherAssertions())

if (exitCode !== 0) {
  console.error('\nAssertions FAILED. Aborting before sample brief.')
  process.exit(exitCode)
}
console.log('\nAll assertions passed.')

// ---------------------------------------------------------------------------
// 3. Sample brief against the demo garment library
// ---------------------------------------------------------------------------
section('3. Sample brief matched against the demo garment library')

const sampleBrief = `
Hi team,

Please set up the following for the club:

Club Polo (Adults) - $45.00
Club Hoodie (Adults) - $58.00
Training Tee - 32.00
Playing Shirt SS (Adults) - $65.00
Deluxe Winter Beanie - $18.00
Unbranded Rain Jacket XL - $75.00

Thanks!
`

const parsed = parseBrief(sampleBrief)
const matched = matchBriefLines(parsed, seedGarments)

for (const line of matched) {
  const priceStr = line.price !== null ? `$${line.price.toFixed(2)}` : '(no price found)'
  if (line.garmentId) {
    const garment = seedGarments.find((g) => g.id === line.garmentId)!
    console.log(`[MATCHED]   "${line.productName}" ${priceStr}  ->  ${garment.name} (confidence ${line.confidence.toFixed(2)})`)
  } else {
    console.log(`[UNMATCHED] "${line.productName}" ${priceStr}  ->  no garment found — flagged for review`)
  }
}

const matchedCount = matched.filter((l) => l.garmentId).length
console.log(`\n${matchedCount}/${matched.length} lines matched a garment in the library.`)

section('RESULT: ALL CHECKS PASSED')
process.exit(0)
