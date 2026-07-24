import { useMemo, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseBrief, type ParsedBriefLine } from '@/lib/briefParser'
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

const SPREADSHEET_EXTENSIONS = new Set(['xlsx', 'xls', 'xlsm'])
const TEXT_EXTENSIONS = new Set(['txt', 'csv', 'tsv'])

function extensionOf(filename: string): string {
  return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
}

export function ImportBriefDialog({ open, onOpenChange, existingGarmentIds, onImport }: ImportBriefDialogProps) {
  const { garments } = useGarments()
  const activeGarments = useMemo(() => garments.filter((g) => g.active), [garments])

  const [text, setText] = useState('')
  const [rows, setRows] = useState<ReviewRow[] | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setText('')
    setRows(null)
    setFileError(null)
  }

  function reviewLines(lines: ParsedBriefLine[]) {
    const matched = matchBriefLines(lines, activeGarments)
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

  function handleFile(file: File) {
    setFileError(null)
    const ext = extensionOf(file.name)

    if (SPREADSHEET_EXTENSIONS.has(ext)) {
      const reader = new FileReader()
      reader.onload = () => {
        void (async () => {
          try {
            // Lazy-loaded: the spreadsheet parsing library is only needed
            // for this one file type, so it shouldn't cost every page load.
            const [{ read }, { parseSpreadsheet }] = await Promise.all([
              import('xlsx'),
              import('@/lib/spreadsheetParser'),
            ])
            const workbook = read(reader.result, { type: 'array' })
            const lines = parseSpreadsheet(workbook)
            if (lines.length === 0) {
              setFileError(`No product rows found in "${file.name}" — check it has a product name and price per row.`)
              return
            }
            reviewLines(lines)
          } catch {
            setFileError(`Couldn't read "${file.name}" as a spreadsheet — it may be corrupted or password-protected.`)
          }
        })()
      }
      reader.onerror = () => setFileError(`Couldn't read "${file.name}".`)
      reader.readAsArrayBuffer(file)
      return
    }

    if (TEXT_EXTENSIONS.has(ext) || file.type.startsWith('text/')) {
      const reader = new FileReader()
      reader.onload = () => setText(String(reader.result ?? ''))
      reader.onerror = () => setFileError(`Couldn't read "${file.name}".`)
      reader.readAsText(file)
      return
    }

    setFileError(
      `"${file.name}" isn't a format that can be read directly yet — use Excel (.xlsx), CSV, or .txt, or paste the text instead.`,
    )
  }

  function findMatches() {
    reviewLines(parseBrief(text))
  }

  function updateRow(index: number, patch: Partial<ReviewRow>) {
    setRows((prev) => (prev ? prev.map((r, i) => (i === index ? { ...r, ...patch } : r)) : prev))
  }

  const matchedCount = rows?.filter((r) => r.garmentId !== null).length ?? 0
  const unmatchedCount = rows ? rows.length - matchedCount : 0
  const readyToImport = rows?.some((r) => r.checked && r.garmentId) ?? false

  function handleImport() {
    if (!rows) return
    const entries: ImportGarmentEntry[] = rows
      .filter((r) => r.checked && r.garmentId)
      .map((r) => {
        const price = Number(r.editedPrice)
        return { garmentId: r.garmentId!, price: r.editedPrice.trim() && price > 0 ? price : undefined }
      })
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
            Paste an email or product brief from the club, or upload a file, and it'll be matched
            against the garment library automatically. Anything that doesn't match gets flagged so
            nothing slips through silently.
          </DialogDescription>
        </DialogHeader>

        {!rows ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Brief text</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Upload file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
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
            {fileError ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">{fileError}</p>
            ) : (
              <p className="text-xs text-slate-400">
                Upload an Excel (.xlsx) or CSV file, upload a .txt file, or paste the text above.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {matchedCount} matched, {unmatchedCount} flagged for review. Price is optional — leave it
              blank to fill in later in Configure Store.
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
                          placeholder="Optional"
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
