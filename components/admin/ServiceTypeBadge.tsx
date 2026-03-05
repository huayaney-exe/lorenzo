import type { ServiceType } from '@/lib/booking-data'

const colors: Record<ServiceType, string> = {
  paddle: 'bg-blue-50 text-blue-700 border-blue-200',
  boat: 'bg-teal-50 text-teal-700 border-teal-200',
  event: 'bg-purple-50 text-purple-700 border-purple-200',
  alliance: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
}

export function ServiceTypeBadge({ type }: { type: ServiceType }) {
  return (
    <span className={`inline-flex items-center font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-brutal border ${colors[type]}`}>
      {type}
    </span>
  )
}

export function AddonBadge() {
  return (
    <span className="inline-flex items-center font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-brutal border border-orange-200 bg-orange-50 text-orange-700">
      addon
    </span>
  )
}
