'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '@/lib/i18n'
import type { Service, Resource, PricingModel, Lang } from '@/lib/booking-data'

interface NextAvailable {
  availableSpots: number
  occupationPct: number
}

interface ServiceCardService {
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
  service: ServiceCardService
  lang: Lang
  index: number
}

const typeBadge: Record<string, { bg: string; text: string }> = {
  paddle: { bg: 'bg-blue-100', text: 'text-blue-700' },
  boat: { bg: 'bg-teal-100', text: 'text-teal-700' },
  alliance: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  event: { bg: 'bg-gray-100', text: 'text-gray-600' },
  other: { bg: 'bg-gray-100', text: 'text-gray-600' },
}

export function ServiceCard({ service, lang, index }: Props) {
  const { t } = useLang()
  const isFull =
    service.hasAvailability &&
    service.nextAvailable &&
    service.nextAvailable.occupationPct >= 100

  const badge = typeBadge[service.type] ?? typeBadge.other

  const pricingLabel =
    service.pricingModel === 'per_person'
      ? t.services.perPerson
      : t.services.flatRate

  const priceFormatted =
    service.pricePen >= 1000
      ? `S/${service.pricePen.toLocaleString('es-PE')}`
      : `S/${service.pricePen}`

  const isUnavailable = !service.hasAvailability || isFull

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.04 + index * 0.06,
        duration: 0.45,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={`bg-white border border-black/[0.08] rounded-brutal p-5 flex flex-col gap-3
                 transition-colors duration-200 ${isUnavailable ? 'opacity-50' : 'hover:border-black/15'}`}
    >
      {/* Type badge */}
      <div className="flex items-center gap-2">
        <span
          className={`${badge.bg} ${badge.text} font-mono text-[10px] tracking-widest uppercase
                      px-2 py-0.5 rounded-full font-bold`}
        >
          {service.type}
        </span>
      </div>

      {/* Service name */}
      <h3 className="font-grotesk font-bold text-lg text-asphalt leading-tight">
        {service.name[lang]}
      </h3>

      {/* Resource name */}
      {service.resource && (
        <span className="font-mono text-[11px] tracking-wide text-mid-gray">
          {service.resource.name}
        </span>
      )}

      {/* Price + Duration row */}
      <div className="flex items-baseline justify-between mt-auto pt-2 border-t border-black/[0.06]">
        <div>
          <span className="font-grotesk font-bold text-xl text-asphalt">
            {priceFormatted}
          </span>
          <span className="font-mono text-[10px] tracking-wide text-mid-gray ml-1.5">
            {pricingLabel}
          </span>
        </div>
        <span className="font-mono text-[11px] tracking-widest text-cement">
          {service.durationMinutes} min
        </span>
      </div>

      {/* Availability */}
      {service.hasAvailability && service.nextAvailable && (
        <div className="flex items-center gap-2">
          {isFull ? (
            <span className="font-mono text-[10px] tracking-widest text-rojo uppercase font-bold">
              {t.services.full}
            </span>
          ) : (
            <span className="font-mono text-[10px] tracking-wide text-mid-gray">
              {service.nextAvailable.availableSpots}{' '}
              {t.services.available}
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      {isUnavailable ? (
        <p className="text-center font-mono text-xs tracking-widest text-cement uppercase mt-1 py-3.5">
          {t.services.noAvailability}
        </p>
      ) : (
        <Link
          href={`/${lang}/book/${service.slug}`}
          className="block w-full text-center font-grotesk font-bold text-sm tracking-display
                     bg-rojo text-white py-3.5 rounded-brutal mt-1
                     hover:bg-rojo-dark transition-colors duration-200
                     focus-visible:outline-rojo focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {t.services.choose}
        </Link>
      )}
    </motion.div>
  )
}
