'use client'

import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Gym Management</h1>
          <p className="text-slate-500 mt-2">Iniciá sesión para continuar</p>
        </div>
        <SignIn 
          routing="path" 
          path="/login"
          redirectUrl="/"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg border border-slate-200 rounded-xl',
            }
          }}
        />
      </div>
    </div>
  )
}