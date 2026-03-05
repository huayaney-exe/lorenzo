'use client'

import { useEffect, useState } from 'react'

interface Resource {
  id: string
  name: string
  capacity: number
  active: boolean
}

interface RelatedService {
  id: string
  name: string
  type: string
}

interface FormData {
  name: string
  capacity: number
}

const EMPTY_FORM: FormData = { name: '', capacity: 1 }

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [servicesByResource, setServicesByResource] = useState<Record<string, RelatedService[]>>({})
  const [loading, setLoading] = useState(true)

  // null = closed, 'new' = creating, string = editing that id
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function fetchResources() {
    const res = await fetch('/api/admin/resources')
    const data = await res.json()
    setResources(data.resources)
    setServicesByResource(data.servicesByResource ?? {})
    setLoading(false)
  }

  useEffect(() => {
    fetchResources()
  }, [])

  function openNew() {
    setEditingId('new')
    setForm(EMPTY_FORM)
    setError(null)
    setConfirmDeleteId(null)
  }

  function openEdit(resource: Resource) {
    setEditingId(resource.id)
    setForm({ name: resource.name, capacity: resource.capacity })
    setError(null)
    setConfirmDeleteId(null)
  }

  function cancelForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSave() {
    if (!form.name.trim() || form.capacity < 1) {
      setError('Nombre y capacidad son requeridos')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editingId === 'new') {
        const res = await fetch('/api/admin/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name.trim(), capacity: form.capacity }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al crear recurso')
        }
      } else {
        const res = await fetch(`/api/admin/resources/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name.trim(), capacity: form.capacity }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al actualizar recurso')
        }
      }

      cancelForm()
      await fetchResources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(resource: Resource) {
    await fetch(`/api/admin/resources/${resource.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !resource.active }),
    })
    await fetchResources()
  }

  async function handleDelete(id: string) {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar recurso')
      }
      setConfirmDeleteId(null)
      await fetchResources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setConfirmDeleteId(null)
    } finally {
      setSaving(false)
    }
  }

  function InlineForm() {
    return (
      <div className="p-4 border border-black/10 rounded-brutal bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Sala Principal"
              autoFocus
              className="w-full px-3 py-2 border border-black/10 rounded-brutal bg-bone
                font-grotesk text-sm text-asphalt placeholder:text-cement/40
                focus:outline-none focus:border-asphalt/30 transition-colors"
            />
          </div>

          <div className="w-full sm:w-32">
            <label className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-1">
              Capacidad
            </label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-black/10 rounded-brutal bg-bone
                font-grotesk text-sm text-asphalt
                focus:outline-none focus:border-asphalt/30 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-asphalt text-white font-mono text-xs tracking-widest
                rounded-brutal hover:bg-cement transition-colors disabled:opacity-50"
            >
              {saving ? '...' : 'GUARDAR'}
            </button>
            <button
              onClick={cancelForm}
              disabled={saving}
              className="px-4 py-2 border border-black/10 text-mid-gray font-mono text-xs tracking-widest
                rounded-brutal hover:bg-bone-dark transition-colors disabled:opacity-50"
            >
              CANCELAR
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 font-mono text-xs text-rojo">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-grotesk font-bold text-lg tracking-display text-asphalt">
          RECURSOS
        </h1>
        {editingId !== 'new' && (
          <button
            onClick={openNew}
            className="px-4 py-2 bg-rojo text-white font-mono text-xs tracking-widest
              rounded-brutal hover:bg-rojo-dark transition-colors"
          >
            + NUEVO
          </button>
        )}
      </div>

      {/* Error toast (for delete errors when no form is open) */}
      {error && editingId === null && (
        <div className="mb-4 p-3 border border-rojo/20 rounded-brutal bg-rojo/5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-rojo">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-rojo/60 hover:text-rojo text-sm ml-3"
              aria-label="Cerrar error"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* New resource form */}
      {editingId === 'new' && (
        <div className="mb-4">
          <InlineForm />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <p className="font-mono text-xs text-mid-gray">Cargando recursos...</p>
      )}

      {/* Resource list */}
      {!loading && resources.length === 0 && editingId !== 'new' && (
        <p className="font-mono text-xs text-mid-gray">
          No hay recursos. Crea uno para empezar.
        </p>
      )}

      <div className="space-y-2">
        {resources.map((resource) =>
          editingId === resource.id ? (
            <InlineForm key={resource.id} />
          ) : (
            <div
              key={resource.id}
              className={`flex items-center justify-between p-4 border border-black/10 rounded-brutal bg-white
                ${!resource.active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleActive(resource)}
                  className="flex-shrink-0"
                  aria-label={resource.active ? 'Desactivar recurso' : 'Activar recurso'}
                  title={resource.active ? 'Activo' : 'Inactivo'}
                >
                  <span
                    className={`block w-2.5 h-2.5 rounded-full transition-colors
                      ${resource.active ? 'bg-green-500' : 'bg-mid-gray'}`}
                  />
                </button>

                <div>
                  <div className="flex items-center">
                    <span className="font-grotesk font-bold text-sm text-asphalt">
                      {resource.name}
                    </span>
                    <span className="ml-3 font-mono text-[10px] text-mid-gray">
                      {resource.capacity} {resource.capacity === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                  {(servicesByResource[resource.id] ?? []).length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {servicesByResource[resource.id].map((svc) => (
                        <span
                          key={svc.id}
                          className="font-mono text-[10px] text-cement bg-bone px-1.5 py-0.5 rounded-brutal"
                        >
                          {svc.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {confirmDeleteId === resource.id ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-rojo">Eliminar?</span>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      disabled={saving}
                      className="px-2 py-1 bg-rojo text-white font-mono text-[10px] tracking-widest
                        rounded-brutal hover:bg-rojo-dark transition-colors disabled:opacity-50"
                    >
                      SI
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 border border-black/10 text-mid-gray font-mono text-[10px]
                        rounded-brutal hover:bg-bone-dark transition-colors"
                    >
                      NO
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => openEdit(resource)}
                      className="p-2 text-mid-gray hover:text-asphalt transition-colors"
                      aria-label="Editar recurso"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDeleteId(resource.id)
                        setError(null)
                      }}
                      className="p-2 text-mid-gray hover:text-rojo transition-colors"
                      aria-label="Eliminar recurso"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
