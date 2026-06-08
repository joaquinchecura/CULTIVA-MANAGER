import { SignIn } from '@clerk/nextjs'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
          <p className="text-slate-500">Acceso solo para administradores</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <SignIn 
            routing="path"
            path="/admin/login"
            redirectUrl="/redirect"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-slate-900 hover:bg-slate-800',
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
              }
            }}
          />
        </div>

        <a 
          href="/"
          className="block text-center text-sm text-slate-500 mt-6 hover:text-slate-700"
        >
          ← Volver al inicio
        </a>
      </div>
    </div>
  )
}