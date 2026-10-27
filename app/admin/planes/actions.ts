'use server'

import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const planSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'PER_CLASS']),
  pack: z.enum(['GYM_ONLY', 'CLASSES_ONLY', 'GYM_CLASSES', 'PERSONAL_TRAINER', 'FULL']),
  price: z.coerce.number().min(0),
  durationDays: z.coerce.number().min(1),
  classesIncluded: z.coerce.number().min(0),
  description: z.string().optional().nullable(),
})

export async function updatePlanAction(formData: FormData) {
  try {
    const { orgId } = await requireOrg()
    const rawData = Object.fromEntries(formData.entries())
    const data = planSchema.parse(rawData)

    const existingPlan = await prisma.plan.findFirst({
      where: { id: data.id, organizationId: orgId },
    })

    if (!existingPlan) return { success: false, error: 'Plan no encontrado' }

    await prisma.plan.update({
      where: { id: data.id },
      data: {
        name: data.name,
        type: data.type,
        pack: data.pack,
        price: data.price,
        durationDays: data.durationDays,
        classesIncluded: data.classesIncluded,
        description: data.description,
      },
    })

    revalidatePath('/admin/planes')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error al actualizar' }
  }
}