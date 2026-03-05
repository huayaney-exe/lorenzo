'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ServiceType, PricingModel } from '@/lib/booking-data'

interface ResourceOption {
  id: string
  name: string
  capacity: number
}

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'paddle', label: 'Paddle' },
  { value: 'boat', label: 'Boat' },
  { value: 'event', label: 'Event' },
  { value: 'alliance', label: 'Alliance' },
  { value: 'other', label: 'Other' },
]

export default function NewServicePage() {
  const router = useRouter()
  const [resources, setResources] = useState<ResourceOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [nameEs, setNameEs] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [descEs, setDescEs] = useState('')
  const [descEn, setDescEn] = useState('')
  const [type, setType] = useState<ServiceType>('paddle')
  const [resourceId, setResourceId] = useState('')
  const [pricingModel, setPricingModel] = useState<PricingModel>('per_person')
  const [pricePen, setPricePen] = useState<number>(0)
  const [maxSpots, setMaxSpots] = useState<number>(1)
  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [isAddon, setIsAddon] = useState(false)
  const [active, setActive] = useState(true)

  useEffect(() => {
    fetch('/api/admin/resources')
      .then((r) => r.json())
      .then((data) => setResources(data.resources))
      .catch(() => setError('Error al cargar recursos'))
  }, [])

  const selectedResource = resources.find((r) => r.id === resourceId) ?? null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: { es: nameEs, en: nameEn },
          description: { es: descEs, en: descEn },
          type,
          resourceId: resourceId || null,
          pricingModel,
          pricePen,
          maxSpots,
          durationMinutes,
          isAddon,
          active,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear servicio')
      }

      router.push('/admin/services')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear servicio')
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/services"
          className="p-1.5 text-mid-gray hover:text-asphalt transition-colors rounded-brutal hover:bg-bone"
          aria-label="Volver a servicios"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="font-mono text-xs tracking-widest text-mid-gray uppercase">
          NUEVO SERVICIO
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-brutal font-mono text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        {/* Name ES */}
        <fieldset className="space-y-1">
          <label
            htmlFor="name-es"
            className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase"
          >
            Nombre (ES)
          </label>
          <input
            id="name-es"
            type="text"
            required
            value={nameEs}
            onChange={(e) => setNameEs(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal font-grotesk text-sm text-asphalt bg-white focus:outline-none focus:border-rojo transition-colors"
          />
        </fieldset>

        {/* Name EN */}
        <fieldset className="space-y-1">
          <label
            htmlFor="name-en"
            className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase"
          >
            Nombre (EN)
          </label>
          <input
            id="name-en"
            type="text"
            required
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal font-grotesk text-sm text-asphalt bg-white focus:outline-none focus:border-rojo transition-colors"
          />
        </fieldset>

        {/* Description ES */}
        <fieldset className="space-y-1">
          <label
            htmlFor="desc-es"
            className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase"
          >
            Descripcion (ES)
          </label>
          <textarea
            id="desc-es"
            rows={3}
            value={descEs}
            onChange={(e) => setDescEs(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal font-grotesk text-sm text-asphalt bg-white focus:outline-none focus:border-rojo transition-colors resize-y"
          />
        </fieldset>

        {/* Description EN */}
        <fieldset className="space-y-1">
          <label
            htmlFor="desc-en"
            className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase"
          >
            Descripcion (EN)
          </label>
          <textarea
            id="desc-en"
            rows={3}
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal font-grotesk text-sm text-asphalt bg-white focus:outline-none focus:border-rojo transition-colors resize-y"
          />
        </fieldset>

        {/* Type */}
        <fieldset className="space-y-1">
          <label
            htmlFor="type"
            className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase"
          >
            Tipo
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as ServiceType)}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal font-grotesk text-sm text-asphalt bg-white focus:outline-none focus:border-rojo transition-colors"
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </fieldset>

        {/* Resource */}
        <fieldset className="space-y-1">
          <label
            htmlFor="resource"
            className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase"
          >
            Recurso
          </label>
          <select
            id="resource"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal font-grotesk text-sm text-asphalt bg-white focus:outline-none focus:border-rojo transition-colors"
          >
            <option value="">Ninguno</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.capacity} pers)
              </option>
            ))}
          </select>
        </fieldset>

        {/* Pricing Model */}
        <fieldset className="space-y-1">
          <span className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase">
            Modelo de precio
          </span>
          <div className="flex rounded-brutal border border-black/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setPricingModel('per_person')}
              className={`flex-1 py-2 font-mono text-[11px] tracking-widest transition-colors ${
                pricingModel === 'per_person'
                  ? 'bg-asphalt text-white'
                  : 'bg-white text-mid-gray hover:text-asphalt'
              }`}
            >
              Por persona
            </button>
            <button
              type="button"
              onClick={() => setPricingModel('flat')}
              className={`flex-1 py-2 font-mono text-[11px] tracking-widest transition-colors ${
                pricingModel === 'flat'
                  ? 'bg-asphalt text-white'
                  : 'bg-white text-mid-gray hover:text-asphalt'
              }`}
            >
              Tarifa fija
            </button>
          </div>
        </fieldset>

        {/* Price */}
        <fieldset className="space-y-1">
          <label
            htmlFor="price"
            className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase"
          >
            {pricingModel === 'per_person'
              ? 'Precio por persona (S/)'
              : 'Tarifa fija (S/)'}
          </label>
          <input
            id="price"
            type="number"
            required
            min={0}
            step={1}
            value={pricePen}
            onChange={(e) => setPricePen(Number(e.target.value))}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal font-grotesk text-sm text-asphalt bg-white focus:outline-none focus:border-rojo transition-colors"
          />
        </fieldset>

        {/* Max Spots */}
        <fieldset className="space-y-1">
          <label
            htmlFor="max-spots"
            className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase"
          >
            Cupos maximos
          </label>
          <input
            id="max-spots"
            type="number"
            required
            min={1}
            value={maxSpots}
            onChange={(e) => setMaxSpots(Number(e.target.value))}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal font-grotesk text-sm text-asphalt bg-white focus:outline-none focus:border-rojo transition-colors"
          />
          {selectedResource && (
            <p className="font-mono text-[10px] text-mid-gray">
              Capacidad del recurso: {selectedResource.capacity} pers
            </p>
          )}
        </fieldset>

        {/* Duration */}
        <fieldset className="space-y-1">
          <label
            htmlFor="duration"
            className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase"
          >
            Duracion (minutos)
          </label>
          <input
            id="duration"
            type="number"
            required
            min={15}
            step={15}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal font-grotesk text-sm text-asphalt bg-white focus:outline-none focus:border-rojo transition-colors"
          />
        </fieldset>

        {/* Is Addon */}
        <fieldset className="flex items-center gap-3">
          <input
            id="is-addon"
            type="checkbox"
            checked={isAddon}
            onChange={(e) => setIsAddon(e.target.checked)}
            className="w-4 h-4 rounded border-black/10 text-rojo focus:ring-rojo"
          />
          <label
            htmlFor="is-addon"
            className="font-mono text-[10px] tracking-widest text-mid-gray uppercase"
          >
            Es addon
          </label>
        </fieldset>

        {/* Active */}
        <fieldset className="space-y-1">
          <span className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase">
            Estado
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => setActive(!active)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              active ? 'bg-green-500' : 'bg-mid-gray'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="ml-2 font-mono text-[10px] text-mid-gray">
            {active ? 'Activo' : 'Inactivo'}
          </span>
        </fieldset>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-rojo text-white font-mono text-xs tracking-widest rounded-brutal hover:bg-rojo/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'CREANDO...' : 'CREAR SERVICIO'}
          </button>
        </div>
      </form>
    </div>
  )
}
