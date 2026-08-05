'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Scan, UserCheck, UserX, Loader2, Camera, CameraOff } from 'lucide-react'

export default function AccesoPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{success?: boolean; message?: string; member?: any} | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<any[]>([])
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // Detectar si es mobile
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  // Listar cámaras disponibles
  async function listCameras() {
    try {
      const devices = await Html5Qrcode.getCameras()
      setCameras(devices)
      console.log('Cámaras encontradas:', devices)
      return devices
    } catch (err) {
      console.error('Error listando cámaras:', err)
      setCameraError('No se pudieron detectar cámaras. Verificá los permisos.')
      return []
    }
  }

  // Encontrar la cámara trasera (back/environment)
  function getBackCamera(devices: any[]) {
    // Primero buscar por label que contenga "back" o "environment"
    const backCamera = devices.find(d => 
      /back|environment|trasera|rear/i.test(d.label)
    )
    if (backCamera) return backCamera.id

    // En mobile, si hay más de una cámara, usar la última (generalmente la trasera)
    if (isMobile && devices.length > 1) {
      return devices[devices.length - 1].id
    }

    // Fallback: usar la primera
    return devices[0]?.id
  }

  async function startScan(cameraId?: string) {
    setScanning(true)
    setResult(null)
    setCameraError(null)
    
    let selectedCamera = cameraId

    // Si no viene cameraId, listar y seleccionar la mejor
    if (!selectedCamera) {
      const devices = await listCameras()
      if (devices.length === 0) {
        setCameraError('No se encontraron cámaras. Verificá que tengas una webcam conectada.')
        setScanning(false)
        return
      }
      selectedCamera = getBackCamera(devices)
      
      // Si después de todo sigue sin haber cámara
      if (!selectedCamera) {
        setCameraError('No se pudo seleccionar una cámara válida')
        setScanning(false)
        return
      }
    }

    scannerRef.current = new Html5Qrcode('qr-reader')
    
    try {
      await scannerRef.current.start(
        selectedCamera,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await handleScan(decodedText)
        },
        (errorMessage) => {
          // Ignorar errores de lectura parcial
        }
      )
      console.log('✅ Scanner iniciado con cámara:', selectedCamera)
    } catch (err: any) {
      console.error('Error iniciando scanner:', err)
      setCameraError(`Error al iniciar la cámara: ${err.message || 'Desconocido'}`)
      setScanning(false)
    }
  }

  async function handleScan(qrData: string) {
    if (loading) return
    setLoading(true)
    
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
      try {
        await scannerRef.current.stop()
      } catch (e) {
        // Ignorar error si ya estaba detenido
      }
      scannerRef.current = null
    }
    setScanning(false)
    setResult(null)
    setCameraError(null)
  }

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
                <Camera className="text-blue-600" size={40} />
              </div>
              <p className="text-slate-600 mb-4">Presioná el botón para iniciar la cámara</p>
              
              {cameras.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-slate-500 mb-2">Cámaras detectadas: {cameras.length}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {cameras.map((cam) => (
                      <button
                        key={cam.id}
                        onClick={() => startScan(cam.id)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          /back|environment|trasera/i.test(cam.label)
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 font-medium'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cam.label || 'Cámara'}
                        {/back|environment|trasera/i.test(cam.label) && ' (Recomendada)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => startScan()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                {cameras.length > 0 ? 'Reiniciar Cámara' : 'Iniciar Escáner'}
              </button>

              {cameraError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600">
                    <CameraOff size={18} />
                    <p className="text-sm font-medium">{cameraError}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <div id="qr-reader" className="w-full aspect-square max-h-[500px]" />
              
              {/* Overlay de resultado */}
              {result && (
                <div className={`absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10`}>
                  <div className={`p-6 rounded-2xl text-center ${result.success ? 'bg-green-500' : 'bg-red-500'} text-white max-w-sm mx-4`}>
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                  <Loader2 className="animate-spin text-white" size={48} />
                </div>
              )}

              {/* Botón detener */}
              <button
                onClick={stopScan}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors z-20"
              >
                Detener
              </button>
            </div>
          )}
        </div>

        {/* Debug info */}
        {scanning && (
          <div className="mt-4 p-3 bg-slate-100 rounded-lg">
            <p className="text-xs text-slate-500">Estado: {loading ? 'Procesando...' : 'Escaneando...'}</p>
            {isMobile && <p className="text-xs text-slate-500">Modo: Mobile (cámara trasera prioritaria)</p>}
          </div>
        )}

        {/* Instrucciones */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Instrucciones</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Asegurate de permitir el acceso a la cámara cuando el navegador lo pida</li>
            <li>• En celular: se usa automáticamente la cámara trasera</li>
            <li>• Si tenés problemas, probá reiniciar la cámara</li>
            <li>• El QR del alumno se regenera cada 2 minutos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}