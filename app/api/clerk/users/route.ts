import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server' // <-- CAMBIO
import { requireOrg } from '@/lib/get-org'

export async function GET() {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const client = await clerkClient() // <-- CAMBIO (es asíncrono)
    
    // Buscar miembros de la organización
    const { data: memberships } = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    })

    // Mapear los datos para devolver algo limpio
    const users = memberships.map((m) => ({
      id: m.publicUserData?.userId,
      firstName: m.publicUserData?.firstName,
      lastName: m.publicUserData?.lastName,
      email: m.publicUserData?.identifier,
      role: m.role,
    }))

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error al obtener usuarios de Clerk:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}