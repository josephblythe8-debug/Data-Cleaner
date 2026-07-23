import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useColourNames } from '@/hooks/useColourNames'
import { buildColourCode, MAX_GARMENT_COLOURS } from '@/lib/colourCode'

interface ColourSlotsInputProps {
  /** Colour names, in order (main / secondary / trim). */
  value: string[]
  onChange: (colours: string[]) => void
}

export function ColourSlotsInput({ value, onChange }: ColourSlotsInputProps) {
  const { colourNames, addColourName } = useColourNames()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAbbreviation, setNewAbbreviation] = useState('')

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

  async function handleAddNewColour() {
    const name = newName.trim()
    const abbreviation = newAbbreviation.trim().toUpperCase()
    if (!name || abbreviation.length !== 2) return
    const colour = await addColourName({ name, abbreviation })
    if (value.length < MAX_GARMENT_COLOURS) addSlot(colour.name)
    setAdding(false)
    setNewName('')
    setNewAbbreviation('')
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
        <div className="flex items-center gap-2">
          <Select key={value.length} value="" onValueChange={addSlot}>
            <SelectTrigger>
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
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus /> New colour
          </Button>
        </div>
      )}

      {value.length >= MAX_GARMENT_COLOURS && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Maximum of {MAX_GARMENT_COLOURS} colours.
        </p>
      )}

      {adding && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-colourname-name">Colour Name</Label>
              <Input
                id="new-colourname-name"
                placeholder="Navy"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-colourname-abbr">Abbreviation (2 letters)</Label>
              <Input
                id="new-colourname-abbr"
                placeholder="NV"
                maxLength={2}
                value={newAbbreviation}
                onChange={(e) => setNewAbbreviation(e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddNewColour}
              disabled={!newName.trim() || newAbbreviation.trim().length !== 2}
            >
              Add to library
            </Button>
          </div>
        </div>
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
