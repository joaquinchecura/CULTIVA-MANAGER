import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function RedirectPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/login')
  }

  // Buscar si el usuario es un cliente (member)
  const member = await prisma.member.findFirst({
    where: { clerkUserId: userId },
  })

  if (member) {
    // Es cliente → WebApp
    redirect('/clientes')
  } else {
    // Es admin → Dashboard
    redirect('/admin')
  }
}