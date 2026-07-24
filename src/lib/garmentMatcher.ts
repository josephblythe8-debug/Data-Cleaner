/**
 * Garment matcher — pure, side-effect-free.
 *
 * Matches parsed brief lines (a product name typed by a sales rep, in
 * whatever wording they used) against the Garment Library, so an imported
 * brief can be turned into store garments automatically. Anything that
 * doesn't clear the confidence threshold is left unmatched and flagged
 * for the coordinator, rather than guessed.
 */
import type { ParsedBriefLine } from './briefParser'

export interface MatchableGarment {
  id: string
  name: string
}

export interface MatchedBriefLine extends ParsedBriefLine {
  garmentId: string | null
  /** 0–1. Only set (and garmentId only populated) when this clears MATCH_THRESHOLD. */
  confidence: number
}

const AGE_GENDER_QUALIFIER = /\((?:adults?|kids?|junior|juniors|youths?|men'?s|ladies|women'?s|mens|womens)\)/gi

/** Lowercase, strip age/gender qualifiers and punctuation, collapse whitespace. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(AGE_GENDER_QUALIFIER, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Jaccard token overlap, with a boost for exact/substring matches. */
function similarity(a: string, b: string): number {
  const normA = normalize(a)
  const normB = normalize(b)
  if (!normA || !normB) return 0
  if (normA === normB) return 1
  if (normA.includes(normB) || normB.includes(normA)) return 0.85

  const tokensA = new Set(normA.split(' '))
  const tokensB = new Set(normB.split(' '))
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length
  const union = new Set([...tokensA, ...tokensB]).size
  return union === 0 ? 0 : intersection / union
}

export const MATCH_THRESHOLD = 0.5

/** Matches each parsed line against the best-scoring garment, if any clears the threshold. */
export function matchBriefLines(
  lines: ParsedBriefLine[],
  garments: MatchableGarment[],
): MatchedBriefLine[] {
  return lines.map((line) => {
    let best: { garment: MatchableGarment; score: number } | null = null
    for (const garment of garments) {
      const score = similarity(line.productName, garment.name)
      if (!best || score > best.score) best = { garment, score }
    }
    if (best && best.score >= MATCH_THRESHOLD) {
      return { ...line, garmentId: best.garment.id, confidence: best.score }
    }
    return { ...line, garmentId: null, confidence: 0 }
  })
}

// ---------------------------------------------------------------------------
// Self-test block, included in `npm run test:import`.
// ---------------------------------------------------------------------------

interface MatcherAssertion {
  description: string
  actual: unknown
  expected: unknown
}

export function runMatcherAssertions(): MatcherAssertion[] {
  const garments: MatchableGarment[] = [
    { id: 'g1', name: 'Club Polo' },
    { id: 'g2', name: 'Training Tee' },
    { id: 'g3', name: 'Playing Shirt SS' },
  ]

  const lines: ParsedBriefLine[] = [
    { raw: '', productName: 'Club Polo (Adults)', price: 45 },
    { raw: '', productName: 'club polo', price: null },
    { raw: '', productName: 'SS Playing Shirt', price: 60 },
    { raw: '', productName: 'Deluxe Winter Jacket XL', price: 90 },
  ]

  const results = matchBriefLines(lines, garments)

  return [
    {
      description: '"Club Polo (Adults)" matches Club Polo despite the qualifier',
      actual: results[0].garmentId,
      expected: 'g1',
    },
    {
      description: 'Case-insensitive exact match',
      actual: results[1].garmentId,
      expected: 'g1',
    },
    {
      description: 'Same words in a different order still matches Playing Shirt SS',
      actual: results[2].garmentId,
      expected: 'g3',
    },
    {
      description: 'Unrelated product is flagged unmatched, not guessed',
      actual: results[3].garmentId,
      expected: null,
    },
  ]
}
