/**
 * Single source of truth for size label -> size code mapping.
 * The SKU engine and CSV export must both read from here — never hardcode
 * a size code anywhere else.
 */

export type SizeTemplateKey = 'kids' | 'adults' | 'socks' | 'osfa'

export interface SizeDef {
  label: string
  code: string
}

export const SIZE_TEMPLATES: Record<SizeTemplateKey, SizeDef[]> = {
  kids: [
    { label: 'Age 5-6', code: '56' },
    { label: 'Age 7-8', code: '78' },
    { label: 'Age 9-10', code: '910' },
    { label: 'Age 10-11', code: '1011' },
    { label: 'Age 13', code: '13' },
  ],
  adults: [
    { label: 'Small', code: 'S' },
    { label: 'Medium', code: 'M' },
    { label: 'Large', code: 'L' },
    { label: 'X-Large', code: 'XL' },
    { label: '2X-Large', code: '2XL' },
    { label: '3X-Large', code: '3XL' },
    { label: '4X-Large', code: '4XL' },
    { label: '5X-Large', code: '5XL' },
    { label: '6X-Large', code: '6XL' },
  ],
  socks: [
    { label: '11-2', code: '112' },
    { label: '2-4', code: '24' },
    { label: '4-7', code: '47' },
    { label: '7-9', code: '79' },
    { label: '9-12', code: '912' },
    { label: '12-15', code: '1215' },
  ],
  osfa: [{ label: 'OSFA', code: 'OS' }],
}

export const SIZE_TEMPLATE_LABELS: Record<SizeTemplateKey, string> = {
  kids: 'Kids',
  adults: 'Adults',
  socks: 'Socks',
  osfa: 'One Size',
}

/** Returns the ordered list of size defs for a template key. */
export function getSizeDefs(template: SizeTemplateKey): SizeDef[] {
  return SIZE_TEMPLATES[template]
}

/**
 * The full set of sizes a garment CAN offer, given its size template and
 * which age brackets it's available in at all (allowKids/allowAdults are a
 * garment-level capability — e.g. a cap is never offered in kids sizing).
 * This is the checklist a coordinator picks specific sizes from per club;
 * it is not itself a selection.
 */
export function getAvailableSizes(
  template: SizeTemplateKey,
  allowKids: boolean,
  allowAdults: boolean,
): SizeDef[] {
  if (template === 'socks' || template === 'osfa') {
    return getSizeDefs(template)
  }
  if (template === 'kids') {
    return allowKids ? getSizeDefs('kids') : []
  }
  // template === 'adults'
  return [
    ...(allowAdults ? getSizeDefs('adults') : []),
    ...(allowKids ? getSizeDefs('kids') : []),
  ]
}

/** Which age group a size code belongs to, by looking it up in the tables above. */
export function ageGroupForSizeCode(code: string): 'adults' | 'kids' | null {
  if (SIZE_TEMPLATES.adults.some((s) => s.code === code)) return 'adults'
  if (SIZE_TEMPLATES.kids.some((s) => s.code === code)) return 'kids'
  return null
}

/**
 * "all" means a garment's sizes aren't split by age at all (socks,
 * headwear) — a single product covers everyone. "adults"/"kids" become
 * separate products, since real-world pricing (and the parent SKU's
 * ADLT/KIDS segment) differs per age group.
 */
export type AgeGroup = 'adults' | 'kids' | 'all'

/** A garment's size list for one age group, e.g. all its selected adult sizes. */
export interface SizeGroup {
  ageGroup: AgeGroup
  sizes: SizeDef[]
}

/**
 * Groups a club's selected size codes into the product(s) they become.
 * Codes are classified purely by which table they belong to — adult-table
 * codes become an "Adults" product, kids-table codes a "Kids" product, and
 * anything else (socks, OSFA) collapses into a single "all" product, since
 * those aren't split by age.
 */
export function resolveGarmentSizeGroups(selectedSizeCodes: string[]): SizeGroup[] {
  const selected = new Set(selectedSizeCodes)
  // Filter each canonical list (rather than iterating selectedSizeCodes) so
  // sizes always display in the standard S/M/L/... order regardless of the
  // order they were ticked in.
  const adults = SIZE_TEMPLATES.adults.filter((s) => selected.has(s.code))
  const kids = SIZE_TEMPLATES.kids.filter((s) => selected.has(s.code))
  const other = [...SIZE_TEMPLATES.socks, ...SIZE_TEMPLATES.osfa].filter((s) => selected.has(s.code))

  const groups: SizeGroup[] = []
  if (adults.length > 0) groups.push({ ageGroup: 'adults', sizes: adults })
  if (kids.length > 0) groups.push({ ageGroup: 'kids', sizes: kids })
  if (other.length > 0) groups.push({ ageGroup: 'all', sizes: other })
  return groups
}
