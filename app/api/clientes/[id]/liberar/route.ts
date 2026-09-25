import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { id } = await params

    // Solo puede liberar un cliente que hoy sea de SU organización
    const result = await prisma.member.updateMany({
      where: { id, organizationId: orgId },
      data: { organizationId: null },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Cliente liberado correctamente' })
  } catch (error) {
    console.error('Error liberando cliente:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}