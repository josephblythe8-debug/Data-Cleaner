import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useColours } from '@/hooks/useColours'

interface ColourPickerProps {
  value: string
  onChange: (code: string) => void
}

function Swatch({ swatchHex, swatchHex2 }: { swatchHex: string; swatchHex2?: string }) {
  return (
    <span
      className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-black/10 dark:border-white/10"
      style={
        swatchHex2
          ? { background: `linear-gradient(135deg, ${swatchHex} 50%, ${swatchHex2} 50%)` }
          : { background: swatchHex }
      }
    />
  )
}

export function ColourPicker({ value, onChange }: ColourPickerProps) {
  const { colours, addColour } = useColours()
  const [adding, setAdding] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newHex, setNewHex] = useState('#2563eb')
  const [newHex2, setNewHex2] = useState('#f8fafc')
  const [useSecondColour, setUseSecondColour] = useState(true)

  const selected = colours.find((c) => c.code === value.toUpperCase())

  async function handleAddColour() {
    if (!newCode.trim() || !newName.trim()) return
    const code = newCode.trim().toUpperCase()
    const colour = await addColour({
      code,
      name: newName.trim(),
      swatchHex: newHex,
      swatchHex2: useSecondColour ? newHex2 : undefined,
    })
    onChange(colour.code)
    setAdding(false)
    setNewCode('')
    setNewName('')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {colours.map((colour) => {
          const isSelected = colour.code === value.toUpperCase()
          return (
            <button
              key={colour.id}
              type="button"
              onClick={() => onChange(colour.code)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
                isSelected
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50',
              )}
            >
              <Swatch swatchHex={colour.swatchHex} swatchHex2={colour.swatchHex2} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{colour.name}</span>
                <span className="block font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {colour.code}
                </span>
              </span>
              {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50"
        >
          <Plus className="h-3.5 w-3.5" /> New colour
        </button>
      </div>

      {selected === undefined && value.trim() && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          "{value}" isn't in the colour library yet — pick a swatch above or add it as a new colour.
        </p>
      )}

      {adding && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-colour-code">Colour Code</Label>
              <Input
                id="new-colour-code"
                placeholder="ROYNVY"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-colour-name">Name</Label>
              <Input
                id="new-colour-name"
                placeholder="Royal / Navy"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-colour-hex">Swatch</Label>
              <input
                id="new-colour-hex"
                type="color"
                value={newHex}
                onChange={(e) => setNewHex(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-md border border-slate-200 dark:border-slate-700"
              />
            </div>
            {useSecondColour && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-colour-hex2">Trim</Label>
                <input
                  id="new-colour-hex2"
                  type="color"
                  value={newHex2}
                  onChange={(e) => setNewHex2(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-slate-200 dark:border-slate-700"
                />
              </div>
            )}
            <label className="mb-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={useSecondColour}
                onChange={(e) => setUseSecondColour(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              Two-tone
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleAddColour} disabled={!newCode.trim() || !newName.trim()}>
              Add to library
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
