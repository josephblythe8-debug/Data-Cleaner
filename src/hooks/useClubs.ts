import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { MOCK_MODE } from '@/lib/config'
import { generateId, getDb, mutate, subscribe } from '@/lib/dataStore'
import { supabase } from '@/lib/supabaseClient'
import type { Club } from '@/lib/types'

export interface ClubInput {
  clubName: string
  clubCode: string
  sport: string
  supplier: string
}

function mockSnapshot() {
  return getDb().clubs
}

function fromRow(row: {
  id: string
  club_name: string
  club_code: string
  sport: string
  supplier: string
  created_at: string
}): Club {
  return {
    id: row.id,
    clubName: row.club_name,
    clubCode: row.club_code,
    sport: row.sport,
    supplier: row.supplier,
    createdAt: row.created_at,
  }
}

export function useClubs() {
  const mockClubs = useSyncExternalStore(subscribe, mockSnapshot, mockSnapshot)
  const [remoteClubs, setRemoteClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(!MOCK_MODE)

  const refetch = useCallback(async () => {
    if (MOCK_MODE) return
    setLoading(true)
    const { data, error } = await supabase!.from('clubs').select('*').order('created_at')
    if (!error && data) setRemoteClubs(data.map(fromRow))
    setLoading(false)
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const addClub = useCallback(
    async (input: ClubInput): Promise<Club> => {
      if (MOCK_MODE) {
        const club: Club = { id: generateId('club'), createdAt: new Date().toISOString(), ...input }
        mutate((db) => {
          db.clubs = [...db.clubs, club]
        })
        return club
      }
      const { data, error } = await supabase!
        .from('clubs')
        .insert({
          club_name: input.clubName,
          club_code: input.clubCode,
          sport: input.sport,
          supplier: input.supplier,
        })
        .select()
        .single()
      if (error) throw error
      const club = fromRow(data)
      await refetch()
      return club
    },
    [refetch],
  )

  const updateClub = useCallback(
    async (id: string, patch: Partial<ClubInput>) => {
      if (MOCK_MODE) {
        mutate((db) => {
          db.clubs = db.clubs.map((c) => (c.id === id ? { ...c, ...patch } : c))
        })
        return
      }
      const { error } = await supabase!
        .from('clubs')
        .update({
          ...(patch.clubName !== undefined && { club_name: patch.clubName }),
          ...(patch.clubCode !== undefined && { club_code: patch.clubCode }),
          ...(patch.sport !== undefined && { sport: patch.sport }),
          ...(patch.supplier !== undefined && { supplier: patch.supplier }),
        })
        .eq('id', id)
      if (error) throw error
      await refetch()
    },
    [refetch],
  )

  return {
    clubs: MOCK_MODE ? mockClubs : remoteClubs,
    loading: MOCK_MODE ? false : loading,
    addClub,
    updateClub,
  }
}
