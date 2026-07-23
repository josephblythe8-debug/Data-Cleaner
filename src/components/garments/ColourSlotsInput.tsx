import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useColourNames } from '@/hooks/useColourNames'
import { buildColourCode, MAX_GARMENT_COLOURS } from '@/lib/colourCode'

interface ColourSlotsInputProps {
  /** Colour names, in order (main / secondary / trim). */
  value: string[]
  onChange: (colours: string[]) => void
}

/**
 * Pick up to 3 colours from the fixed company colour table — the
 * coordinator just picks the name; the 2-letter code and the padded
 * colour_code segment (e.g. MERDXX) are entirely automatic.
 */
export function ColourSlotsInput({ value, onChange }: ColourSlotsInputProps) {
  const { colourNames } = useColourNames()

  const byName = new Map(colourNames.map((c) => [c.name, c]))
  const abbreviations = value.map((name) => byName.get(name)?.abbreviation ?? '??')
  const previewCode = buildColourCode(abbreviations)

  function updateAt(index: number, name: string) {
    const next = [...value]
    next[index] = name
    onChange(next)
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function addSlot(name: string) {
    if (value.length >= MAX_GARMENT_COLOURS) return
    onChange([...value, name])
  }

  function optionsFor(currentValue: string | undefined) {
    return colourNames.filter((c) => c.name === currentValue || !value.includes(c.name))
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((name, index) => (
        <div key={index} className="flex items-center gap-2">
          <Select value={name} onValueChange={(v) => updateAt(index, v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {optionsFor(name).map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name} ({c.abbreviation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {value.length < MAX_GARMENT_COLOURS && (
        <Select key={value.length} value="" onValueChange={addSlot}>
          <SelectTrigger>
            <Plus className="h-3.5 w-3.5 text-slate-400" />
            <SelectValue placeholder="Add colour..." />
          </SelectTrigger>
          <SelectContent>
            {optionsFor(undefined).map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name} ({c.abbreviation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {value.length >= MAX_GARMENT_COLOURS && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Maximum of {MAX_GARMENT_COLOURS} colours.
        </p>
      )}

      {value.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Colour code:{' '}
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{previewCode}</span>
        </p>
      )}
    </div>
  )
}
