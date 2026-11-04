import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// /sign-up tiene que ser pública: es donde aterriza el profesional invitado
// (link con __clerk_ticket) para crear su contraseña. Si no, auth.protect() lo
// manda a /login, que no tiene "Registrate", y nunca puede crear la cuenta.
const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}