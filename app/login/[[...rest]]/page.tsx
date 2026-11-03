import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Fondo de puntitos y resplandor */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute w-[480px] h-[480px] bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Tarjetas fantasma */}
      <div className="hidden sm:block absolute top-16 left-10 lg:left-24 w-52 rotate-[-6deg] opacity-50 blur-[1.5px] pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Clientes</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-blue-500" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-900">128</p>
        </div>
      </div>
      <div className="hidden sm:block absolute bottom-20 right-10 lg:right-28 w-52 rotate-[5deg] opacity-50 blur-[1.5px] pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Asistencias Hoy</span>
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-green-500" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-900">34</p>
        </div>
      </div>
      <div className="hidden lg:block absolute bottom-32 left-24 w-48 rotate-[4deg] opacity-40 blur-[1.5px] pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Recaudación</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-purple-500" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-900">$4.2k</p>
        </div>
      </div>

      {/* TARJETA PRINCIPAL - Sin overflow-hidden para no cortar el contenido */}
      <div className="relative z-10 w-full max-w-[400px] bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/60 flex flex-col">
        
        {/* Header (Solo Logo y Nombre) */}
        <div className="p-8 pb-4 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3">
            <img src="/logo-manager.png" alt="Cultiva" width={64} height={64} className="w-20 h-20 object-contain" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 leading-tight">MANAGER</h1>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">Cultiva Fitness</p>
        </div>

        {/* CONTENEDOR DE CLERK - Forzado a centrarse y no desbordar */}
        <div className="px-6 pb-6 w-full flex justify-center">
          <SignIn
            routing="path"
            path="/login" 
            fallbackRedirectUrl="/redirect"
            appearance={{
              variables: { 
                colorPrimary: '#2563eb', 
                borderRadius: '0.75rem', 
                fontFamily: 'inherit' 
              },
              elements: {
                // Forzamos a Clerk a medir 100% del contenedor
                rootBox: '!w-full !max-w-full',
                cardBox: '!w-full !max-w-full !shadow-none !bg-transparent',
                card: '!bg-transparent !shadow-none !p-0 !w-full !max-w-full !border-none',
                
                // Ocultamos el header de Clerk
                header: 'hidden',
                
                // Inputs (con !w-full para que no se salgan)
                formFieldLabel: 'text-slate-600 font-medium text-sm',
                formFieldInput: '!bg-slate-50 !border-slate-200 !text-slate-900 !h-10 !rounded-lg !w-full',
                
                // Botón
                formButtonPrimary: '!bg-blue-600 hover:!bg-blue-700 !text-white font-semibold !h-10 !rounded-lg !w-full',
                
                // Sociales
                socialButtonsBlockButton: '!border-slate-200 !text-slate-700 hover:!bg-slate-50 !h-10 !rounded-lg !w-full',
                socialButtonsBlockButtonText: 'text-sm',
                
                // Footer
                footer: '!bg-transparent !border-t !border-slate-100 !mt-4 !pt-4 !w-full',
                footerActionLink: '!text-blue-600 hover:!text-blue-700 font-semibold',
                
                // Ocultar logos
                logoBox: 'hidden',
              },
            }}
          />
        </div>

        {/* Footer de la tarjeta */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100 w-full mt-auto rounded-b-3xl">
          <p className="text-[11px] text-slate-400">¿Sos nuevo? Contactá al administrador para crear tu cuenta</p>
        </div>
      </div>
    </div>
  )
}