// app/admin/configuracion/page.tsx
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import BackupButton from '@/components/admin/BackupButton'
import { ShareRegistrationLink } from '@/components/ShareRegistrationLink'
import { Settings, DatabaseBackup, Building2, LayoutGrid } from 'lucide-react'
import { QuickActionsEditor } from '../components/QuickActionsEditor'
import { GymNameForm } from '../components/GymNameForm'
import { saveQuickActions } from '../quick-actions-actions'
import { saveGymName } from './actions'

export default async function ConfiguracionPage() {
  const { orgId, sessionClaims } = await auth()
  if (!orgId) redirect('/sin-acceso')

  const metadata = sessionClaims?.publicMetadata as { platformAdmin?: boolean } | undefined
  const isPlatformAdmin = metadata?.platformAdmin === true

  let config = await prisma.gymConfig.findFirst({ where: { organizationId: orgId } })

  // Si no existe, lo creamos usando el nombre de la organización de Clerk
  if (!config) {
    const clerk = await clerkClient()
    const org = await clerk.organizations.getOrganization({ organizationId: orgId })
    config = await prisma.gymConfig.create({
      data: {
        organizationId: orgId,
        name: org.name || 'Mi Gimnasio',
        timezone: 'America/Argentina/Buenos_Aires',
        dashboardQuickActions: ['clientes', 'rutinas', 'agenda', 'pagos'],
      },
    })
  }

  const initialActions = (config?.dashboardQuickActions as any) ?? [
    'clientes', 'rutinas', 'agenda', 'pagos',
  ]

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings size={24} className="text-blue-600" />
          Configuración
        </h2>
        <p className="text-slate-500 mt-1">Datos del gimnasio, accesos rápidos y respaldo</p>
      </div>

      <ShareRegistrationLink />

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <LayoutGrid size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Accesos rápidos del Panel de Control</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Elegí qué tarjetas querés ver en la pantalla de Inicio.
            </p>
          </div>
        </div>
        <QuickActionsEditor initialActions={initialActions} onSave={saveQuickActions} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <DatabaseBackup size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Descargar mis datos</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Descargá un archivo con tus clientes, membresías, pagos, rutinas y asistencias, listo para abrir en Excel.
            </p>
          </div>
        </div>
        <BackupButton endpoint="/api/backup" label="Descargar mis datos" />
      </div>

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
              </p>
            </div>
          </div>
          <BackupButton endpoint="/api/admin/backup" label="Backup completo (admin)" />
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Datos del gimnasio</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Este nombre aparece en los emails que reciben tus clientes.
              {config?.timezone && ` Zona horaria: ${config.timezone}`}
            </p>
          </div>
        </div>
        <GymNameForm initialName={config?.name ?? ''} onSave={saveGymName} />
      </div>
    </div>
  )
}