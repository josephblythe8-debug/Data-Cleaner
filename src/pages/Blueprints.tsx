import { useMemo, useState } from 'react'
import { Copy, LayoutTemplate, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BlueprintFormDialog } from '@/components/blueprints/BlueprintFormDialog'
import { useBlueprints } from '@/hooks/useBlueprints'
import type { Blueprint } from '@/lib/types'

export function Blueprints() {
  const { blueprints, blueprintGarments, createBlueprint, updateBlueprintGarments, updateBlueprint, cloneBlueprint, deleteBlueprint } =
    useBlueprints()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBlueprint, setEditingBlueprint] = useState<Blueprint | undefined>(undefined)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return blueprints.filter((b) => (q ? b.name.toLowerCase().includes(q) || b.sport.toLowerCase().includes(q) : true))
  }, [blueprints, search])

  function garmentCount(blueprintId: string) {
    return blueprintGarments.filter((bg) => bg.blueprintId === blueprintId).length
  }

  function openCreate() {
    setEditingBlueprint(undefined)
    setDialogOpen(true)
  }

  function openEdit(blueprint: Blueprint) {
    setEditingBlueprint(blueprint)
    setDialogOpen(true)
  }

  async function handleSubmit(input: { name: string; sport: string }, garmentIds: string[]) {
    if (editingBlueprint) {
      await updateBlueprint(editingBlueprint.id, input)
      await updateBlueprintGarments(editingBlueprint.id, garmentIds)
    } else {
      await createBlueprint(input, garmentIds)
    }
  }

  async function handleClone(blueprint: Blueprint) {
    const newName = window.prompt('Name for the cloned blueprint', `${blueprint.name} Copy`)
    if (!newName) return
    await cloneBlueprint(blueprint.id, newName)
  }

  async function handleDelete(blueprint: Blueprint) {
    if (!window.confirm(`Delete blueprint "${blueprint.name}"? This cannot be undone.`)) return
    await deleteBlueprint(blueprint.id)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blueprints</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Reusable product packs — build once, apply to any club.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Create Blueprint
        </Button>
      </div>

      <div className="relative sm:max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search blueprints..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((blueprint) => (
          <Card key={blueprint.id}>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                  <LayoutTemplate className="h-4 w-4" />
                </span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(blueprint)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleClone(blueprint)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(blueprint)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="font-semibold">{blueprint.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {garmentCount(blueprint.id)} garments
                </p>
              </div>
              <Badge variant="secondary" className="w-fit">
                {blueprint.sport}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No blueprints match your search.
          </p>
        )}
      </div>

      <BlueprintFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        blueprint={editingBlueprint}
        initialGarmentIds={
          editingBlueprint
            ? blueprintGarments
                .filter((bg) => bg.blueprintId === editingBlueprint.id)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((bg) => bg.garmentId)
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </div>
  )
}
