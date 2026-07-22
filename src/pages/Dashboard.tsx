import { Link } from 'react-router-dom'
import { ArrowRight, LayoutTemplate, Plus, Shirt, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGarments } from '@/hooks/useGarments'
import { useBlueprints } from '@/hooks/useBlueprints'
import { useStoreProjects } from '@/hooks/useStoreProjects'
import { useClubs } from '@/hooks/useClubs'

function Kpi({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Shirt }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-3xl font-semibold">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { garments } = useGarments()
  const { blueprints } = useBlueprints()
  const { projects } = useStoreProjects()
  const { clubs } = useClubs()

  const clubById = new Map(clubs.map((c) => [c.id, c]))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Build a new club store in minutes, not hours.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/store-builder">
            <Plus /> Create New Store
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Total Garments" value={garments.length} icon={Shirt} />
        <Kpi label="Total Blueprints" value={blueprints.length} icon={LayoutTemplate} />
        <Kpi label="Total Stores Created" value={projects.length} icon={Store} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Link to="/store-builder" className="text-sm text-brand-600 hover:underline">
              New store <ArrowRight className="inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {projects.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No store projects yet. Create your first one.
              </p>
            )}
            {projects.slice(0, 6).map((project) => {
              const club = clubById.get(project.clubId)
              return (
                <Link
                  key={project.id}
                  to={`/store-builder/${project.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <div>
                    <p className="font-medium">{project.projectName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {club ? `${club.clubName} · ${club.clubCode}` : 'Unknown club'}
                    </p>
                  </div>
                  {club && <Badge variant="secondary">{club.sport}</Badge>}
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Saved Blueprints</CardTitle>
            <Link to="/blueprints" className="text-sm text-brand-600 hover:underline">
              Manage <ArrowRight className="inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {blueprints.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No blueprints yet.
              </p>
            )}
            {blueprints.slice(0, 6).map((bp) => (
              <div
                key={bp.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800"
              >
                <p className="font-medium">{bp.name}</p>
                <Badge variant="secondary">{bp.sport}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Garment Library</CardTitle>
          <Link to="/garments" className="text-sm text-brand-600 hover:underline">
            View all <ArrowRight className="inline h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {garments.slice(0, 8).map((g) => (
              <div key={g.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="truncate text-sm font-medium">{g.name}</p>
                <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {g.rangeCode}-{g.styleCode}-{g.colourCode}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
