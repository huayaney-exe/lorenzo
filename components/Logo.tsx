'use client'

import Image from 'next/image'

export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Lorenzo Active Hub"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      priority
    />
  )
}

export function LogoWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-grotesk font-bold tracking-display text-lg ${className}`}
      aria-hidden="true"
    >
      LORENZO
    </span>
  )
}
