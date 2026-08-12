'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign, CreditCard, Calendar, TrendingUp, Users,
  Search, Plus, X, CheckCircle, Loader2, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  concept: string
  reference: string | null
  notes: string | null
  createdAt: string
  member: {
    id: string
    firstName: string
    lastName: string
    dni: string
  }
}

interface Member {
  id: string
  firstName: string
  lastName: string
  dni: string
  email: string
}

export const dynamic = 'force-dynamic'

export default function PagosPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [filterMethod, setFilterMethod] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    method: 'CASH',
    concept: '',
    reference: '',
    notes: '',
  })

  useEffect(() => {
    fetchPayments()
    fetchMembers()
  }, [])

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/pagos')
      if (res.ok) {
        const data = await res.json()
        setPayments(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/admin/clientes')
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.memberId || !formData.amount || !formData.concept) return

    setSaving(true)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: formData.memberId,
          amount: parseFloat(formData.amount),
          method: formData.method,
          concept: formData.concept,
          reference: formData.reference || undefined,
          notes: formData.notes || undefined,
        }),
      })

      if (res.ok) {
        setShowModal(false)
        setFormData({
          memberId: '',
          amount: '',
          method: 'CASH',
          concept: '',
          reference: '',
          notes: '',
        })
        fetchPayments()
      } else {
        const err = await res.json()
        alert('Error: ' + (err.error?.[0]?.message || 'No se pudo registrar el pago'))
      }
    } catch (err) {
      console.error(err)
      alert('Error al registrar el pago')
    } finally {
      setSaving(false)
    }
  }

  // Stats
  const totalRecaudado = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const totalPagos = payments.length

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const pagosHoy = payments.filter(p => new Date(p.createdAt) >= hoy)
  const totalHoy = pagosHoy.reduce((sum, p) => sum + Number(p.amount), 0)

  const promedio = totalPagos > 0 ? Math.round(totalRecaudado / totalPagos) : 0

  // Por método
  const porMetodo = payments.reduce((acc, p) => {
    if (!acc[p.method]) acc[p.method] = { count: 0, total: 0 }
    acc[p.method].count++
    acc[p.method].total += Number(p.amount)
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  // Filtros
  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.member.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.member.lastName.toLowerCase().includes(search.toLowerCase()) ||
      p.member.dni.includes(search) ||
      p.concept.toLowerCase().includes(search.toLowerCase())
    const matchesMethod = filterMethod === 'all' || p.method === filterMethod
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesMethod && matchesStatus
  })

  // Miembros filtrados para el select
  const filteredMembers = members.filter(m =>
    m.firstName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.lastName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.dni.includes(memberSearch) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const methodLabels: Record<string, string> = {
    CASH: '💵 Efectivo',
    TRANSFER: '🏦 Transferencia',
    MERCADOPAGO: '📱 MercadoPago',
    CARD: '💳 Tarjeta',
    OTHER: '📝 Otro',
  }

  const methodColors: Record<string, string> = {
    CASH: 'bg-green-50 text-green-700 border-green-200',
    TRANSFER: 'bg-blue-50 text-blue-700 border-blue-200',
    MERCADOPAGO: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    CARD: 'bg-purple-50 text-purple-700 border-purple-200',
    OTHER: 'bg-slate-50 text-slate-700 border-slate-200',
  }

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Cargando pagos...</div>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">💳 Pagos</h2>
          <p className="text-slate-500 mt-1">Gestión de pagos y recaudación</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus size={16} /> Registrar Pago
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-green-600" />
            <span className="text-xs text-slate-500">Total recaudado</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${totalRecaudado.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-blue-600" />
            <span className="text-xs text-slate-500">Total pagos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalPagos}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-purple-600" />
            <span className="text-xs text-slate-500">Hoy</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${totalHoy.toLocaleString('es-AR')}
          </p>
          <p className="text-xs text-slate-500">{pagosHoy.length} pagos</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-orange-600" />
            <span className="text-xs text-slate-500">Promedio</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${promedio.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Desglose por método */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(methodLabels).map(([key, label]) => {
          const data = porMetodo[key]
          return (
            <div key={key} className={`border rounded-xl p-4 ${methodColors[key]}`}>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xl font-bold mt-1">
                ${data ? data.total.toLocaleString('es-AR') : '0'}
              </p>
              <p className="text-xs opacity-70">{data ? data.count : 0} pagos</p>
            </div>
          )
        })}
      </div>

      {/* Lista de pagos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Buscar por cliente, DNI o concepto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <select 
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
          >
            <option value="all">Todos los métodos</option>
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="MERCADOPAGO">MercadoPago</option>
            <option value="CARD">Tarjeta</option>
            <option value="OTHER">Otro</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
          >
            <option value="all">Todos los estados</option>
            <option value="COMPLETED">Completado</option>
            <option value="PENDING">Pendiente</option>
            <option value="FAILED">Fallido</option>
            <option value="REFUNDED">Reembolsado</option>
          </select>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CreditCard className="mx-auto mb-2 text-slate-300" size={40} />
            <p>Sin pagos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Concepto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Método</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(p.createdAt).toLocaleDateString('es-AR')}
                      <span className="block text-xs text-slate-400">
                        {new Date(p.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link 
                        href={`/admin/clientes/${p.member.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-blue-600"
                      >
                        {p.member.firstName} {p.member.lastName}
                      </Link>
                      <span className="block text-xs text-slate-500">DNI: {p.member.dni}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">{p.concept}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {methodLabels[p.method] || p.method}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">
                      ${Number(p.amount).toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                        p.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                        p.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                        'bg-slate-50 text-slate-700'
                      }`}>
                        {p.status === 'COMPLETED' ? '✓ Completado' :
                         p.status === 'PENDING' ? '⏳ Pendiente' :
                         p.status === 'FAILED' ? '✕ Fallido' : '↩ Reembolsado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">{filteredPayments.length} pagos encontrados</span>
        </div>
      </div>

      {/* MODAL: Registrar Pago */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Registrar Pago</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Buscar cliente */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Cliente *</Label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Buscar por nombre, DNI o email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
                {memberSearch && filteredMembers.length > 0 && !formData.memberId && (
                  <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                    {filteredMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, memberId: m.id }))
                          setMemberSearch(`${m.firstName} ${m.lastName} (${m.dni})`)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0"
                      >
                        <span className="font-medium text-slate-900">{m.firstName} {m.lastName}</span>
                        <span className="text-slate-500 text-xs ml-2">DNI: {m.dni}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Monto *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Método *</Label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="CASH">💵 Efectivo</option>
                    <option value="TRANSFER">🏦 Transferencia</option>
                    <option value="MERCADOPAGO">📱 MercadoPago</option>
                    <option value="CARD">💳 Tarjeta</option>
                    <option value="OTHER">📝 Otro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Concepto *</Label>
                <Input
                  placeholder="Ej: Membresía mensual, Personal training..."
                  value={formData.concept}
                  onChange={(e) => setFormData(prev => ({ ...prev, concept: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Referencia (opcional)</Label>
                <Input
                  placeholder="N° de transferencia, comprobante..."
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Notas (opcional)</Label>
                <Input
                  placeholder="Observaciones adicionales..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button type="submit" disabled={saving || !formData.memberId} className="flex-1 gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {saving ? 'Registrando...' : 'Registrar pago'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}