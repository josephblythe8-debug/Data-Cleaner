import { useEffect, useState, type FormEvent } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SIZE_TEMPLATE_LABELS, type SizeTemplateKey } from '@/lib/sizeTemplates'
import type { GarmentInput } from '@/hooks/useGarments'
import type { Garment } from '@/lib/types'

const EMPTY: GarmentInput = {
  name: '',
  rangeCode: '',
  styleCode: '',
  category: '',
  sizeTemplate: 'adults',
  allowKids: true,
  allowAdults: true,
}

interface GarmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  garment?: Garment
  onSubmit: (input: GarmentInput) => Promise<void> | void
}

export function GarmentFormDialog({ open, onOpenChange, garment, onSubmit }: GarmentFormDialogProps) {
  const [form, setForm] = useState<GarmentInput>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        garment
          ? {
              name: garment.name,
              rangeCode: garment.rangeCode,
              styleCode: garment.styleCode,
              category: garment.category,
              sizeTemplate: garment.sizeTemplate,
              allowKids: garment.allowKids,
              allowAdults: garment.allowAdults,
            }
          : EMPTY,
      )
    }
  }, [open, garment])

  const isValid = form.name.trim() && form.rangeCode.trim() && form.styleCode.trim() && form.category.trim()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{garment ? 'Edit Garment' : 'Add Garment'}</DialogTitle>
          <DialogDescription>
            Range and Style codes are fixed by the supplier catalogue. Colour and exact sizing are
            chosen per club in Store Builder, since every club is different.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Garment Name</Label>
            <Input
              id="name"
              placeholder="Club Polo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="range">Range Code</Label>
              <Input
                id="range"
                placeholder="LINC"
                value={form.rangeCode}
                onChange={(e) => setForm({ ...form, rangeCode: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="style">Style Code</Label>
              <Input
                id="style"
                placeholder="061"
                value={form.styleCode}
                onChange={(e) => setForm({ ...form, styleCode: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="Polo"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Size Template</Label>
            <Select
              value={form.sizeTemplate}
              onValueChange={(v) => setForm({ ...form, sizeTemplate: v as SizeTemplateKey })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SIZE_TEMPLATE_LABELS) as SizeTemplateKey[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SIZE_TEMPLATE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="allowKids"
                checked={form.allowKids}
                onCheckedChange={(v) => setForm({ ...form, allowKids: v })}
              />
              <Label htmlFor="allowKids">Allow Kids sizing</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="allowAdults"
                checked={form.allowAdults}
                onCheckedChange={(v) => setForm({ ...form, allowAdults: v })}
              />
              <Label htmlFor="allowAdults">Allow Adults sizing</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || saving}>
              {garment ? 'Save Changes' : 'Add Garment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
