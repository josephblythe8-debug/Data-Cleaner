/**
 * Zero-setup terminal test for the catalogue-import engine.
 * Run with `npm run test:catalogue`.
 */
import { runCatalogueParserAssertions } from '../src/lib/catalogueParser'

function section(title: string) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(title)
  console.log('='.repeat(70))
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

let exitCode = 0

section('Catalogue parser assertions')
for (const a of runCatalogueParserAssertions()) {
  const pass = deepEqual(a.actual, a.expected)
  const icon = pass ? 'PASS' : 'FAIL'
  console.log(`[${icon}] ${a.description}`)
  console.log(`       expected: ${JSON.stringify(a.expected)}`)
  console.log(`       actual:   ${JSON.stringify(a.actual)}`)
  if (!pass) exitCode = 1
}

if (exitCode !== 0) {
  console.error('\nAssertions FAILED.')
} else {
  console.log('\nAll assertions passed.')
}
process.exit(exitCode)
