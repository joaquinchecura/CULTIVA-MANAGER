export default function PendientePage() {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-amber-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">⏳</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Cuenta en revisión</h1>
          <p className="text-slate-500 mb-6">
            Tu cuenta fue creada correctamente, pero necesita ser aprobada por un administrador antes de que puedas acceder a la app.
          </p>
          <p className="text-sm text-slate-400">
            Te notificaremos cuando tu cuenta esté activa.
          </p>
          <a 
            href="/"
            className="block mt-8 text-blue-600 font-medium hover:underline"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }