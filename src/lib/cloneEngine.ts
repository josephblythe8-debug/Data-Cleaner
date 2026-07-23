/**
 * Clones another club's garment configuration (including its chosen
 * colours and sizes) onto a new project. SKUs are never copied verbatim —
 * colour_code is always derived fresh at generation time from colours +
 * the colour library and the new club's code, so cloning "regenerates"
 * automatically with no special-case logic needed.
 */
import type { ConfiguredGarment, StoreGarment } from './types'

/** Generates a fresh id. Swappable — Supabase mode will use DB-issued ids instead. */
function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

export function cloneStoreGarments(
  targetProjectId: string,
  sourceConfiguredGarments: ConfiguredGarment[],
): StoreGarment[] {
  return [...sourceConfiguredGarments]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((cg, index) => ({
      id: generateId('sg'),
      projectId: targetProjectId,
      garmentId: cg.garmentId,
      customName: cg.customName,
      colours: cg.colours,
      selectedSizeCodes: cg.selectedSizeCodes,
      sortOrder: index,
    }))
}

export { generateId }
