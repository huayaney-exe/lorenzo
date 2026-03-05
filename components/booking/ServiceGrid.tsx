'use client'

import { motion } from 'framer-motion'
import { ServiceCard } from './ServiceCard'
import type { Lang, PricingModel, Resource } from '@/lib/booking-data'

interface NextAvailable {
  availableSpots: number
  occupationPct: number
}

interface ServiceGridService {
  id: string
  slug: string
  name: Record<'es' | 'en', string>
  type: string
  resourceId: string | null
  resource: Pick<Resource, 'name' | 'capacity'> | null
  pricingModel: PricingModel
  pricePen: number
  maxSpots: number
  durationMinutes: number
  hasAvailability: boolean
  nextAvailable: NextAvailable | null
}

interface Props {
  services: ServiceGridService[]
  lang: Lang
}

const typeLabels: Record<string, Record<'es' | 'en', string>> = {
  paddle: { es: 'PADDLE', en: 'PADDLE' },
  boat: { es: 'EN BOTE', en: 'BY BOAT' },
  alliance: { es: 'ALIANZAS', en: 'ALLIANCES' },
  event: { es: 'EVENTOS', en: 'EVENTS' },
  other: { es: 'OTROS', en: 'OTHER' },
}

function groupByType(services: ServiceGridService[]): Map<string, ServiceGridService[]> {
  const groups = new Map<string, ServiceGridService[]>()
  const order = ['paddle', 'boat', 'alliance', 'event', 'other']

  for (const type of order) {
    const items = services.filter((s) => s.type === type)
    if (items.length > 0) groups.set(type, items)
  }

  // Catch any types not in the predefined order
  for (const s of services) {
    if (!order.includes(s.type)) {
      const existing = groups.get(s.type) ?? []
      existing.push(s)
      groups.set(s.type, existing)
    }
  }

  return groups
}

export function ServiceGrid({ services, lang }: Props) {
  if (services.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="py-16 text-center"
      >
        <p className="font-mono text-sm tracking-wide text-mid-gray">
          {lang === 'es'
            ? 'No hay experiencias disponibles'
            : 'No experiences available'}
        </p>
      </motion.div>
    )
  }

  const groups = groupByType(services)
  let globalIndex = 0

  return (
    <div className="space-y-10">
      {Array.from(groups.entries()).map(([type, items]) => {
        const label = typeLabels[type]?.[lang] ?? type.toUpperCase()

        return (
          <section key={type} aria-labelledby={`section-${type}`}>
            {/* Section header with centered label and thin border */}
            <div className="relative flex items-center mb-5">
              <div className="flex-1 h-px bg-black/[0.08]" />
              <h2
                id={`section-${type}`}
                className="font-mono text-[10px] tracking-widest text-mid-gray uppercase px-4 font-bold"
              >
                {label}
              </h2>
              <div className="flex-1 h-px bg-black/[0.08]" />
            </div>

            {/* Service cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((service) => {
                const idx = globalIndex++
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    lang={lang}
                    index={idx}
                  />
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
