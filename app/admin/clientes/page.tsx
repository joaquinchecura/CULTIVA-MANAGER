'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Plus, DoorOpen, BarChart3, Search,
  Filter, Download, Edit2, Trash2, MoreHorizontal,
  MapPin, TrendingUp, UserMinus, UserCheck,
  ChevronDown, ChevronUp, X, CheckCircle,
  Calendar, Phone, Mail, MapPin as MapPinIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Tab = 'listado' | 'nuevo' | 'accesos' | 'estadisticas'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dni: string
  birthDate: string
  address: string | null
  city: string | null
  status: string
  createdAt: string
  memberships: {
    id: string
    plan: { name: string }
    endDate: string
    status: string
  }[]
}

interface Stats {
  total: number
  nuevosEsteMes: number
  bajasEsteMes: number
  porCiudad: Record<string, number>
  porMes: { mes: string; cantidad: number }[]
  retencion: number
}

export default function ClientesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('listado')
  const [members, setMembers] = useState<Member[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const router = useRouter()

  const tabs = [
    { id: 'listado' as Tab, label: 'Listado', icon: Users },
    { id: 'nuevo' as Tab, label: 'Nuevo Cliente', icon: Plus },
    { id: 'accesos' as Tab, label: 'Accesos', icon: DoorOpen },
    { id: 'estadisticas' as Tab, label: 'Estadísticas', icon: BarChart3 },
  ]

  useEffect(() => {
    fetchMembers()
    fetchStats()
  }, [])

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/admin/clientes')
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/clientes/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteMember = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    try {
      const res = await fetch(`/api/admin/clientes?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== id))
      } else {
        alert('Error al eliminar')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.firstName.toLowerCase().includes(search.toLowerCase()) ||
      m.lastName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.dni.includes(search)
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
    const matchesCity = cityFilter === 'all' || m.city === cityFilter
    return matchesSearch && matchesStatus && matchesCity
  })

  const cities = Array.from(new Set(members.map(m => m.city).filter(Boolean)))

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
      FROZEN: 'bg-blue-50 text-blue-700 border-blue-200',
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      OVERDUE: 'bg-red-50 text-red-700 border-red-200',
    }
    const labels: Record<string, string> = {
      ACTIVE: 'Activo', INACTIVE: 'Inactivo', FROZEN: 'Congelado',
      PENDING: 'Pendiente', OVERDUE: 'Atrasado',
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.INACTIVE}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500' : status === 'PENDING' ? 'bg-amber-500' : status === 'OVERDUE' ? 'bg-red-500' : 'bg-slate-400'}`} />
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">👥 Clientes</h2>
        <p className="text-slate-500 mt-1">Gestión completa de clientes del gimnasio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'listado' && (
        <ClientesListado 
          members={filteredMembers}
          loading={loading}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          cities={cities}
          getStatusBadge={getStatusBadge}
          deleteMember={deleteMember}
        />
      )}
      {activeTab === 'nuevo' && <NuevoCliente onSuccess={() => { fetchMembers(); setActiveTab('listado') }} />}
      {activeTab === 'accesos' && <AccesosApp />}
      {activeTab === 'estadisticas' && <EstadisticasClientes stats={stats} members={members} />}
    </div>
  )
}

// ============================================
// TAB: LISTADO
// ============================================
function ClientesListado({ 
  members, loading, search, setSearch, statusFilter, setStatusFilter,
  cityFilter, setCityFilter, cities, getStatusBadge, deleteMember 
}: any) {
  if (loading) return <div className="p-8 text-center text-slate-500">Cargando clientes...</div>

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Buscar por nombre, email o DNI..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
        >
          <option value="all">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="PENDING">Pendiente</option>
          <option value="INACTIVE">Inactivo</option>
          <option value="FROZEN">Congelado</option>
          <option value="OVERDUE">Atrasado</option>
        </select>
        {cities.length > 0 && (
          <select 
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
          >
            <option value="all">Todas las ciudades</option>
            {cities.map((city: string) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        )}
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Download size={14} /> Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ubicación</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Membresía</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingreso</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m: Member) => {
              const activeMembership = m.memberships.find(mem => mem.status === 'ACTIVE')
              return (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                        {m.firstName[0]}{m.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{m.firstName} {m.lastName}</p>
                        <p className="text-xs text-slate-500">DNI: {m.dni}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Mail size={12} className="text-slate-400" />
                      {m.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mt-1">
                      <Phone size={12} className="text-slate-400" />
                      {m.phone}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {m.city ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPinIcon size={12} className="text-slate-400" />
                        {m.city}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {activeMembership ? (
                      <div>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {activeMembership.plan.name}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          Vence: {new Date(activeMembership.endDate).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Sin membresía</span>
                    )}
                  </td>
                  <td className="px-5 py-4">{getStatusBadge(m.status)}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/clientes/${m.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                          <Edit2 size={14} />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        onClick={() => deleteMember(m.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {members.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          <Users size={32} className="mx-auto mb-3 text-slate-300" />
          <p>No se encontraron clientes</p>
        </div>
      )}

      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
        <span className="text-slate-500">{members.length} clientes encontrados</span>
      </div>
    </div>
  )
}

// ============================================
// TAB: NUEVO CLIENTE
// ============================================
function NuevoCliente({ onSuccess }: { onSuccess: () => void }) {
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          dni: formData.get('dni'),
          phone: formData.get('phone'),
          birthDate: formData.get('birthDate'),
          address: formData.get('address'),
          city: formData.get('city'),
        }),
      })
      
      if (res.ok) {
        onSuccess()
      } else {
        alert('Error al crear cliente')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl">
      <h3 className="text-lg font-semibold text-slate-900 mb-1">Crear nuevo cliente</h3>
      <p className="text-sm text-slate-500 mb-6">Completá los datos para registrar un nuevo miembro</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Nombre *</Label>
            <Input name="firstName" placeholder="Juan" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Apellido *</Label>
            <Input name="lastName" placeholder="Pérez" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Email *</Label>
          <Input name="email" type="email" placeholder="juan@email.com" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">DNI *</Label>
            <Input name="dni" placeholder="12345678" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Teléfono *</Label>
            <Input name="phone" placeholder="+54 9 11 1234-5678" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Fecha de nacimiento *</Label>
          <Input name="birthDate" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Dirección</Label>
          <Input name="address" placeholder="Av. Siempre Viva 742" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Ciudad</Label>
          <Input name="city" placeholder="Buenos Aires" />
        </div>
        <div className="pt-4 flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            <Plus size={16} />
            {saving ? 'Creando...' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ============================================
// TAB: ACCESOS A LA APP
// ============================================
function AccesosApp() {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">🚪 Accesos a la app</h3>
            <p className="text-sm text-slate-500">Historial de inicios de sesión (integración con Clerk próximamente)</p>
          </div>
        </div>
        <div className="p-8 text-center">
          <DoorOpen size={48} className="mx-auto mb-4 text-slate-300" />
          <h4 className="text-lg font-medium text-slate-700">Integración con Clerk</h4>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Para ver los logs de acceso completos, se puede integrar con la API de Clerk 
            o crear un modelo de sesiones en la base de datos.
          </p>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-lg mx-auto">
            <p className="text-sm text-amber-800">
              <strong>Datos disponibles ahora:</strong> Los clientes se autentican con Clerk. 
              Podés ver la última actividad en el dashboard principal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TAB: ESTADÍSTICAS
// ============================================
function EstadisticasClientes({ stats, members }: { stats: Stats | null, members: Member[] }) {
  if (!stats) return <div className="p-8 text-center text-slate-500">Cargando estadísticas...</div>

  const cityData = Object.entries(stats.porCiudad)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const maxCityCount = Math.max(...cityData.map(([, count]) => count))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total clientes</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Nuevos este mes</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.nuevosEsteMes}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <UserCheck size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Bajas este mes</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.bajasEsteMes}</p>
            </div>
            <div className="p-2.5 bg-red-50 rounded-xl">
              <UserMinus size={20} className="text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tasa de retención</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.retencion}%</p>
            </div>
            <div className="p-2.5 bg-violet-50 rounded-xl">
              <TrendingUp size={20} className="text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ubicación geográfica */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-slate-400" /> 
            Distribución por ciudad
          </h3>
          <div className="space-y-3">
            {cityData.map(([city, count]) => (
              <div key={city} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-32 truncate">{city}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(count / maxCityCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 w-8 text-right">{count}</span>
              </div>
            ))}
            {cityData.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos de ubicación</p>
            )}
          </div>
        </div>

        {/* Nuevos por mes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" /> 
            Nuevos clientes por mes
          </h3>
          <div className="space-y-3">
            {stats.porMes.map(({ mes, cantidad }) => (
              <div key={mes} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-20">{mes}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min((cantidad / (stats.nuevosEsteMes || 1)) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 w-8 text-right">{cantidad}</span>
              </div>
            ))}
            {stats.porMes.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos históricos</p>
            )}
          </div>
        </div>

        {/* Estados */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Estados de clientes</h3>
          <div className="grid grid-cols-2 gap-3">
            {['ACTIVE', 'PENDING', 'INACTIVE', 'FROZEN', 'OVERDUE'].map(status => {
              const count = members.filter(m => m.status === status).length
              const labels: Record<string, string> = {
                ACTIVE: 'Activos', PENDING: 'Pendientes', INACTIVE: 'Inactivos',
                FROZEN: 'Congelados', OVERDUE: 'Atrasados',
              }
              const colors: Record<string, string> = {
                ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
                FROZEN: 'bg-blue-50 text-blue-700 border-blue-200',
                OVERDUE: 'bg-red-50 text-red-700 border-red-200',
              }
              return (
                <div key={status} className={`p-3 rounded-lg border ${colors[status]}`}>
                  <p className="text-xs opacity-80">{labels[status]}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Edades */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Distribución por edad</h3>
          <EdadesChart members={members} />
        </div>
      </div>
    </div>
  )
}

function EdadesChart({ members }: { members: Member[] }) {
  const now = new Date()
  const ages = members.map(m => {
    const birth = new Date(m.birthDate)
    return now.getFullYear() - birth.getFullYear()
  }).filter(a => a > 0 && a < 100)

  const ranges = [
    { label: '18-25', min: 18, max: 25 },
    { label: '26-35', min: 26, max: 35 },
    { label: '36-45', min: 36, max: 45 },
    { label: '46-55', min: 46, max: 55 },
    { label: '56+', min: 56, max: 999 },
  ]

  const maxCount = Math.max(...ranges.map(r => ages.filter(a => a >= r.min && a <= r.max).length), 1)

  return (
    <div className="space-y-3">
      {ranges.map(range => {
        const count = ages.filter(a => a >= range.min && a <= range.max).length
        return (
          <div key={range.label} className="flex items-center gap-3">
            <span className="text-sm text-slate-600 w-12">{range.label}</span>
            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-900 w-8 text-right">{count}</span>
          </div>
        )
      })}
      {ages.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">Sin datos de edad</p>
      )}
    </div>
  )
}