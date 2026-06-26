import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function RedirectPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  redirect('/admin')
}