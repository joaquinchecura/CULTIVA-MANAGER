'use client'

import { useOrganization } from '@clerk/nextjs'
import { useState } from 'react'
import { Copy, Check, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MIPLAN_URL = 'https://miplan.cultivafitness.app'

export function ShareRegistrationLink() {
  const { organization, isLoaded } = useOrganization()
  const [copied, setCopied] = useState(false)

  if (!isLoaded || !organization) return null

  const link = `${MIPLAN_URL}/registro?org=${organization.id}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2 text-slate-900">
        <Link2 size={18} className="text-blue-600" />
        <h3 className="font-semibold">Link de registro para tus clientes</h3>
      </div>
      <p className="text-sm text-slate-500">
        Compartí este link por WhatsApp con tus clientes nuevos para que se registren y queden vinculados a tu cuenta automáticamente.
      </p>
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <code className="text-xs text-slate-600 flex-1 truncate">{link}</code>
        <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 shrink-0">
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
    </div>
  )
}