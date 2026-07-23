import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Download, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useStoreProject } from '@/hooks/useStoreProject'
import { generateProducts } from '@/lib/productGenerator'
import { validateStoreProject } from '@/lib/validation'
import { renderCsv } from '@/lib/csvExport'

export function Preview() {
  const { projectId } = useParams<{ projectId: string }>()
  const { project, club, configuredGarments } = useStoreProject(projectId)

  const products = useMemo(
    () =>
      generateProducts(configuredGarments, {
        clubCode: club?.clubCode ?? '',
        clubName: club?.clubName ?? '',
      }),
    [configuredGarments, club?.clubCode, club?.clubName],
  )

  const validation = useMemo(
    () => validateStoreProject(club, configuredGarments, products),
    [club, configuredGarments, products],
  )

  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0)

  function handleDownload() {
    const csv = renderCsv(products, club)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${club?.clubCode ?? 'store'}-bigcommerce-import.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!project) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading store project...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Preview &amp; Export</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {project.projectName} {club && `· ${club.clubCode}`}
          </p>
        </div>
        <Button size="lg" onClick={handleDownload} disabled={!validation.isValid}>
          <Download /> Download BigCommerce CSV
        </Button>
      </div>

      {validation.errors.length > 0 && (
        <Card className="border-red-300 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-5 w-5" /> Blocking errors — export disabled
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {validation.errors.map((err, i) => (
              <p key={i} className="text-sm text-red-700 dark:text-red-400">
                {err.message}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {validation.warnings.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" /> Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {validation.warnings.map((warn, i) => (
              <p key={i} className="text-sm text-amber-700 dark:text-amber-400">
                {warn.message}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Products</p>
            <p className="mt-1 text-3xl font-semibold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Variants</p>
            <p className="mt-1 text-3xl font-semibold">{totalVariants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total SKUs</p>
            <p className="mt-1 text-3xl font-semibold">{products.length + totalVariants}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {products.map((product) => (
          <Card key={product.productId}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{product.productName}</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">{product.category}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {product.ageGroup !== 'all' && (
                  <Badge variant="secondary">{product.ageGroup === 'adults' ? 'Adults' : 'Kids'}</Badge>
                )}
                <Badge variant="outline">{product.variants.length} variants</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                Parent SKU: {product.parentSku}
              </p>
              {product.variants.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">No sizes selected.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((v) => (
                    <span
                      key={v.sku}
                      className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      title={v.sizeLabel}
                    >
                      {v.sku}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Link
        to={`/store-builder/${projectId}`}
        className="flex items-center gap-1 text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to store configuration
      </Link>
    </div>
  )
}
