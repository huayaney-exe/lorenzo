'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ServiceTypeBadge, AddonBadge } from '@/components/admin/ServiceTypeBadge'
import { formatPrice } from '@/lib/booking-data'
import type { ServiceType, PricingModel } from '@/lib/booking-data'

interface ServiceResource {
  id: string
  name: string
  capacity: number
}

interface ServiceEntry {
  id: string
  name: { es: string; en: string }
  type: ServiceType
  pricingModel: PricingModel
  pricePen: number
  maxSpots: number
  durationMinutes: number
  isAddon: boolean
  active: boolean
  resource: ServiceResource | null
}

export default function ServicesListPage() {
  const [services, setServices] = useState<ServiceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  function fetchServices() {
    setLoading(true)
    fetch('/api/admin/services')
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services)
        setLoading(false)
      })
      .catch(() => {
        setError('Error al cargar servicios')
        setLoading(false)
      })
  }

  async function handleToggleActive(svc: ServiceEntry) {
    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !svc.active }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, active: !s.active } : s))
      )
    } catch {
      setError('Error al cambiar estado')
    }
  }

  async function handleDelete(svc: ServiceEntry) {
    const confirmed = window.confirm(
      `Eliminar "${svc.name.es}"? Esta accion no se puede deshacer.`
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, {
        method: 'DELETE',
      })
      if (res.status === 409) {
        const data = await res.json()
        setError(data.error || 'No se puede eliminar: tiene sesiones asociadas')
        return
      }
      if (!res.ok) throw new Error('Error al eliminar')
      setServices((prev) => prev.filter((s) => s.id !== svc.id))
      setError(null)
    } catch {
      setError('Error al eliminar servicio')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xs tracking-widest text-mid-gray uppercase">
          SERVICIOS
        </h1>
        <Link
          href="/admin/services/new"
          className="font-mono text-[11px] tracking-widest bg-rojo text-white px-4 py-2 rounded-full hover:bg-rojo/90 transition-colors"
        >
          + Nuevo
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-brutal font-mono text-xs text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline"
            aria-label="Cerrar mensaje de error"
          >
            cerrar
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p className="font-mono text-xs text-mid-gray">Cargando...</p>
      )}

      {/* List */}
      {!loading && services.length === 0 && (
        <p className="font-mono text-xs text-mid-gray">
          No hay servicios creados
        </p>
      )}

      {!loading && services.length > 0 && (
        <div className="space-y-2">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`p-4 border border-black/10 rounded-brutal bg-white transition-opacity ${
                !svc.active ? 'opacity-50' : ''
              }`}
            >
              {/* Top row: name, badges, actions */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="font-grotesk font-bold text-sm text-asphalt truncate">
                    {svc.name.es}
                  </span>
                  <ServiceTypeBadge type={svc.type} />
                  {svc.isAddon && <AddonBadge />}
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      svc.active ? 'bg-green-500' : 'bg-mid-gray'
                    }`}
                    title={svc.active ? 'Activo' : 'Inactivo'}
                    aria-label={svc.active ? 'Activo' : 'Inactivo'}
                  />
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Edit */}
                  <Link
                    href={`/admin/services/${svc.id}/edit`}
                    className="p-1.5 text-mid-gray hover:text-asphalt transition-colors rounded-brutal hover:bg-bone"
                    aria-label={`Editar ${svc.name.es}`}
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
                  </Link>

                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggleActive(svc)}
                    className="p-1.5 text-mid-gray hover:text-asphalt transition-colors rounded-brutal hover:bg-bone"
                    title={svc.active ? 'Desactivar' : 'Activar'}
                    aria-label={
                      svc.active
                        ? `Desactivar ${svc.name.es}`
                        : `Activar ${svc.name.es}`
                    }
                  >
                    {svc.active ? (
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
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
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
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(svc)}
                    className="p-1.5 text-mid-gray hover:text-rojo transition-colors rounded-brutal hover:bg-red-50"
                    aria-label={`Eliminar ${svc.name.es}`}
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
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Bottom row: details */}
              <div className="flex items-center gap-3 flex-wrap">
                {svc.resource && (
                  <span className="font-mono text-[10px] text-mid-gray">
                    {svc.resource.name} ({svc.resource.capacity} pers)
                  </span>
                )}
                <span className="font-mono text-[10px] text-mid-gray">
                  {formatPrice(svc.pricePen)}
                </span>
                <span className="font-mono text-[10px] text-mid-gray">
                  {svc.pricingModel === 'per_person' ? 'pp' : 'fijo'}
                </span>
                <span className="font-mono text-[10px] text-mid-gray">
                  {svc.durationMinutes} min
                </span>
                <span className="font-mono text-[10px] text-mid-gray">
                  max {svc.maxSpots}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
