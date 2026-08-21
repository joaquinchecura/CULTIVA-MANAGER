// app/admin/configuracion/page.tsx
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import BackupButton from '@/components/admin/BackupButton' 
import { Settings, DatabaseBackup, Building2 } from 'lucide-react'

export default async function ConfiguracionPage() {
  const config = await prisma.gymConfig.findFirst()

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings size={24} className="text-blue-600" />
          Configuración
        </h2>
        <p className="text-slate-500 mt-1">Datos del gimnasio y respaldo de la base de datos</p>
      </div>

      {/* Backup */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <DatabaseBackup size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Backup de la base de datos</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Descarga un archivo JSON con todos los clientes, membresías, pagos, rutinas y ejercicios.
              Recomendado hacerlo periódicamente, sobre todo antes de cambios grandes en el sistema.
            </p>
          </div>
        </div>
        <BackupButton />
      </div>

      {/* Datos del gimnasio */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Datos del gimnasio</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Nombre: <strong>{config?.name || 'Sin configurar'}</strong>
              {config?.timezone && ` · Zona horaria: ${config.timezone}`}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Edición de estos datos disponible próximamente.
        </p>
      </div>
    </div>
  )
}