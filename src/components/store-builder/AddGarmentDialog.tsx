import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useGarments } from '@/hooks/useGarments'

interface AddGarmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (garmentId: string) => void
}

export function AddGarmentDialog({ open, onOpenChange, onAdd }: AddGarmentDialogProps) {
  const { garments } = useGarments()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return garments
      .filter((g) => g.active)
      .filter((g) => (q ? [g.name, g.category, g.rangeCode].some((v) => v.toLowerCase().includes(q)) : true))
  }, [garments, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Garment</DialogTitle>
          <DialogDescription>Pick from the garment library to add it to this store.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search garments..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between border-b border-slate-100 px-3 py-2 last:border-b-0 dark:border-slate-800"
            >
              <div>
                <p className="text-sm font-medium">{g.name}</p>
                <p className="font-mono text-xs text-slate-400">
                  {g.rangeCode}-{g.styleCode}-{g.colourCode}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onAdd(g.id)}>
                Add
              </Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No garments found.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
