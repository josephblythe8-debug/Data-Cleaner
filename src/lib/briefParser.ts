/**
 * Brief parser — pure, side-effect-free.
 *
 * Takes the raw text of a sales rep's email or product brief (already
 * extracted from whatever file it came in as) and pulls out one entry per
 * line: a product name and, if present, a price. This never talks to the
 * garment library — matching against it is garmentMatcher.ts's job.
 */

export interface ParsedBriefLine {
  /** The original line, unmodified — shown back to the coordinator for context. */
  raw: string
  /** The line with the price token (and its punctuation) stripped out. */
  productName: string
  /** null when no price-looking token was found on the line. */
  price: number | null
}

// Requires either a currency symbol or a two-decimal-place amount, so bare
// numbers that are actually part of a product name (a style code, a size)
// don't get misread as a price.
const PRICE_PATTERN = /(?:AUD|USD|NZD)?\s*\$\s*(\d{1,5}(?:\.\d{2})?)|(\d{1,5}\.\d{2})\s*(?:AUD|USD|NZD)?/gi

const HEADER_WORDS = new Set(['product', 'products', 'item', 'items', 'description', 'price', 'qty', 'quantity'])

// Priceless lines that read as email chrome (greeting/sign-off/instruction),
// not a product — e.g. "Hi team," or "Please set up the following:".
const CHROME_PATTERN = /^(hi|hello|hey|thanks|thank you|regards|cheers|best|kind regards|dear|please)\b/i

function extractPrice(line: string): { price: number | null; withoutPrice: string } {
  const matches = [...line.matchAll(PRICE_PATTERN)]
  if (matches.length === 0) {
    return { price: null, withoutPrice: line }
  }
  // The trailing amount is almost always the price ("Club Polo (Adults) - $45.00").
  const match = matches[matches.length - 1]
  const value = Number(match[1] ?? match[2])
  const withoutPrice = (line.slice(0, match.index) + line.slice(match.index! + match[0].length))
    // trim connecting punctuation left behind, e.g. "Club Polo -" or "Club Polo:"
    .replace(/[-–:|,]+\s*$/, '')
    .trim()
  return { price: Number.isFinite(value) ? value : null, withoutPrice }
}

/** Parses free-form brief text into one candidate line per product. */
export function parseBrief(text: string): ParsedBriefLine[] {
  const lines = text.split(/\r?\n/)
  const results: ParsedBriefLine[] = []

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    const { price, withoutPrice } = extractPrice(trimmed)
    const productName = withoutPrice.replace(/^[-•*\d.)\s]+/, '').trim()
    if (!productName) continue

    // Skip obvious table headers / section labels ("Product", "Price",
    // "Product List:", ...) — a priceless line ending in ":" is a section
    // label, not an item; a priceless single header word is a column title.
    const normalized = productName.toLowerCase().replace(/[^a-z]/g, '')
    if (HEADER_WORDS.has(normalized)) continue
    if (price === null && /:$/.test(productName)) continue
    if (price === null && CHROME_PATTERN.test(productName)) continue

    results.push({ raw: trimmed, productName, price })
  }

  return results
}

// ---------------------------------------------------------------------------
// Self-test block, included in `npm run test:import`.
// ---------------------------------------------------------------------------

interface BriefParserAssertion {
  description: string
  actual: unknown
  expected: unknown
}

export function runBriefParserAssertions(): BriefParserAssertion[] {
  const sample = [
    'Product List:',
    'Club Polo (Adults) - $45.00',
    'Club Hoodie (Kids) - $38.50',
    'Training Tee    32.00',
    'Playing Pants',
    '',
    'Price',
  ].join('\n')

  const parsed = parseBrief(sample)

  return [
    { description: 'Skips the "Product List:" header line', actual: parsed.some((l) => l.productName === 'Product List:'), expected: false },
    { description: 'Skips the bare "Price" header line', actual: parsed.some((l) => l.productName.toLowerCase() === 'price'), expected: false },
    { description: 'Parses 4 real product lines', actual: parsed.length, expected: 4 },
    {
      description: 'Club Polo name has price stripped, price = 45',
      actual: parsed.find((l) => l.productName.startsWith('Club Polo')),
      expected: { raw: 'Club Polo (Adults) - $45.00', productName: 'Club Polo (Adults)', price: 45 },
    },
    {
      description: 'Training Tee: decimal-only price (no $) still detected',
      actual: parsed.find((l) => l.productName === 'Training Tee')?.price,
      expected: 32,
    },
    {
      description: 'Playing Pants: no price token -> price is null',
      actual: parsed.find((l) => l.productName === 'Playing Pants')?.price,
      expected: null,
    },
  ]
}
