import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GarmentChecklist } from '@/components/store-builder/GarmentChecklist'

interface AddGarmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Garments already in this store, shown checked and locked. */
  existingGarmentIds: Set<string>
  onAdd: (garmentIds: string[]) => void
}

export function AddGarmentDialog({ open, onOpenChange, existingGarmentIds, onAdd }: AddGarmentDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(garmentId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(garmentId)) next.delete(garmentId)
      else next.add(garmentId)
      return next
    })
  }

  function handleAdd() {
    if (selected.size === 0) return
    onAdd([...selected])
    setSelected(new Set())
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSelected(new Set())
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Garments</DialogTitle>
          <DialogDescription>Tick as many as this store needs from the garment library.</DialogDescription>
        </DialogHeader>
        <GarmentChecklist selected={selected} onToggle={toggle} disabledIds={existingGarmentIds} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAdd} disabled={selected.size === 0}>
            Add {selected.size > 0 ? selected.size : ''} garment{selected.size === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
