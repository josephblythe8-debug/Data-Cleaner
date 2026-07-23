/**
 * In-memory data store for MOCK_MODE. A tiny pub/sub store so React hooks
 * can subscribe and re-render on mutation, without any external state
 * library. Phase 2 swaps the hooks that read this for ones backed by
 * Supabase, behind the same hook interface (useGarments, useClubs, etc.).
 */
import {
  seedBlueprintGarments,
  seedBlueprints,
  seedClubs,
  seedColourNames,
  seedGarments,
  seedStoreGarments,
  seedStoreProjects,
} from './mockData'
import type {
  Blueprint,
  BlueprintGarment,
  Club,
  ColourName,
  Garment,
  StoreGarment,
  StoreProject,
} from './types'

interface Db {
  clubs: Club[]
  garments: Garment[]
  colourNames: ColourName[]
  blueprints: Blueprint[]
  blueprintGarments: BlueprintGarment[]
  storeProjects: StoreProject[]
  storeGarments: StoreGarment[]
}

function cloneSeed(): Db {
  return {
    clubs: structuredClone(seedClubs),
    garments: structuredClone(seedGarments),
    colourNames: structuredClone(seedColourNames),
    blueprints: structuredClone(seedBlueprints),
    blueprintGarments: structuredClone(seedBlueprintGarments),
    storeProjects: structuredClone(seedStoreProjects),
    storeGarments: structuredClone(seedStoreGarments),
  }
}

let db: Db = cloneSeed()

type Listener = () => void
const listeners = new Set<Listener>()

function notify() {
  for (const listener of listeners) listener()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getDb(): Db {
  return db
}

export function resetDb() {
  db = cloneSeed()
  notify()
}

export function mutate(fn: (draft: Db) => void) {
  fn(db)
  notify()
}

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}
