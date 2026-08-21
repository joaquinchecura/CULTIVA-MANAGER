
'use client'

import { useState } from 'react'
import { Download, Loader2, DatabaseBackup } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BackupButton() {
  const [loading, setLoading] = useState(false)

  async function handleBackup() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/backup')
      if (!res.ok) throw new Error('Error al generar backup')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const disposition = res.headers.get('Content-Disposition')
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || `backup-${Date.now()}.json`

      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Error al generar el backup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleBackup}
      disabled={loading}
      className="gap-2"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <DatabaseBackup size={15} />}
      {loading ? 'Generando...' : 'Descargar backup completo'}
    </Button>
  )
}