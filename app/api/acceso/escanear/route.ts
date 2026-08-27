import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { qrData } = await request.json()

    const [memberId, token] = qrData.split(':')

    if (!memberId || !token) {
      return NextResponse.json({ error: 'QR inválido' }, { status: 400 })
    }

    const attendance = await prisma.attendance.findFirst({
      where: {
        memberId,
        qrToken: token,
        status: 'PENDING',
      },
      include: { member: true },
    })

    if (!attendance) {
      return NextResponse.json({ error: 'QR expirado o ya utilizado' }, { status: 400 })
    }

    // entryTime acá todavía es la hora de GENERACIÓN del QR (seteada en generar-qr)
    const tokenAge = Date.now() - attendance.entryTime.getTime()
    const maxAge = 2 * 60 * 1000

    if (tokenAge > maxAge) {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { status: 'DENIED' },
      })
      return NextResponse.json({ error: 'QR expirado' }, { status: 400 })
    }

    const activeMembership = await prisma.membership.findFirst({
      where: {
        memberId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
    })

    if (!activeMembership && attendance.member.status !== 'ACTIVE') {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { status: 'DENIED' },
      })
      return NextResponse.json({
        error: 'Membresía inactiva',
        member: attendance.member,
      }, { status: 403 })
    }

    // Ahora sí: entryTime pasa a ser la hora REAL del escaneo/ingreso
    await prisma.attendance.update({
      where: { id: attendance.id },
      data: { status: 'ALLOWED', entryTime: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: '✅ Acceso permitido',
      member: {
        name: `${attendance.member.firstName} ${attendance.member.lastName}`,
        email: attendance.member.email,
        dni: attendance.member.dni,
        status: attendance.member.status,
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}