import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { MOCK_MODE } from '@/lib/config'
import { cloneStoreGarments, generateId } from '@/lib/cloneEngine'
import { getDb, mutate, subscribe } from '@/lib/dataStore'
import { getAvailableSizes, type AgeGroup } from '@/lib/sizeTemplates'
import { supabase } from '@/lib/supabaseClient'
import type { Club, ConfiguredGarment, Garment, StoreGarment, StoreProject } from '@/lib/types'
import { useGarments } from './useGarments'

export interface StoreGarmentPatch {
  customName?: string | null
  colours?: string[]
  selectedSizeCodes?: string[]
  priceByAgeGroup?: Partial<Record<AgeGroup, number>>
}

export interface ImportGarmentEntry {
  garmentId: string
  /** Omitted when the brief didn't include a price — it can be added later in Configure Store. */
  price?: number
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

function defaultSizeCodes(garment: Garment): string[] {
  return getAvailableSizes(garment.sizeTemplate, garment.allowKids, garment.allowAdults).map((s) => s.code)
}

export function useStoreProject(projectId: string | undefined) {
  const { garments } = useGarments()
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
          colours: sg.colours ?? [],
          selectedSizeCodes: sg.selected_size_codes ?? [],
          priceByAgeGroup: sg.price_by_age_group ?? {},
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
            colours: r.colours,
            selected_size_codes: r.selectedSizeCodes,
            price_by_age_group: r.priceByAgeGroup,
            sort_order: r.sortOrder,
          })),
        )
      }
      await refetch()
    },
    [projectId, refetch],
  )

  const addGarments = useCallback(
    async (garmentIds: string[]) => {
      if (!projectId || garmentIds.length === 0) return
      const startIndex = storeGarments.length
      const rows: StoreGarment[] = garmentIds
        .map((garmentId) => garmentsById.get(garmentId))
        .filter((g): g is Garment => Boolean(g))
        .map((g, i) => ({
          id: generateId('sg'),
          projectId,
          garmentId: g.id,
          customName: null,
          colours: [],
          selectedSizeCodes: defaultSizeCodes(g),
          priceByAgeGroup: {},
          sortOrder: startIndex + i,
        }))
      if (MOCK_MODE) {
        mutate((db) => {
          db.storeGarments = [...db.storeGarments, ...rows]
        })
        return
      }
      await supabase!.from('store_garments').insert(
        rows.map((r) => ({
          id: r.id,
          project_id: r.projectId,
          garment_id: r.garmentId,
          custom_name: r.customName,
          colours: r.colours,
          selected_size_codes: r.selectedSizeCodes,
          price_by_age_group: r.priceByAgeGroup,
          sort_order: r.sortOrder,
        })),
      )
      await refetch()
    },
    [projectId, garmentsById, storeGarments.length, refetch],
  )

  const addGarment = useCallback((garmentId: string) => addGarments([garmentId]), [addGarments])

  /** Adds garments matched from an imported brief, pre-filling the price extracted from it. */
  const importGarments = useCallback(
    async (entries: ImportGarmentEntry[]) => {
      if (!projectId || entries.length === 0) return
      const startIndex = storeGarments.length
      const rows: StoreGarment[] = entries
        .map(({ garmentId, price }) => {
          const g = garmentsById.get(garmentId)
          return g ? { g, price } : null
        })
        .filter((e): e is { g: Garment; price: number | undefined } => e !== null)
        .map(({ g, price }, i) => ({
          id: generateId('sg'),
          projectId,
          garmentId: g.id,
          customName: null,
          colours: [],
          selectedSizeCodes: defaultSizeCodes(g),
          priceByAgeGroup: price !== undefined ? { adults: price, kids: price, all: price } : {},
          sortOrder: startIndex + i,
        }))
      if (MOCK_MODE) {
        mutate((db) => {
          db.storeGarments = [...db.storeGarments, ...rows]
        })
        return
      }
      await supabase!.from('store_garments').insert(
        rows.map((r) => ({
          id: r.id,
          project_id: r.projectId,
          garment_id: r.garmentId,
          custom_name: r.customName,
          colours: r.colours,
          selected_size_codes: r.selectedSizeCodes,
          price_by_age_group: r.priceByAgeGroup,
          sort_order: r.sortOrder,
        })),
      )
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
        colours: clone.colours,
        selected_size_codes: clone.selectedSizeCodes,
        price_by_age_group: clone.priceByAgeGroup,
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
          ...(patch.colours !== undefined && { colours: patch.colours }),
          ...(patch.selectedSizeCodes !== undefined && { selected_size_codes: patch.selectedSizeCodes }),
          ...(patch.priceByAgeGroup !== undefined && { price_by_age_group: patch.priceByAgeGroup }),
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
    addGarments,
    importGarments,
    removeGarment,
    duplicateGarment,
    updateGarment,
    reorder,
    cloneFromClubProject,
  }
}
