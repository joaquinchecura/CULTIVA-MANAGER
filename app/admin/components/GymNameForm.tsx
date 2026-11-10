'use client'

import { useState, useTransition } from 'react'

export function GymNameForm({ initialName, onSave }: {
  initialName: string
  onSave: (name: string) => Promise<{ success: boolean; error?: string }>
}) {
  const [name, setName] = useState(initialName)
  const [msg, setMsg] = useState('')
  const [pending, start] = useTransition()

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const r = await onSave(name)
          setMsg(r.success ? 'Guardado' : r.error || 'Error')
        })
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        placeholder="Nombre de tu gimnasio o estudio"
      />
      <button disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">
        {pending ? 'Guardando…' : 'Guardar'}
      </button>
      {msg && <span className="self-center text-sm text-slate-500">{msg}</span>}
    </form>
  )
}