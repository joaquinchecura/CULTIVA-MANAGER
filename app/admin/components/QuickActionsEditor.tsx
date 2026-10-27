'use client'

import { useState, useTransition } from 'react'
import { QUICK_ACTIONS_CATALOG, QUICK_ACTIONS_LIST, QuickActionKey } from '@/lib/quick-actions'
import { Check, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

export function QuickActionsEditor({
  initialActions,
  onSave,
}: {
  initialActions: QuickActionKey[]
  onSave: (actions: QuickActionKey[]) => Promise<{ success: boolean }>
}) {
  const [selected, setSelected] = useState<QuickActionKey[]>(initialActions)
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false) // Estado para abrir/cerrar

  const toggle = (key: QuickActionKey) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSave = () => {
    startTransition(async () => {
      const res = await onSave(selected)
      if (res.success) {
        toast.success('Acciones rápidas actualizadas')
        setIsOpen(false) // Cerramos al guardar
      } else {
        toast.error('No se pudo guardar. Reintentá.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Botón para abrir/cerrar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-left"
      >
        <div>
          <span className="font-medium text-slate-900 block text-sm">Configurar accesos</span>
          <span className="text-xs text-slate-500">
            Tenés {selected.length} de {QUICK_ACTIONS_LIST.length} seleccionados
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Contenido desplegable */}
      {isOpen && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-slate-600">
            Elegí qué accesos directos querés ver en tu Panel de Control. El orden en que los
            selecciones será el orden en el que aparezcan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_ACTIONS_LIST.map((key) => {
              const action = QUICK_ACTIONS_CATALOG[key]
              const isSelected = selected.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${action.className.split(' ')[0]}`}>
                    <action.icon size={16} />
                  </div>
                  <span className="flex-1 text-sm font-medium">{action.label}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar preferencias'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}