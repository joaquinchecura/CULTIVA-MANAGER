'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Scan, UserCheck, UserX, Loader2 } from 'lucide-react'

export default function AccesoPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{success?: boolean; message?: string; member?: any} | null>(null)
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  async function startScan() {
    setScanning(true)
    setResult(null)
    
    scannerRef.current = new Html5Qrcode('qr-reader')
    
    try {
      await scannerRef.current.start(
        { facingMode: 'environment' }, // Cámara trasera en mobile, webcam en PC
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // QR escaneado
          await handleScan(decodedText)
        },
        () => {} // Error callback (ignorar errores de lectura parcial)
      )
    } catch (err) {
      console.error('Error starting scanner:', err)
      // Fallback a webcam si environment falla
      try {
        await scannerRef.current?.start(
          { facingMode: 'user' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            await handleScan(decodedText)
          },
          () => {}
        )
      } catch (err2) {
        console.error('Fallback also failed:', err2)
      }
    }
  }

  async function handleScan(qrData: string) {
    if (loading) return
    setLoading(true)
    
    // Detener scanner temporalmente
    await scannerRef.current?.pause()

    try {
      const res = await fetch('/api/acceso/escanear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData }),
      })

      const data = await res.json()
      setResult({
        success: res.ok,
        message: data.message || data.error,
        member: data.member,
      })

      // Reanudar después de 3 segundos
      setTimeout(async () => {
        setResult(null)
        await scannerRef.current?.resume()
      }, 3000)

    } catch (error) {
      setResult({ success: false, message: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  async function stopScan() {
    if (scannerRef.current) {
      await scannerRef.current.stop()
      scannerRef.current = null
    }
    setScanning(false)
    setResult(null)
  }

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Scan className="text-blue-600" />
          Control de Acceso
        </h1>
        <p className="text-slate-500 mb-6">Escaneá el QR del alumno para registrar su ingreso</p>

        {/* Scanner */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {!scanning ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="text-blue-600" size={40} />
              </div>
              <p className="text-slate-600 mb-4">Presioná el botón para iniciar la cámara</p>
              <button
                onClick={startScan}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Iniciar Escáner
              </button>
            </div>
          ) : (
            <div className="relative">
              <div id="qr-reader" className="w-full aspect-square max-h-[500px]" />
              
              {/* Overlay de resultado */}
              {result && (
                <div className={`absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm`}>
                  <div className={`p-6 rounded-2xl text-center ${result.success ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                    {result.success ? (
                      <UserCheck size={48} className="mx-auto mb-2" />
                    ) : (
                      <UserX size={48} className="mx-auto mb-2" />
                    )}
                    <p className="text-xl font-bold">{result.message}</p>
                    {result.member && (
                      <p className="text-sm mt-1 opacity-90">{result.member.name} — DNI: {result.member.dni}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && !result && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <Loader2 className="animate-spin text-white" size={48} />
                </div>
              )}

              {/* Botón detener */}
              <button
                onClick={stopScan}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors"
              >
                Detener
              </button>
            </div>
          )}
        </div>

        {/* Instrucciones */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Instrucciones</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Asegurate de tener buena iluminación</li>
            <li>• En PC: usa la webcam frontal</li>
            <li>• En celular: usa la cámara trasera para mejor calidad</li>
            <li>• El QR del alumno se regenera cada 2 minutos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}