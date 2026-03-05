'use client'

import { useEffect, useState } from 'react'

interface Coach {
  id: string
  name: string
  phone: string
  role: 'admin' | 'operator'
  active: boolean
}

interface FormData {
  name: string
  phone: string
  role: 'admin' | 'operator'
}

const EMPTY_FORM: FormData = { name: '', phone: '', role: 'operator' }

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)

  // null = closed, 'new' = creating, string = editing that id
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchCoaches() {
    try {
      const res = await fetch('/api/admin/coaches')
      const data = await res.json()
      setCoaches(data.coaches)
    } catch {
      setError('Error al cargar coaches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoaches()
  }, [])

  function openNew() {
    setEditingId('new')
    setForm(EMPTY_FORM)
    setError(null)
  }

  function openEdit(coach: Coach) {
    setEditingId(coach.id)
    setForm({ name: coach.name, phone: coach.phone, role: coach.role })
    setError(null)
  }

  function cancelForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Nombre y telefono son requeridos')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editingId === 'new') {
        const res = await fetch('/api/admin/coaches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            role: form.role,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al crear coach')
        }
      } else {
        const res = await fetch(`/api/admin/coaches/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            role: form.role,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al actualizar coach')
        }
      }

      cancelForm()
      await fetchCoaches()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(coach: Coach) {
    try {
      await fetch(`/api/admin/coaches/${coach.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !coach.active }),
      })
      await fetchCoaches()
    } catch {
      setError('Error al cambiar estado')
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
              placeholder="Ej: Franco Marsano"
              autoFocus
              className="w-full px-3 py-2 border border-black/10 rounded-brutal bg-bone
                font-grotesk text-sm text-asphalt placeholder:text-cement/40
                focus:outline-none focus:border-asphalt/30 transition-colors"
            />
          </div>

          <div className="flex-1">
            <label className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-1">
              Telefono
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+51999888777"
              className="w-full px-3 py-2 border border-black/10 rounded-brutal bg-bone
                font-grotesk text-sm text-asphalt placeholder:text-cement/40
                focus:outline-none focus:border-asphalt/30 transition-colors"
            />
          </div>

          <div className="w-full sm:w-36">
            <label className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-1">
              Rol
            </label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as 'admin' | 'operator' }))
              }
              className="w-full px-3 py-2 border border-black/10 rounded-brutal bg-bone
                font-grotesk text-sm text-asphalt
                focus:outline-none focus:border-asphalt/30 transition-colors"
            >
              <option value="operator">Operador</option>
              <option value="admin">Admin</option>
            </select>
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
          COACHES
        </h1>
        {editingId !== 'new' && (
          <button
            onClick={openNew}
            className="px-4 py-2 bg-rojo text-white font-mono text-xs tracking-widest
              rounded-brutal hover:bg-rojo/90 transition-colors"
          >
            + NUEVO
          </button>
        )}
      </div>

      {/* Error toast (when no form is open) */}
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

      {/* New coach form */}
      {editingId === 'new' && (
        <div className="mb-4">
          <InlineForm />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <p className="font-mono text-xs text-mid-gray">Cargando coaches...</p>
      )}

      {/* Empty state */}
      {!loading && coaches.length === 0 && editingId !== 'new' && (
        <p className="font-mono text-xs text-mid-gray">
          No hay coaches. Crea uno para empezar.
        </p>
      )}

      {/* Coach list */}
      <div className="space-y-2">
        {coaches.map((coach) =>
          editingId === coach.id ? (
            <InlineForm key={coach.id} />
          ) : (
            <div
              key={coach.id}
              className={`flex items-center justify-between p-4 border border-black/10 rounded-brutal bg-white
                ${!coach.active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleActive(coach)}
                  className="flex-shrink-0"
                  aria-label={coach.active ? 'Desactivar coach' : 'Activar coach'}
                  title={coach.active ? 'Activo' : 'Inactivo'}
                >
                  <span
                    className={`block w-2.5 h-2.5 rounded-full transition-colors
                      ${coach.active ? 'bg-green-500' : 'bg-mid-gray'}`}
                  />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-grotesk font-bold text-sm text-asphalt">
                      {coach.name}
                    </span>
                    <span
                      className={`inline-flex items-center font-mono text-[10px] tracking-wide px-2 py-0.5 rounded-brutal border
                        ${coach.role === 'admin'
                          ? 'bg-rojo/10 text-rojo border-rojo/20'
                          : 'bg-black/5 text-mid-gray border-black/10'
                        }`}
                    >
                      {coach.role === 'admin' ? 'Admin' : 'Operador'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-mid-gray">
                    {coach.phone}
                  </span>
                </div>
              </div>

              <button
                onClick={() => openEdit(coach)}
                className="p-2 text-mid-gray hover:text-asphalt transition-colors"
                aria-label={`Editar ${coach.name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
