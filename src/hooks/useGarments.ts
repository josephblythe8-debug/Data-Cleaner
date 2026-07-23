import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { MOCK_MODE } from '@/lib/config'
import { generateId, getDb, mutate, subscribe } from '@/lib/dataStore'
import { supabase } from '@/lib/supabaseClient'
import type { SizeTemplateKey } from '@/lib/sizeTemplates'
import type { Garment } from '@/lib/types'

export interface GarmentInput {
  name: string
  rangeCode: string
  styleCode: string
  /** Derived from `colours` via buildColourCode() — never typed by hand. */
  colourCode: string
  colours: string[]
  category: string
  sizeTemplate: SizeTemplateKey
  allowKids: boolean
  allowAdults: boolean
}

function mockSnapshot() {
  return getDb().garments
}

function fromRow(row: {
  id: string
  name: string
  range_code: string
  style_code: string
  colour_code: string
  colours: string[] | null
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
    styleCode: row.style_code,
    colourCode: row.colour_code,
    colours: row.colours ?? [],
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
          style_code: input.styleCode,
          colour_code: input.colourCode,
          colours: input.colours,
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
          ...(patch.styleCode !== undefined && { style_code: patch.styleCode }),
          ...(patch.colourCode !== undefined && { colour_code: patch.colourCode }),
          ...(patch.colours !== undefined && { colours: patch.colours }),
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
    archiveGarment: (id: string) => setArchived(id, false),
    unarchiveGarment: (id: string) => setArchived(id, true),
  }
}
