import { useMemo, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseBrief } from '@/lib/briefParser'
import { matchBriefLines, type MatchedBriefLine } from '@/lib/garmentMatcher'
import { useGarments } from '@/hooks/useGarments'
import type { ImportGarmentEntry } from '@/hooks/useStoreProject'

interface ImportBriefDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Garments already in this store — matched lines against these are flagged, not re-added. */
  existingGarmentIds: Set<string>
  onImport: (entries: ImportGarmentEntry[]) => void
}

interface ReviewRow extends MatchedBriefLine {
  checked: boolean
  editedPrice: string
  alreadyAdded: boolean
}

export function ImportBriefDialog({ open, onOpenChange, existingGarmentIds, onImport }: ImportBriefDialogProps) {
  const { garments } = useGarments()
  const activeGarments = useMemo(() => garments.filter((g) => g.active), [garments])

  const [text, setText] = useState('')
  const [rows, setRows] = useState<ReviewRow[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setText('')
    setRows(null)
  }

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  function findMatches() {
    const parsed = parseBrief(text)
    const matched = matchBriefLines(parsed, activeGarments)
    setRows(
      matched.map((line) => {
        const alreadyAdded = line.garmentId !== null && existingGarmentIds.has(line.garmentId)
        return {
          ...line,
          checked: line.garmentId !== null && !alreadyAdded,
          editedPrice: line.price !== null ? String(line.price) : '',
          alreadyAdded,
        }
      }),
    )
  }

  function updateRow(index: number, patch: Partial<ReviewRow>) {
    setRows((prev) => (prev ? prev.map((r, i) => (i === index ? { ...r, ...patch } : r)) : prev))
  }

  const matchedCount = rows?.filter((r) => r.garmentId !== null).length ?? 0
  const unmatchedCount = rows ? rows.length - matchedCount : 0
  const readyToImport = rows?.some((r) => r.checked && r.garmentId && Number(r.editedPrice) > 0) ?? false

  function handleImport() {
    if (!rows) return
    const entries: ImportGarmentEntry[] = rows
      .filter((r) => r.checked && r.garmentId && Number(r.editedPrice) > 0)
      .map((r) => ({ garmentId: r.garmentId!, price: Number(r.editedPrice) }))
    if (entries.length === 0) return
    onImport(entries)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from Brief</DialogTitle>
          <DialogDescription>
            Paste an email or product brief from the club, and it'll be matched against the garment
            library automatically. Anything that doesn't match gets flagged so nothing slips through
            silently.
          </DialogDescription>
        </DialogHeader>

        {!rows ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Brief text</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Upload .txt
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                  e.target.value = ''
                }}
              />
            </div>
            <Textarea
              rows={10}
              placeholder="Paste the email or brief text here (e.g. &quot;Club Polo (Adults) - $45.00&quot; per line)..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              Only plain text is supported for now — paste the body of the email, or upload a .txt file.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {matchedCount} matched, {unmatchedCount} flagged for review.
            </p>
            <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
              {rows.map((row, i) => {
                const garment = row.garmentId ? activeGarments.find((g) => g.id === row.garmentId) : null
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      row.garmentId
                        ? 'border-slate-200 dark:border-slate-700'
                        : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={row.checked}
                      disabled={!row.garmentId || row.alreadyAdded}
                      onChange={(e) => updateRow(i, { checked: e.target.checked })}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{row.productName}</p>
                      {garment && row.alreadyAdded ? (
                        <p className="text-xs text-slate-400">
                          Matched: {garment.name} — already in this store
                        </p>
                      ) : garment ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Matched: {garment.name} ({Math.round(row.confidence * 100)}% confidence)
                        </p>
                      ) : (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          No match found in the garment library — add it there first, or check the wording.
                        </p>
                      )}
                    </div>
                    {row.garmentId && !row.alreadyAdded && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-8 w-20 text-xs"
                          value={row.editedPrice}
                          onChange={(e) => updateRow(i, { editedPrice: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          {rows ? (
            <>
              <Button type="button" variant="outline" onClick={() => setRows(null)}>
                Back
              </Button>
              <Button type="button" onClick={handleImport} disabled={!readyToImport}>
                Add matched garments
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={findMatches} disabled={!text.trim()}>
                Find matches
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
