import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function RedirectPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  // Buscar si el usuario es un cliente (member)
  const member = await prisma.member.findFirst({
    where: { clerkUserId: userId },
  })

  if (member) {
    // Es cliente autorizado → WebApp
    redirect('/clientes')
  } else {
    // Verificar si es admin (no existe en members)
    // TODO: Podríamos verificar si tiene un rol específico en Clerk
    redirect('/admin')
  }
}