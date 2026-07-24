import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { ArrowRight, Plus, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfiguredGarmentCard } from '@/components/store-builder/ConfiguredGarmentCard'
import { AddGarmentDialog } from '@/components/store-builder/AddGarmentDialog'
import { ImportBriefDialog } from '@/components/store-builder/ImportBriefDialog'
import { useStoreProject } from '@/hooks/useStoreProject'

export function StoreBuilderConfigure() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const {
    project,
    club,
    configuredGarments,
    addGarments,
    importGarments,
    removeGarment,
    duplicateGarment,
    updateGarment,
    reorder,
    cloneFromClubProject,
  } = useStoreProject(projectId)

  const sourceGarments = searchParams.get('sourceGarments')
  const sourceClone = searchParams.get('sourceClone')
  const cloneSource = useStoreProject(sourceClone ?? undefined)
  const appliedRef = useRef(false)

  useEffect(() => {
    if (appliedRef.current) return
    if (sourceGarments) {
      appliedRef.current = true
      void addGarments(sourceGarments.split(',')).then(() => {
        searchParams.delete('sourceGarments')
        setSearchParams(searchParams, { replace: true })
      })
    } else if (sourceClone && cloneSource.configuredGarments.length > 0) {
      appliedRef.current = true
      void cloneFromClubProject(cloneSource.configuredGarments).then(() => {
        searchParams.delete('sourceClone')
        setSearchParams(searchParams, { replace: true })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceGarments, sourceClone, cloneSource.configuredGarments.length])

  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return configuredGarments.filter((cg) =>
      q ? [cg.garment.name, cg.customName ?? ''].some((v) => v.toLowerCase().includes(q)) : true,
    )
  }, [configuredGarments, search])

  const existingGarmentIds = useMemo(
    () => new Set(configuredGarments.map((cg) => cg.garmentId)),
    [configuredGarments],
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = configuredGarments.map((cg) => cg.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    void reorder(arrayMove(ids, oldIndex, newIndex))
  }

  if (!project) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading store project...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.projectName}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            Step 3 of 3 — Configure Store
            {club && <Badge variant="secondary">{club.clubCode}</Badge>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload /> Import Brief
          </Button>
          <Button variant="outline" onClick={() => setAddOpen(true)}>
            <Plus /> Add Garments
          </Button>
          <Button onClick={() => navigate(`/store-builder/${projectId}/preview`)}>
            Preview & Export <ArrowRight />
          </Button>
        </div>
      </div>

      <div className="relative sm:max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search this store's garments..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {configuredGarments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No garments yet. Add some from the library to get started.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload /> Import Brief
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus /> Add Garments
            </Button>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((cg) => cg.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {filtered.map((cg) => (
                <ConfiguredGarmentCard
                  key={cg.id}
                  configuredGarment={cg}
                  onUpdate={(patch) => updateGarment(cg.id, patch)}
                  onDuplicate={() => duplicateGarment(cg.id)}
                  onRemove={() => removeGarment(cg.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
        <Link to="/store-builder" className="hover:underline">
          &larr; Back to store setup
        </Link>
        <Link to={`/store-builder/${projectId}/preview`} className="text-brand-600 hover:underline">
          Continue to Preview &amp; Export &rarr;
        </Link>
      </div>

      <AddGarmentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existingGarmentIds={existingGarmentIds}
        onAdd={(garmentIds) => {
          void addGarments(garmentIds)
        }}
      />

      <ImportBriefDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingGarmentIds={existingGarmentIds}
        onImport={(entries) => {
          void importGarments(entries)
        }}
      />
    </div>
  )
}
