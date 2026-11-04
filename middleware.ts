import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Rutas que no requieren autenticación
const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-up(.*)',
  '/select-org(.*)', // Ruta para elegir organización
])

export default clerkMiddleware(async (auth, req) => {
  // Si es una ruta pública, dejar pasar
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Obtener la sesión
  const session = await auth()

  // 1. Si no hay usuario, redirigir al login
  if (!session.userId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 2. Si hay usuario pero no hay organización, redirigir a seleccionar org
  if (!session.orgId) {
    return NextResponse.redirect(new URL('/select-org', req.url))
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}