'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit2, Trash2, CreditCard, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditPaymentModal } from '@/components/clientes/EditPaymentModal'
import { toast } from 'sonner'

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  concept: string
  reference: string | null
  notes: string | null
  createdAt: string
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  MERCADOPAGO: 'Mercado Pago',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
}

export default function PagosPage({ params }: { params: Promise<{ id: string }> }) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [memberId, setMemberId] = useState('')
  const [memberName, setMemberName] = useState('')
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)

  useEffect(() => {
    const getParams = async () => {
      const resolved = await params
      setMemberId(resolved.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (memberId) fetchData()
  }, [memberId])

  const fetchData = async () => {
    try {
      const [memberRes, paymentsRes] = await Promise.all([
        fetch(`/api/clientes/${memberId}`),
        fetch(`/api/pagos?memberId=${memberId}`),
      ])
      if (memberRes.ok) {
        const data = await memberRes.json()
        setMemberName(`${data.firstName} ${data.lastName}`)
      }
      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        setPayments(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este pago? Esta acción no se puede deshacer.')) return

    try {
      const res = await fetch(`/api/pagos/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Pago eliminado')
        setPayments(prev => prev.filter(p => p.id !== id))
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  if (loading) return <div className="p-6">Cargando...</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/clientes/${memberId}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos de {memberName}</h1>
          <p className="text-sm text-slate-500">DNI: {memberId}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total pagado</p>
          <p className="text-2xl font-bold text-emerald-700">
            ${totalPaid.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500">Pagos registrados</p>
          <p className="text-2xl font-bold text-blue-700">{payments.length}</p>
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <CreditCard size={16} className="text-slate-400" />
            Historial de pagos
          </h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>Sin pagos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <div key={payment.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Información del pago */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-lg font-bold text-slate-900">
                        ${Number(payment.amount).toLocaleString('es-AR')}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {METHOD_LABELS[payment.method] || payment.method}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        payment.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {payment.status === 'COMPLETED' ? 'Completado' : payment.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{payment.concept}</p>
                    
                    {payment.reference && (
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-medium">Ref:</span> {payment.reference}
                      </p>
                    )}
                    {payment.notes && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-medium">Notas:</span> {payment.notes}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">
                      {new Date(payment.createdAt).toLocaleString('es-AR', {
                        timeZone: 'America/Argentina/Buenos_Aires',
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                      onClick={() => setEditingPayment(payment)}
                      title="Editar pago"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                      onClick={() => handleDelete(payment.id)}
                      title="Eliminar pago"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}