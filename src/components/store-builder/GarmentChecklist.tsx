import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useGarments } from '@/hooks/useGarments'
import type { Garment } from '@/lib/types'

interface GarmentChecklistProps {
  selected: Set<string>
  onToggle: (garmentId: string) => void
  /** Garments already in the store — shown checked and disabled, can't be unticked here. */
  disabledIds?: Set<string>
  className?: string
}

/** A searchable, checkbox-driven list of the garment library — the "easy way to select what garments a club needs". */
export function GarmentChecklist({ selected, onToggle, disabledIds, className }: GarmentChecklistProps) {
  const { garments } = useGarments()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return garments
      .filter((g) => g.active)
      .filter((g) =>
        q ? [g.name, g.category, g.rangeCode, g.rangeName].some((v) => v.toLowerCase().includes(q)) : true,
      )
  }, [garments, search])

  function selectAll() {
    for (const g of filtered) {
      if (!selected.has(g.id) && !disabledIds?.has(g.id)) onToggle(g.id)
    }
  }

  function clearAll() {
    for (const g of filtered) {
      if (selected.has(g.id) && !disabledIds?.has(g.id)) onToggle(g.id)
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search garments..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
            Select all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>

      <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
        {filtered.map((g: Garment) => {
          const isDisabled = disabledIds?.has(g.id) ?? false
          const isChecked = selected.has(g.id) || isDisabled
          return (
            <label
              key={g.id}
              className={`flex items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0 dark:border-slate-800 ${
                isDisabled ? 'opacity-50' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => onToggle(g.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="flex-1">
                <span className="block font-medium">{g.name}</span>
                <span className="block text-xs text-slate-400">{g.category}</span>
              </span>
              <span className="font-mono text-xs text-slate-400">
                {g.rangeCode}-{g.styleCode}
              </span>
              {isDisabled && <span className="text-xs text-slate-400">Already added</span>}
            </label>
          )
        })}
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No garments found.</p>
        )}
      </div>
    </div>
  )
}
