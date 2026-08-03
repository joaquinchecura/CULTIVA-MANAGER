'use client'

import { useState } from 'react'
import { Plus, Scale, Ruler, Activity, Dumbbell, Droplets, Flame, Zap, Heart, Target, Clipboard, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  memberId: string
}

export default function NuevoRegistroProgreso({ memberId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    weight: '',
    height: '',
    bodyFatPercent: '',
    musclePercent: '',
    waterPercent: '',
    visceralFat: '',
    basalMetabolism: '',
    metabolicAge: '',
    waist: '',
    hip: '',
    arm: '',
    chest: '',
    targetWeight: '',
    notes: '',
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.weight) {
      alert('El peso es obligatorio')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/${memberId}/progreso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parseFloat(form.weight),
          height: form.height ? parseFloat(form.height) : null,
          bodyFatPercent: form.bodyFatPercent ? parseFloat(form.bodyFatPercent) : null,
          musclePercent: form.musclePercent ? parseFloat(form.musclePercent) : null,
          waterPercent: form.waterPercent ? parseFloat(form.waterPercent) : null,
          visceralFat: form.visceralFat ? parseInt(form.visceralFat) : null,
          basalMetabolism: form.basalMetabolism ? parseInt(form.basalMetabolism) : null,
          metabolicAge: form.metabolicAge ? parseInt(form.metabolicAge) : null,
          waist: form.waist ? parseFloat(form.waist) : null,
          hip: form.hip ? parseFloat(form.hip) : null,
          arm: form.arm ? parseFloat(form.arm) : null,
          chest: form.chest ? parseFloat(form.chest) : null,
          targetWeight: form.targetWeight ? parseFloat(form.targetWeight) : null,
          notes: form.notes || null,
        }),
      })

      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al guardar')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"

  const fields = [
    { key: 'weight', label: 'Peso (kg) *', icon: Scale, required: true, placeholder: '70.5', step: '0.1' },
    { key: 'height', label: 'Altura (cm)', icon: Ruler, placeholder: '175', step: '0.1' },
    { key: 'bodyFatPercent', label: '% Grasa', icon: Activity, placeholder: '15.5', step: '0.1' },
    { key: 'musclePercent', label: '% Músculo', icon: Dumbbell, placeholder: '45.2', step: '0.1' },
    { key: 'waterPercent', label: '% Agua', icon: Droplets, placeholder: '55.0', step: '0.1' },
    { key: 'visceralFat', label: 'Grasa visceral', icon: Flame, placeholder: '5', step: '1' },
    { key: 'basalMetabolism', label: 'Metab. basal (kcal)', icon: Zap, placeholder: '1800', step: '1' },
    { key: 'metabolicAge', label: 'Edad metabólica', icon: Heart, placeholder: '25', step: '1' },
    { key: 'waist', label: 'Cintura (cm)', icon: Ruler, placeholder: '80', step: '0.1' },
    { key: 'hip', label: 'Cadera (cm)', icon: Ruler, placeholder: '95', step: '0.1' },
    { key: 'arm', label: 'Brazo (cm)', icon: Ruler, placeholder: '32', step: '0.1' },
    { key: 'chest', label: 'Pecho (cm)', icon: Ruler, placeholder: '100', step: '0.1' },
    { key: 'targetWeight', label: 'Peso objetivo (kg)', icon: Target, placeholder: '68.0', step: '0.1' },
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Plus size={18} className="text-blue-600" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">Nuevo Registro</span>
            <span className="text-xs text-slate-500">Registrar medidas del cliente</span>
          </div>
        </div>
        {open ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="p-5 border-t border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {fields.map((field) => {
              const Icon = field.icon
              return (
                <div key={field.key}>
                  <label className={labelClass}>
                    <Icon size={12} className="inline mr-1 text-slate-400" />
                    {field.label}
                  </label>
                  <input
                    type="number"
                    step={field.step}
                    required={field.required}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className={inputClass}
                    placeholder={field.placeholder}
                  />
                </div>
              )
            })}
          </div>

          <div className="mb-4">
            <label className={labelClass}>
              <Clipboard size={12} className="inline mr-1 text-slate-400" />
              Notas
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Observaciones del entrenador"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Guardar registro
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}