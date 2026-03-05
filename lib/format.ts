/** Client-safe formatting utilities — no server dependencies */

export function formatPrice(amount: number): string {
  return amount >= 1000 ? `S/${amount.toLocaleString('es-PE')}` : `S/${amount}`
}

export function formatOccupation(pct: number): string {
  return pct >= 100 ? 'LLENO' : `${pct}%`
}
