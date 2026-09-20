// app/admin/configuracion/page.tsx
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import BackupButton from '@/components/admin/BackupButton'
import { ShareRegistrationLink } from '@/components/ShareRegistrationLink'
import { Settings, DatabaseBackup, Building2 } from 'lucide-react'

export default async function ConfiguracionPage() {
  const { orgId, sessionClaims } = await auth()
  if (!orgId) redirect('/login')

  const metadata = sessionClaims?.publicMetadata as { platformAdmin?: boolean } | undefined
  const isPlatformAdmin = metadata?.platformAdmin === true

  const config = await prisma.gymConfig.findFirst({ where: { organizationId: orgId } })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings size={24} className="text-blue-600" />
          Configuración
        </h2>
        <p className="text-slate-500 mt-1">Datos del gimnasio y respaldo de la base de datos</p>
      </div>

      {/* Link de registro para clientes */}
      <ShareRegistrationLink />

      {/* Backup propio — visible para cualquier profesional */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <DatabaseBackup size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Descargar mis datos</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Descargá un archivo con tus clientes, membresías, pagos, rutinas y asistencias, listo para abrir en Excel.
              Recomendado hacerlo periódicamente.
            </p>
          </div>
        </div>
        <BackupButton endpoint="/api/backup" label="Descargar mis datos" />
      </div>

      {/* Backup total de plataforma — solo visible para el admin de plataforma */}
      {isPlatformAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <DatabaseBackup size={20} className="text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Backup de toda la plataforma</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Descarga un archivo con todos los profesionales, clientes, membresías, pagos, rutinas y ejercicios de toda la plataforma.
                Recomendado hacerlo periódicamente, sobre todo antes de cambios grandes en el sistema.
              </p>
            </div>
          </div>
          <BackupButton endpoint="/api/admin/backup" label="Backup completo (admin)" />
        </div>
      )}

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