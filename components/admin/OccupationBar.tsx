interface Props {
  bookedSpots: number
  maxSpots: number
  occupationPct: number
  size?: 'sm' | 'md'
}

export function OccupationBar({ bookedSpots, maxSpots, occupationPct, size = 'sm' }: Props) {
  const color = occupationPct >= 80 ? 'bg-rojo' : occupationPct >= 50 ? 'bg-amber-500' : 'bg-asphalt/30'
  const trackColor = 'bg-black/[0.06]'
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'
  const width = size === 'sm' ? 'w-16' : 'w-24'

  return (
    <div className="flex items-center gap-2">
      <div className={`${width} ${height} ${trackColor} rounded-full overflow-hidden`}>
        <div
          className={`${height} ${color} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, occupationPct)}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-cement">
        {bookedSpots}/{maxSpots}
      </span>
      <span className={`font-mono text-[10px] ${occupationPct >= 80 ? 'text-rojo' : occupationPct >= 50 ? 'text-amber-600' : 'text-mid-gray'}`}>
        {occupationPct}%
      </span>
    </div>
  )
}
