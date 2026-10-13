import { requireOrgForPage } from '@/lib/get-org'
import ReportesList from './ReportesList'

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  await requireOrgForPage()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Reportes</h2>
        <p className="text-slate-500 mt-1">Generación y exportación de informes en CSV (se abre en Excel)</p>
      </div>
      <ReportesList />
    </div>
  )
}