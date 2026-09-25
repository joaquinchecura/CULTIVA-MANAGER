'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserX, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LiberarClienteButton({ memberId }: { memberId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLiberar() {
    const confirmado = confirm(
      '¿Liberar a este cliente? Va a dejar de aparecer en tu lista de clientes hasta que se vincule a otra organización. Su historial no se borra.'
    )
    if (!confirmado) return

    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/${memberId}/liberar`, { method: 'POST' })
      if (res.ok) {
        router.push('/admin/clientes')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'No se pudo liberar al cliente')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleLiberar}
      disabled={loading}
      className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <UserX size={15} />}
      Liberar cliente
    </Button>
  )
}