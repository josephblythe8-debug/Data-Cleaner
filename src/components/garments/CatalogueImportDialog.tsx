import { useMemo, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { ParsedCatalogueRow } from '@/lib/catalogueParser'
import type { CatalogueImportResult } from '@/hooks/useGarments'
import type { SizeTemplateKey } from '@/lib/sizeTemplates'
import { SIZE_TEMPLATE_LABELS } from '@/lib/sizeTemplates'

interface CatalogueImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingKeys: Set<string>
  onImport: (rows: ParsedCatalogueRow[]) => Promise<CatalogueImportResult>
}

const SPREADSHEET_EXTENSIONS = new Set(['xlsx', 'xls', 'xlsm'])
const TEXT_EXTENSIONS = new Set(['csv', 'tsv'])

function extensionOf(filename: string): string {
  return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
}

function keyOf(rangeCode: string, styleCode: string): string {
  return `${rangeCode.trim().toUpperCase()}|${styleCode.trim().toUpperCase()}`
}

export function CatalogueImportDialog({ open, onOpenChange, existingKeys, onImport }: CatalogueImportDialogProps) {
  const [rows, setRows] = useState<ParsedCatalogueRow[] | null>(null)
  const [knownCategories, setKnownCategories] = useState<string[]>(['Uncategorised'])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CatalogueImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setRows(null)
    setError(null)
    setResult(null)
  }

  async function handleFile(file: File) {
    setError(null)
    const ext = extensionOf(file.name)
    if (!SPREADSHEET_EXTENSIONS.has(ext) && !TEXT_EXTENSIONS.has(ext)) {
      setError(`"${file.name}" isn't a spreadsheet — upload the catalogue export as .xlsx or .csv.`)
      return
    }

    const reader = new FileReader()
    reader.onerror = () => setError(`Couldn't read "${file.name}".`)
    reader.onload = () => {
      void (async () => {
        try {
          const [{ read }, { parseCatalogue, KNOWN_CATEGORIES }] = await Promise.all([
            import('xlsx'),
            import('@/lib/catalogueParser'),
          ])
          const workbook = read(reader.result, { type: 'array' })
          const parsed = parseCatalogue(workbook)
          if (parsed.length === 0) {
            setError(`No rows found in "${file.name}" — check it has Range Code, Style Code and Style Name columns.`)
            return
          }
          setKnownCategories(KNOWN_CATEGORIES)
          setRows(parsed)
        } catch (e) {
          setError(e instanceof Error ? e.message : `Couldn't read "${file.name}" as a catalogue export.`)
        }
      })()
    }
    reader.readAsArrayBuffer(file)
  }

  // Grouped by inferred category so a coordinator can bulk-fix a whole
  // group at once (e.g. every "Uncategorised" row) instead of row-by-row.
  const groups = useMemo(() => {
    if (!rows) return []
    const byCategory = new Map<string, ParsedCatalogueRow[]>()
    for (const row of rows) {
      const list = byCategory.get(row.category) ?? []
      list.push(row)
      byCategory.set(row.category, list)
    }
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [rows])

  const newCount = rows?.filter((r) => !existingKeys.has(keyOf(r.rangeCode, r.styleCode))).length ?? 0
  const updateCount = (rows?.length ?? 0) - newCount

  function updateGroup(category: string, patch: Partial<Pick<ParsedCatalogueRow, 'category' | 'sizeTemplate' | 'allowKids' | 'allowAdults'>>) {
    setRows((prev) => (prev ? prev.map((r) => (r.category === category ? { ...r, ...patch } : r)) : prev))
  }

  async function handleImport() {
    if (!rows) return
    setImporting(true)
    try {
      const res = await onImport(rows)
      setResult(res)
      setRows(null)
    } finally {
      setImporting(false)
    }
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
          <DialogTitle>Import Catalogue</DialogTitle>
          <DialogDescription>
            Upload the ClubHub product list export to bulk-load the Garment Library — Range Code,
            Range Name, Style Code and Style Name are read directly. Category and Kids/Adults sizing
            aren't in that export, so they're guessed from the Style Name and shown here to fix
            before anything is saved.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-2 py-4 text-center">
            <p className="text-lg font-semibold">Import complete</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {result.created} garment{result.created === 1 ? '' : 's'} added, {result.updated} updated.
            </p>
          </div>
        ) : !rows ? (
          <div className="flex flex-col gap-3">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload catalogue file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
                e.target.value = ''
              }}
            />
            {error && <p className="text-xs text-amber-700 dark:text-amber-400">{error}</p>}
            <p className="text-xs text-slate-400">Accepts .xlsx, .xls or .csv exported from ClubHub.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {rows.length} rows found — {newCount} new, {updateCount} already in the library (name will
              be refreshed, category/sizing left as-is).
            </p>
            <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
              {groups.map(([category, groupRows]) => (
                <div key={category} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {category} <span className="text-slate-400">({groupRows.length})</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Select value={category} onValueChange={(v) => updateGroup(category, { category: v })}>
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...new Set([category, ...knownCategories])].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={groupRows[0].sizeTemplate}
                        onValueChange={(v) => updateGroup(category, { sizeTemplate: v as SizeTemplateKey })}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
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
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Switch
                          checked={groupRows[0].allowKids}
                          onCheckedChange={(v) => updateGroup(category, { allowKids: v })}
                        />
                        Kids
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Switch
                          checked={groupRows[0].allowAdults}
                          onCheckedChange={(v) => updateGroup(category, { allowAdults: v })}
                        />
                        Adults
                      </label>
                    </div>
                  </div>
                  <ul className="mt-2 flex flex-col gap-0.5">
                    {groupRows.map((r) => (
                      <li key={`${r.rangeCode}-${r.styleCode}`} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono text-slate-400">{r.rangeCode}-{r.styleCode}</span>
                        <span>{r.styleName}</span>
                        {existingKeys.has(keyOf(r.rangeCode, r.styleCode)) && (
                          <span className="text-slate-400">(already in library)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : rows ? (
            <>
              <Button type="button" variant="outline" onClick={() => setRows(null)}>
                Back
              </Button>
              <Button type="button" onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : `Import ${rows.length} garments`}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
