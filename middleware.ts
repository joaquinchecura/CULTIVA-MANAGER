import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const session = await auth()
    if (!session.userId) {
      return session.redirectToSignIn()
    }
    // Si tiene sesión pero no organización, lo dejamos pasar igual 
    // (o podrías redirigirlo a una página de "contactá al admin")
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}