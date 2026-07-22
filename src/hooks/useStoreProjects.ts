import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { MOCK_MODE } from '@/lib/config'
import { generateId, getDb, mutate, subscribe } from '@/lib/dataStore'
import { supabase } from '@/lib/supabaseClient'
import type { StoreProject } from '@/lib/types'

function mockSnapshot() {
  return getDb().storeProjects
}

export function useStoreProjects() {
  const mockProjects = useSyncExternalStore(subscribe, mockSnapshot, mockSnapshot)
  const [remoteProjects, setRemoteProjects] = useState<StoreProject[]>([])
  const [loading, setLoading] = useState(!MOCK_MODE)

  const refetch = useCallback(async () => {
    if (MOCK_MODE) return
    setLoading(true)
    const { data, error } = await supabase!.from('store_projects').select('*').order('created_at', { ascending: false })
    if (!error && data) {
      setRemoteProjects(
        data.map((p) => ({ id: p.id, clubId: p.club_id, projectName: p.project_name, createdAt: p.created_at })),
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const createProject = useCallback(
    async (clubId: string, projectName: string): Promise<StoreProject> => {
      if (MOCK_MODE) {
        const project: StoreProject = {
          id: generateId('project'),
          clubId,
          projectName,
          createdAt: new Date().toISOString(),
        }
        mutate((db) => {
          db.storeProjects = [...db.storeProjects, project]
        })
        return project
      }
      const { data, error } = await supabase!
        .from('store_projects')
        .insert({ club_id: clubId, project_name: projectName })
        .select()
        .single()
      if (error) throw error
      const project: StoreProject = {
        id: data.id,
        clubId: data.club_id,
        projectName: data.project_name,
        createdAt: data.created_at,
      }
      await refetch()
      return project
    },
    [refetch],
  )

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (MOCK_MODE) {
        mutate((db) => {
          db.storeProjects = db.storeProjects.filter((p) => p.id !== projectId)
          db.storeGarments = db.storeGarments.filter((sg) => sg.projectId !== projectId)
        })
        return
      }
      const { error } = await supabase!.from('store_projects').delete().eq('id', projectId)
      if (error) throw error
      await refetch()
    },
    [refetch],
  )

  return {
    projects: (MOCK_MODE ? mockProjects : remoteProjects).slice().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    loading: MOCK_MODE ? false : loading,
    createProject,
    deleteProject,
  }
}
