'use client'

import { useEffect, useState } from 'react'
import WeeklyScheduleEditor from '@/components/admin/WeeklyScheduleEditor'

interface ServiceOption {
  id: string
  name: { es: string; en: string }
  durationMinutes: number
  isAddon: boolean
  active: boolean
}

export default function SchedulesPage() {
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    fetch('/api/admin/services')
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.services as ServiceOption[]).filter((s) => !s.isAddon && s.active)
        setServices(filtered)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const selected = services.find((s) => s.id === selectedId) ?? null

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-grotesk font-bold text-xl text-asphalt">Horarios</h1>
        <p className="font-mono text-xs text-mid-gray mt-1">
          Configura la disponibilidad semanal de cada servicio
        </p>
      </div>

      {/* Service selector */}
      <div className="mb-6">
        <label className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-1">
          Servicio
        </label>
        {loading ? (
          <p className="font-mono text-xs text-mid-gray">Cargando servicios...</p>
        ) : services.length === 0 ? (
          <p className="font-mono text-xs text-mid-gray">
            No hay servicios activos. Crea uno primero.
          </p>
        ) : (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-black/10 rounded-brutal bg-bone
              font-grotesk text-sm text-asphalt
              focus:outline-none focus:border-asphalt/30 transition-colors"
          >
            <option value="">Selecciona un servicio</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name.es} ({svc.durationMinutes} min)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Editor */}
      {selected && (
        <WeeklyScheduleEditor
          key={selected.id}
          serviceId={selected.id}
          serviceName={selected.name.es}
          durationMinutes={selected.durationMinutes}
        />
      )}
    </div>
  )
}
