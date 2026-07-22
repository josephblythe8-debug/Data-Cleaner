import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { MOCK_MODE } from '@/lib/config'
import { applyBlueprint, cloneStoreGarments, generateId } from '@/lib/blueprintEngine'
import { getDb, mutate, subscribe } from '@/lib/dataStore'
import { supabase } from '@/lib/supabaseClient'
import type { Club, ConfiguredGarment, StoreGarment, StoreProject } from '@/lib/types'
import { useBlueprints } from './useBlueprints'
import { useGarments } from './useGarments'

export interface StoreGarmentPatch {
  customName?: string | null
  includeKids?: boolean
  includeAdults?: boolean
}

function clubsSnapshot() {
  return getDb().clubs
}

function storeProjectsSnapshot() {
  return getDb().storeProjects
}

function storeGarmentsSnapshot() {
  return getDb().storeGarments
}

export function useStoreProject(projectId: string | undefined) {
  const { garments } = useGarments()
  const { blueprintGarments } = useBlueprints()
  const garmentsById = useMemo(() => new Map(garments.map((g) => [g.id, g])), [garments])

  const mockClubs = useSyncExternalStore(subscribe, clubsSnapshot, clubsSnapshot)
  const mockStoreProjects = useSyncExternalStore(subscribe, storeProjectsSnapshot, storeProjectsSnapshot)
  const mockAllStoreGarments = useSyncExternalStore(subscribe, storeGarmentsSnapshot, storeGarmentsSnapshot)

  const [remoteProject, setRemoteProject] = useState<StoreProject | undefined>()
  const [remoteClub, setRemoteClub] = useState<Club | undefined>()
  const [remoteStoreGarments, setRemoteStoreGarments] = useState<StoreGarment[]>([])
  const [loading, setLoading] = useState(!MOCK_MODE)

  const refetch = useCallback(async () => {
    if (MOCK_MODE || !projectId) return
    setLoading(true)
    const { data: p } = await supabase!.from('store_projects').select('*').eq('id', projectId).single()
    if (p) {
      setRemoteProject({ id: p.id, clubId: p.club_id, projectName: p.project_name, createdAt: p.created_at })
      const { data: c } = await supabase!.from('clubs').select('*').eq('id', p.club_id).single()
      if (c) {
        setRemoteClub({
          id: c.id,
          clubName: c.club_name,
          clubCode: c.club_code,
          sport: c.sport,
          supplier: c.supplier,
          createdAt: c.created_at,
        })
      }
    }
    const { data: sgs } = await supabase!
      .from('store_garments')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order')
    if (sgs) {
      setRemoteStoreGarments(
        sgs.map((sg) => ({
          id: sg.id,
          projectId: sg.project_id,
          garmentId: sg.garment_id,
          customName: sg.custom_name,
          includeKids: sg.include_kids,
          includeAdults: sg.include_adults,
          sortOrder: sg.sort_order,
        })),
      )
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const project = MOCK_MODE ? mockStoreProjects.find((p) => p.id === projectId) : remoteProject
  const club = MOCK_MODE ? mockClubs.find((c) => c.id === project?.clubId) : remoteClub

  const storeGarments = useMemo(
    () =>
      MOCK_MODE
        ? mockAllStoreGarments.filter((sg) => sg.projectId === projectId)
        : remoteStoreGarments,
    [mockAllStoreGarments, projectId, remoteStoreGarments],
  )

  const configuredGarments: ConfiguredGarment[] = useMemo(
    () =>
      storeGarments
        .map((sg) => {
          const garment = garmentsById.get(sg.garmentId)
          return garment ? { ...sg, garment } : null
        })
        .filter((cg): cg is ConfiguredGarment => cg !== null)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [storeGarments, garmentsById],
  )

  const persistStoreGarments = useCallback(
    async (rows: StoreGarment[]) => {
      if (MOCK_MODE || !projectId) return
      await supabase!.from('store_garments').delete().eq('project_id', projectId)
      if (rows.length > 0) {
        await supabase!.from('store_garments').insert(
          rows.map((r) => ({
            id: r.id,
            project_id: r.projectId,
            garment_id: r.garmentId,
            custom_name: r.customName,
            include_kids: r.includeKids,
            include_adults: r.includeAdults,
            sort_order: r.sortOrder,
          })),
        )
      }
      await refetch()
    },
    [projectId, refetch],
  )

  const addGarment = useCallback(
    async (garmentId: string) => {
      if (!projectId) return
      const garment = garmentsById.get(garmentId)
      if (!garment) return
      const row: StoreGarment = {
        id: generateId('sg'),
        projectId,
        garmentId,
        customName: null,
        includeKids: garment.allowKids,
        includeAdults: garment.allowAdults,
        sortOrder: storeGarments.length,
      }
      if (MOCK_MODE) {
        mutate((db) => {
          db.storeGarments = [...db.storeGarments, row]
        })
        return
      }
      await supabase!.from('store_garments').insert({
        id: row.id,
        project_id: row.projectId,
        garment_id: row.garmentId,
        custom_name: row.customName,
        include_kids: row.includeKids,
        include_adults: row.includeAdults,
        sort_order: row.sortOrder,
      })
      await refetch()
    },
    [projectId, garmentsById, storeGarments.length, refetch],
  )

  const removeGarment = useCallback(
    async (storeGarmentId: string) => {
      if (MOCK_MODE) {
        mutate((db) => {
          db.storeGarments = db.storeGarments.filter((sg) => sg.id !== storeGarmentId)
        })
        return
      }
      await supabase!.from('store_garments').delete().eq('id', storeGarmentId)
      await refetch()
    },
    [refetch],
  )

  const duplicateGarment = useCallback(
    async (storeGarmentId: string) => {
      const source = storeGarments.find((sg) => sg.id === storeGarmentId)
      if (!source) return
      const clone: StoreGarment = {
        ...source,
        id: generateId('sg'),
        sortOrder: storeGarments.length,
      }
      if (MOCK_MODE) {
        mutate((db) => {
          db.storeGarments = [...db.storeGarments, clone]
        })
        return
      }
      await supabase!.from('store_garments').insert({
        id: clone.id,
        project_id: clone.projectId,
        garment_id: clone.garmentId,
        custom_name: clone.customName,
        include_kids: clone.includeKids,
        include_adults: clone.includeAdults,
        sort_order: clone.sortOrder,
      })
      await refetch()
    },
    [storeGarments, refetch],
  )

  const updateGarment = useCallback(
    async (storeGarmentId: string, patch: StoreGarmentPatch) => {
      if (MOCK_MODE) {
        mutate((db) => {
          db.storeGarments = db.storeGarments.map((sg) =>
            sg.id === storeGarmentId ? { ...sg, ...patch } : sg,
          )
        })
        return
      }
      await supabase!
        .from('store_garments')
        .update({
          ...(patch.customName !== undefined && { custom_name: patch.customName }),
          ...(patch.includeKids !== undefined && { include_kids: patch.includeKids }),
          ...(patch.includeAdults !== undefined && { include_adults: patch.includeAdults }),
        })
        .eq('id', storeGarmentId)
      await refetch()
    },
    [refetch],
  )

  const reorder = useCallback(
    async (orderedStoreGarmentIds: string[]) => {
      if (MOCK_MODE) {
        const orderIndex = new Map(orderedStoreGarmentIds.map((id, index) => [id, index]))
        mutate((db) => {
          db.storeGarments = db.storeGarments.map((sg) =>
            orderIndex.has(sg.id) ? { ...sg, sortOrder: orderIndex.get(sg.id)! } : sg,
          )
        })
        return
      }
      await Promise.all(
        orderedStoreGarmentIds.map((id, index) =>
          supabase!.from('store_garments').update({ sort_order: index }).eq('id', id),
        ),
      )
      await refetch()
    },
    [refetch],
  )

  const applyBlueprintToProject = useCallback(
    async (blueprintId: string) => {
      if (!projectId) return
      const blueprint = { id: blueprintId, name: '', sport: '', createdAt: '' }
      const rows = applyBlueprint(projectId, blueprint, blueprintGarments, garmentsById)
      if (MOCK_MODE) {
        mutate((db) => {
          db.storeGarments = [...db.storeGarments.filter((sg) => sg.projectId !== projectId), ...rows]
        })
        return
      }
      await persistStoreGarments(rows)
    },
    [projectId, blueprintGarments, garmentsById, persistStoreGarments],
  )

  const cloneFromClubProject = useCallback(
    async (sourceConfiguredGarments: ConfiguredGarment[]) => {
      if (!projectId) return
      const rows = cloneStoreGarments(projectId, sourceConfiguredGarments)
      if (MOCK_MODE) {
        mutate((db) => {
          db.storeGarments = [...db.storeGarments.filter((sg) => sg.projectId !== projectId), ...rows]
        })
        return
      }
      await persistStoreGarments(rows)
    },
    [projectId, persistStoreGarments],
  )

  return {
    project,
    club,
    configuredGarments,
    loading: MOCK_MODE ? false : loading,
    addGarment,
    removeGarment,
    duplicateGarment,
    updateGarment,
    reorder,
    applyBlueprintToProject,
    cloneFromClubProject,
  }
}
