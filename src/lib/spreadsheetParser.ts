/**
 * Spreadsheet parser — pure, side-effect-free.
 *
 * Takes an already-parsed SheetJS workbook (uploaded Excel/CSV file — see
 * ImportBriefDialog.tsx, which owns reading the file itself) and pulls out
 * one candidate product line per row: a product name and, if present, a
 * price. Mirrors briefParser.ts's ParsedBriefLine shape exactly, so the
 * output feeds straight into garmentMatcher.ts either way — a brief is a
 * brief, whether it arrived as an email or a spreadsheet.
 *
 * Cells are read as their real parsed type (SheetJS keeps numbers as
 * numbers), so a price cell is found by type rather than by regex — more
 * reliable than the text parser for a plain "45" cell with no currency
 * symbol or decimals, which free-text parsing would miss.
 */
import type { WorkBook } from 'xlsx'
import { utils } from 'xlsx'
import { HEADER_WORDS, isNonProductLine, type ParsedBriefLine } from './briefParser'

type Cell = string | number | boolean | null | undefined

function isPriceLike(value: Cell): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 100000
}

/** True when every cell in the row is a column heading, e.g. ["Product", "Price"]. */
function isHeaderRow(cells: Cell[]): boolean {
  return cells.every((c) => HEADER_WORDS.has(String(c).toLowerCase().replace(/[^a-z]/g, '')))
}

/** Parses every sheet in a workbook into candidate product lines. */
export function parseSpreadsheet(workbook: WorkBook): ParsedBriefLine[] {
  const results: ParsedBriefLine[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue
    const rows = utils.sheet_to_json<Cell[]>(sheet, { header: 1, blankrows: false })

    for (const row of rows) {
      const cells = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== '')
      if (cells.length === 0) continue
      if (isHeaderRow(cells)) continue

      // The rightmost numeric cell is almost always the price (a row is
      // typically "Name ... Qty ... Price", and price is what's asked
      // last) — same trailing-value heuristic briefParser.ts uses for text.
      let priceIndex = -1
      for (let i = cells.length - 1; i >= 0; i--) {
        if (isPriceLike(cells[i])) {
          priceIndex = i
          break
        }
      }
      const price = priceIndex >= 0 ? (cells[priceIndex] as number) : null
      const nameCells = cells.filter((_, i) => i !== priceIndex)
      const productName = nameCells.map((c) => String(c).trim()).join(' ').trim()
      if (!productName) continue

      if (isNonProductLine(productName, price !== null)) continue

      results.push({ raw: cells.map((c) => String(c)).join(' | '), productName, price })
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// Self-test block, included in `npm run test:import`.
// ---------------------------------------------------------------------------

interface SpreadsheetParserAssertion {
  description: string
  actual: unknown
  expected: unknown
}

export function runSpreadsheetParserAssertions(): SpreadsheetParserAssertion[] {
  const sheet = utils.aoa_to_sheet([
    ['Product', 'Price'],
    ['Club Polo (Adults)', 45],
    ['Club Hoodie (Kids)', 38.5],
    ['Training Tee', 32],
    ['Playing Pants', null],
  ])
  const workbook: WorkBook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: sheet } }

  const parsed = parseSpreadsheet(workbook)

  return [
    { description: 'Skips the "Product / Price" header row', actual: parsed.some((l) => l.productName === 'Product'), expected: false },
    { description: 'Parses 4 real product rows', actual: parsed.length, expected: 4 },
    {
      description: 'Club Polo: name text cell + numeric price cell (no $, no decimals) both found',
      actual: parsed.find((l) => l.productName === 'Club Polo (Adults)')?.price,
      expected: 45,
    },
    {
      description: 'Club Hoodie: decimal price cell read correctly',
      actual: parsed.find((l) => l.productName === 'Club Hoodie (Kids)')?.price,
      expected: 38.5,
    },
    {
      description: 'Playing Pants: no price cell -> price is null',
      actual: parsed.find((l) => l.productName === 'Playing Pants')?.price,
      expected: null,
    },
  ]
}
