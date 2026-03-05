'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value changes
  useEffect(() => { setDraft(value) }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^0-9:]/g, '')

    // Auto-insert colon: "07" → "07:", "073" → "07:3"
    if (raw.length === 2 && !raw.includes(':')) raw = raw + ':'
    if (raw.length > 5) raw = raw.slice(0, 5)

    setDraft(raw)
  }

  function commit() {
    const match = draft.match(/^(\d{1,2}):(\d{2})$/)
    if (match) {
      const h = Math.min(23, Math.max(0, parseInt(match[1])))
      const m = Math.min(59, Math.max(0, parseInt(match[2])))
      const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      setDraft(formatted)
      onChange(formatted)
    } else {
      // Revert to last valid value
      setDraft(value)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      commit()
      inputRef.current?.blur()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      placeholder="HH:MM"
      maxLength={5}
      value={draft}
      onChange={handleChange}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className="w-[80px] px-3 py-2 border border-black/10 rounded-brutal text-sm font-grotesk text-center
        text-asphalt bg-white focus:outline-none focus:border-asphalt/30 transition-colors"
    />
  )
}

interface Props {
  serviceId: string
  serviceName: string
  durationMinutes: number
}

interface TimeWindow {
  startTime: string
  endTime: string
}

type DaySchedule = {
  active: boolean
  windows: TimeWindow[]
}

type WeekGrid = Record<number, DaySchedule>

interface PreviewSlot {
  date: string
  dayLabel: string
  time: string
  endTime: string
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'] as const

const EMPTY_GRID: WeekGrid = {
  0: { active: false, windows: [] },
  1: { active: false, windows: [] },
  2: { active: false, windows: [] },
  3: { active: false, windows: [] },
  4: { active: false, windows: [] },
  5: { active: false, windows: [] },
  6: { active: false, windows: [] },
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const newH = Math.floor(total / 60) % 24
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

function generateSlotsForDay(
  dateStr: string,
  dayLabel: string,
  windows: TimeWindow[],
  durationMinutes: number
): PreviewSlot[] {
  const slots: PreviewSlot[] = []
  for (const w of windows) {
    let cursor = w.startTime
    while (cursor < w.endTime) {
      const end = addMinutes(cursor, durationMinutes)
      if (end > w.endTime) break
      slots.push({ date: dateStr, dayLabel, time: cursor, endTime: end })
      cursor = end
    }
  }
  return slots
}

export default function WeeklyScheduleEditor({ serviceId, serviceName, durationMinutes }: Props) {
  const [grid, setGrid] = useState<WeekGrid>(structuredClone(EMPTY_GRID))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [preview, setPreview] = useState<PreviewSlot[]>([])
  const [copyFrom, setCopyFrom] = useState<number | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/schedules?serviceId=${serviceId}`)
      const data = await res.json()
      const fresh: WeekGrid = structuredClone(EMPTY_GRID)

      for (const sch of data.schedules ?? []) {
        const day = fresh[sch.dayOfWeek as number]
        if (day) {
          day.active = true
          day.windows.push({ startTime: sch.startTime, endTime: sch.endTime })
        }
      }

      setGrid(fresh)
      setPreview([])
    } catch {
      setFeedback({ type: 'error', message: 'Error al cargar horarios' })
    } finally {
      setLoading(false)
    }
  }, [serviceId])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  // Close copy popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCopyFrom(null)
      }
    }
    if (copyFrom !== null) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [copyFrom])

  function toggleDay(day: number) {
    setGrid((prev) => {
      const updated = { ...prev }
      const current = updated[day]
      if (current.active) {
        updated[day] = { active: false, windows: [] }
      } else {
        updated[day] = { active: true, windows: [{ startTime: '08:00', endTime: '17:00' }] }
      }
      return updated
    })
  }

  function updateWindow(day: number, idx: number, field: 'startTime' | 'endTime', value: string) {
    setGrid((prev) => {
      const updated = { ...prev }
      const windows = [...updated[day].windows]
      windows[idx] = { ...windows[idx], [field]: value }
      updated[day] = { ...updated[day], windows }
      return updated
    })
  }

  function addWindow(day: number) {
    setGrid((prev) => {
      const updated = { ...prev }
      const windows = [...updated[day].windows]
      const last = windows[windows.length - 1]
      const newStart = last ? addMinutes(last.endTime, 60) : '08:00'
      const newEnd = addMinutes(newStart, 120)
      windows.push({ startTime: newStart, endTime: newEnd > '23:59' ? '23:59' : newEnd })
      updated[day] = { ...updated[day], windows }
      return updated
    })
  }

  function removeWindow(day: number, idx: number) {
    setGrid((prev) => {
      const updated = { ...prev }
      const windows = updated[day].windows.filter((_, i) => i !== idx)
      if (windows.length === 0) {
        updated[day] = { active: false, windows: [] }
      } else {
        updated[day] = { ...updated[day], windows }
      }
      return updated
    })
  }

  function copyToDay(fromDay: number, toDay: number) {
    setGrid((prev) => {
      const updated = { ...prev }
      updated[toDay] = {
        active: true,
        windows: prev[fromDay].windows.map((w) => ({ ...w })),
      }
      return updated
    })
  }

  async function handleSave() {
    setSaving(true)
    setFeedback(null)

    // Build entries array from grid
    const entries: Array<{ dayOfWeek: number; startTime: string; endTime: string }> = []
    for (let day = 0; day < 7; day++) {
      const dayData = grid[day]
      if (!dayData.active) continue
      for (const w of dayData.windows) {
        entries.push({ dayOfWeek: day, startTime: w.startTime, endTime: w.endTime })
      }
    }

    try {
      const res = await fetch('/api/admin/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, schedules: entries }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      setFeedback({ type: 'success', message: 'Horarios guardados correctamente' })
      generatePreview()
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Error inesperado' })
    } finally {
      setSaving(false)
    }
  }

  function generatePreview() {
    const slots: PreviewSlot[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dow = date.getDay()
      const dayData = grid[dow]
      if (!dayData.active || dayData.windows.length === 0) continue

      const dateStr = date.toISOString().split('T')[0]
      const dayLabel = date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })

      slots.push(...generateSlotsForDay(dateStr, dayLabel, dayData.windows, durationMinutes))
    }

    setPreview(slots)
  }

  if (loading) {
    return (
      <div className="border border-black/10 rounded-brutal bg-white p-6">
        <p className="font-mono text-xs text-mid-gray">Cargando horarios...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-black/10 rounded-brutal bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-grotesk font-bold text-sm text-asphalt">{serviceName}</h2>
          <span className="font-mono text-[10px] text-mid-gray">{durationMinutes} min / sesion</span>
        </div>
        <p className="font-mono text-[10px] text-mid-gray">
          Define las ventanas de disponibilidad para cada dia de la semana
        </p>
      </div>

      {/* Day rows */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const dayData = grid[day]
          return (
            <div
              key={day}
              className="border border-black/10 rounded-brutal bg-white p-4"
            >
              <div className="flex items-start gap-4">
                {/* Day label + toggle */}
                <div className="flex items-center gap-3 w-24 flex-shrink-0 pt-1">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`w-8 h-5 rounded-full relative transition-colors ${
                      dayData.active ? 'bg-rojo' : 'bg-black/10'
                    }`}
                    aria-label={`${dayData.active ? 'Desactivar' : 'Activar'} ${DAY_LABELS[day]}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                        dayData.active ? 'left-3.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <span className="font-mono text-xs tracking-widest text-asphalt font-bold">
                    {DAY_LABELS[day]}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {!dayData.active ? (
                    <p className="font-mono text-[10px] text-mid-gray pt-1.5">No disponible</p>
                  ) : (
                    <div className="space-y-2">
                      {dayData.windows.map((w, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-wrap">
                          <TimeInput
                            value={w.startTime}
                            onChange={(v) => updateWindow(day, idx, 'startTime', v)}
                          />
                          <span className="font-mono text-[10px] text-mid-gray">a</span>
                          <TimeInput
                            value={w.endTime}
                            onChange={(v) => updateWindow(day, idx, 'endTime', v)}
                          />
                          <button
                            onClick={() => removeWindow(day, idx)}
                            className="p-1.5 text-mid-gray hover:text-rojo transition-colors"
                            aria-label="Eliminar ventana"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Add window + copy buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => addWindow(day)}
                          className="border border-black/10 text-mid-gray hover:text-asphalt
                            px-3 py-1.5 rounded-brutal font-mono text-[10px] tracking-widest
                            hover:bg-bone transition-colors"
                        >
                          + VENTANA
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setCopyFrom(copyFrom === day ? null : day)}
                            className="border border-black/10 text-mid-gray hover:text-asphalt
                              px-3 py-1.5 rounded-brutal font-mono text-[10px] tracking-widest
                              hover:bg-bone transition-colors"
                          >
                            COPIAR A...
                          </button>

                          {copyFrom === day && (
                            <div
                              ref={popoverRef}
                              className="absolute left-0 top-full mt-1 z-10 bg-white border border-black/10
                                rounded-brutal p-3 shadow-lg min-w-[160px]"
                            >
                              <p className="font-mono text-[10px] text-mid-gray mb-2 tracking-widest">
                                COPIAR A:
                              </p>
                              <div className="space-y-1">
                                {[0, 1, 2, 3, 4, 5, 6]
                                  .filter((d) => d !== day)
                                  .map((d) => (
                                    <button
                                      key={d}
                                      onClick={() => {
                                        copyToDay(day, d)
                                        setCopyFrom(null)
                                      }}
                                      className="block w-full text-left px-2 py-1.5 rounded-brutal
                                        font-mono text-xs text-asphalt hover:bg-bone transition-colors"
                                    >
                                      {DAY_LABELS[d]}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-3 border rounded-brutal font-mono text-xs ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-rojo/20 bg-rojo/5 text-rojo'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="ml-3 opacity-60 hover:opacity-100"
              aria-label="Cerrar mensaje"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-rojo text-white px-6 py-2.5 rounded-brutal font-mono text-xs tracking-widest
            hover:bg-rojo-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'GUARDANDO...' : 'GUARDAR HORARIOS'}
        </button>
        <button
          onClick={generatePreview}
          className="border border-black/10 text-mid-gray hover:text-asphalt
            px-4 py-2.5 rounded-brutal font-mono text-xs tracking-widest
            hover:bg-bone transition-colors"
        >
          VISTA PREVIA
        </button>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="border border-black/10 rounded-brutal bg-white p-4">
          <h3 className="font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-3">
            Sesiones generadas - proximos 7 dias
          </h3>
          <div className="space-y-1">
            {preview.map((slot, i) => (
              <div
                key={`${slot.date}-${slot.time}-${i}`}
                className="flex items-center gap-3 py-1.5 border-b border-black/[0.04] last:border-0"
              >
                <span className="font-mono text-[10px] text-mid-gray w-32 flex-shrink-0">
                  {slot.dayLabel}
                </span>
                <span className="font-grotesk text-sm text-asphalt">
                  {slot.time} - {slot.endTime}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] text-mid-gray">
            {preview.length} sesion{preview.length !== 1 ? 'es' : ''} en total
          </p>
        </div>
      )}

      {preview.length === 0 && feedback?.type === 'success' && (
        <div className="border border-black/10 rounded-brutal bg-white p-4">
          <p className="font-mono text-[10px] text-mid-gray">
            No se generan sesiones para los proximos 7 dias con la configuracion actual.
          </p>
        </div>
      )}
    </div>
  )
}
