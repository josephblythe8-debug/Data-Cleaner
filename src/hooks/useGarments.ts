import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { MOCK_MODE } from '@/lib/config'
import { generateId, getDb, mutate, subscribe } from '@/lib/dataStore'
import { supabase } from '@/lib/supabaseClient'
import type { SizeTemplateKey } from '@/lib/sizeTemplates'
import type { Garment } from '@/lib/types'

export interface GarmentInput {
  name: string
  rangeCode: string
  rangeName: string
  styleCode: string
  category: string
  sizeTemplate: SizeTemplateKey
  allowKids: boolean
  allowAdults: boolean
}

/** One row from a parsed supplier catalogue export, ready to create or update a Garment. */
export interface CatalogueImportRow {
  rangeCode: string
  rangeName: string
  styleCode: string
  styleName: string
  category: string
  sizeTemplate: SizeTemplateKey
  allowKids: boolean
  allowAdults: boolean
}

export interface CatalogueImportResult {
  created: number
  updated: number
}

function mockSnapshot() {
  return getDb().garments
}

function fromRow(row: {
  id: string
  name: string
  range_code: string
  range_name: string | null
  style_code: string
  category: string
  size_template: SizeTemplateKey
  allow_kids: boolean
  allow_adults: boolean
  active: boolean
}): Garment {
  return {
    id: row.id,
    name: row.name,
    rangeCode: row.range_code,
    rangeName: row.range_name ?? '',
    styleCode: row.style_code,
    category: row.category,
    sizeTemplate: row.size_template,
    allowKids: row.allow_kids,
    allowAdults: row.allow_adults,
    active: row.active,
  }
}

export function useGarments() {
  const mockGarments = useSyncExternalStore(subscribe, mockSnapshot, mockSnapshot)
  const [remoteGarments, setRemoteGarments] = useState<Garment[]>([])
  const [loading, setLoading] = useState(!MOCK_MODE)

  const refetch = useCallback(async () => {
    if (MOCK_MODE) return
    setLoading(true)
    const { data, error } = await supabase!.from('garments').select('*').order('name')
    if (!error && data) setRemoteGarments(data.map(fromRow))
    setLoading(false)
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const addGarment = useCallback(
    async (input: GarmentInput): Promise<Garment> => {
      if (MOCK_MODE) {
        const garment: Garment = { id: generateId('garment'), active: true, ...input }
        mutate((db) => {
          db.garments = [...db.garments, garment]
        })
        return garment
      }
      const { data, error } = await supabase!
        .from('garments')
        .insert({
          name: input.name,
          range_code: input.rangeCode,
          range_name: input.rangeName,
          style_code: input.styleCode,
          category: input.category,
          size_template: input.sizeTemplate,
          allow_kids: input.allowKids,
          allow_adults: input.allowAdults,
          active: true,
        })
        .select()
        .single()
      if (error) throw error
      const garment = fromRow(data)
      await refetch()
      return garment
    },
    [refetch],
  )

  const updateGarment = useCallback(
    async (id: string, patch: Partial<GarmentInput>) => {
      if (MOCK_MODE) {
        mutate((db) => {
          db.garments = db.garments.map((g) => (g.id === id ? { ...g, ...patch } : g))
        })
        return
      }
      const { error } = await supabase!
        .from('garments')
        .update({
          ...(patch.name !== undefined && { name: patch.name }),
          ...(patch.rangeCode !== undefined && { range_code: patch.rangeCode }),
          ...(patch.rangeName !== undefined && { range_name: patch.rangeName }),
          ...(patch.styleCode !== undefined && { style_code: patch.styleCode }),
          ...(patch.category !== undefined && { category: patch.category }),
          ...(patch.sizeTemplate !== undefined && { size_template: patch.sizeTemplate }),
          ...(patch.allowKids !== undefined && { allow_kids: patch.allowKids }),
          ...(patch.allowAdults !== undefined && { allow_adults: patch.allowAdults }),
        })
        .eq('id', id)
      if (error) throw error
      await refetch()
    },
    [refetch],
  )

  /**
   * Bulk-creates/updates garments from a parsed supplier catalogue export,
   * keyed on (Range Code, Style Code) — the supplier's own unique key.
   * Re-importing the same file updates the name/range name of garments
   * that already exist rather than duplicating them, but deliberately
   * leaves category/sizing alone on an existing match, since a coordinator
   * may have already corrected an inference-based guess by hand.
   */
  const importCatalogue = useCallback(
    async (rows: CatalogueImportRow[]): Promise<CatalogueImportResult> => {
      const currentGarments = MOCK_MODE ? getDb().garments : remoteGarments
      const keyOf = (rangeCode: string, styleCode: string) =>
        `${rangeCode.trim().toUpperCase()}|${styleCode.trim().toUpperCase()}`
      const existingByKey = new Map(currentGarments.map((g) => [keyOf(g.rangeCode, g.styleCode), g]))

      let created = 0
      let updated = 0

      if (MOCK_MODE) {
        mutate((db) => {
          let next = db.garments
          for (const row of rows) {
            const key = keyOf(row.rangeCode, row.styleCode)
            const existing = existingByKey.get(key)
            if (existing) {
              next = next.map((g) =>
                g.id === existing.id ? { ...g, name: row.styleName, rangeName: row.rangeName } : g,
              )
              updated++
            } else {
              const garment: Garment = {
                id: generateId('garment'),
                name: row.styleName,
                rangeCode: row.rangeCode,
                rangeName: row.rangeName,
                styleCode: row.styleCode,
                category: row.category,
                sizeTemplate: row.sizeTemplate,
                allowKids: row.allowKids,
                allowAdults: row.allowAdults,
                active: true,
              }
              next = [...next, garment]
              existingByKey.set(key, garment)
              created++
            }
          }
          db.garments = next
        })
        return { created, updated }
      }

      for (const row of rows) {
        const key = keyOf(row.rangeCode, row.styleCode)
        const existing = existingByKey.get(key)
        if (existing) {
          const { error } = await supabase!
            .from('garments')
            .update({ name: row.styleName, range_name: row.rangeName })
            .eq('id', existing.id)
          if (error) throw error
          updated++
        } else {
          const { error } = await supabase!.from('garments').insert({
            name: row.styleName,
            range_code: row.rangeCode,
            range_name: row.rangeName,
            style_code: row.styleCode,
            category: row.category,
            size_template: row.sizeTemplate,
            allow_kids: row.allowKids,
            allow_adults: row.allowAdults,
            active: true,
          })
          if (error) throw error
          created++
        }
      }
      await refetch()
      return { created, updated }
    },
    [remoteGarments, refetch],
  )

  const setArchived = useCallback(
    async (id: string, active: boolean) => {
      if (MOCK_MODE) {
        mutate((db) => {
          db.garments = db.garments.map((g) => (g.id === id ? { ...g, active } : g))
        })
        return
      }
      const { error } = await supabase!.from('garments').update({ active }).eq('id', id)
      if (error) throw error
      await refetch()
    },
    [refetch],
  )

  return {
    garments: MOCK_MODE ? mockGarments : remoteGarments,
    loading: MOCK_MODE ? false : loading,
    addGarment,
    updateGarment,
    importCatalogue,
    archiveGarment: (id: string) => setArchived(id, false),
    unarchiveGarment: (id: string) => setArchived(id, true),
  }
}
