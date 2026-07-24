/**
 * Catalogue parser — pure, side-effect-free.
 *
 * Parses a supplier product-list export (ClubHub's Range Code / Range Name
 * / Style Code / Style Name / Sort Order columns) into rows ready to
 * bulk-populate the Garment Library. ClubHub's export has no Category or
 * Kids/Adults columns, so both are inferred from the Style Name — see
 * inferCategory below — and shown for review before anything is saved
 * (CatalogueImportDialog.tsx), never silently trusted.
 */
import type { WorkBook } from 'xlsx'
import { utils } from 'xlsx'
import type { SizeTemplateKey } from './sizeTemplates'

export interface ParsedCatalogueRow {
  rangeCode: string
  rangeName: string
  styleCode: string
  styleName: string
  sortOrder: number
  category: string
  sizeTemplate: SizeTemplateKey
  allowKids: boolean
  allowAdults: boolean
}

type Cell = string | number | boolean | null | undefined

const HEADER_ALIASES: Record<'rangeCode' | 'rangeName' | 'styleCode' | 'styleName' | 'sortOrder', string[]> = {
  rangeCode: ['range code', 'rangecode'],
  rangeName: ['range name', 'rangename'],
  styleCode: ['style code', 'stylecode'],
  styleName: ['style name', 'stylename', 'description'],
  sortOrder: ['sort order', 'sortorder'],
}

function normalizeHeader(h: Cell): string {
  return String(h ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function findColumn(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(h))
}

// Longest/most-specific term first, so e.g. "Polo Shirt" matches Polo, not
// the generic Shirt rule further down the list.
const CATEGORY_RULES: [RegExp, string][] = [
  [/\bplaying\s?shirt\b/i, 'Playing Shirt'],
  [/\bpolo\b/i, 'Polo'],
  [/\bhoodie|hoody\b/i, 'Hoodie'],
  [/\bjacket\b/i, 'Jacket'],
  [/\bvest\b/i, 'Vest'],
  [/\bskort\b/i, 'Skort'],
  [/\bdress\b/i, 'Dress'],
  [/\btracksuit|track\s?pant\b/i, 'Tracksuit'],
  [/\bshort\b/i, 'Shorts'],
  [/\bpant\b|\btrouser\b/i, 'Pants'],
  [/\bsock\b/i, 'Socks'],
  [/\bcap\b|\bbeanie\b|\bhat\b|\bbucket\b/i, 'Headwear'],
  [/\bt-?shirt\b|\btee\b/i, 'Tee'],
  [/\bshirt\b/i, 'Shirt'],
]

/** Every category the inference rules know about, plus the catch-all — for populating a picker. */
export const KNOWN_CATEGORIES = [...new Set(CATEGORY_RULES.map(([, category]) => category)), 'Uncategorised']

/** Best-guess category from a style name — always reviewable before import commits. */
export function inferCategory(styleName: string): string {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(styleName)) return category
  }
  return 'Uncategorised'
}

/** Best-guess sizing for an inferred category — ClubHub's export has no age-group data at all. */
export function inferSizing(category: string): { sizeTemplate: SizeTemplateKey; allowKids: boolean; allowAdults: boolean } {
  if (category === 'Headwear') return { sizeTemplate: 'osfa', allowKids: false, allowAdults: true }
  if (category === 'Socks') return { sizeTemplate: 'socks', allowKids: true, allowAdults: true }
  return { sizeTemplate: 'adults', allowKids: true, allowAdults: true }
}

/** Parses the first sheet of a catalogue workbook. Throws if required columns aren't found. */
export function parseCatalogue(workbook: WorkBook): ParsedCatalogueRow[] {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) return []
  const rows = utils.sheet_to_json<Cell[]>(sheet, { header: 1, blankrows: false })
  if (rows.length === 0) return []

  const headers = rows[0].map(normalizeHeader)
  const rangeCodeIdx = findColumn(headers, HEADER_ALIASES.rangeCode)
  const rangeNameIdx = findColumn(headers, HEADER_ALIASES.rangeName)
  const styleCodeIdx = findColumn(headers, HEADER_ALIASES.styleCode)
  const styleNameIdx = findColumn(headers, HEADER_ALIASES.styleName)
  const sortOrderIdx = findColumn(headers, HEADER_ALIASES.sortOrder)

  if (rangeCodeIdx === -1 || styleCodeIdx === -1 || styleNameIdx === -1) {
    throw new Error('Missing required columns — expected "Range Code", "Style Code" and "Style Name".')
  }

  const results: ParsedCatalogueRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const rangeCode = String(row[rangeCodeIdx] ?? '').trim()
    const styleCode = String(row[styleCodeIdx] ?? '').trim()
    const styleName = String(row[styleNameIdx] ?? '').trim()
    if (!rangeCode || !styleCode || !styleName) continue

    const rangeName = rangeNameIdx !== -1 ? String(row[rangeNameIdx] ?? '').trim() : ''
    const sortOrderCell = sortOrderIdx !== -1 ? row[sortOrderIdx] : undefined
    const sortOrder = typeof sortOrderCell === 'number' ? sortOrderCell : i

    const category = inferCategory(styleName)
    results.push({ rangeCode, rangeName, styleCode, styleName, sortOrder, category, ...inferSizing(category) })
  }

  return results
}

// ---------------------------------------------------------------------------
// Self-test block, included in `npm run test:catalogue`.
// ---------------------------------------------------------------------------

interface CatalogueParserAssertion {
  description: string
  actual: unknown
  expected: unknown
}

export function runCatalogueParserAssertions(): CatalogueParserAssertion[] {
  const sheet = utils.aoa_to_sheet([
    ['Range Code', 'Range Name', 'Style Code', 'Style Name', 'Sort Order'],
    ['LINC', 'Lincoln', '061', 'Kids Panelled Polo', 1],
    ['LINC', 'Lincoln', '112', 'Pullover Hoodie', 2],
    ['LINC', 'Lincoln', '400', 'Sports Bucket Hat', 3],
    ['LINC', 'Lincoln', '410', 'Performance Sports Sock', 4],
    ['LINC', 'Lincoln', '999', '', 5], // blank style name -> skipped
  ])
  const workbook: WorkBook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: sheet } }
  const parsed = parseCatalogue(workbook)

  const upperCaseHeaderSheet = utils.aoa_to_sheet([
    ['RANGE CODE', 'STYLE CODE', 'STYLE NAME'],
    ['TEAM', '327', 'SS Playing Shirt'],
  ])
  const upperCaseWorkbook: WorkBook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: upperCaseHeaderSheet } }
  const parsedUpperCase = parseCatalogue(upperCaseWorkbook)

  return [
    { description: 'Skips the row with a blank Style Name', actual: parsed.length, expected: 4 },
    { description: '"Kids Panelled Polo" infers category Polo', actual: parsed[0].category, expected: 'Polo' },
    { description: '"Pullover Hoodie" infers category Hoodie', actual: parsed[1].category, expected: 'Hoodie' },
    {
      description: '"Sports Bucket Hat" infers Headwear -> osfa, adults only, no kids',
      actual: { category: parsed[2].category, sizeTemplate: parsed[2].sizeTemplate, allowKids: parsed[2].allowKids },
      expected: { category: 'Headwear', sizeTemplate: 'osfa', allowKids: false },
    },
    {
      description: '"Performance Sports Sock" infers Socks -> socks template',
      actual: { category: parsed[3].category, sizeTemplate: parsed[3].sizeTemplate },
      expected: { category: 'Socks', sizeTemplate: 'socks' },
    },
    {
      description: 'Header matching tolerates ALL CAPS headers and a missing Range Name column',
      actual: parsedUpperCase.length === 1 && parsedUpperCase[0].category === 'Playing Shirt' && parsedUpperCase[0].rangeName === '',
      expected: true,
    },
  ]
}
