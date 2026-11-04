// app/sin-acceso/page.tsx
// Destino de las páginas del admin cuando hay sesión pero no hay una organización
// utilizable. Vive fuera de /admin a propósito: así nunca puede formar un loop con
// requireOrgForPage(), que solo manda acá cuando la organización NO es utilizable,
// mientras que esta página solo manda a /admin cuando SÍ lo es.
export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OrganizationList, OrganizationSwitcher, SignOutButton } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

export default async function SinAccesoPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect('/login')

  // Si la organización activa ya es válida, no hay nada que resolver acá.
  let org: { status: string } | null = null
  if (orgId) {
    org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { status: true },
    })
    if (org?.status === 'ACTIVE') redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-[#F6FDF7] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full text-center">
        {!orgId ? (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Seleccioná tu organización</h1>
            <p className="text-slate-500 mb-6 text-sm">
              Para continuar, elegí la organización a la que pertenecés.
            </p>
            <OrganizationList
              hidePersonal
              afterSelectOrganizationUrl="/admin"
              afterCreateOrganizationUrl="/admin"
            />
          </>
        ) : !org ? (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Organización no habilitada</h1>
            <p className="text-slate-500 mb-4 text-sm">
              Tu organización todavía no está dada de alta en el sistema. Contactá al administrador.
            </p>
            <p className="text-[11px] text-slate-400 mb-6 break-all">ID: {orgId}</p>
            <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/admin" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Cuenta suspendida</h1>
            <p className="text-slate-500 mb-6 text-sm">
              El acceso de tu organización está suspendido. Contactá al administrador.
            </p>
            <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/admin" />
          </>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100">
          <SignOutButton redirectUrl="/login">
            <button className="text-sm text-slate-500 hover:text-slate-800">Cerrar sesión</button>
          </SignOutButton>
        </div>
      </div>
    </div>
  )
}
