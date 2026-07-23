import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { MOCK_MODE } from '@/lib/config'
import { generateId, getDb, mutate, subscribe } from '@/lib/dataStore'
import { supabase } from '@/lib/supabaseClient'
import type { ColourName } from '@/lib/types'

export interface ColourNameInput {
  name: string
  abbreviation: string
}

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

  const addColourName = useCallback(
    async (input: ColourNameInput): Promise<ColourName> => {
      if (MOCK_MODE) {
        const colourName: ColourName = { id: generateId('colourname'), ...input }
        mutate((db) => {
          db.colourNames = [...db.colourNames, colourName]
        })
        return colourName
      }
      const { data, error } = await supabase!
        .from('colour_library')
        .insert({ name: input.name, abbreviation: input.abbreviation })
        .select()
        .single()
      if (error) throw error
      const colourName = fromRow(data)
      await refetch()
      return colourName
    },
    [refetch],
  )

  return {
    colourNames: MOCK_MODE ? mockColourNames : remoteColourNames,
    loading: MOCK_MODE ? false : loading,
    addColourName,
  }
}
