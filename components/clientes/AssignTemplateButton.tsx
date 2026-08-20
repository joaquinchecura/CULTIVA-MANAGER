'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { assignTemplateToMember } from '@/app/actions/routines'

interface Template {
  id: string
  name: string
  goal: string | null
  frequencyPerWeek: number | null
  totalWeeks: number | null
}

export default function AssignTemplateButton({
  memberId,
  templates,
}: {
  memberId: string
  templates: Template[]
}) {
  const router = useRouter()
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState<string>('')
  const [loading,  setLoading]  = useState(false)

  async function handleAssign() {
    if (!selected) return
    setLoading(true)
    try {
      await assignTemplateToMember(selected, memberId)
      setOpen(false)
      setSelected('')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error al asignar template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 text-xs"
        onClick={() => setOpen(true)}
      >
        <Copy size={13} /> Desde template
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-900">Asignar template</h3>
              <button
                onClick={() => { setOpen(false); setSelected('') }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              La rutina activa actual quedará archivada en el historial.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto mb-5">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selected === t.id
                      ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t.frequencyPerWeek && `${t.frequencyPerWeek} ses/sem`}
                    {t.totalWeeks && ` · ${t.totalWeeks} semanas`}
                    {t.goal && ` · ${t.goal}`}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAssign}
                disabled={!selected || loading}
                className="flex-1 gap-2"
              >
                <Send size={15} />
                {loading ? 'Asignando...' : 'Asignar'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setOpen(false); setSelected('') }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}