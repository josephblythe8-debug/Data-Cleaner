import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ColourSlotsInput } from '@/components/garments/ColourSlotsInput'
import { ageGroupForSizeCode, getAvailableSizes, type AgeGroup, type SizeDef } from '@/lib/sizeTemplates'
import type { ConfiguredGarment } from '@/lib/types'
import type { StoreGarmentPatch } from '@/hooks/useStoreProject'

interface ConfiguredGarmentCardProps {
  configuredGarment: ConfiguredGarment
  onUpdate: (patch: StoreGarmentPatch) => void
  onDuplicate: () => void
  onRemove: () => void
}

function SizeGroupPicker({
  title,
  sizes,
  selected,
  onToggle,
  onSelectAll,
  onClear,
  price,
  onPriceChange,
}: {
  title: string | null
  sizes: SizeDef[]
  selected: Set<string>
  onToggle: (code: string) => void
  onSelectAll: () => void
  onClear: () => void
  price?: number
  onPriceChange?: (value: number | null) => void
}) {
  if (sizes.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      {title && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">{title}</Label>
          <div className="flex gap-2">
            <button type="button" onClick={onSelectAll} className="text-xs text-brand-600 hover:underline">
              All
            </button>
            <button type="button" onClick={onClear} className="text-xs text-slate-400 hover:underline">
              None
            </button>
          </div>
        </div>
      )}
      {onPriceChange && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">$</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Price"
            className="h-7 w-24 text-xs"
            value={price ?? ''}
            onChange={(e) => {
              const raw = e.target.value
              onPriceChange(raw === '' ? null : Number(raw))
            }}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((size) => {
          const isChecked = selected.has(size.code)
          return (
            <button
              key={size.code}
              type="button"
              onClick={() => onToggle(size.code)}
              title={size.label}
              className={`rounded-md border px-2 py-1 font-mono text-xs transition-colors ${
                isChecked
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
              }`}
            >
              {size.code}
            </button>
          )
        })}
      </div>
    </div>
  )
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

  const availableSizes = getAvailableSizes(cg.garment.sizeTemplate, cg.garment.allowKids, cg.garment.allowAdults)
  const adultSizes = availableSizes.filter((s) => ageGroupForSizeCode(s.code) === 'adults')
  const kidsSizes = availableSizes.filter((s) => ageGroupForSizeCode(s.code) === 'kids')
  const flatSizes = availableSizes.filter((s) => ageGroupForSizeCode(s.code) === null)
  const selected = new Set(cg.selectedSizeCodes)

  function toggleSize(code: string) {
    const next = new Set(selected)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    onUpdate({ selectedSizeCodes: [...next] })
  }

  function selectGroup(codes: string[]) {
    onUpdate({ selectedSizeCodes: [...new Set([...selected, ...codes])] })
  }

  function clearGroup(codes: string[]) {
    const toRemove = new Set(codes)
    onUpdate({ selectedSizeCodes: cg.selectedSizeCodes.filter((c) => !toRemove.has(c)) })
  }

  function setPrice(ageGroup: AgeGroup, value: number | null) {
    const next = { ...cg.priceByAgeGroup }
    if (value === null || Number.isNaN(value)) delete next[ageGroup]
    else next[ageGroup] = value
    onUpdate({ priceByAgeGroup: next })
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
              {cg.garment.rangeCode}-{cg.garment.styleCode}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            <Label className="text-xs">Custom Product Name</Label>
            <Input
              placeholder={cg.garment.name}
              value={cg.customName ?? ''}
              onChange={(e) => onUpdate({ customName: e.target.value || null })}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Colours (up to 3)</Label>
              <ColourSlotsInput value={cg.colours} onChange={(colours) => onUpdate({ colours })} />
            </div>

            <div className="flex flex-col gap-3">
              <SizeGroupPicker
                title="Adults"
                sizes={adultSizes}
                selected={selected}
                onToggle={toggleSize}
                onSelectAll={() => selectGroup(adultSizes.map((s) => s.code))}
                onClear={() => clearGroup(adultSizes.map((s) => s.code))}
                price={cg.priceByAgeGroup.adults}
                onPriceChange={(v) => setPrice('adults', v)}
              />
              <SizeGroupPicker
                title="Kids"
                sizes={kidsSizes}
                selected={selected}
                onToggle={toggleSize}
                onSelectAll={() => selectGroup(kidsSizes.map((s) => s.code))}
                onClear={() => clearGroup(kidsSizes.map((s) => s.code))}
                price={cg.priceByAgeGroup.kids}
                onPriceChange={(v) => setPrice('kids', v)}
              />
              <SizeGroupPicker
                title={flatSizes.length > 0 && (adultSizes.length > 0 || kidsSizes.length > 0) ? 'Sizes' : null}
                sizes={flatSizes}
                selected={selected}
                onToggle={toggleSize}
                onSelectAll={() => selectGroup(flatSizes.map((s) => s.code))}
                onClear={() => clearGroup(flatSizes.map((s) => s.code))}
                price={cg.priceByAgeGroup.all}
                onPriceChange={(v) => setPrice('all', v)}
              />
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
