/**
 * Blueprint engine — turns a blueprint (a reusable product pack) into the
 * configured-garment rows for a fresh store project, and supports cloning
 * an existing club's garment configuration onto a new club.
 */
import type { Blueprint, BlueprintGarment, ConfiguredGarment, Garment, StoreGarment } from './types'

/** Generates a fresh id. Swappable — Supabase mode will use DB-issued ids instead. */
function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

/**
 * Builds the store_garments rows for a brand new project from a blueprint,
 * defaulting include_kids/include_adults from the garment's allow flags.
 */
export function applyBlueprint(
  projectId: string,
  blueprint: Blueprint,
  blueprintGarments: BlueprintGarment[],
  garmentsById: Map<string, Garment>,
): StoreGarment[] {
  const rows = blueprintGarments
    .filter((bg) => bg.blueprintId === blueprint.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return rows
    .map((bg) => garmentsById.get(bg.garmentId))
    .filter((g): g is Garment => Boolean(g))
    .map((garment, index) => ({
      id: generateId('sg'),
      projectId,
      garmentId: garment.id,
      customName: null,
      includeKids: garment.allowKids,
      includeAdults: garment.allowAdults,
      sortOrder: index,
    }))
}

/**
 * Clones another club's garment configuration onto a new project. SKUs are
 * never copied verbatim — they are always regenerated later against the new
 * club code by the SKU engine, since a store_garment row carries no SKU of
 * its own (SKUs are derived at generation time).
 */
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
      includeKids: cg.includeKids,
      includeAdults: cg.includeAdults,
      sortOrder: index,
    }))
}

export { generateId }
