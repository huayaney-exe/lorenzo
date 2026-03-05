'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatPrice } from '@/lib/format'

interface Customer {
  name: string
  phone: string
  totalSpent: number
  totalBookings: number
  totalSeats: number
  lastVisit: string
  services: string[]
}

type SortKey = 'name' | 'last_visit_asc' | 'last_visit_desc' | 'spent_desc' | 'bookings_desc'

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'name', label: 'Nombre A-Z' },
  { value: 'last_visit_asc', label: 'Mas tiempo sin venir' },
  { value: 'last_visit_desc', label: 'Visita mas reciente' },
  { value: 'spent_desc', label: 'Mayor gasto' },
  { value: 'bookings_desc', label: 'Mas reservas' },
]

function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
}

function daysAgo(dateStr: string): string {
  if (!dateStr) return '--'
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))
  const visit = new Date(dateStr + 'T00:00:00')
  const diff = Math.floor((now.getTime() - visit.getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return `Hace ${diff}d`
}

export default function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 30

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ sort, page: String(page) })
    if (search) params.set('q', search)
    const res = await fetch(`/api/admin/crm?${params}`)
    const data = await res.json()
    setCustomers(data.customers ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [sort, page, search])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const hasMore = page * limit < total

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-grotesk font-bold text-lg tracking-display text-asphalt">
          CLIENTES
        </h1>
        <span className="font-mono text-[10px] text-mid-gray">
          {total} contactos
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar nombre o telefono..."
          className="flex-1 px-3 py-2 border border-black/10 rounded-brutal bg-bone
            font-mono text-xs text-asphalt placeholder:text-cement/40
            focus:outline-none focus:border-asphalt/30 transition-colors"
        />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortKey)
            setPage(1)
          }}
          className="px-3 py-2 border border-black/10 rounded-brutal bg-bone
            font-mono text-xs text-asphalt
            focus:outline-none focus:border-asphalt/30 transition-colors"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-black/[0.04] rounded-brutal animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && customers.length === 0 && (
        <p className="font-mono text-xs text-mid-gray py-10 text-center">
          {search ? 'Sin resultados' : 'No hay clientes registrados'}
        </p>
      )}

      {/* Customer list */}
      {!loading && customers.length > 0 && (
        <div className="space-y-2">
          {customers.map((c) => (
            <div
              key={c.phone}
              className="p-4 border border-black/10 rounded-brutal bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                {/* Left: name + phone + services */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-grotesk font-bold text-sm text-asphalt truncate">
                      {c.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[11px] text-cement">
                      {c.phone}
                    </span>
                    <a
                      href={waLink(c.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] text-green-600 hover:text-green-700 transition-colors"
                    >
                      WhatsApp
                    </a>
                  </div>
                  {c.services.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {c.services.map((s) => (
                        <span
                          key={s}
                          className="font-mono text-[10px] text-cement bg-bone px-1.5 py-0.5 rounded-brutal"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: stats */}
                <div className="flex items-center gap-4 flex-shrink-0 sm:text-right">
                  <div>
                    <span className="font-mono text-[10px] text-mid-gray block">Gasto</span>
                    <span className="font-grotesk font-bold text-sm text-asphalt">
                      {formatPrice(c.totalSpent)}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-mid-gray block">Reservas</span>
                    <span className="font-grotesk font-bold text-sm text-asphalt">
                      {c.totalBookings}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-mid-gray block">Ultima</span>
                    <span className="font-grotesk font-bold text-sm text-asphalt">
                      {daysAgo(c.lastVisit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > limit && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-black/10 rounded-brutal font-mono text-xs
              text-mid-gray hover:text-asphalt transition-colors disabled:opacity-30"
          >
            ANT
          </button>
          <span className="font-mono text-[10px] text-mid-gray">
            {page} / {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="px-3 py-1.5 border border-black/10 rounded-brutal font-mono text-xs
              text-mid-gray hover:text-asphalt transition-colors disabled:opacity-30"
          >
            SIG
          </button>
        </div>
      )}
    </div>
  )
}
