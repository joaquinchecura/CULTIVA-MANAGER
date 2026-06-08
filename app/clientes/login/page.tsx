'use client'

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

export default function ClientesLoginPage() {
  const searchParams = useSearchParams()
  const needsAuth = searchParams.get('auth') === 'required'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Mi Cultiva</h1>
          <p className="text-slate-500">Acceso para socios</p>
        </div>

        {needsAuth && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mb-4 text-sm text-center">
            Iniciá sesión para continuar
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <SignIn 
            routing="path"
            path="/clientes/login"
            redirectUrl="/redirect"
            signUpUrl="/clientes/signup"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
              }
            }}
          />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 mb-2">¿Primera vez?</p>
          <a 
            href="/clientes/signup"
            className="text-blue-600 font-medium hover:underline"
          >
            Crear cuenta de socio
          </a>
        </div>

        <a 
          href="/"
          className="block text-center text-sm text-slate-400 mt-6 hover:text-slate-600"
        >
          ← Volver al inicio
        </a>
      </div>
    </div>
  )
}