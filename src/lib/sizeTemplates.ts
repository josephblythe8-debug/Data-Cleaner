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
 * Resolves the full set of sizes a garment offers given whether kids/adults
 * are enabled for that garment in the current store project.
 *
 * - "socks" and "osfa" are flat, self-contained runs (a sock size run
 *   already spans kid-to-adult feet, and OSFA is one size for everyone),
 *   so they ignore the kids/adults toggles entirely.
 * - "adults" is the general apparel template: most apparel (polos, tees,
 *   shorts, etc.) is cut in both a kids run and an adults run from the
 *   same garment, so both toggles apply and the result is the union.
 * - "kids" is a kids-only garment; the adults toggle has no effect since
 *   there is no adult size list attached to it.
 */
export function resolveGarmentSizes(
  template: SizeTemplateKey,
  includeKids: boolean,
  includeAdults: boolean,
): SizeDef[] {
  if (template === 'socks' || template === 'osfa') {
    return getSizeDefs(template)
  }
  if (template === 'kids') {
    return includeKids ? getSizeDefs('kids') : []
  }
  // template === 'adults'
  return [
    ...(includeAdults ? getSizeDefs('adults') : []),
    ...(includeKids ? getSizeDefs('kids') : []),
  ]
}
