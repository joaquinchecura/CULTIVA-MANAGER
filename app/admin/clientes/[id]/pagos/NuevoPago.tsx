'use client'

import { useState } from 'react'
import { Plus, DollarSign, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  memberId: string
}

export default function NuevoPago({ memberId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    amount: '',
    method: 'CASH',
    concept: '',
    reference: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validación local
    if (!form.amount || !form.concept || !form.reference || !form.notes) {
      toast.error('Todos los campos son obligatorios')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          amount: parseFloat(form.amount),
          method: form.method,
          concept: form.concept,
          reference: form.reference,
          notes: form.notes,
        }),
      })

      if (res.ok) {
        toast.success('Pago registrado con éxito')
        window.location.reload()
      } else {
        const data = await res.json()
        // 👇 Manejo de errores de Zod (array de objetos)
        let errorMsg = 'Error al registrar pago'
        if (typeof data.error === 'string') {
          errorMsg = data.error
        } else if (Array.isArray(data.error)) {
          errorMsg = data.error.map((e: any) => e.message).join(', ')
        }
        toast.error(errorMsg)
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Plus size={18} className="text-green-600" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">Registrar Pago</span>
            <span className="text-xs text-slate-500">Agregar nuevo pago del cliente</span>
          </div>
        </div>
        <span className="text-slate-400 text-xl font-light">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="p-5 border-t border-slate-100 bg-slate-50/30">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="15000"
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
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Concepto *</label>
              <input
                type="text"
                required
                value={form.concept}
                onChange={(e) => setForm({ ...form, concept: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Membresía Mensual - Marzo 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Referencia *</label>
              <input
                type="text"
                required
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="N° transferencia, comprobante, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas *</label>
              <input
                type="text"
                required
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observaciones"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <DollarSign size={16} />
                  Registrar pago
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}