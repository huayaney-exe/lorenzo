/**
 * Supabase-backed data layer for Lorenzo two-sided platform.
 * All interfaces, CRUD functions, resource conflict checks,
 * pricing logic, and availability calculation.
 */

import { supabase } from './supabase'

// --- Types ---

export type ServiceType = 'paddle' | 'boat' | 'event' | 'alliance' | 'other'
export type PricingModel = 'per_person' | 'flat'
export type BookingStatus = 'pending' | 'approved' | 'rejected'
export type SessionStatus = 'scheduled' | 'cancelled'
export type CoachRole = 'admin' | 'operator'
export type Lang = 'es' | 'en'

export interface ServiceSchedule {
  id: string
  serviceId: string
  dayOfWeek: number   // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string   // "HH:MM" format
  endTime: string     // "HH:MM" format
  active: boolean
}

// --- Interfaces ---

export interface Resource {
  id: string
  name: string
  capacity: number
  active: boolean
}

export interface Service {
  id: string
  slug: string
  name: Record<Lang, string>
  description: Record<Lang, string>
  type: ServiceType
  resourceId: string | null
  pricingModel: PricingModel
  pricePen: number
  maxSpots: number
  durationMinutes: number
  isAddon: boolean
  active: boolean
  createdAt: string
}

export interface Session {
  id: string
  serviceId: string
  date: string
  time: string
  durationMinutes: number
  maxSpots: number
  pricePen: number
  coachId: string | null
  status: SessionStatus
}

export interface Booking {
  id: string
  sessionId: string
  name: string
  phone: string
  seats: number
  totalPen: number
  addons: string[]
  status: BookingStatus
  lang: Lang
  createdAt: string
}

export interface Coach {
  id: string
  name: string
  phone: string
  role: CoachRole
  active: boolean
}

export interface SessionWithAvailability extends Session {
  bookedSpots: number
  availableSpots: number
  occupationPct: number
  service?: Service
  coach?: Coach
  resource?: Resource
}

// --- Row Mappers (snake_case DB → camelCase TS) ---

function trimTime(t: string): string {
  // "09:00:00" → "09:00"
  return t.length > 5 ? t.substring(0, 5) : t
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapResource(row: any): Resource {
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    active: row.active,
  }
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function mapService(row: any): Service {
  return {
    id: row.id,
    slug: row.slug || toSlug(row.name_en),
    name: { es: row.name_es, en: row.name_en },
    description: { es: row.description_es, en: row.description_en },
    type: row.type,
    resourceId: row.resource_id,
    pricingModel: row.pricing_model,
    pricePen: Number(row.price_pen),
    maxSpots: row.max_spots,
    durationMinutes: row.duration_minutes,
    isAddon: row.is_addon,
    active: row.active,
    createdAt: row.created_at,
  }
}

function mapSession(row: any): Session {
  return {
    id: row.id,
    serviceId: row.service_id,
    date: row.date,
    time: trimTime(row.time),
    durationMinutes: row.duration_minutes,
    maxSpots: row.max_spots,
    pricePen: Number(row.price_pen),
    coachId: row.coach_id,
    status: row.status,
  }
}

function mapSessionWithAvailability(row: any): SessionWithAvailability {
  return {
    id: row.id,
    serviceId: row.service_id,
    date: row.date,
    time: trimTime(row.time),
    durationMinutes: row.duration_minutes,
    maxSpots: row.max_spots,
    pricePen: Number(row.price_pen),
    coachId: row.coach_id,
    status: row.status,
    bookedSpots: Number(row.booked_spots ?? 0),
    availableSpots: Number(row.available_spots ?? row.max_spots),
    occupationPct: Number(row.occupation_pct ?? 0),
    service: row.service_name_es ? {
      id: row.service_id ?? row.id,
      slug: row.slug || toSlug(row.service_name_en || ''),
      name: { es: row.service_name_es, en: row.service_name_en },
      description: { es: '', en: '' },
      type: row.service_type,
      resourceId: row.resource_id,
      pricingModel: row.pricing_model,
      pricePen: Number(row.price_pen),
      maxSpots: row.max_spots,
      durationMinutes: row.duration_minutes,
      isAddon: row.is_addon,
      active: true,
      createdAt: '',
    } : undefined,
    coach: row.coach_name ? { id: row.coach_id, name: row.coach_name, phone: '', role: 'operator' as CoachRole, active: true } : undefined,
    resource: row.resource_name ? { id: row.resource_id, name: row.resource_name, capacity: row.resource_capacity, active: true } : undefined,
  }
}

function mapBooking(row: any): Booking {
  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    phone: row.phone,
    seats: row.seats,
    totalPen: Number(row.total_pen),
    addons: row.addons ?? [],
    status: row.status,
    lang: row.lang,
    createdAt: row.created_at,
  }
}

function mapCoach(row: any): Coach {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    active: row.active,
  }
}

function mapSchedule(row: any): ServiceSchedule {
  return {
    id: row.id,
    serviceId: row.service_id,
    dayOfWeek: row.day_of_week,
    startTime: trimTime(row.start_time),
    endTime: trimTime(row.end_time),
    active: row.active,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// --- Pure Helpers (sync) ---

export function computeTotal(pricingModel: PricingModel, pricePen: number, seats: number): number {
  return pricingModel === 'per_person' ? pricePen * seats : pricePen
}

export function formatPrice(amount: number): string {
  return amount >= 1000 ? `S/${amount.toLocaleString('es-PE')}` : `S/${amount}`
}

export function formatOccupation(pct: number): string {
  return pct >= 100 ? 'LLENO' : `${pct}%`
}

export function formatDate(dateStr: string, lang: Lang): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateFull(dateStr: string, lang: Lang): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMin = h * 60 + m + minutes
  const newH = Math.floor(totalMin / 60) % 24
  const newM = totalMin % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

export function getEndTime(time: string, durationMinutes: number): string {
  return addMinutesToTime(time, durationMinutes)
}

function timeRangesOverlap(
  startA: string, endA: string,
  startB: string, endB: string
): boolean {
  return startA < endB && startB < endA
}

export function buildWhatsAppUrl(
  booking: Booking,
  session: Session,
  service: Service,
  addons: Service[] = [],
  resource?: Resource | null,
): string {
  const endTime = getEndTime(session.time, session.durationMinutes)
  const isEs = booking.lang === 'es'

  // Human-readable date
  const dateObj = new Date(session.date + 'T12:00:00')
  const dateFmt = dateObj.toLocaleDateString(isEs ? 'es-PE' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // Header
  const seatLabel = isEs
    ? (booking.seats === 1 ? 'persona' : 'personas')
    : (booking.seats === 1 ? 'person' : 'people')
  const greeting = isEs
    ? `Hola! Soy ${booking.name}.`
    : `Hi! I'm ${booking.name}.`
  const bookingRef = isEs
    ? `Reserva #${booking.id.slice(0, 8)}`
    : `Booking #${booking.id.slice(0, 8)}`

  // Service line
  const svcName = isEs ? service.name.es : service.name.en
  const resourceNote = resource ? ` (${resource.name})` : ''

  // Price breakdown
  const baseTotal = computeTotal(service.pricingModel, session.pricePen, booking.seats)
  const basePrice = service.pricingModel === 'per_person'
    ? `S/${session.pricePen} x ${booking.seats} = S/${baseTotal}`
    : `S/${session.pricePen}`

  // Add-on lines
  const addonLines = addons.map((a) => {
    const aName = isEs ? a.name.es : a.name.en
    const aTotal = computeTotal(a.pricingModel, a.pricePen, booking.seats)
    const aPrice = a.pricingModel === 'per_person'
      ? `S/${a.pricePen} x ${booking.seats} = S/${aTotal}`
      : `S/${a.pricePen}`
    return `  + ${aName}: ${aPrice}`
  })

  // Build message
  const lines = [
    greeting,
    '',
    `${bookingRef}`,
    `${svcName}${resourceNote}`,
    `${dateFmt} · ${session.time} - ${endTime}`,
    `${booking.seats} ${seatLabel}`,
    '',
    `${svcName}: ${basePrice}`,
    ...addonLines,
    `*Total: S/${booking.totalPen}*`,
    '',
    isEs ? `Tel: ${booking.phone}` : `Phone: ${booking.phone}`,
  ]

  const msg = lines.join('\n')
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '51944629513'
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

export function computeOccupation(
  session: Session,
  sessionBookings: Booking[]
): { bookedSpots: number; availableSpots: number; occupationPct: number } {
  const bookedSpots = sessionBookings
    .filter((b) => b.status !== 'rejected')
    .reduce((sum, b) => sum + b.seats, 0)
  const availableSpots = Math.max(0, session.maxSpots - bookedSpots)
  const occupationPct = session.maxSpots > 0 ? Math.round((bookedSpots / session.maxSpots) * 100) : 0
  return { bookedSpots, availableSpots, occupationPct }
}

// --- Resource CRUD ---

export async function getResources(): Promise<Resource[]> {
  const { data, error } = await supabase.from('resources').select('*').order('name')
  if (error) throw error
  return (data ?? []).map(mapResource)
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const { data, error } = await supabase.from('resources').select('*').eq('id', id).single()
  if (error) return null
  return mapResource(data)
}

export async function createResource(data: { name: string; capacity: number }): Promise<Resource> {
  const { data: row, error } = await supabase
    .from('resources')
    .insert({ name: data.name, capacity: data.capacity })
    .select()
    .single()
  if (error) throw error
  return mapResource(row)
}

export async function updateResource(id: string, data: Partial<Resource>): Promise<Resource | null> {
  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.capacity !== undefined) updates.capacity = data.capacity
  if (data.active !== undefined) updates.active = data.active

  const { data: row, error } = await supabase
    .from('resources')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return null
  return mapResource(row)
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function checkResourceAvailability(
  resourceId: string,
  date: string,
  time: string,
  durationMinutes: number,
  excludeSessionId?: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_resource_overlap', {
    p_resource_id: resourceId,
    p_date: date,
    p_start_time: time,
    p_duration_minutes: durationMinutes,
    p_exclude_session_id: excludeSessionId ?? null,
  })
  if (error) throw error
  return !data // RPC returns true if overlap exists; we return true if available
}

// --- Service CRUD ---

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase.from('services').select('*').order('name_es')
  if (error) throw error
  return (data ?? []).map(mapService)
}

export async function getActiveServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .eq('is_addon', false)
    .order('name_es')
  if (error) throw error
  return (data ?? []).map(mapService)
}

export async function getServiceById(id: string): Promise<Service | null> {
  const { data, error } = await supabase.from('services').select('*').eq('id', id).single()
  if (error) return null
  return mapService(data)
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const { data, error } = await supabase.from('services').select('*').eq('slug', slug).single()
  if (error) return null
  return mapService(data)
}

export async function getServicesByIds(ids: string[]): Promise<Service[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('services').select('*').in('id', ids)
  if (error) throw error
  return (data ?? []).map(mapService)
}

export async function getAddonsByResource(resourceId: string | null): Promise<Service[]> {
  if (!resourceId) return []
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_addon', true)
    .eq('active', true)
    .eq('resource_id', resourceId)
  if (error) throw error
  return (data ?? []).map(mapService)
}

export async function createService(data: Omit<Service, 'id' | 'createdAt'>): Promise<Service> {
  const slug = data.slug || toSlug(data.name.en)
  const { data: row, error } = await supabase
    .from('services')
    .insert({
      slug,
      name_es: data.name.es,
      name_en: data.name.en,
      description_es: data.description.es,
      description_en: data.description.en,
      type: data.type,
      resource_id: data.resourceId,
      pricing_model: data.pricingModel,
      price_pen: data.pricePen,
      max_spots: data.maxSpots,
      duration_minutes: data.durationMinutes,
      is_addon: data.isAddon,
      active: data.active,
    })
    .select()
    .single()
  if (error) throw error
  return mapService(row)
}

export async function updateService(id: string, data: Partial<Service>): Promise<Service | null> {
  const updates: Record<string, unknown> = {}
  if (data.name) {
    updates.name_es = data.name.es
    updates.name_en = data.name.en
    updates.slug = toSlug(data.name.en)
  }
  if (data.description) { updates.description_es = data.description.es; updates.description_en = data.description.en }
  if (data.type !== undefined) updates.type = data.type
  if (data.resourceId !== undefined) updates.resource_id = data.resourceId
  if (data.pricingModel !== undefined) updates.pricing_model = data.pricingModel
  if (data.pricePen !== undefined) updates.price_pen = data.pricePen
  if (data.maxSpots !== undefined) updates.max_spots = data.maxSpots
  if (data.durationMinutes !== undefined) updates.duration_minutes = data.durationMinutes
  if (data.isAddon !== undefined) updates.is_addon = data.isAddon
  if (data.active !== undefined) updates.active = data.active

  const { data: row, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return null
  return mapService(row)
}

export async function deleteService(id: string): Promise<void> {
  // Schedules cascade-delete via FK. Sessions restrict.
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// --- Session CRUD ---

export async function getSessionById(id: string): Promise<SessionWithAvailability | null> {
  const { data, error } = await supabase
    .from('sessions_with_availability')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return mapSessionWithAvailability(data)
}

export async function getSessionsByService(serviceId: string): Promise<SessionWithAvailability[]> {
  const { data, error } = await supabase
    .from('sessions_with_availability')
    .select('*')
    .eq('service_id', serviceId)
    .order('date')
    .order('time')
  if (error) throw error
  return (data ?? []).map(mapSessionWithAvailability)
}

export async function getAllSessions(filters?: {
  serviceId?: string
  from?: string
  to?: string
}): Promise<SessionWithAvailability[]> {
  let query = supabase.from('sessions_with_availability').select('*')
  if (filters?.serviceId) query = query.eq('service_id', filters.serviceId)
  if (filters?.from) query = query.gte('date', filters.from)
  if (filters?.to) query = query.lte('date', filters.to)
  query = query.order('date').order('time')

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapSessionWithAvailability)
}

export async function getUpcomingSessions(filters?: {
  serviceId?: string
  from?: string
  to?: string
}): Promise<SessionWithAvailability[]> {
  const today = new Date().toISOString().split('T')[0]
  let query = supabase
    .from('sessions_with_availability')
    .select('*')
    .eq('status', 'scheduled')
    .gte('date', today)
  if (filters?.serviceId) query = query.eq('service_id', filters.serviceId)
  if (filters?.from) query = query.gte('date', filters.from)
  if (filters?.to) query = query.lte('date', filters.to)
  query = query.order('date').order('time')

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapSessionWithAvailability)
}

export async function createSession(data: {
  serviceId: string
  date: string
  time: string
  coachId?: string | null
  maxSpots?: number
  pricePen?: number
  durationMinutes?: number
}): Promise<Session> {
  const service = await getServiceById(data.serviceId)
  if (!service) throw new Error('Service not found')

  const duration = data.durationMinutes ?? service.durationMinutes
  const maxSpots = data.maxSpots ?? service.maxSpots
  const price = data.pricePen ?? service.pricePen

  if (service.resourceId) {
    const available = await checkResourceAvailability(service.resourceId, data.date, data.time, duration)
    if (!available) throw new Error('Resource conflict: overlapping session')
  }

  const { data: row, error } = await supabase
    .from('sessions')
    .insert({
      service_id: data.serviceId,
      date: data.date,
      time: data.time,
      duration_minutes: duration,
      max_spots: maxSpots,
      price_pen: price,
      coach_id: data.coachId ?? null,
      status: 'scheduled',
    })
    .select()
    .single()
  if (error) throw error
  return mapSession(row)
}

export async function updateSession(id: string, data: Partial<Session>): Promise<Session | null> {
  const updates: Record<string, unknown> = {}
  if (data.date !== undefined) updates.date = data.date
  if (data.time !== undefined) updates.time = data.time
  if (data.durationMinutes !== undefined) updates.duration_minutes = data.durationMinutes
  if (data.maxSpots !== undefined) updates.max_spots = data.maxSpots
  if (data.pricePen !== undefined) updates.price_pen = data.pricePen
  if (data.coachId !== undefined) updates.coach_id = data.coachId
  if (data.status !== undefined) updates.status = data.status

  const { data: row, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return null
  return mapSession(row)
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// --- Booking CRUD ---

export async function createBooking(data: {
  sessionId: string
  name: string
  phone: string
  seats: number
  addons?: string[]
  lang: Lang
}): Promise<Booking> {
  const session = await getSessionById(data.sessionId)
  if (!session) throw new Error('Session not found')

  const service = await getServiceById(session.serviceId)
  if (!service) throw new Error('Service not found')

  let total = computeTotal(service.pricingModel, session.pricePen, data.seats)
  const addonIds = data.addons ?? []
  for (const addonId of addonIds) {
    const addon = await getServiceById(addonId)
    if (addon) {
      total += computeTotal(addon.pricingModel, addon.pricePen, data.seats)
    }
  }

  // Atomic booking: check availability + insert in a single transaction (row-level lock)
  const { data: bookingId, error: rpcError } = await supabase.rpc('create_booking_atomic', {
    p_session_id: data.sessionId,
    p_name: data.name,
    p_phone: data.phone,
    p_seats: data.seats,
    p_total_pen: total,
    p_addons: addonIds,
    p_lang: data.lang,
  })

  if (rpcError) {
    // Translate RPC exceptions to user-friendly errors
    const msg = rpcError.message || ''
    if (msg.includes('Not enough spots')) throw new Error('Not enough spots')
    if (msg.includes('Session not found')) throw new Error('Session not found')
    throw rpcError
  }

  // Fetch the created booking
  const booking = await getBookingById(bookingId)
  if (!booking) throw new Error('Booking creation failed')
  return booking
}

export async function approveBooking(id: string): Promise<Booking | null> {
  const { data: row, error } = await supabase
    .from('bookings')
    .update({ status: 'approved' })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single()
  if (error) return null
  return mapBooking(row)
}

export async function rejectBooking(id: string): Promise<Booking | null> {
  const { data: row, error } = await supabase
    .from('bookings')
    .update({ status: 'rejected' })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single()
  if (error) return null
  return mapBooking(row)
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single()
  if (error) return null
  return mapBooking(data)
}

export async function getAllBookings(filters?: {
  serviceId?: string
  status?: BookingStatus
  from?: string
  to?: string
}): Promise<(Booking & { session?: SessionWithAvailability; service?: Service })[]> {
  let query = supabase.from('bookings').select('*').order('created_at', { ascending: false })
  if (filters?.status) query = query.eq('status', filters.status)

  const { data: bookingRows, error } = await query
  if (error) throw error
  const allBookings = (bookingRows ?? []).map(mapBooking)

  // Batch-fetch all sessions at once (1 query instead of N)
  const sessionIds = [...new Set(allBookings.map((b) => b.sessionId))]
  let sessionsQuery = supabase.from('sessions_with_availability').select('*').in('id', sessionIds)
  if (filters?.serviceId) sessionsQuery = sessionsQuery.eq('service_id', filters.serviceId)
  if (filters?.from) sessionsQuery = sessionsQuery.gte('date', filters.from)
  if (filters?.to) sessionsQuery = sessionsQuery.lte('date', filters.to)

  const { data: sessionRows } = sessionIds.length > 0 ? await sessionsQuery : { data: [] }
  const sessionMap = new Map<string, SessionWithAvailability>()
  for (const row of (sessionRows ?? []).map(mapSessionWithAvailability)) {
    sessionMap.set(row.id, row)
  }

  // Batch-fetch all services at once (1 query instead of N)
  const serviceIds = [...new Set([...sessionMap.values()].map((s) => s.serviceId))]
  const services = serviceIds.length > 0 ? await getServicesByIds(serviceIds) : []
  const serviceMap = new Map<string, Service>()
  for (const svc of services) {
    serviceMap.set(svc.id, svc)
  }

  // Assemble results
  const results: (Booking & { session?: SessionWithAvailability; service?: Service })[] = []
  for (const b of allBookings) {
    const session = sessionMap.get(b.sessionId)
    // If session filters were applied, skip bookings whose sessions didn't match
    if ((filters?.serviceId || filters?.from || filters?.to) && !session) continue
    const service = session ? serviceMap.get(session.serviceId) : undefined
    results.push({ ...b, session, service })
  }

  return results.sort((a, b) => {
    const dateA = a.session ? `${a.session.date}T${a.session.time}` : ''
    const dateB = b.session ? `${b.session.date}T${b.session.time}` : ''
    return dateA.localeCompare(dateB)
  })
}

export async function getBookingsBySession(sessionId: string): Promise<Booking[]> {
  const { data, error } = await supabase.from('bookings').select('*').eq('session_id', sessionId)
  if (error) throw error
  return (data ?? []).map(mapBooking)
}

// --- Coach CRUD ---

export async function getCoaches(): Promise<Coach[]> {
  const { data, error } = await supabase.from('coaches').select('*').order('name')
  if (error) throw error
  return (data ?? []).map(mapCoach)
}

export async function getCoachById(id: string): Promise<Coach | null> {
  const { data, error } = await supabase.from('coaches').select('*').eq('id', id).single()
  if (error) return null
  return mapCoach(data)
}

export async function createCoach(data: { name: string; phone: string; role: CoachRole }): Promise<Coach> {
  const { data: row, error } = await supabase
    .from('coaches')
    .insert({ name: data.name, phone: data.phone, role: data.role })
    .select()
    .single()
  if (error) throw error
  return mapCoach(row)
}

export async function updateCoach(id: string, data: Partial<Coach>): Promise<Coach | null> {
  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.phone !== undefined) updates.phone = data.phone
  if (data.role !== undefined) updates.role = data.role
  if (data.active !== undefined) updates.active = data.active

  const { data: row, error } = await supabase
    .from('coaches')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return null
  return mapCoach(row)
}

export async function deleteCoach(id: string): Promise<void> {
  await supabase.from('coaches').update({ active: false }).eq('id', id)
}

// --- Schedule CRUD ---

export async function getSchedulesByService(serviceId: string): Promise<ServiceSchedule[]> {
  const { data, error } = await supabase
    .from('service_schedules')
    .select('*')
    .eq('service_id', serviceId)
    .eq('active', true)
    .order('day_of_week')
    .order('start_time')
  if (error) throw error
  return (data ?? []).map(mapSchedule)
}

export async function getAllSchedules(): Promise<ServiceSchedule[]> {
  const { data, error } = await supabase.from('service_schedules').select('*').order('service_id').order('day_of_week')
  if (error) throw error
  return (data ?? []).map(mapSchedule)
}

export async function createSchedule(data: { serviceId: string; dayOfWeek: number; startTime: string; endTime: string }): Promise<ServiceSchedule> {
  const { data: row, error } = await supabase
    .from('service_schedules')
    .insert({
      service_id: data.serviceId,
      day_of_week: data.dayOfWeek,
      start_time: data.startTime,
      end_time: data.endTime,
    })
    .select()
    .single()
  if (error) throw error
  return mapSchedule(row)
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from('service_schedules').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function bulkSetSchedules(
  serviceId: string,
  entries: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
): Promise<ServiceSchedule[]> {
  // Delete all existing schedules for this service
  await supabase.from('service_schedules').delete().eq('service_id', serviceId)

  if (entries.length === 0) return []

  const rows = entries.map((e) => ({
    service_id: serviceId,
    day_of_week: e.dayOfWeek,
    start_time: e.startTime,
    end_time: e.endTime,
  }))

  const { data, error } = await supabase
    .from('service_schedules')
    .insert(rows)
    .select()
  if (error) throw error
  return (data ?? []).map(mapSchedule)
}

// --- Slot Generation ---

export async function generateAvailableSlots(
  serviceId: string,
  horizonDays: number = 14
): Promise<SessionWithAvailability[]> {
  const service = await getServiceById(serviceId)
  if (!service) return []

  const serviceSchedules = await getSchedulesByService(serviceId)
  if (serviceSchedules.length === 0) return []

  const resource = service.resourceId ? await getResourceById(service.resourceId) : null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const now = new Date()

  const endDate = new Date(today)
  endDate.setDate(today.getDate() + horizonDays)
  const todayStr = today.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  // Fetch existing materialized sessions for this service in the date range
  const { data: existingRows } = await supabase
    .from('sessions_with_availability')
    .select('*')
    .eq('service_id', serviceId)
    .gte('date', todayStr)
    .lte('date', endDateStr)
    .neq('status', 'cancelled')

  const existingSessions = (existingRows ?? []).map(mapSessionWithAvailability)
  const existingMap = new Map<string, SessionWithAvailability>()
  for (const s of existingSessions) {
    existingMap.set(`${s.date}:${s.time}`, s)
  }

  // Fetch conflict sessions (other services using same resource)
  let conflictSessions: SessionWithAvailability[] = []
  if (service.resourceId) {
    const { data: conflictRows } = await supabase
      .from('sessions_with_availability')
      .select('*')
      .eq('resource_id', service.resourceId)
      .neq('service_id', serviceId)
      .gte('date', todayStr)
      .lte('date', endDateStr)
      .neq('status', 'cancelled')

    conflictSessions = (conflictRows ?? []).map(mapSessionWithAvailability)
  }

  const slots: SessionWithAvailability[] = []

  for (let i = 0; i < horizonDays; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dow = date.getDay()
    const dateStr = date.toISOString().split('T')[0]

    const daySchedules = serviceSchedules.filter((s) => s.dayOfWeek === dow)
    const dayConflicts = conflictSessions.filter((s) => s.date === dateStr)

    for (const schedule of daySchedules) {
      let slotTime = schedule.startTime
      while (true) {
        const slotEnd = addMinutesToTime(slotTime, service.durationMinutes)
        if (slotEnd > schedule.endTime) break

        // Check slot is in the future
        const slotDate = new Date(`${dateStr}T${slotTime}:00`)
        if (slotDate <= now) {
          slotTime = slotEnd
          continue
        }

        // Check resource conflict with other services' sessions
        let resourceConflict = false
        if (service.resourceId) {
          for (const cs of dayConflicts) {
            const csEnd = addMinutesToTime(cs.time, cs.durationMinutes)
            if (timeRangesOverlap(slotTime, slotEnd, cs.time, csEnd)) {
              resourceConflict = true
              break
            }
          }
        }

        if (!resourceConflict) {
          const existing = existingMap.get(`${dateStr}:${slotTime}`)
          if (existing) {
            slots.push(existing)
          } else {
            // Virtual slot
            const slotId = `slot:${serviceId}:${dateStr}:${slotTime.replace(':', '')}`
            slots.push({
              id: slotId,
              serviceId,
              date: dateStr,
              time: slotTime,
              durationMinutes: service.durationMinutes,
              maxSpots: service.maxSpots,
              pricePen: service.pricePen,
              coachId: null,
              status: 'scheduled',
              bookedSpots: 0,
              availableSpots: service.maxSpots,
              occupationPct: 0,
              service,
              coach: undefined,
              resource: resource ?? undefined,
            })
          }
        }

        slotTime = slotEnd
      }
    }
  }

  return slots.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
}

// Materialize a virtual slot into a real session (called when booking a generated slot)
export async function materializeSlot(slotId: string): Promise<Session | null> {
  // Parse the deterministic slot ID: slot:{serviceId}:{date}:{HHMM}
  const parts = slotId.split(':')
  if (parts.length !== 4 || parts[0] !== 'slot') return null

  const [, serviceId, date, timePart] = parts
  const time = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}`

  // Check if already materialized
  const { data: existing } = await supabase
    .from('sessions')
    .select('*')
    .eq('service_id', serviceId)
    .eq('date', date)
    .eq('time', time)
    .neq('status', 'cancelled')
    .limit(1)

  if (existing && existing.length > 0) {
    return mapSession(existing[0])
  }

  const service = await getServiceById(serviceId)
  if (!service) return null

  const { data: row, error } = await supabase
    .from('sessions')
    .insert({
      service_id: serviceId,
      date,
      time,
      duration_minutes: service.durationMinutes,
      max_spots: service.maxSpots,
      price_pen: service.pricePen,
      coach_id: null,
      status: 'scheduled',
    })
    .select()
    .single()
  if (error) throw error
  return mapSession(row)
}
