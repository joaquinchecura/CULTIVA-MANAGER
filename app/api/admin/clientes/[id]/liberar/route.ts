import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, error } = await requireOrg()
  if (error) return error

  const { id } = await params

  const existing = await prisma.member.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const member = await prisma.member.update({
    where: { id },
    data: { organizationId: null, status: 'INACTIVE' },
  })

  return NextResponse.json({ success: true, member })
}