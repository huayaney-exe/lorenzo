'use client'

/**
 * Hand-drawn arrow SVG — artisanal, not stock.
 * Irregular stroke paths that evoke chalk on a red wall
 * or white marker on a construction site.
 */
export function HandArrow({
  className = '',
  color = 'currentColor',
  size = 24,
}: {
  className?: string
  color?: string
  size?: number
}) {
  return (
    <svg
      viewBox="0 0 28 14"
      width={size}
      height={size * 0.5}
      fill="none"
      className={`inline-block ${className}`}
      aria-hidden="true"
    >
      <path
        d="M1 7.2 C4 6.4, 9 7.8, 14 7 C17 6.5, 19.5 7.3, 22 7"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M18.5 3.5 C19.8 4.8, 21 6, 23 7.2 C21 8.3, 19.5 9.8, 18 11.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Hand-drawn curved arrow — for annotations/labels,
 * like the "ACCESO CON HUELLA DIGITAL" reference
 */
export function HandArrowCurved({
  className = '',
  color = 'currentColor',
}: {
  className?: string
  color?: string
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={24}
      height={24}
      fill="none"
      className={`inline-block ${className}`}
      aria-hidden="true"
    >
      <path
        d="M8 6 C12 4, 20 6, 22 14 C23 18, 21 23, 18 26"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 23 L18 26.5 L21 22"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
