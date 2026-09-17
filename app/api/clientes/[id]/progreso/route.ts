import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { id } = await params

    // Verificar que el member sea de esta organización antes de traer sus datos
    const member = await prisma.member.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    })
    if (!member) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const records = await prisma.bodyComposition.findMany({
      where: { memberId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { id } = await params
    const data = await request.json()

    // Verificar que el member existe Y es de esta organización
    const member = await prisma.member.findFirst({ where: { id, organizationId: orgId } })
    if (!member) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Calcular BMI
    let bmi = null
    if (data.weight && data.height) {
      const weightKg = Number(data.weight)
      const heightM = Number(data.height) / 100
      bmi = Number((weightKg / (heightM * heightM)).toFixed(2))
    }

    const record = await prisma.bodyComposition.create({
      data: {
        memberId: id,
        weight: data.weight,
        height: data.height || null,
        bmi,
        bodyFatPercent: data.bodyFatPercent || null,
        musclePercent: data.musclePercent || null,
        waterPercent: data.waterPercent || null,
        visceralFat: data.visceralFat || null,
        basalMetabolism: data.basalMetabolism || null,
        metabolicAge: data.metabolicAge || null,
        waist: data.waist || null,
        hip: data.hip || null,
        arm: data.arm || null,
        chest: data.chest || null,
        targetWeight: data.targetWeight || null,
        notes: data.notes || null,
        recordedBy: 'trainer',
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}