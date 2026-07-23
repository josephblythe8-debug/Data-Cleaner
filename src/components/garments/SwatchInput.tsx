import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MAX_SWATCHES = 3
const DEFAULT_HEX = '#2563eb'

interface SwatchInputProps {
  value: string[]
  onChange: (swatches: string[]) => void
}

function isValidHex(hex: string) {
  return /^#[0-9a-f]{6}$/i.test(hex)
}

export function SwatchInput({ value, onChange }: SwatchInputProps) {
  function updateAt(index: number, hex: string) {
    const next = [...value]
    next[index] = hex
    onChange(next)
  }

  function addSwatch() {
    if (value.length >= MAX_SWATCHES) return
    onChange([...value, DEFAULT_HEX])
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((hex, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="color"
            value={isValidHex(hex) ? hex : DEFAULT_HEX}
            onChange={(e) => updateAt(index, e.target.value)}
            className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-slate-200 dark:border-slate-700"
            aria-label={`Colour ${index + 1}`}
          />
          <Input
            value={hex}
            onChange={(e) => updateAt(index, e.target.value)}
            placeholder="#7F1D3D"
            className="font-mono uppercase"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeAt(index)}
            aria-label={`Remove colour ${index + 1}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {value.length < MAX_SWATCHES && (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addSwatch}>
          <Plus /> Add colour
        </Button>
      )}
      {value.length >= MAX_SWATCHES && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Maximum of {MAX_SWATCHES} colours.</p>
      )}
    </div>
  )
}
