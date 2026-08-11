import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    total,
    nuevosEsteMes,
    bajasEsteMes,
    allMembers,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.member.count({ 
      where: { 
        status: 'INACTIVE',
        updatedAt: { gte: startOfMonth }
      } 
    }),
    prisma.member.findMany({
      select: { city: true, createdAt: true, status: true, birthDate: true },
    }),
  ])

  // Agrupar por ciudad
  const porCiudad: Record<string, number> = {}
  allMembers.forEach(m => {
    if (m.city) {
      porCiudad[m.city] = (porCiudad[m.city] || 0) + 1
    }
  })

  // Agrupar por mes (últimos 6 meses)
  const porMes: { mes: string; cantidad: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('es-AR', { month: 'short' })
    const count = allMembers.filter(m => {
      const cm = new Date(m.createdAt)
      return cm.getFullYear() === d.getFullYear() && cm.getMonth() === d.getMonth()
    }).length
    porMes.push({ mes: label, cantidad: count })
  }

  // Calcular retención (activos / total)
  const activos = allMembers.filter(m => m.status === 'ACTIVE').length
  const retencion = total > 0 ? Math.round((activos / total) * 100) : 0

  return NextResponse.json({
    total,
    nuevosEsteMes,
    bajasEsteMes,
    porCiudad,
    porMes,
    retencion,
  })
}