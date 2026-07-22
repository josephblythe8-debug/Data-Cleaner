import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGarments } from '@/hooks/useGarments'
import type { Blueprint } from '@/lib/types'

interface BlueprintFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blueprint?: Blueprint
  initialGarmentIds?: string[]
  onSubmit: (input: { name: string; sport: string }, garmentIds: string[]) => Promise<void> | void
}

export function BlueprintFormDialog({
  open,
  onOpenChange,
  blueprint,
  initialGarmentIds,
  onSubmit,
}: BlueprintFormDialogProps) {
  const { garments } = useGarments()
  const [name, setName] = useState('')
  const [sport, setSport] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(blueprint?.name ?? '')
      setSport(blueprint?.sport ?? '')
      setSelectedIds(initialGarmentIds ?? [])
    }
  }, [open, blueprint, initialGarmentIds])

  function toggleGarment(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const isValid = name.trim() && sport.trim()

  async function handleSubmit() {
    if (!isValid) return
    setSaving(true)
    try {
      await onSubmit({ name, sport }, selectedIds)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{blueprint ? 'Edit Blueprint' : 'Create Blueprint'}</DialogTitle>
          <DialogDescription>
            Blueprints are reusable product packs you can apply to any new store.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bp-name">Blueprint Name</Label>
            <Input id="bp-name" placeholder="Cricket Template" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bp-sport">Sport</Label>
            <Input id="bp-sport" placeholder="Cricket" value={sport} onChange={(e) => setSport(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Garments ({selectedIds.length} selected)</Label>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
            {garments
              .filter((g) => g.active)
              .map((g) => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(g.id)}
                    onChange={() => toggleGarment(g.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="flex-1">{g.name}</span>
                  <span className="font-mono text-xs text-slate-400">
                    {g.rangeCode}-{g.styleCode}
                  </span>
                </label>
              ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!isValid || saving}>
            {blueprint ? 'Save Changes' : 'Create Blueprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
