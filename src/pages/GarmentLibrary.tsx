import { useMemo, useState } from 'react'
import { Archive, ArchiveRestore, Pencil, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GarmentFormDialog } from '@/components/garments/GarmentFormDialog'
import { useGarments, type GarmentInput } from '@/hooks/useGarments'
import { SIZE_TEMPLATE_LABELS } from '@/lib/sizeTemplates'
import type { Garment } from '@/lib/types'

export function GarmentLibrary() {
  const { garments, addGarment, updateGarment, archiveGarment, unarchiveGarment } = useGarments()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGarment, setEditingGarment] = useState<Garment | undefined>(undefined)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return garments
      .filter((g) => (showArchived ? true : g.active))
      .filter((g) =>
        q ? [g.name, g.rangeCode, g.styleCode, g.category].some((v) => v.toLowerCase().includes(q)) : true,
      )
  }, [garments, search, showArchived])

  function openAdd() {
    setEditingGarment(undefined)
    setDialogOpen(true)
  }

  function openEdit(garment: Garment) {
    setEditingGarment(garment)
    setDialogOpen(true)
  }

  async function handleSubmit(input: GarmentInput) {
    if (editingGarment) {
      await updateGarment(editingGarment.id, input)
    } else {
      await addGarment(input)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Garment Library</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            The master catalogue of garments products are generated from.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus /> Add Garment
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search garments..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Show archived
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((garment) => (
          <Card key={garment.id} className={!garment.active ? 'opacity-60' : undefined}>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{garment.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{garment.category}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(garment)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      garment.active ? archiveGarment(garment.id) : unarchiveGarment(garment.id)
                    }
                  >
                    {garment.active ? (
                      <Archive className="h-4 w-4" />
                    ) : (
                      <ArchiveRestore className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="rounded-md bg-slate-100 px-2 py-1.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {garment.rangeCode}-{garment.styleCode}
              </p>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{SIZE_TEMPLATE_LABELS[garment.sizeTemplate]}</Badge>
                {garment.allowKids && <Badge variant="secondary">Kids</Badge>}
                {garment.allowAdults && <Badge variant="secondary">Adults</Badge>}
                {!garment.active && <Badge variant="destructive">Archived</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No garments match your search.
          </p>
        )}
      </div>

      <GarmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        garment={editingGarment}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
