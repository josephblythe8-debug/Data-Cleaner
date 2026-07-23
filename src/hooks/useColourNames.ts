import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { MOCK_MODE } from '@/lib/config'
import { getDb, subscribe } from '@/lib/dataStore'
import { supabase } from '@/lib/supabaseClient'
import type { ColourName } from '@/lib/types'

/**
 * The colour library is a fixed, centrally-managed reference table (the
 * real "SKU database" colour sheet) — coordinators pick from it, they
 * don't add to it, so this hook is read-only.
 */

function mockSnapshot() {
  return getDb().colourNames
}

function fromRow(row: { id: string; name: string; abbreviation: string }): ColourName {
  return { id: row.id, name: row.name, abbreviation: row.abbreviation }
}

export function useColourNames() {
  const mockColourNames = useSyncExternalStore(subscribe, mockSnapshot, mockSnapshot)
  const [remoteColourNames, setRemoteColourNames] = useState<ColourName[]>([])
  const [loading, setLoading] = useState(!MOCK_MODE)

  const refetch = useCallback(async () => {
    if (MOCK_MODE) return
    setLoading(true)
    const { data, error } = await supabase!.from('colour_library').select('*').order('name')
    if (!error && data) setRemoteColourNames(data.map(fromRow))
    setLoading(false)
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    colourNames: MOCK_MODE ? mockColourNames : remoteColourNames,
    loading: MOCK_MODE ? false : loading,
  }
}
