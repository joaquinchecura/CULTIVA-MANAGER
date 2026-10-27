'use server'

import { prisma } from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'
import { QuickActionKey } from '@/lib/quick-actions'
import { revalidatePath } from 'next/cache'

export async function saveQuickActions(actions: QuickActionKey[]) {
  try {
    const { orgId, orgSlug } = await auth()
    
    if (!orgId) {
      console.error('❌ No hay orgId en la sesión')
      return { success: false, error: 'No hay organización activa' }
    }

    console.log('💾 Guardando accesos para la org:', orgId)
    console.log('📦 Acciones a guardar:', actions)

    // 👇 UPSERT: Si existe, actualiza. Si no existe, lo crea con datos básicos.
    const result = await prisma.gymConfig.upsert({
      where: { 
        // ⚠️ Ojo: esto funciona si tenés un @@unique o una relación 1-a-1.
        // Como tu schema actual NO tiene unique en organizationId, usamos otro approach.
        id: (await prisma.gymConfig.findFirst({ where: { organizationId: orgId } }))?.id || 'new',
      },
      update: {
        dashboardQuickActions: actions,
      },
      create: {
        organizationId: orgId,
        name: orgSlug ? orgSlug.charAt(0).toUpperCase() + orgSlug.slice(1) : 'Mi Gimnasio',
        dashboardQuickActions: actions,
      },
    })

    console.log('✅ GymConfig procesado. ID:', result.id)

    revalidatePath('/admin')
    revalidatePath('/admin/configuracion')
    
    return { success: true }
  } catch (e) {
    console.error('❌ Error al guardar:', e)
    return { success: false, error: 'Error de base de datos' }
  }
}