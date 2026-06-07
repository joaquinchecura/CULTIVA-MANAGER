export default function AdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <a href="/admin/clientes/nuevo" className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:border-blue-400 transition-colors">
          <h3 className="text-sm font-medium text-slate-500">Crear Cliente</h3>
          <p className="text-2xl font-bold mt-2 text-blue-600">+</p>
        </a>
        <a href="/admin/clientes" className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:border-blue-400 transition-colors">
          <h3 className="text-sm font-medium text-slate-500">Listado Clientes</h3>
          <p className="text-2xl font-bold mt-2 text-blue-600">0</p>
        </a>
        <a href="/admin/pagos" className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:border-blue-400 transition-colors">
          <h3 className="text-sm font-medium text-slate-500">Registrar Pago</h3>
          <p className="text-2xl font-bold mt-2 text-blue-600">$</p>
        </a>
        <a href="/admin/agenda" className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:border-blue-400 transition-colors">
          <h3 className="text-sm font-medium text-slate-500">Agenda Diaria</h3>
          <p className="text-2xl font-bold mt-2 text-blue-600">📅</p>
        </a>
      </div>
    </div>
  )
}