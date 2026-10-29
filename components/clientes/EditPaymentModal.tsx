'use client'

import { useState } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface Payment {
  id: string
  amount: number
  method: string
  concept: string
  reference: string | null
  notes: string | null
  createdAt: string
}

interface EditPaymentModalProps {
  payment: Payment
  onClose: () => void
  onSuccess: () => void
}

export function EditPaymentModal({ payment, onClose, onSuccess }: EditPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    amount: String(payment.amount),
    method: payment.method,
    concept: payment.concept,
    reference: payment.reference || '',
    notes: payment.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 👇 CAMBIO: Usamos PATCH en lugar de PUT
      const res = await fetch(`/api/pagos/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          method: form.method,
          concept: form.concept,
          reference: form.reference || null,
          notes: form.notes || null,
        }),
      })

      if (res.ok) {
        toast.success('Pago actualizado')
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        let errorMsg = 'Error al actualizar'
        if (Array.isArray(data.error)) {
          errorMsg = data.error.map((e: any) => e.message).join(', ')
        } else if (typeof data.error === 'string') {
          errorMsg = data.error
        }
        toast.error(errorMsg)
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Editar Pago</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Método *</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="MERCADOPAGO">MercadoPago</option>
                <option value="CARD">Tarjeta</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Concepto *</label>
            <input
              type="text"
              required
              value={form.concept}
              onChange={(e) => setForm({ ...form, concept: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Referencia</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}