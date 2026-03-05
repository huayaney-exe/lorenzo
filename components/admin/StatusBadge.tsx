import type { BookingStatus, SessionStatus } from '@/lib/booking-data'

const bookingColors: Record<BookingStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const bookingLabels: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const sessionColors: Record<SessionStatus, string> = {
  scheduled: 'bg-green-500',
  cancelled: 'bg-red-500',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center font-mono text-[10px] tracking-wide px-2 py-0.5 rounded-brutal border ${bookingColors[status]}`}>
      {bookingLabels[status]}
    </span>
  )
}

export function SessionStatusDot({ status }: { status: SessionStatus }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${sessionColors[status]}`} />
}
