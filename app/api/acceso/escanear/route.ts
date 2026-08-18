import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { qrData } = await request.json()
    
    // qrData = "memberId:token"
    const [memberId, token] = qrData.split(':')
    
    if (!memberId || !token) {
      return NextResponse.json({ error: 'QR inválido' }, { status: 400 })
    }

    // Buscar el attendance con ese token y status ALLOWED
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

    // Verificar que el token no haya expirado (2 minutos)
    const tokenAge = Date.now() - attendance.entryTime.getTime()
    const maxAge = 2 * 60 * 1000 // 2 minutos
    
    if (tokenAge > maxAge) {
      // Invalidar token expirado
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { status: 'DENIED' },
      })
      return NextResponse.json({ error: 'QR expirado' }, { status: 400 })
    }

    // Verificar que el member tenga membresía activa
    const activeMembership = await prisma.membership.findFirst({
      where: {
        memberId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
    })

    if (!activeMembership && attendance.member.status !== 'ACTIVE') {
      return NextResponse.json({ 
        error: 'Membresía inactiva',
        member: attendance.member 
      }, { status: 403 })
    }

    // Marcar asistencia como completada
    await prisma.attendance.update({
      where: { id: attendance.id },
      data: { status: 'ALLOWED' }, // Ya estaba ALLOWED, podríamos agregar un campo "scannedAt"
    })

    return NextResponse.json({ 
      success: true, 
      message: '✅ Acceso permitido',
      member: {
        name: `${attendance.member.firstName} ${attendance.member.lastName}`,
        dni: attendance.member.dni,
        status: attendance.member.status,
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}