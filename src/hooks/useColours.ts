import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { MOCK_MODE } from '@/lib/config'
import { generateId, getDb, mutate, subscribe } from '@/lib/dataStore'
import { supabase } from '@/lib/supabaseClient'
import type { ColourOption } from '@/lib/types'

export interface ColourInput {
  code: string
  name: string
  swatchHex: string
  swatchHex2?: string
}

function mockSnapshot() {
  return getDb().colours
}

function fromRow(row: {
  id: string
  code: string
  name: string
  swatch_hex: string
  swatch_hex_2: string | null
}): ColourOption {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    swatchHex: row.swatch_hex,
    swatchHex2: row.swatch_hex_2 ?? undefined,
  }
}

export function useColours() {
  const mockColours = useSyncExternalStore(subscribe, mockSnapshot, mockSnapshot)
  const [remoteColours, setRemoteColours] = useState<ColourOption[]>([])
  const [loading, setLoading] = useState(!MOCK_MODE)

  const refetch = useCallback(async () => {
    if (MOCK_MODE) return
    setLoading(true)
    const { data, error } = await supabase!.from('colours').select('*').order('name')
    if (!error && data) setRemoteColours(data.map(fromRow))
    setLoading(false)
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const addColour = useCallback(
    async (input: ColourInput): Promise<ColourOption> => {
      if (MOCK_MODE) {
        const colour: ColourOption = { id: generateId('colour'), ...input }
        mutate((db) => {
          db.colours = [...db.colours, colour]
        })
        return colour
      }
      const { data, error } = await supabase!
        .from('colours')
        .insert({
          code: input.code,
          name: input.name,
          swatch_hex: input.swatchHex,
          swatch_hex_2: input.swatchHex2 ?? null,
        })
        .select()
        .single()
      if (error) throw error
      const colour = fromRow(data)
      await refetch()
      return colour
    },
    [refetch],
  )

  return {
    colours: MOCK_MODE ? mockColours : remoteColours,
    loading: MOCK_MODE ? false : loading,
    addColour,
  }
}
