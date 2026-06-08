'use client'

import { SignUp } from '@clerk/nextjs'
import { useState } from 'react'

export default function ClientesSignUpPage() {
  const [step, setStep] = useState<'signup' | 'pending'>('signup')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {step === 'signup' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Crear Cuenta</h1>
              <p className="text-slate-500">Unite a Cultiva</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <SignUp 
                routing="path"
                path="/clientes/signup"
                redirectUrl="/clientes/pendiente"
                signInUrl="/clientes/login"
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
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Cuenta creada</h2>
            <p className="text-slate-500">
              Tu cuenta está pendiente de aprobación. El administrador te autorizará pronto.
            </p>
          </div>
        )}

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