"use client";

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* FONDO PREMIUM: Gradiente radial sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-slate-50 pointer-events-none" />

      {/* FONDO PREMIUM: Patrón de puntos */}
      <div 
        className="absolute inset-0 opacity-[0.3] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', 
          backgroundSize: '32px 32px' 
        }} 
      />

      {/* TARJETA PRINCIPAL */}
      <div className="relative z-10 w-full max-w-[400px] bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-300/50 flex flex-col">
        
        {/* Header (Logo y Nombre) */}
        <div className="p-8 pb-4 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3">
            <img src="/logo.png" alt="Cultiva" width={64} height={64} className="w-16 h-16 object-contain" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Crear Cuenta</h1>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">Cultiva Fitness</p>
        </div>

        {/* CONTENEDOR DE CLERK */}
        <div className="px-6 pb-6 w-full flex justify-center">
          <SignUp
            routing="path"
            path="/sign-up" 
            fallbackRedirectUrl="/admin" // <-- Al terminar de registrarse, va al admin
            appearance={{
              variables: { 
                colorPrimary: '#2563eb', 
                borderRadius: '0.75rem', 
                fontFamily: 'inherit' 
              },
              elements: {
                rootBox: '!w-full !max-w-full',
                cardBox: '!w-full !max-w-full !shadow-none !bg-transparent',
                card: '!bg-transparent !shadow-none !p-0 !w-full !max-w-full !border-none',
                header: 'hidden',
                formFieldLabel: '!text-slate-600 font-medium text-sm !w-full !block mb-1',
                formFieldInput: '!bg-slate-50 !border-slate-200 !text-slate-900 !h-10 !rounded-lg !w-full',
                formButtonPrimary: '!bg-blue-600 hover:!bg-blue-700 !text-white font-semibold !h-10 !rounded-lg !w-full mt-2',
                socialButtonsBlockButton: '!border-slate-200 !text-slate-700 hover:!bg-slate-50 !h-10 !rounded-lg !w-full',
                socialButtonsBlockButtonText: 'text-sm',
                footer: '!bg-transparent !border-t !border-slate-100 !mt-4 !pt-4 !w-full',
                footerActionText: '!text-slate-500 text-sm',
                footerActionLink: '!text-blue-600 hover:!text-blue-700 font-semibold',
                logoBox: 'hidden',
              },
            }}
          />
        </div>

        {/* Footer de la tarjeta */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100 w-full mt-auto rounded-b-3xl">
          <p className="text-[11px] text-slate-400">Ingresá con el correo al que recibiste la invitación</p>
        </div>
      </div>
    </div>
  )
}