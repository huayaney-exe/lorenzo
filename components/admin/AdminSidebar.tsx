'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    label: 'Inicio',
    href: '/admin',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2.25 6.75L9 1.5l6.75 5.25V15a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6.75z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.75 16.5V9h4.5v7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Recursos',
    href: '/admin/resources',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M15.75 12.375l-6.75 3.75-6.75-3.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.75 9l-6.75 3.75L2.25 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.25 5.625L9 9.375l6.75-3.75L9 1.875l-6.75 3.75z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Servicios',
    href: '/admin/services',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2.25" y="2.25" width="5.25" height="5.25" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10.5" y="2.25" width="5.25" height="5.25" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2.25" y="10.5" width="5.25" height="5.25" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10.5" y="10.5" width="5.25" height="5.25" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: 'Horarios',
    href: '/admin/schedules',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6.75" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9 4.5V9l3 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Coaches',
    href: '/admin/coaches',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M12.75 15.75v-1.5a3 3 0 00-3-3h-1.5a3 3 0 00-3 3v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="5.25" r="3" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: 'Reservas',
    href: '/admin/bookings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M15.75 11.25v3a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.25 7.5L9 11.25l3.75-3.75M9 11.25V2.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Clientes',
    href: '/admin/crm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M15 15.75v-1.5a3 3 0 00-3-3H6a3 3 0 00-3 3v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="5.25" r="3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M16.5 15.75v-1.5a2.25 2.25 0 00-1.5-2.12M12.75 2.55a2.25 2.25 0 010 4.36" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname?.startsWith(href) ?? false
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white border-r border-black/[0.08] flex-shrink-0">
        {/* Branding */}
        <div className="px-5 py-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <h1 className="font-grotesk font-bold text-sm tracking-display text-asphalt">LORENZO</h1>
            <span className="font-mono text-[8px] tracking-widest bg-asphalt text-white px-1.5 py-0.5 rounded-[3px]">
              ADMIN
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors
                  ${active
                    ? 'bg-bone text-asphalt'
                    : 'text-mid-gray hover:text-asphalt hover:bg-bone/60'
                  }
                `}
              >
                <span className={active ? 'text-rojo' : 'text-mid-gray'}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/[0.06]">
          <span className="font-mono text-[9px] tracking-widest text-mid-gray/60">v1.0</span>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-black/[0.08]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="font-grotesk font-bold text-sm tracking-display text-asphalt">LORENZO</h1>
            <span className="font-mono text-[8px] tracking-widest bg-asphalt text-white px-1.5 py-0.5 rounded-[3px]">
              ADMIN
            </span>
          </div>
        </div>
        <div className="flex border-t border-black/[0.06] overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex-shrink-0 px-4 py-2.5 font-mono text-[10px] tracking-widest transition-colors
                  ${active
                    ? 'text-rojo border-b-2 border-rojo'
                    : 'text-mid-gray hover:text-asphalt'
                  }
                `}
              >
                {item.label.toUpperCase()}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
