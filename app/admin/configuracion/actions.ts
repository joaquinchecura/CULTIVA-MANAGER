'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function saveGymName(name: string) {
  const { orgId } = await auth()
  if (!orgId) return { success: false, error: 'No hay organización activa' }

  const clean = name.trim().slice(0, 80)
  if (clean.length < 2) return { success: false, error: 'El nombre es muy corto' }

  // updateMany filtrado por org: no hace falta un @unique y no toca otras organizaciones
  const r = await prisma.gymConfig.updateMany({
    where: { organizationId: orgId },
    data: { name: clean },
  })
  if (r.count === 0) {
    await prisma.gymConfig.create({ data: { organizationId: orgId, name: clean } })
  }

  revalidatePath('/admin/configuracion')
  return { success: true }
}