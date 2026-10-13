import Image from 'next/image'
import { SignIn } from '@clerk/nextjs'
import { Users, Dumbbell, CreditCard, CalendarClock } from 'lucide-react'

const features = [
  { icon: Users, label: 'Clientes' },
  { icon: Dumbbell, label: 'Rutinas' },
  { icon: CreditCard, label: 'Pagos' },
  { icon: CalendarClock, label: 'Agenda' },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Textura de fondo: grid de puntos, sutil */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Resplandor detrás de la card central */}
      <div className="absolute w-[480px] h-[480px] bg-blue-200/40 rounded-full blur-3xl" />

      {/* Tarjetas fantasma del panel real, como vista previa borrosa */}
      <div className="hidden sm:block absolute top-16 left-10 lg:left-24 w-52 rotate-[-6deg] opacity-50 blur-[1.5px] pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Clientes</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">128</p>
        </div>
      </div>

      <div className="hidden sm:block absolute bottom-20 right-10 lg:right-28 w-52 rotate-[5deg] opacity-50 blur-[1.5px] pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Asistencias Hoy</span>
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">34</p>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-32 left-24 w-48 rotate-[4deg] opacity-40 blur-[1.5px] pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Recaudación</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">$4.2k</p>
        </div>
      </div>

      {/* Card única: logo + Clerk, todo integrado */}
      <div className="relative z-10 w-full max-w-sm bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/60 p-8 sm:p-10">
        <div className="flex flex-col items-center text-center mb-6">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase mb-6">
            Gestión para profesionales
          </span>

          {/* Logo real de Cultiva */}
          <Image
            src="/images/logo2.png"
            alt="Cultiva Fitness"
            width={72}
            height={72}
            priority
            className="w-[72px] h-[72px] rounded-2xl object-cover mb-4 shadow-lg shadow-emerald-900/10 ring-1 ring-emerald-900/10"
          />

          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Cultiva</h1>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
            Manager
          </p>

          {/* Íconos de lo que incluye la plataforma */}
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Qué incluye MANAGER">
            {features.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600"
              >
                <Icon className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <SignIn
          routing="path"
          path="/login"
          fallbackRedirectUrl="/redirect"
          appearance={{
            variables: {
              colorPrimary: '#2563eb',
              borderRadius: '1rem',
              fontFamily: 'inherit',
            },
            elements: {
              rootBox: 'w-full',
              cardBox: 'w-full shadow-none',
              card: 'bg-transparent shadow-none border-none p-0 w-full',
              header: 'hidden',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              footer: 'bg-transparent',
              footerAction: 'text-sm',
              formButtonPrimary:
                'bg-blue-600 hover:bg-blue-700 text-sm normal-case font-semibold py-3',
              socialButtonsBlockButton:
                'border-slate-200 hover:bg-slate-50 text-slate-700',
              formFieldInput:
                'border-slate-200 focus:border-blue-500 focus:ring-blue-500',
              formFieldLabel: 'text-slate-600 font-medium',
              dividerLine: 'bg-slate-200',
              dividerText: 'text-slate-400',
              identityPreviewEditButton: 'text-blue-600',
            },
          }}
        />

        <p className="text-center text-xs text-slate-400 mt-6">
          ¿Sos nuevo? Contactá al administrador para crear tu cuenta
        </p>
      </div>
    </div>
  )
}