# Lorenzo Two-Sided Platform — Implementation Plan
**Date:** Mar 4, 2026
**Source:** Feedback call with Franco & Claudio Marsano
**Revision:** v5 — subdomain split, duration-based resource blocking, pending locks resource

---

## Context

Two-sided platform, split by subdomain:
1. **`admin.lorenzo.club`** — Franco creates resources, services, sessions, coaches. Manages bookings.
2. **`lorenzo.club`** (or `www.`) — Customer browses services, picks date/time, books, WhatsApp confirms.

Same Next.js app, routed by hostname via middleware.

**Core principle:** Admin creates everything. Customer sees exactly what admin published.
- Admin creates a Resource (any name, any capacity) -> creates a Service linked to it (any duration: 30 min, 2 hours, whatever) -> creates Sessions -> Customer sees and books them.
- Everything is admin-defined: resource names, seat counts, prices, durations, pricing models. No hardcoded types or categories.

**Constraints:**
- No payment gateway — WhatsApp is the conversion point
- Pending bookings block BOTH seats and the resource's time slot (not just approval)
- Resources are blocked for the full duration of a session (a 2h boat trip at 9:00 blocks that boat until 11:00)
- Different services can have different durations — admin decides (30 min kayak vs 2h boat trip vs 4h island excursion)
- Alliances (Mar Adentro, Michele) listed as Lorenzo services; Lorenzo charges, reconciles internally
- Occupation % (`bookedSeats / maxSeats`) is the universal availability metric, visible on both sides
- In-memory mock data now, Supabase later
- No auth for admin (just subdomain access for now)

---

## 0. Subdomain Architecture

### Routing

Same Next.js app, single deployment. Middleware reads `request.headers.get('host')` and routes:

```
admin.lorenzo.club/*     → /admin/*     (admin pages)
lorenzo.club/*           → /[lang]/*    (customer pages)
www.lorenzo.club/*       → redirect to lorenzo.club
```

### Implementation

**`middleware.ts`** — extend existing i18n middleware:
```typescript
// 1. Read hostname
const host = request.headers.get('host') || ''
const isAdmin = host.startsWith('admin.')

// 2. Admin subdomain: rewrite to /admin/* routes
if (isAdmin) {
  const url = request.nextUrl.clone()
  url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`
  return NextResponse.rewrite(url)
}

// 3. Customer subdomain: existing i18n redirect logic
// /es/book, /en/book, etc.
```

**Local dev:** Use `localhost:3000` for customer, `admin.localhost:3000` for admin (browsers resolve `*.localhost` natively).

### Route mapping

| URL user sees | Internal Next.js route | Side |
|---------------|----------------------|------|
| `lorenzo.club/` | `/es` (redirect) | customer |
| `lorenzo.club/es` | `/es/page.tsx` | customer |
| `lorenzo.club/es/book` | `/es/book/page.tsx` | customer |
| `lorenzo.club/es/book/[serviceId]` | `/es/book/[serviceId]/page.tsx` | customer |
| `admin.lorenzo.club/` | `/admin/page.tsx` | admin |
| `admin.lorenzo.club/services` | `/admin/services/page.tsx` | admin |
| `admin.lorenzo.club/sessions/new` | `/admin/sessions/new/page.tsx` | admin |

### API routes

All API routes live in the same app. No subdomain restriction on API calls — both sides call the same `/api/*` endpoints. Admin endpoints are under `/api/admin/*` by convention (auth later).

---

## 1. Data Model

### Admin Creates, Customer Sees

```
ADMIN SIDE                              CUSTOMER SIDE (lorenzo.club)
──────────                              ────────────────────────────
1. Create Resource
   "Kayak Solo", 1 seat
   "Lancha 1", 7 seats

2. Create Service                       → Service appears in /book grid
   "Kayak Atardecer", S/80 pp, 30 min   → Card: "Kayak Atardecer, S/80 pp, 30 min"
   "Bahia Anchor", S/1200 flat, 2h      → Card: "Bahia Anchor, S/1,200, 2 horas"
   linked to resource                    → Shows "Kayak Solo · 1 persona"

3. Create Session                       → Date appears in calendar
   Mar 7, 09:00, Kayak Atardecer        → Time slot: "09:00-09:30 · 0/1 · 0%"
   Mar 7, 09:00, Bahia Anchor           → Time slot: "09:00-11:00 · 0/7 · 0%"

4. Customer books Bahia Anchor          → Occupation: "2/7 · 29%"
   (pending)                            → Lancha 1 BLOCKED 09:00-11:00
                                        → No new Lancha 1 sessions can overlap

5. Admin approves/rejects               → Rejection frees spot AND unblocks resource
                                           (if no other bookings remain)
```

### Entity Relationship

```
Resource 1──* Service 1──* Session 1──* Booking
                                 *──1 Coach
```

- Resource is a physical asset with a name and seat count. Admin creates whatever they need.
- Resource constrains scheduling: two Sessions using the same Resource cannot overlap in **time range** on the same date.
- A session occupies a time RANGE: `start` to `start + durationMinutes`. A 2h boat trip at 09:00 blocks the resource until 11:00.
- Service links to Resource (optional — events have no physical asset).
- Service defines the default duration. Admin can set 30 min, 90 min, 2h, 4h — whatever they want. Session can override.
- Session inherits maxSpots, price, duration from Service but can override each.
- Booking computes total from Service.pricingModel.
- **Pending bookings lock the resource.** As soon as a session has any non-rejected booking, that resource's time range is blocked. Admin cannot create overlapping sessions.
- Occupation % = `bookedSeats / maxSeats` — the universal metric, visible everywhere.

### Interfaces

```typescript
type ServiceType = 'paddle' | 'boat' | 'event' | 'alliance' | 'other'
type PricingModel = 'per_person' | 'flat'
type BookingStatus = 'pending' | 'approved' | 'rejected'
type SessionStatus = 'scheduled' | 'cancelled'
type CoachRole = 'admin' | 'operator'
type Lang = 'es' | 'en'

// Physical asset — admin names it freely, sets seat count.
// "Kayak Solo" (1 seat), "Lancha Grande" (12 seats), "SUP Boards" (6 seats)
interface Resource {
  id: string
  name: string                        // freeform — admin decides the name
  capacity: number                    // total seats this asset has
  active: boolean
}

interface Service {
  id: string
  name: Record<Lang, string>          // { es: 'Paddle Bahia', en: 'Bay Paddle' }
  description: Record<Lang, string>
  type: ServiceType
  resourceId: string | null           // FK -> Resource. null = no physical constraint
  pricingModel: PricingModel          // per_person: price * seats. flat: fixed total.
  pricePen: number                    // default price in soles (S/130 = 130)
  maxSpots: number                    // capped by resource.capacity when resource linked
  durationMinutes: number
  isAddon: boolean                    // true = can only be added to another session
  active: boolean
  createdAt: string
}

interface Session {
  id: string
  serviceId: string
  date: string                        // "2026-03-07"
  time: string                        // "09:00"
  durationMinutes: number             // override or inherit from service
  maxSpots: number                    // override or inherit from service
  pricePen: number                    // override or inherit from service
  coachId: string | null
  status: SessionStatus
}

interface Booking {
  id: string
  sessionId: string
  name: string
  phone: string                       // with country code: "+51999888777"
  seats: number
  totalPen: number                    // computed
  addons: string[]                    // addon service IDs
  status: BookingStatus
  lang: Lang
  createdAt: string
}

interface Coach {
  id: string
  name: string
  phone: string
  role: CoachRole                     // admin = full access, operator = own sessions only
  active: boolean
}

interface SessionWithAvailability extends Session {
  bookedSpots: number                 // seats taken (pending + approved)
  availableSpots: number              // maxSpots - bookedSpots
  occupationPct: number               // bookedSpots / maxSpots * 100 (0-100)
  service?: Service
  coach?: Coach
  resource?: Resource
}
```

### Business Rules

**Availability & Occupation:**
```
bookedSpots    = bookings.filter(b => b.status !== 'rejected').reduce((sum, b) => sum + b.seats, 0)
availableSpots = session.maxSpots - bookedSpots
occupationPct  = Math.round((bookedSpots / session.maxSpots) * 100)  // 0-100
```
Occupation % is the universal metric: `3/6 = 50%`, `7/7 = 100%` (full), `0/1 = 0%` (empty).
Shown on both admin (sessions list, dashboard) and customer (time slots, service cards).

**Pricing:**
```
per_person: totalPen = session.pricePen * seats
flat:       totalPen = session.pricePen (regardless of seats)
addons:     each addon adds its own price (per_person or flat, same logic)
```

**Resource blocking (time-range based):**
```
// Each session occupies a TIME RANGE:
//   startTime = session.time (e.g. "09:00")
//   endTime   = session.time + session.durationMinutes (e.g. "09:00" + 120min = "11:00")
//
// Two sessions CONFLICT if:
//   1. Same date
//   2. Same resourceId (via their service)
//   3. Time ranges overlap: startA < endB && startB < endA
//
// Example: Bahia Anchor (Lancha 1, 09:00-11:00) conflicts with
//          San Lorenzo Island (Lancha 1, 10:00-14:00) but NOT with
//          Paddle Bahia (SUP Boards, 09:00-10:30) — different resource.
//
// WHEN TO CHECK:
//   - Creating a new session: reject if resource has overlapping session
//   - Creating a new session: reject if resource has ANY session with non-rejected
//     bookings in an overlapping time range (pending bookings lock the resource)
//
// Sessions with resourceId = null (events) have no resource constraint.
```

**Resource lock on booking:**
```
// As soon as a session has >= 1 non-rejected booking:
//   The resource is LOCKED for that session's time range.
//   Admin CANNOT create another session on the same resource that overlaps.
//   Admin CAN still create sessions on DIFFERENT resources at the same time.
//
// When all bookings are rejected (or session has 0 bookings):
//   Resource time range is freed — admin can create overlapping sessions again.
```

**Capacity cap:** service.maxSpots <= resource.capacity (enforced on service create/update)

### Seed Data

**Resources** (admin-created, freeform names):

| id | name | capacity (seats) |
|----|------|-----------------|
| res-1 | Lancha 1 | 7 |
| res-2 | SUP Boards | 6 |
| res-3 | SUP Grupal | 5 |
| res-4 | Velero Michele | 8 |

**Services:**

| id | name (es) | type | resourceId | pricing | price | spots | duration | addon |
|----|-----------|------|------------|---------|-------|-------|----------|-------|
| svc-1 | Paddle Bahia | paddle | res-2 | per_person | 130 | 6 | 90 min | no |
| svc-2 | Paddle Camotal | paddle | res-2 | per_person | 150 | 6 | 120 min | no |
| svc-3 | Paddle Grupal | paddle | res-3 | flat | 500 | 5 | 90 min | no |
| svc-4 | Bahia — Anchor & Chill | boat | res-1 | flat | 1200 | 7 | 180 min | no |
| svc-5 | El Camotal — Anchor | boat | res-1 | flat | 1500 | 7 | 240 min | no |
| svc-6 | San Lorenzo Island | boat | res-1 | flat | 2000 | 7 | 300 min | no |
| svc-7 | Wakeboard / Toys | boat | res-1 | per_person | 80 | 7 | 30 min | **yes** |
| svc-8 | Palomino Island | alliance | null | per_person | 120 | 30 | 180 min | no |
| svc-9 | Velero Experience | alliance | res-4 | flat | 3000 | 8 | 240 min | no |

**Coaches:** Franco Marsano (admin)
**Sessions:** auto-generated for next 7 days from templates
**Bookings:** 2 demo (1 pending, 1 approved)

### Exported Functions

```typescript
// Resources
getResources(): Resource[]
getResourceById(id): Resource | null
createResource(data: { name: string, capacity: number }): Resource
updateResource(id, data: Partial<Resource>): Resource
deleteResource(id): void                           // throws if services reference it
checkResourceAvailability(resourceId, date, time, durationMinutes): boolean

// Services
getServices(): Service[]
getActiveServices(): Service[]                     // active && !isAddon
getServiceById(id): Service | null
getAddonsByResource(resourceId): Service[]         // isAddon && same resourceId
createService(data): Service                       // validates maxSpots <= resource.capacity
updateService(id, data): Service
deleteService(id): void                            // throws if sessions reference it

// Sessions
getSessionsByService(serviceId): SessionWithAvailability[]
getSessionById(id): SessionWithAvailability | null
getUpcomingSessions(): SessionWithAvailability[]
createSession(data): Session                       // validates resource availability
updateSession(id, data): Session
deleteSession(id): void

// Bookings
createBooking(data): Booking                       // validates availability, computes total
approveBooking(id): Booking
rejectBooking(id): Booking
getBookingById(id): Booking | null
getAllBookings(filters?: { serviceId?, status?, from?, to? }): Booking[]
getBookingsBySession(sessionId): Booking[]

// Coaches
getCoaches(): Coach[]
getCoachById(id): Coach | null
createCoach(data): Coach
updateCoach(id, data): Coach
deleteCoach(id): void

// Helpers
computeTotal(pricingModel, pricePen, seats): number
computeOccupation(session, bookings): { bookedSpots, availableSpots, occupationPct }
formatPrice(amount): string                        // "S/130" or "S/1,200"
formatOccupation(pct): string                      // "50%" or "LLENO" at 100%
buildWhatsAppUrl(booking, session, service): string
```

---

## 2. Customer Screens

### Screen: Service Picker `/[lang]/book`

**Purpose:** Customer sees all bookable experiences and picks one.

**Data fetched:** `GET /api/services` -> active, non-addon services with next available session date.

**Layout:**
```
┌──────────────────────────────────┐
│ NAVBAR (with RESERVAR CTA hidden)│
├──────────────────────────────────┤
│ 01 — La Punta                    │  <- exhibition label
│ EXPERIENCIAS                     │  <- h1
│ Elige tu actividad.              │  <- subtitle
├──────────────────────────────────┤
│ ── PADDLE ──                     │  <- type group header
│ ┌──────────┐ ┌──────────┐       │
│ │ Paddle   │ │ Paddle   │       │
│ │ Bahia    │ │ Camotal  │       │
│ │ Lancha 1 │ │ Lancha 1 │       │  <- resource name
│ │ S/130 pp │ │ S/150 pp │       │
│ │ 90 min   │ │ 120 min  │       │
│ │ 4 disp.  │ │ LLENO    │       │  <- availability from next session
│ │ [ELEGIR] │ │ [——————] │       │  <- disabled if all sessions full
│ └──────────┘ └──────────┘       │
│ ── EN BOTE ──                    │
│ ┌──────────┐ ┌──────────┐       │
│ │ Bahia    │ │ Kayak    │       │
│ │ Anchor   │ │ Atardecer│       │  <- admin-created custom service
│ │ Lancha 1 │ │ Kayak S. │       │  <- resource: "Kayak Solo"
│ │ S/1,200  │ │ S/80 pp  │       │
│ │ grupo    │ │ 30 min   │       │
│ │ 5 disp.  │ │ 1 disp.  │       │
│ │ [ELEGIR] │ │ [ELEGIR] │       │
│ └──────────┘ └──────────┘       │
│ ── ALIANZAS ──                   │
│ ...                              │
├──────────────────────────────────┤
│ FOOTER                           │
└──────────────────────────────────┘
```

**ServiceCard fields:**
| Field | Source | Display |
|-------|--------|---------|
| Name | `service.name[lang]` | Bold, large |
| Type badge | `service.type` | Colored pill (paddle=blue, boat=teal, alliance=indigo) |
| Resource | `resource.name` | Subtle text: "Lancha 1" or "SUP Boards" (connects what they're booking to the physical thing) |
| Price | `service.pricePen` | "S/130" |
| Pricing label | `service.pricingModel` | "por persona" or "grupo completo" |
| Duration | `service.durationMinutes` | "90 min" |
| Availability | next session's occupation | Bar or text: "4/6 disponibles" or "DISPONIBLE" or "LLENO" if all sessions full |
| CTA | — | "ELEGIR" / "CHOOSE" -> `/[lang]/book/[serviceId]` (disabled + "LLENO" if no available sessions) |

**Interactions:**
- Click card CTA -> navigate to `/[lang]/book/[serviceId]`
- Cards grouped by `service.type` with section headers
- Staggered entrance animation per card (0.06s offset)

**States:**
- Loading: bone skeleton cards
- Empty: "No hay experiencias disponibles" / "No experiences available"

---

### Screen: Booking Flow `/[lang]/book/[serviceId]`

**Purpose:** Customer selects date, time, fills form, and confirms. 4-step flow.

**Data fetched:** `GET /api/services/[id]` -> service + sessions + addons

**Layout (header):**
```
┌──────────────────────────────────┐
│ NAVBAR                           │
├──────────────────────────────────┤
│ ← Experiencias                   │  <- back link to /book
│ PADDLE BAHIA                     │  <- service.name[lang]
│ Lancha 1 · 6 personas            │  <- resource.name + resource.capacity
│ S/130 por persona · 90 min       │  <- price + pricing label + duration
├──────────────────────────────────┤
│ ● ─── ○ ─── ○ ─── ○             │  <- step indicator (4 steps)
│ Fecha  Hora  Datos  Confirmar    │
├──────────────────────────────────┤
│ [STEP CONTENT]                   │
└──────────────────────────────────┘
```

**Step indicator:** 4 dots connected by lines. Current = filled rojo. Completed = checkmark. Future = outline.

---

#### Step 1: Date Selection

**Displays:** Calendar tiles for dates that have at least one available session.

**Tile fields:**
| Field | Source | Display |
|-------|--------|---------|
| Day of week | computed | "LUN" / "MON" |
| Day number | `session.date` | "7" |
| Month | `session.date` | "MAR" |
| Day occupation | avg occupationPct across sessions that day | Small bar or dot: gray <50%, amber 50-79%, rojo >=80%. Indicates how busy that day is. |
| Sessions count | count of sessions that day | "2 sesiones" / "2 sessions" (subtle) |

**Interactions:**
| Action | Behavior |
|--------|----------|
| Tap tile | Select date, auto-advance to Step 2 |
| Tap selected tile | Deselect, stay on Step 1 |

**States:**
- No sessions: "No hay fechas disponibles esta semana" + "Contactar por WhatsApp" link
- Tile staggered reveal animation (0.04s per tile)

---

#### Step 2: Time Selection

**Displays:** Time slot cards for selected date.

**Slot fields:**
| Field | Source | Display |
|-------|--------|---------|
| Time range | `session.time` + `durationMinutes` | "09:00 — 11:00" (Space Mono). Shows BOTH start and end so customer knows how long it lasts. |
| Duration | `session.durationMinutes` | "2 horas" or "90 min" or "30 min" — varies per service, admin defines it |
| Occupation | `occupationPct` | Visual bar: filled portion = booked seats, empty = available. "3/6" label. Bar color: gray <50%, amber 50-79%, rojo >=80% |
| Available text | `availableSpots` | "3 disponibles" / "3 available" — or "LLENO" / "FULL" at 100% |
| Price | `session.pricePen` | "S/130" (only if overrides service default) |
| Coach | `session.coach.name` | "Franco M." (if assigned) |

**Interactions:**
| Action | Behavior |
|--------|----------|
| Tap slot | Select session, auto-advance to Step 3 |
| Tap "← Fecha" | Go back to Step 1, keep date selected |

**States:**
- Slot full (availableSpots = 0): grayed out, "COMPLETO" label, not tappable
- Low availability (availableSpots <= 2): red availability dots
- Staggered entrance (0.05s per slot)

---

#### Step 3: Contact Form + Addons

**Form fields:**
| Field | Label | Type | Validation | Notes |
|-------|-------|------|------------|-------|
| name | "Nombre completo" / "Full name" | text | required, min 2 chars | |
| countryCode | — | select | required | Dropdown: PE (+51), US (+1), MX (+52), etc. 13 countries, flag emoji |
| phone | "WhatsApp" | tel | required, min 6 digits | Shares bottom border with countryCode |
| seats | "Personas" / "People" | stepper | 1 to session.availableSpots | +/- buttons, default 1 |

**Addon picker** (shown only if service has addons — same resourceId, isAddon=true):
| Field | Source | Display |
|-------|--------|---------|
| Addon name | `addon.name[lang]` | "Wakeboard / Toys" |
| Addon price | `addon.pricePen` | "S/80 pp" or "S/200 grupo" |
| Toggle | — | Checkbox per addon |

**Live price display:**
```
┌─────────────────────────┐
│ Tu seleccion             │
│ Paddle Bahia             │
│ Mar 7 · 09:00-10:30 · 2 pers │
│                          │
│ Base     S/130 x 2 = S/260│  <- per_person example
│ Wakeboard S/80 x 2 = S/160│  <- addon if selected
│ ─────────────────────────│
│ Total            S/420   │  <- animated on change
│                          │
│ [CONTINUAR]              │  <- disabled if name or phone empty
└─────────────────────────┘
```

For flat pricing:
```
│ Bahia Anchor     S/1,200 │  <- flat, no "x seats"
│ Wakeboard S/80 x 4 = S/320│  <- addon can still be per_person
│ Total           S/1,520  │
```

**Interactions:**
| Action | Behavior |
|--------|----------|
| Change seats | Recalculate total (animated), cap at availableSpots |
| Toggle addon | Recalculate total |
| Tap CONTINUAR | Validate form -> advance to Step 4 |
| Tap "← Hora" | Go back to Step 2 |

**States:**
- CONTINUAR disabled (opacity 30%) when name or phone empty
- Focus animation on active input (label slides up)
- Total animates (y-axis swap) when seats change

---

#### Step 4: Confirm + WhatsApp

**Purpose:** Review summary, then submit booking and open WhatsApp.

**Layout:**
```
┌──────────────────────────────────┐
│ CONFIRMAR RESERVA                │
│ Revisa tu reserva.               │
├──────────────────────────────────┤
│ ┌ dark header ─────────────────┐ │
│ │ PADDLE BAHIA                 │ │  <- service name
│ │ Sabado 7 de marzo · 09:00-10:30 │ │  <- date + time range
│ └──────────────────────────────┘ │
│ │ Personas    2                │ │
│ │ Contacto    Juan Perez       │ │
│ │             +51 999 888 777  │ │
│ │ Base        S/130 x 2  S/260│ │
│ │ Wakeboard   S/80 x 2   S/160│ │  <- if addon selected
│ │ ────────────────────────────│ │
│ │ Total               S/420  │ │
│ └──────────────────────────────┘ │
│                                  │
│ ⓘ Se abrira WhatsApp para       │
│   coordinar el pago.             │
│                                  │
│ [CONFIRMAR POR WHATSAPP]         │  <- primary CTA, rojo bg
│                                  │
│ ← Editar datos                   │  <- back to Step 3
└──────────────────────────────────┘
```

**Interactions:**
| Action | Behavior |
|--------|----------|
| Tap CONFIRMAR POR WHATSAPP | 1. Button shows spinner. 2. POST `/api/booking` with {sessionId, name, phone, seats, addons, lang}. 3. API returns {bookingId, whatsappUrl}. 4. `window.open(whatsappUrl)` opens WhatsApp. 5. Redirect to `/[lang]/book/success?booking=[bookingId]`. |
| Tap "← Editar datos" | Go back to Step 3, form fields preserved |
| API error | Redirect to `/[lang]/book/failure` |

**WhatsApp message template:**
```
ES: "Hola! Soy {name}. Reserva #{bookingId}: {serviceName} el {date} de {startTime} a {endTime}. {seats} persona(s). Total: S/{total}."
EN: "Hi! I'm {name}. Booking #{bookingId}: {serviceName} on {date} from {startTime} to {endTime}. {seats} person(s). Total: S/{total}."
```

---

### Screen: Success `/[lang]/book/success`

**Data fetched:** `GET /api/booking/[id]` via `?booking=` query param.

**Layout:**
```
┌──────────────────────────────────┐
│ [animated checkmark]             │
│ Reserva recibida                 │  <- rojo text
│ Te confirmaremos por WhatsApp.   │
├──────────────────────────────────┤
│ ┌ dark header ─────────────────┐ │
│ │ PADDLE BAHIA                 │ │
│ │ Sabado 7 de marzo · 09:00-10:30 │ │
│ └──────────────────────────────┘ │
│ │ 🕐 90 minutos               │ │
│ │ 📍 Av. Bolognesi, La Punta  │ │
│ │ ✓  Trae ropa comoda y ganas │ │
│ └──────────────────────────────┘ │
│                                  │
│ [RESERVAR OTRA]                  │  <- -> /book
│ [WHATSAPP]                       │  <- bordered, opens WA
└──────────────────────────────────┘
```

**States:**
- No booking ID in URL: show generic "Reserva recibida" without details
- Animated checkmark: spring scale on container, pathLength draw on SVG

---

### Screen: Failure `/[lang]/book/failure`

**Layout:**
```
┌──────────────────────────────────┐
│ [muted X mark]                   │
│ No completado                    │
│ Algo salio mal. Tu lugar sigue   │
│ reservado por 10 minutos.        │
│                                  │
│ [INTENTAR DE NUEVO]              │  <- -> /book
│ [WHATSAPP]                       │  <- bordered, opens WA
└──────────────────────────────────┘
```

---

## 3. Admin Screens

### Shared: Admin Layout `app/admin/layout.tsx`

**Layout:**
```
┌──────────────────────────────────┐
│ LORENZO  [ADMIN]                 │  <- logo + red badge
├──────────────────────────────────┤
│ INICIO  RECURSOS  SERVICIOS ...  │  <- horizontal scroll tabs
│ ═══════                          │  <- rojo underline on active
├──────────────────────────────────┤
│ [PAGE CONTENT]                   │
└──────────────────────────────────┘
```

**Tabs:**
| Tab | Route | Visible to |
|-----|-------|------------|
| INICIO | `/admin` | all |
| RECURSOS | `/admin/resources` | admin only |
| SERVICIOS | `/admin/services` | admin only |
| SESIONES | `/admin/sessions` | admin only |
| COACHES | `/admin/coaches` | admin only |
| RESERVAS | `/admin/bookings` | all |

**Behavior:** Tabs scroll horizontally on mobile. Active tab has `border-b-2 border-rojo`. Operator role sees only INICIO + RESERVAS.

---

### Screen: Dashboard `/admin`

**Purpose:** At-a-glance view of today's operations.

**Admin view:**
```
┌──────────────────────────────────┐
│ Hoy — Sabado 7 de marzo         │
├──────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌──────┐│
│ │ 4       │ │ 2       │ │ 1    ││
│ │ reservas│ │ sesiones│ │ pend.││
│ │ hoy     │ │ hoy     │ │      ││
│ └─────────┘ └─────────┘ └──────┘│
│ ┌──────────────────────────────┐ │
│ │ Ocupacion hoy         67%   │ │  <- avg occupation across today's sessions
│ │ ████████████░░░░░░          │ │  <- visual bar
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ Proximas sesiones                │
│ ┌──────────────────────────────┐ │
│ │ 09:00-10:30  Paddle Bahia     │ │  <- time range, service
│ │        Lancha 1  3/6   50%   │ │  <- resource, seats, occupation
│ │        ████░░░░  Franco M.   │ │  <- occupation bar, coach
│ │ 11:00-13:00  Bahia Anchor    │ │
│ │        Lancha 1  7/7  100% ■ │ │  <- full
│ │        ████████  Franco M.   │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ Acciones rapidas                 │
│ [+ Sesion]  [+ Servicio]  [Ver] │
└──────────────────────────────────┘
```

**Stat cards:**
| Stat | Source | Computation |
|------|--------|-------------|
| Reservas hoy | bookings where session.date = today | count |
| Sesiones hoy | sessions where date = today, status = scheduled | count |
| Pendientes | bookings where status = 'pending' | count, amber if > 0 |
| Ocupacion hoy | avg occupationPct across today's sessions | percentage + bar (gray <50%, amber 50-79%, rojo >=80%) |

**Upcoming sessions list:**
| Field | Source | Display |
|-------|--------|---------|
| Time range | `session.time` + `durationMinutes` | "09:00-10:30" mono |
| Service name | service.name.es | |
| Resource | resource.name | "Lancha 1", "SUP Boards" |
| Seats | `bookedSpots/maxSpots` | "3/6" |
| Occupation | occupationPct | Percentage + mini bar. Color: gray <50%, amber 50-79%, rojo >=80% |
| Coach | coach.name | |
| Full indicator | occupationPct === 100 | Filled square |

**Operator view:** Same layout but only shows sessions where `session.coachId = currentCoach.id`. No stat cards. No quick actions.

**Interactions:**
| Action | Behavior |
|--------|----------|
| Tap session row | Navigate to `/admin/bookings?sessionId=[id]` |
| Tap "+ Sesion" | Navigate to `/admin/sessions/new` |
| Tap "+ Servicio" | Navigate to `/admin/services/new` |
| Tap "Ver reservas" | Navigate to `/admin/bookings` |
| Tap pending count | Navigate to `/admin/bookings?status=pending` |

---

### Screen: Resources `/admin/resources`

**Purpose:** CRUD for physical assets (boats, SUP sets, etc.)

**List view:**
```
┌──────────────────────────────────┐
│ RECURSOS          [+ Nuevo]      │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Lancha 1              ●     │ │  <- name, active dot
│ │ 7 personas                  │ │  <- capacity
│ │ 3 servicios vinculados      │ │  <- count of services using this resource
│ │                  [✎] [🗑]   │ │
│ ├──────────────────────────────┤ │
│ │ SUP Boards            ●     │ │
│ │ 6 personas                  │ │
│ │ 2 servicios vinculados      │ │
│ │                  [✎] [🗑]   │ │
│ ├──────────────────────────────┤ │
│ │ Kayak Solo            ●     │ │  <- admin created a new one
│ │ 1 persona                   │ │  <- 1 seat
│ │ 1 servicio vinculado        │ │
│ │                  [✎] [🗑]   │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Inline create/edit form** (expands below "+ Nuevo" or replaces row on edit):

| Field | Label | Type | Validation | Notes |
|-------|-------|------|------------|-------|
| name | "Nombre" | text | required | Freeform — admin names it whatever they want: "Lancha 1", "Kayak Solo", "Bote Familiar" |
| capacity | "Capacidad (personas)" | number | required, min 1 | This is the max seats. A kayak = 1, a boat = 7, a large SUP = 5 |
| active | "Activo" | toggle | default true | |

**Interactions:**
| Action | Behavior |
|--------|----------|
| Tap "+ Nuevo" | Show inline form at top |
| Submit form | POST `/api/admin/resources` -> add to list, close form |
| Tap edit icon | Replace row with inline form, pre-filled |
| Tap delete icon | Confirm dialog "Eliminar {name}?" -> DELETE `/api/admin/resources/[id]` |
| Delete fails | Toast: "No se puede eliminar: hay servicios usando este recurso" |

---

### Screen: Services List `/admin/services`

**Purpose:** See all services, toggle active, navigate to create/edit.

**List view:**
```
┌───────────────────────────────────────────────────┐
│ SERVICIOS                            [+ Nuevo]    │
├───────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────┐ │
│ │ Paddle Bahia                  [paddle] [●]    │ │  <- name, type badge, active
│ │ Lancha 1 (7 pers) · S/130 pp · 90 min        │ │  <- resource (capacity), price, duration
│ │ 6 personas max                    [✎] [🗑]    │ │
│ ├───────────────────────────────────────────────┤ │
│ │ Kayak Atardecer               [other]  [●]    │ │  <- admin created a custom service
│ │ Kayak Solo (1 pers) · S/80 pp · 30 min       │ │  <- linked to 1-seat resource
│ │ 1 persona max                     [✎] [🗑]    │ │
│ ├───────────────────────────────────────────────┤ │
│ │ Wakeboard / Toys     [boat] [addon] [●]       │ │  <- addon badge
│ │ Lancha 1 (7 pers) · S/80 pp · 30 min         │ │
│ │ 7 personas max                    [✎] [🗑]    │ │
│ └───────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

**Row fields:**
| Field | Source | Display |
|-------|--------|---------|
| Name | service.name.es | Bold |
| Type badge | service.type | Colored pill |
| Addon badge | service.isAddon | "addon" pill if true |
| Active toggle | service.active | Green dot / gray dot, tappable |
| Resource | resource.name + resource.capacity | "Lancha 1 (7 pers)" or "Ninguno" if null |
| Pricing model | service.pricingModel | "pp" (per_person) or "fijo" (flat) |
| Price | service.pricePen | "S/130" |
| Duration | service.durationMinutes | "90 min" |
| Max spots | service.maxSpots | "6 personas max" |

**Interactions:**
| Action | Behavior |
|--------|----------|
| Tap "+ Nuevo" | Navigate to `/admin/services/new` |
| Tap edit icon | Navigate to `/admin/services/[id]/edit` |
| Tap active toggle | PUT `/api/admin/services/[id]` { active: !current } |
| Tap delete icon | Confirm -> DELETE `/api/admin/services/[id]` |
| Delete fails | Toast: "No se puede eliminar: hay sesiones para este servicio" |

---

### Screen: Create Service `/admin/services/new`

**Form fields:**

| Field | Label | Type | Validation | Notes |
|-------|-------|------|------------|-------|
| name.es | "Nombre (ES)" | text | required | |
| name.en | "Nombre (EN)" | text | required | |
| description.es | "Descripcion (ES)" | textarea | required | |
| description.en | "Descripcion (EN)" | textarea | required | |
| type | "Tipo" | select: paddle, boat, event, alliance, other | required | |
| resourceId | "Recurso fisico" | select: resources list + "Ninguno" | optional | Shows name + capacity: "Lancha 1 (7 personas)", "Kayak Solo (1 persona)" |
| pricingModel | "Modelo de precio" | toggle: "Por persona" / "Tarifa fija" | required | |
| pricePen | "Precio (S/)" | number | required, min 1 | Label changes: "Precio por persona" or "Tarifa total" based on toggle |
| maxSpots | "Maximo de personas" | number | required, min 1 | If resource selected: capped at resource.capacity, shows "(max {capacity})" hint |
| durationMinutes | "Duracion (minutos)" | number | required, min 15 | |
| isAddon | "Es complemento (add-on)" | checkbox | default false | "Solo se puede agregar a otra reserva" hint |
| active | "Activo" | toggle | default true | |

**Interactions:**
| Action | Behavior |
|--------|----------|
| Select resource | Auto-fill maxSpots cap hint. If maxSpots > resource.capacity, show warning |
| Toggle pricingModel | Update price field label |
| Submit | POST `/api/admin/services` -> navigate to `/admin/services` |
| Cancel | Navigate back to `/admin/services` |

**Edit screen** `/admin/services/[id]/edit` — same form, pre-filled. PUT on submit.

---

### Screen: Sessions `/admin/sessions`

**Purpose:** See all upcoming sessions, create new, detect resource conflicts.

**Filters bar:**
```
[Servicio: Todos ▾] [Desde: hoy ▾] [Hasta: +7d ▾]
```

**List view:**
```
┌──────────────────────────────────────────────────────────┐
│ SESIONES                                    [+ Nueva]    │
│ [filters]                                                │
├──────────────────────────────────────────────────────────┤
│ ── Sabado 7 de marzo ──                                  │  <- date group header
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 09:00-10:30  Paddle Bahia   Lancha 1   3/6  50%  Franco │ │
│ │                                      ████░░░░     [●]  │ │  <- occupation bar + status dot
│ │ 09:00-11:00  Bahia Anchor  Lancha 1   5/7  71%  Franco │ │
│ │                                      ██████░░     [●]  │ │
│ │ ⚠ Lancha 1: sesiones se solapan 09:00-10:30           │ │  <- resource conflict warning (time overlap)
│ │ 11:00-12:30  Paddle Camotal SUP Boards 0/6  0%  —     │ │
│ │                                      ░░░░░░░░     [●]  │ │
│ └──────────────────────────────────────────────────────┘ │
│ ── Domingo 8 de marzo ──                                 │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

**Row fields:**
| Field | Source | Display |
|-------|--------|---------|
| Time range | `session.time` + `durationMinutes` | "09:00-10:30" mono. Shows start-end so admin sees resource occupation window. |
| Service | service.name.es | |
| Resource | resource.name | "Lancha 1", "SUP Boards" — ties session to physical asset |
| Seats | `bookedSpots/maxSpots` | "3/6" |
| Occupation | occupationPct | Percentage + mini bar. Gray <50%, amber 50-79%, rojo >=80% |
| Coach | coach.name or "—" | |
| Status | session.status | Green dot (scheduled) or red dot (cancelled) |
| Conflict warning | computed | Amber banner if another session on same resource has overlapping time range |

**Interactions:**
| Action | Behavior |
|--------|----------|
| Tap "+ Nueva" | Navigate to `/admin/sessions/new` |
| Tap row | Expand inline: show bookings for this session, edit/cancel/delete actions |
| Tap "Cancelar" | PUT `/api/admin/sessions/[id]` { status: 'cancelled' } |
| Tap "Eliminar" | Confirm -> DELETE (only if no bookings) |
| Tap coach "—" | Inline dropdown to assign coach |
| Change filters | Refetch sessions list |

---

### Screen: Create Session `/admin/sessions/new`

**Form fields:**

| Field | Label | Type | Validation | Notes |
|-------|-------|------|------------|-------|
| serviceId | "Servicio" | select: services list | required | Shows resource + pricing info on selection |
| date | "Fecha" | date picker | required, >= today | |
| time | "Hora" | time input (HH:MM) | required | |
| coachId | "Coach" | select: coaches list + "Sin asignar" | optional | |
| maxSpots | "Personas (max)" | number | optional | Pre-filled from service.maxSpots. Override allowed. |
| pricePen | "Precio (S/)" | number | optional | Pre-filled from service.pricePen. Override allowed. Shows pricing model label. |
| durationMinutes | "Duracion (min)" | number | optional | Pre-filled from service.durationMinutes. Override allowed. |

**Resource conflict check** (live, as user selects service + date + time):
```
┌──────────────────────────────────┐
│ ⚠ Conflicto de recurso           │
│ "Lancha 1" ya tiene una sesion   │
│ de "Bahia Anchor" de 09:00 a     │
│ 11:30 este dia.                  │
└──────────────────────────────────┘
```

**Bulk create section** (collapsible):

| Field | Label | Type | Notes |
|-------|-------|------|-------|
| serviceId | "Servicio" | select | Same as above |
| days | "Dias de la semana" | multi-select: LUN, MAR, MIE, JUE, VIE, SAB, DOM | |
| time | "Hora" | time input | |
| coachId | "Coach" | select | optional |
| weeks | "Semanas" | number, 1-4 | default 1 |

**Interactions:**
| Action | Behavior |
|--------|----------|
| Select service | Auto-fill maxSpots, pricePen, durationMinutes from service defaults |
| Change date+time | Live conflict check against existing sessions on same resource |
| Submit (single) | POST `/api/admin/sessions` -> navigate to `/admin/sessions` |
| Submit (bulk) | POST multiple sessions -> show count created, navigate to list |
| Conflict blocks submit | Submit button disabled with conflict message |

---

### Screen: Coaches `/admin/coaches`

**Purpose:** Inline CRUD for staff. Simple list.

**Layout:**
```
┌──────────────────────────────────┐
│ COACHES                [+ Nuevo] │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Franco Marsano   [admin] [●]│ │  <- name, role badge, active
│ │ +51 999 888 777       [✎]   │ │  <- phone, edit
│ ├──────────────────────────────┤ │
│ │ Carlos Lopez  [operator] [●]│ │
│ │ +51 988 777 666       [✎]   │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Inline form fields:**
| Field | Label | Type | Validation |
|-------|-------|------|------------|
| name | "Nombre" | text | required |
| phone | "Telefono" | tel | required |
| role | "Rol" | select: admin, operator | required |
| active | "Activo" | toggle | default true |

**Interactions:**
| Action | Behavior |
|--------|----------|
| Tap "+ Nuevo" | Show inline form at top |
| Submit | POST `/api/admin/coaches` -> add to list |
| Tap edit | Replace row with form, pre-filled |
| Save edit | PUT `/api/admin/coaches/[id]` |
| No delete | Coaches are deactivated, not deleted (preserves booking history) |

---

### Screen: Bookings `/admin/bookings`

**Purpose:** See all bookings, filter, approve/reject, assign coach.

**Filters bar:**
```
[Servicio: Todos ▾] [Estado: Todos ▾] [Fecha: Hoy ▾]
```

**List view:**
```
┌────────────────────────────────────────────────────────┐
│ RESERVAS                                               │
│ [filters]                                              │
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ [pending]  Juan Perez               📱 +51 999... │ │  <- status badge, name, phone (WA link)
│ │ Paddle Bahia · Sab 7 mar · 09:00-10:30            │ │  <- service, date, time range
│ │ 2 personas · S/260 · +Wakeboard S/160             │ │  <- seats, total, addons
│ │                                                    │ │
│ │ Coach: [Franco M. ▾]                               │ │  <- coach dropdown
│ │ [✓ Aprobar]  [✗ Rechazar]                          │ │  <- action buttons
│ ├────────────────────────────────────────────────────┤ │
│ │ [approved] Maria Garcia             📱 +51 988... │ │
│ │ Bahia Anchor · Dom 8 mar · 10:00-12:00            │ │
│ │ 5 personas · S/1,200 (grupo)                      │ │
│ │ Coach: Franco M.                                   │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**Row fields:**
| Field | Source | Display |
|-------|--------|---------|
| Status badge | booking.status | Pill: pending=amber, approved=green, rejected=red |
| Client name | booking.name | Bold |
| Phone | booking.phone | Tappable -> opens `https://wa.me/{phone}` |
| Service | service.name.es (via session) | With type badge |
| Date + time range | session.date + session.time + durationMinutes | "Sab 7 mar · 09:00-10:30" |
| Seats | booking.seats | "{n} personas" |
| Total | booking.totalPen | "S/260" |
| Pricing note | service.pricingModel | "(grupo)" if flat |
| Addons | booking.addons -> addon service names | "+Wakeboard S/160" |
| Coach dropdown | coaches list | Current selection or "Sin asignar" |
| Actions | — | Approve + Reject buttons (only for pending) |

**Interactions:**
| Action | Behavior |
|--------|----------|
| Tap phone | Opens WhatsApp chat with that number |
| Select coach | PUT `/api/admin/bookings/[id]` { coachId } |
| Tap "Aprobar" | PUT `/api/admin/bookings/[id]` { status: 'approved' } -> badge turns green, buttons hide |
| Tap "Rechazar" | Confirm dialog -> PUT { status: 'rejected' } -> badge turns red, spots freed |
| Change filters | Refetch bookings list |

**Operator view:** Only shows bookings for sessions where `session.coachId = currentCoach.id`. No approve/reject. Read-only list of their assigned clients.

---

## 4. API Routes

### Customer-facing

| Method | Route | Request | Response | Validation |
|--------|-------|---------|----------|------------|
| GET | `/api/services` | — | `{ services: Service[] }` (active, !isAddon, with resource name) | — |
| GET | `/api/services/[id]` | — | `{ service, sessions: SessionWithAvailability[], addons: Service[] }` | 404 if not found |
| POST | `/api/booking` | `{ sessionId, name, phone, seats, addons: string[], lang }` | `{ bookingId, whatsappUrl }` | Session exists, availableSpots >= seats, name+phone not empty |
| GET | `/api/booking/[id]` | — | `{ booking, session, service }` | 404 if not found |

### Admin

| Method | Route | Request | Response | Validation |
|--------|-------|---------|----------|------------|
| GET | `/api/admin/resources` | — | `{ resources: Resource[] }` | — |
| POST | `/api/admin/resources` | `{ name, capacity, active }` | `{ resource }` | name required, capacity >= 1 |
| PUT | `/api/admin/resources/[id]` | `Partial<Resource>` | `{ resource }` | 404 if not found |
| DELETE | `/api/admin/resources/[id]` | — | `{ ok }` | 409 if services reference it |
| GET | `/api/admin/services` | — | `{ services: Service[] }` (all, with resource) | — |
| POST | `/api/admin/services` | full Service body (minus id, createdAt) | `{ service }` | maxSpots <= resource.capacity |
| PUT | `/api/admin/services/[id]` | `Partial<Service>` | `{ service }` | same cap validation |
| DELETE | `/api/admin/services/[id]` | — | `{ ok }` | 409 if sessions reference it |
| GET | `/api/admin/sessions` | `?serviceId=&from=&to=` | `{ sessions: SessionWithAvailability[] }` | — |
| POST | `/api/admin/sessions` | `{ serviceId, date, time, coachId?, maxSpots?, pricePen?, durationMinutes? }` | `{ session }` | Resource not overlapping |
| PUT | `/api/admin/sessions/[id]` | `Partial<Session>` | `{ session }` | — |
| DELETE | `/api/admin/sessions/[id]` | — | `{ ok }` | 409 if bookings exist |
| GET | `/api/admin/coaches` | — | `{ coaches: Coach[] }` | — |
| POST | `/api/admin/coaches` | `{ name, phone, role, active }` | `{ coach }` | name + phone required |
| PUT | `/api/admin/coaches/[id]` | `Partial<Coach>` | `{ coach }` | — |
| DELETE | `/api/admin/coaches/[id]` | — | `{ ok }` | soft-delete preferred |
| GET | `/api/admin/bookings` | `?serviceId=&status=&from=&to=` | `{ bookings: (Booking & session & service)[] }` | — |
| PUT | `/api/admin/bookings/[id]` | `{ status?, coachId? }` | `{ booking }` | valid status transition |

---

## 5. i18n Keys

**New keys to add:**
```typescript
services: {
  title: 'EXPERIENCIAS' / 'EXPERIENCES',
  subtitle: 'Elige tu actividad.' / 'Choose your activity.',
  perPerson: 'por persona' / 'per person',
  flatRate: 'grupo completo' / 'full group',
  addon: 'complemento' / 'add-on',
  choose: 'ELEGIR' / 'CHOOSE',
  noServices: 'No hay experiencias disponibles.' / 'No experiences available.',
}
book: {
  back: '← Experiencias' / '← Experiences',
  steps: { date: 'Fecha', time: 'Hora', details: 'Datos', confirm: 'Confirmar' }
       / { date: 'Date', time: 'Time', details: 'Details', confirm: 'Confirm' },
  confirm: {
    title: 'CONFIRMAR RESERVA' / 'CONFIRM BOOKING',
    subtitle: 'Revisa tu reserva.' / 'Review your booking.',
    whatsapp: 'CONFIRMAR POR WHATSAPP' / 'CONFIRM VIA WHATSAPP',
    note: 'Se abrira WhatsApp para coordinar el pago.' / 'WhatsApp will open to coordinate payment.',
    edit: '← Editar datos' / '← Edit details',
  },
  addons: {
    title: 'Complementos' / 'Add-ons',
    subtitle: 'Mejora tu experiencia.' / 'Enhance your experience.',
  },
  success: {
    confirmed: 'Reserva recibida' / 'Booking received',
    subtitle: 'Te confirmaremos por WhatsApp.' / "We'll confirm via WhatsApp.",
    what: 'Trae ropa comoda y ganas.' / 'Bring comfy clothes and good vibes.',
    another: 'RESERVAR OTRA' / 'BOOK ANOTHER',
  },
  failure: {
    title: 'NO COMPLETADO' / 'NOT COMPLETED',
    subtitle: 'Algo salio mal. Tu lugar sigue reservado por 10 minutos.'
           / 'Something went wrong. Your spot is held for 10 minutes.',
    retry: 'INTENTAR DE NUEVO' / 'TRY AGAIN',
  },
}
```

**Keys to remove:** `checkout.pay`, `checkout.method`, `checkout.card`, `checkout.yape`, `checkout.transfer`, `checkout.secure`, `checkout.processing`.

---

## 6. Implementation Order

### Phase 0: Subdomain Middleware
0. Update `middleware.ts` — hostname-based routing: `admin.*` rewrites to `/admin/*`, default rewrites to `/[lang]/*`. Combine with existing i18n locale detection.

### Phase 1: Data Layer
1. Rewrite `lib/booking-data.ts` — all interfaces, all CRUD functions, seed data, resource conflict check (time-range based), pricing logic, availability calculation

### Phase 2: Admin API
2. Resource CRUD: `/api/admin/resources/` + `/api/admin/resources/[id]/`
3. Service CRUD: `/api/admin/services/` + `/api/admin/services/[id]/` (with resource cap validation)
4. Coach CRUD: `/api/admin/coaches/` + `/api/admin/coaches/[id]/`
5. Session CRUD: `/api/admin/sessions/` + `/api/admin/sessions/[id]/` (with resource conflict validation)
6. Booking management: `/api/admin/bookings/` + `/api/admin/bookings/[id]/`

### Phase 3: Customer API
7. `GET /api/services` + `GET /api/services/[id]` (with addons and availability)
8. `POST /api/booking` (pending status, addon support, pricing computation, WhatsApp URL)

### Phase 4: Admin UI
9. Admin layout (`app/admin/layout.tsx`) — role-aware tab navigation
10. Shared components: AdminNav, StatusBadge, ServiceTypeBadge, OccupationBar
11. Dashboard page — stat cards, upcoming sessions, quick actions
12. Resources page — inline CRUD
13. Services pages — list + create + edit forms
14. Sessions page — list with conflict warnings + create form with bulk create
15. Coaches page — inline CRUD with role
16. Bookings page — list with filters, approve/reject, coach assign

### Phase 5: Customer UI
17. Update i18n with all new keys, remove payment keys
18. ServiceCard + ServiceGrid components
19. Service picker page (`/[lang]/book`) — grouped grid
20. Service booking page (`/[lang]/book/[serviceId]`) — dynamic header
21. Refactor BookingFlow — 4 steps, service prop, addon state
22. AddonPicker component
23. ConfirmStep component — summary + WhatsApp CTA
24. Update success/failure pages — dynamic service data
25. Delete CheckoutStep.tsx

### Phase 6: Polish
26. Full round-trip test: admin creates resource -> service -> session -> customer books with addon -> WhatsApp -> admin approves
27. Resource conflict test: two boat sessions on same Lancha with overlapping time ranges -> blocked
28. Pricing test: per_person vs flat compute correctly with addons
29. Operator view test: coach sees only their assigned sessions + bookings
30. Bilingual test: switch EN/ES on all screens
31. Remove dead code

---

## 7. Files

```
middleware.ts                                 — MODIFY (add subdomain routing)
lib/booking-data.ts                          — REWRITE

app/api/services/route.ts                    — NEW
app/api/services/[id]/route.ts               — NEW
app/api/booking/route.ts                     — MODIFY
app/api/admin/resources/route.ts             — NEW
app/api/admin/resources/[id]/route.ts        — NEW
app/api/admin/services/route.ts              — NEW
app/api/admin/services/[id]/route.ts         — NEW
app/api/admin/coaches/route.ts               — NEW
app/api/admin/coaches/[id]/route.ts          — NEW
app/api/admin/sessions/route.ts              — NEW
app/api/admin/sessions/[id]/route.ts         — NEW
app/api/admin/bookings/route.ts              — NEW
app/api/admin/bookings/[id]/route.ts         — NEW

app/admin/layout.tsx                         — REWRITE
app/admin/page.tsx                           — REWRITE
app/admin/resources/page.tsx                 — NEW
app/admin/services/page.tsx                  — NEW
app/admin/services/new/page.tsx              — NEW
app/admin/services/[id]/edit/page.tsx        — NEW
app/admin/sessions/page.tsx                  — NEW
app/admin/sessions/new/page.tsx              — NEW
app/admin/coaches/page.tsx                   — NEW
app/admin/bookings/page.tsx                  — NEW

components/admin/AdminNav.tsx                — NEW
components/admin/StatusBadge.tsx              — NEW
components/admin/ServiceTypeBadge.tsx         — NEW
components/admin/OccupationBar.tsx            — NEW (reused: dashboard, sessions, bookings)

app/[lang]/book/page.tsx                     — REWRITE
app/[lang]/book/[serviceId]/page.tsx         — NEW
components/booking/ServiceCard.tsx            — NEW
components/booking/ServiceGrid.tsx            — NEW
components/booking/ConfirmStep.tsx            — NEW
components/booking/AddonPicker.tsx            — NEW
components/booking/BookingFlow.tsx            — MODIFY
components/booking/BookingForm.tsx            — MODIFY
app/[lang]/book/success/SuccessContent.tsx   — MODIFY
app/[lang]/book/failure/FailureContent.tsx   — MODIFY
lib/i18n.tsx                                 — MODIFY

DELETE: components/booking/CheckoutStep.tsx
```
