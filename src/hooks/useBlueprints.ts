import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { MOCK_MODE } from '@/lib/config'
import { generateId, getDb, mutate, subscribe } from '@/lib/dataStore'
import { supabase } from '@/lib/supabaseClient'
import type { Blueprint, BlueprintGarment } from '@/lib/types'

export interface BlueprintInput {
  name: string
  sport: string
}

function blueprintsSnapshot() {
  return getDb().blueprints
}

function blueprintGarmentsSnapshot() {
  return getDb().blueprintGarments
}

export function useBlueprints() {
  const mockBlueprints = useSyncExternalStore(subscribe, blueprintsSnapshot, blueprintsSnapshot)
  const mockBlueprintGarments = useSyncExternalStore(
    subscribe,
    blueprintGarmentsSnapshot,
    blueprintGarmentsSnapshot,
  )
  const [remoteBlueprints, setRemoteBlueprints] = useState<Blueprint[]>([])
  const [remoteBlueprintGarments, setRemoteBlueprintGarments] = useState<BlueprintGarment[]>([])
  const [loading, setLoading] = useState(!MOCK_MODE)

  const refetch = useCallback(async () => {
    if (MOCK_MODE) return
    setLoading(true)
    const [{ data: bps, error: e1 }, { data: bgs, error: e2 }] = await Promise.all([
      supabase!.from('blueprints').select('*').order('created_at'),
      supabase!.from('blueprint_garments').select('*').order('sort_order'),
    ])
    if (!e1 && bps) {
      setRemoteBlueprints(
        bps.map((b) => ({ id: b.id, name: b.name, sport: b.sport, createdAt: b.created_at })),
      )
    }
    if (!e2 && bgs) {
      setRemoteBlueprintGarments(
        bgs.map((bg) => ({
          id: bg.id,
          blueprintId: bg.blueprint_id,
          garmentId: bg.garment_id,
          sortOrder: bg.sort_order,
        })),
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const blueprints = MOCK_MODE ? mockBlueprints : remoteBlueprints
  const blueprintGarments = MOCK_MODE ? mockBlueprintGarments : remoteBlueprintGarments

  const createBlueprint = useCallback(
    async (input: BlueprintInput, garmentIds: string[]): Promise<Blueprint> => {
      if (MOCK_MODE) {
        const blueprint: Blueprint = {
          id: generateId('bp'),
          createdAt: new Date().toISOString(),
          ...input,
        }
        const newRows: BlueprintGarment[] = garmentIds.map((garmentId, index) => ({
          id: generateId('bg'),
          blueprintId: blueprint.id,
          garmentId,
          sortOrder: index,
        }))
        mutate((db) => {
          db.blueprints = [...db.blueprints, blueprint]
          db.blueprintGarments = [...db.blueprintGarments, ...newRows]
        })
        return blueprint
      }
      const { data, error } = await supabase!
        .from('blueprints')
        .insert({ name: input.name, sport: input.sport })
        .select()
        .single()
      if (error) throw error
      const blueprint: Blueprint = { id: data.id, name: data.name, sport: data.sport, createdAt: data.created_at }
      if (garmentIds.length > 0) {
        await supabase!.from('blueprint_garments').insert(
          garmentIds.map((garmentId, index) => ({
            blueprint_id: blueprint.id,
            garment_id: garmentId,
            sort_order: index,
          })),
        )
      }
      await refetch()
      return blueprint
    },
    [refetch],
  )

  const updateBlueprintGarments = useCallback(
    async (blueprintId: string, garmentIds: string[]) => {
      if (MOCK_MODE) {
        const newRows: BlueprintGarment[] = garmentIds.map((garmentId, index) => ({
          id: generateId('bg'),
          blueprintId,
          garmentId,
          sortOrder: index,
        }))
        mutate((db) => {
          db.blueprintGarments = [
            ...db.blueprintGarments.filter((bg) => bg.blueprintId !== blueprintId),
            ...newRows,
          ]
        })
        return
      }
      await supabase!.from('blueprint_garments').delete().eq('blueprint_id', blueprintId)
      if (garmentIds.length > 0) {
        await supabase!.from('blueprint_garments').insert(
          garmentIds.map((garmentId, index) => ({
            blueprint_id: blueprintId,
            garment_id: garmentId,
            sort_order: index,
          })),
        )
      }
      await refetch()
    },
    [refetch],
  )

  const cloneBlueprint = useCallback(
    async (blueprintId: string, newName: string): Promise<Blueprint> => {
      const source = blueprints.find((b) => b.id === blueprintId)
      if (!source) throw new Error('Blueprint not found')
      const garmentIds = blueprintGarments
        .filter((bg) => bg.blueprintId === blueprintId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((bg) => bg.garmentId)
      return createBlueprint({ name: newName, sport: source.sport }, garmentIds)
    },
    [blueprints, blueprintGarments, createBlueprint],
  )

  const deleteBlueprint = useCallback(
    async (blueprintId: string) => {
      if (MOCK_MODE) {
        mutate((db) => {
          db.blueprints = db.blueprints.filter((b) => b.id !== blueprintId)
          db.blueprintGarments = db.blueprintGarments.filter((bg) => bg.blueprintId !== blueprintId)
        })
        return
      }
      const { error } = await supabase!.from('blueprints').delete().eq('id', blueprintId)
      if (error) throw error
      await refetch()
    },
    [refetch],
  )

  const updateBlueprint = useCallback(
    async (blueprintId: string, patch: Partial<BlueprintInput>) => {
      if (MOCK_MODE) {
        mutate((db) => {
          db.blueprints = db.blueprints.map((b) => (b.id === blueprintId ? { ...b, ...patch } : b))
        })
        return
      }
      const { error } = await supabase!.from('blueprints').update(patch).eq('id', blueprintId)
      if (error) throw error
      await refetch()
    },
    [refetch],
  )

  return useMemo(
    () => ({
      blueprints,
      blueprintGarments,
      loading: MOCK_MODE ? false : loading,
      createBlueprint,
      updateBlueprint,
      updateBlueprintGarments,
      cloneBlueprint,
      deleteBlueprint,
    }),
    [
      blueprints,
      blueprintGarments,
      loading,
      createBlueprint,
      updateBlueprint,
      updateBlueprintGarments,
      cloneBlueprint,
      deleteBlueprint,
    ],
  )
}
