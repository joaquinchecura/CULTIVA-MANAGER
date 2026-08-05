'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Newspaper, Calendar, Eye, EyeOff } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  content: string
  imageUrl: string | null
  isActive: boolean
  createdAt: string
}

export default function NoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    title: '',
    content: '',
    imageUrl: '',
  })

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/noticias')
      if (res.ok) {
        const data = await res.json()
        setNews(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editing ? `/api/noticias?id=${editing.id}` : '/api/noticias'
      const method = editing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setForm({ title: '', content: '', imageUrl: '' })
        setEditing(null)
        setShowForm(false)
        fetchNews()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteNews = async (id: string) => {
    if (!confirm('¿Eliminar esta noticia?')) return
    try {
      const res = await fetch(`/api/noticias?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchNews()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const toggleActive = async (item: NewsItem) => {
    try {
      const res = await fetch(`/api/noticias?id=${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      if (res.ok) fetchNews()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const startEdit = (item: NewsItem) => {
    setEditing(item)
    setForm({
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl || '',
    })
    setShowForm(true)
  }

  if (loading) return <div className="p-6">Cargando...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Noticias y Novedades</h2>
          <p className="text-slate-500">Comunicate con tus clientes</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setForm({ title: '', content: '', imageUrl: '' })
            setShowForm(!showForm)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          Nueva Noticia
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold mb-4">{editing ? 'Editar Noticia' : 'Nueva Noticia'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título de la noticia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contenido *</label>
              <textarea
                rows={4}
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Contenido de la noticia..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL de imagen (opcional)</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                {editing ? 'Guardar cambios' : 'Publicar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de noticias */}
      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className={`bg-white border rounded-xl p-6 ${item.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Newspaper size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Calendar size={12} />
                    {new Date(item.createdAt).toLocaleDateString('es-AR')}
                    {!item.isActive && <span className="text-amber-600">• Inactiva</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleActive(item)}
                  className={`p-1.5 rounded-lg ${item.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                  title={item.isActive ? 'Ocultar' : 'Mostrar'}
                >
                  {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => startEdit(item)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => deleteNews(item.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.content}</p>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.title} className="mt-3 rounded-lg max-h-48 object-cover" />
            )}
          </div>
        ))}

        {news.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Newspaper className="mx-auto mb-3 text-slate-300" size={48} />
            <p>No hay noticias publicadas</p>
          </div>
        )}
      </div>
    </div>
  )
}