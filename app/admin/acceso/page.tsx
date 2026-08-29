'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Scan, UserCheck, UserX, Loader2, Camera, CameraOff, Info } from 'lucide-react'

export default function AccesoPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    member?: { id: string; name: string; dni: string; email?: string; status?: string; photoUrl?: string | null }
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<any[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [capturePhase, setCapturePhase] = useState<'idle' | 'live' | 'preview'>('idle')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const photoFlowActiveRef = useRef(false)

  useEffect(() => {
    photoFlowActiveRef.current = capturePhase !== 'idle' || uploadingPhoto
  }, [capturePhase, uploadingPhoto])

  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  async function listCameras() {
    try {
      const devices = await Html5Qrcode.getCameras()
      setCameras(devices)
      return devices
    } catch (err) {
      console.error('Error listando cámaras:', err)
      setCameraError('No se pudieron detectar cámaras. Verificá los permisos.')
      return []
    }
  }

  function getBackCamera(devices: any[]) {
    const backCamera = devices.find(d => /back|environment|trasera|rear/i.test(d.label))
    if (backCamera) return backCamera.id
    if (isMobile && devices.length > 1) return devices[devices.length - 1].id
    return devices[0]?.id
  }

  async function startScan(cameraId?: string) {
    setScanning(true)
    setResult(null)
    setCameraError(null)

    let selectedCamera = cameraId

    if (!selectedCamera) {
      const devices = await listCameras()
      if (devices.length === 0) {
        setCameraError('No se encontraron cámaras. Verificá que tengas una webcam conectada.')
        setScanning(false)
        return
      }
      selectedCamera = getBackCamera(devices)
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
        { fps: 10, qrbox: isMobile ? { width: 260, height: 260 } : { width: 380, height: 380 } },
        async (decodedText) => { await handleScan(decodedText) },
        () => {}
      )
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
      setResult({ success: res.ok, message: data.message || data.error, member: data.member })
      setTimeout(async () => {
        if (photoFlowActiveRef.current) return // no cerrar mientras se revisa/sube una foto
        setResult(null)
        await scannerRef.current?.resume()
      }, 6000)
    } catch (error) {
      setResult({ success: false, message: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  function captureFrame() {
    const video = document.querySelector('#qr-reader video') as HTMLVideoElement | null
    if (!video || video.videoWidth === 0) {
      alert('No se pudo acceder a la imagen de la cámara')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.9))
    setCapturePhase('preview')
  }

  function cancelPhotoFlow() {
    setCapturedPhoto(null)
    setCapturePhase('idle')
    setResult(null)
    scannerRef.current?.resume()
  }

  async function confirmUploadPhoto() {
    if (!result?.member?.id || !capturedPhoto) return

    setUploadingPhoto(true)
    try {
      const res = await fetch('/api/upload/member-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: result.member.id, imageBase64: capturedPhoto }),
      })

      if (res.ok) {
        const data = await res.json()
        setResult(prev => prev?.member
          ? { ...prev, member: { ...prev.member, photoUrl: data.photoUrl } }
          : prev)
        setCapturedPhoto(null)
        setCapturePhase('idle')
      } else {
        alert('No se pudo guardar la foto de perfil')
      }
    } catch (err) {
      console.error(err)
      alert('Error al subir la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function stopScan() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch (e) {}
      scannerRef.current = null
    }
    setScanning(false)
    setResult(null)
    setCameraError(null)
    setCapturedPhoto(null)
    setCapturePhase('idle')
  }

  useEffect(() => {
    return () => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}) }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* html5-qrcode inyecta su propio <video>/<canvas> dentro de #qr-reader;
          forzamos que llenen el contenedor con zoom "cover" en vez del letterboxing por defecto */}
      <style>{`
        #qr-reader video, #qr-reader canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}</style>
      <div className="max-w-[1600px] mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <Scan className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Control de Acceso</h1>
            <p className="text-slate-500 text-sm mt-0.5">Escaneá el QR del alumno para registrar su ingreso</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {!scanning ? (
              <div className="p-10 lg:p-16 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Camera className="text-blue-600" size={36} />
                </div>
                <p className="text-slate-600 mb-6">Presioná el botón para iniciar la cámara</p>

                {cameras.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                      Cámaras detectadas ({cameras.length})
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {cameras.map((cam) => {
                        const isBack = /back|environment|trasera/i.test(cam.label)
                        return (
                          <button
                            key={cam.id}
                            onClick={() => startScan(cam.id)}
                            className={`px-4 py-2 rounded-xl text-sm transition-colors border ${
                              isBack
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {cam.label || 'Cámara'}{isBack && ' · Recomendada'}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => startScan()}
                  className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/25"
                >
                  {cameras.length > 0 ? 'Reiniciar cámara' : 'Iniciar escáner'}
                </button>

                {cameraError && (
                  <div className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-xl inline-flex items-center gap-2 text-red-600">
                    <CameraOff size={18} />
                    <p className="text-sm font-medium">{cameraError}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative bg-slate-950">
                <div id="qr-reader" className="w-full aspect-square lg:aspect-[16/10] lg:max-h-[820px] mx-auto" />

                {/* Tarjeta de resultado normal — solo visible cuando no estamos en medio de capturar una foto */}
                {result && capturePhase === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
                    <div className={`p-8 rounded-3xl text-center ${result.success ? 'bg-emerald-500' : 'bg-red-500'} text-white max-w-sm mx-4 shadow-2xl`}>
                      {result.member?.photoUrl ? (
                        <img
                          src={result.member.photoUrl}
                          alt={result.member.name}
                          className="w-40 h-40 rounded-full object-cover mx-auto mb-3 border-4 border-white/40"
                        />
                      ) : result.success ? (
                        <UserCheck size={52} className="mx-auto mb-3" />
                      ) : (
                        <UserX size={52} className="mx-auto mb-3" />
                      )}
                      <p className="text-xl font-bold">{result.message}</p>
                      {result.member && (
                        <p className="text-sm mt-1.5 opacity-90">{result.member.name} — DNI: {result.member.dni}</p>
                      )}
                      {result.member?.id && (
                        <button
                          onClick={() => setCapturePhase('live')}
                          className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2"
                        >
                          {result.member.photoUrl ? 'Actualizar foto de perfil' : 'Capturar foto de perfil'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Modo "live": destapamos el video en vivo (sin overlay oscuro) para encuadrar antes de sacar la foto */}
                {capturePhase === 'live' && (
                  <div className="absolute inset-x-0 bottom-0 z-20 p-5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-3">
                    <button
                      onClick={cancelPhotoFlow}
                      className="px-5 py-2.5 rounded-xl bg-white/90 text-slate-700 text-sm font-medium hover:bg-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={captureFrame}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      📷 Tomar foto
                    </button>
                  </div>
                )}

                {/* Preview grande de la foto capturada, antes de confirmar el guardado */}
                {capturePhase === 'preview' && capturedPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm z-30 p-6">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                      <p className="text-sm font-medium text-slate-500 mb-4 text-center">
                        ¿Guardar esta foto de perfil?
                      </p>
                      <img
                        src={capturedPhoto}
                        alt="Foto capturada"
                        className="w-72 h-72 object-cover rounded-2xl mx-auto border border-slate-200"
                      />
                      <div className="flex gap-2 mt-5">
                        <button
                          onClick={() => { setCapturedPhoto(null); setCapturePhase('live') }}
                          disabled={uploadingPhoto}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                        >
                          Volver a tomar
                        </button>
                        <button
                          onClick={confirmUploadPhoto}
                          disabled={uploadingPhoto}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                        >
                          {uploadingPhoto && <Loader2 size={14} className="animate-spin" />}
                          {uploadingPhoto ? 'Guardando...' : 'Guardar foto'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {loading && !result && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                    <Loader2 className="animate-spin text-white" size={48} />
                  </div>
                )}

                <button
                  onClick={stopScan}
                  className="absolute bottom-5 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white/95 text-slate-700 rounded-xl font-medium hover:bg-white transition-colors z-20 shadow-lg"
                >
                  Detener
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {scanning && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <p className="text-sm font-medium text-slate-700">{loading ? 'Procesando...' : 'Escaneando...'}</p>
                </div>
                {isMobile && <p className="text-xs text-slate-400">Modo mobile · cámara trasera prioritaria</p>}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2 text-sm">
                <Info size={15} /> Instrucciones
              </h3>
              <ul className="text-sm text-blue-800/90 space-y-2 leading-snug">
                <li>Permití el acceso a la cámara cuando el navegador lo pida</li>
                <li>En celular se usa automáticamente la cámara trasera</li>
                <li>Si hay problemas, probá reiniciar la cámara</li>
                <li>El QR del alumno se regenera cada 2 minutos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}