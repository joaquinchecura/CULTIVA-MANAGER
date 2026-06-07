'use client'

import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Cultiva</h1>
          <p className="text-slate-500 mt-1">Manager</p>
        </div>

        {/* Login de Clerk */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <SignIn 
            routing="path"
            path="/login"
            redirectUrl="/redirect"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border-slate-200',
              }
            }}
          />
        </div>

        {/* Info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          ¿Sos nuevo? Contactá al administrador para crear tu cuenta
        </p>
      </div>
    </div>
  )
}