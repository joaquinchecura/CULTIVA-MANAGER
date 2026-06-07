export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Gym Management</h1>
        <div className="space-y-2">
          <a href="/admin" className="block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Panel Admin
          </a>
          <a href="/clientes" className="block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            WebApp Cliente
          </a>
          <a href="/login" className="block bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700">
            Login
          </a>
        </div>
      </div>
    </div>
  )
}