import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function RedirectPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  // Buscar si el usuario es un cliente
  const member = await prisma.member.findFirst({
    where: { clerkUserId: userId },
  })

  if (member) {
    if (member.status === 'PENDING') {
      // Cliente pendiente → mostrar mensaje de espera
      redirect('/clientes/pendiente')
    }
    // Cliente autorizado → WebApp
    redirect('/clientes')
  } else {
    // No es cliente → asumimos admin
    redirect('/admin')
  }
}