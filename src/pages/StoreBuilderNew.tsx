import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GarmentChecklist } from '@/components/store-builder/GarmentChecklist'
import { useClubs, type ClubInput } from '@/hooks/useClubs'
import { useStoreProjects } from '@/hooks/useStoreProjects'

const EMPTY_CLUB: ClubInput = { clubName: '', clubCode: '', sport: '', supplier: '' }

type Source = 'select' | 'clone'

export function StoreBuilderNew() {
  const navigate = useNavigate()
  const { addClub } = useClubs()
  const { createProject, projects } = useStoreProjects()

  const [club, setClub] = useState<ClubInput>(EMPTY_CLUB)
  const [source, setSource] = useState<Source>('select')
  const [selectedGarmentIds, setSelectedGarmentIds] = useState<Set<string>>(new Set())
  const [cloneProjectId, setCloneProjectId] = useState<string>('')
  const [creating, setCreating] = useState(false)

  function toggleGarment(garmentId: string) {
    setSelectedGarmentIds((prev) => {
      const next = new Set(prev)
      if (next.has(garmentId)) next.delete(garmentId)
      else next.add(garmentId)
      return next
    })
  }

  const isClubValid = club.clubName.trim() && club.clubCode.trim() && club.sport.trim() && club.supplier.trim()
  const canSubmit = isClubValid && (source === 'select' || (source === 'clone' && cloneProjectId))

  async function handleCreate() {
    if (!canSubmit) return
    setCreating(true)
    try {
      const newClub = await addClub({ ...club, clubCode: club.clubCode.toUpperCase() })
      const project = await createProject(newClub.id, `${newClub.clubName} Store`)
      const params = new URLSearchParams()
      if (source === 'select' && selectedGarmentIds.size > 0) {
        params.set('sourceGarments', [...selectedGarmentIds].join(','))
      }
      if (source === 'clone') params.set('sourceClone', cloneProjectId)
      const qs = params.toString()
      navigate(`/store-builder/${project.id}${qs ? `?${qs}` : ''}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create New Store</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Step 1 of 3 — Create the club</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Club Details</CardTitle>
          <CardDescription>These become the {'{TEAM}'} segment of every SKU.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="clubName">Club Name</Label>
            <Input
              id="clubName"
              placeholder="Eastern Districts Cricket Club"
              value={club.clubName}
              onChange={(e) => setClub({ ...club, clubName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="clubCode">Club Code</Label>
            <Input
              id="clubCode"
              placeholder="ETDC"
              value={club.clubCode}
              onChange={(e) => setClub({ ...club, clubCode: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sport">Sport</Label>
            <Input
              id="sport"
              placeholder="Cricket"
              value={club.sport}
              onChange={(e) => setClub({ ...club, sport: e.target.value })}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              placeholder="O'Neills"
              value={club.supplier}
              onChange={(e) => setClub({ ...club, supplier: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Garments</CardTitle>
          <CardDescription>Step 2 of 3 — which garments does this club need?</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={source} onValueChange={(v) => setSource(v as Source)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">Select Garments</TabsTrigger>
              <TabsTrigger value="clone">Clone Existing Club</TabsTrigger>
            </TabsList>
            <TabsContent value="select">
              <GarmentChecklist selected={selectedGarmentIds} onToggle={toggleGarment} />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Colours and sizes are set per club in the next step — leave everything unticked to start blank.
              </p>
            </TabsContent>
            <TabsContent value="clone" className="flex flex-col gap-2">
              <Label>Clone garment configuration from</Label>
              <Select value={cloneProjectId} onValueChange={setCloneProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an existing store..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Copies garments, colours and sizes from that store. SKUs regenerate automatically against
                the new club code — nothing is copied verbatim.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Button size="lg" onClick={handleCreate} disabled={!canSubmit || creating}>
        Continue to Store Builder
      </Button>
    </div>
  )
}
