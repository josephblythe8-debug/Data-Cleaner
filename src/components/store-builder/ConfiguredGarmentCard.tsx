import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import type { ConfiguredGarment } from '@/lib/types'
import type { StoreGarmentPatch } from '@/hooks/useStoreProject'

interface ConfiguredGarmentCardProps {
  configuredGarment: ConfiguredGarment
  onUpdate: (patch: StoreGarmentPatch) => void
  onDuplicate: () => void
  onRemove: () => void
}

export function ConfiguredGarmentCard({
  configuredGarment: cg,
  onUpdate,
  onDuplicate,
  onRemove,
}: ConfiguredGarmentCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cg.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <button
          className="mt-1 flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 active:cursor-grabbing dark:hover:bg-slate-800"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{cg.garment.name}</p>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {cg.garment.rangeCode}-{cg.garment.styleCode}-{cg.garment.colourCode}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Custom Product Name</Label>
              <Input
                placeholder={cg.garment.name}
                value={cg.customName ?? ''}
                onChange={(e) => onUpdate({ customName: e.target.value || null })}
              />
            </div>
            <div className="flex items-center gap-6 pt-1 sm:pt-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={cg.includeKids}
                  onCheckedChange={(v) => onUpdate({ includeKids: v })}
                  disabled={!cg.garment.allowKids}
                />
                Include Kids
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={cg.includeAdults}
                  onCheckedChange={(v) => onUpdate({ includeAdults: v })}
                  disabled={!cg.garment.allowAdults}
                />
                Include Adults
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-1 sm:flex-col">
          <Button size="icon" variant="ghost" onClick={onDuplicate} aria-label="Duplicate garment">
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onRemove} aria-label="Remove garment">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
