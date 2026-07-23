/**
 * Colour code engine — pure, side-effect-free.
 *
 * The COLOUR segment of a SKU (e.g. "MERDXX", "MNGOXX") is never typed by
 * hand. It's built from up to 3 colours picked from the fixed company
 * colour table (see src/lib/mockData.ts), each with its own 2-letter
 * abbreviation, joined in the order chosen and padded with "XX" for any
 * unused slot:
 *
 *   Marine, Red           -> ME + RD + XX -> "MERDXX"
 *   Maroon, Gold           -> MN + GO + XX -> "MNGOXX"
 *
 * Order matters — it's positional (main / secondary / trim), so swapping
 * two colours produces a different code.
 */

export const MAX_GARMENT_COLOURS = 3
const EMPTY_SLOT = 'XX'

/** Joins up to 3 colour abbreviations into a 6-character colour code. */
export function buildColourCode(abbreviations: string[]): string {
  const slots = abbreviations.slice(0, MAX_GARMENT_COLOURS).map((a) => a.trim().toUpperCase())
  while (slots.length < MAX_GARMENT_COLOURS) slots.push(EMPTY_SLOT)
  return slots.join('')
}

// ---------------------------------------------------------------------------
// Self-test block, included in `npm run test:sku`.
// ---------------------------------------------------------------------------

interface ColourCodeAssertion {
  description: string
  actual: string
  expected: string
}

export function runColourCodeAssertions(): ColourCodeAssertion[] {
  return [
    {
      description: 'Marine + Red -> MERDXX',
      actual: buildColourCode(['ME', 'RD']),
      expected: 'MERDXX',
    },
    {
      description: 'Maroon + Gold -> MNGOXX',
      actual: buildColourCode(['MN', 'GO']),
      expected: 'MNGOXX',
    },
  ]
}
