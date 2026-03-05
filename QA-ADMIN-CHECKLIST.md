# Lorenzo — QA Test Guide

## Prerequisites

Before testing, ensure:

- `ADMIN_API_KEY` is set in Vercel environment variables
- `supabase-add-slugs.sql` has been run
- `supabase-missing-objects.sql` has been run
- Latest code is deployed

---

## A. Customer Booking Flow

### A1. Landing Page
- [ ] `/es` loads with hero video, service cards, photo grid, footer
- [ ] `/en` loads with English text
- [ ] Language toggle switches between ES/EN
- [ ] "RESERVAR" button navigates to `/es/book`

### A2. Service Catalog
- [ ] `/es/book` shows all active services from database
- [ ] Each card shows: name, type badge, price, duration, resource name
- [ ] "Elegir" button links to service detail page
- [ ] Services without availability show disabled button

### A3. Service Detail + Calendar
- [ ] Click a service card — URL uses slug (e.g. `/es/book/bay-paddle`)
- [ ] Month calendar displays with available dates highlighted
- [ ] Green/amber/red dots indicate occupation level
- [ ] Days without availability are grayed out
- [ ] Month navigation arrows work (prev/next)
- [ ] Invalid slug (e.g. `/es/book/nonexistent`) shows "Servicio no encontrado"

### A4. Time Selection
- [ ] Selecting a date shows available time slots
- [ ] Each slot shows time range, available spots, occupation bar
- [ ] Back button returns to calendar
- [ ] Full slots are disabled

### A5. Booking Form
- [ ] Name field: focuses cleanly, no red outline
- [ ] Phone field: country code selector + input, no red outline
- [ ] Seats selector: buttons 1 through max available
- [ ] **Per-person pricing**: total updates as seats change (e.g. 3 seats x S/130 = S/390)
- [ ] **Flat pricing**: total stays fixed regardless of seats
- [ ] CONTINUAR button is full-width, not cropped

### A6. Confirmation + Submit
- [ ] Review card shows: service, date, time, seats, contact, price breakdown
- [ ] Per-person: shows "S/130 x 3 = S/390"
- [ ] "Confirmar por WhatsApp" submits booking
- [ ] Success page shows with booking summary
- [ ] WhatsApp opens with pre-filled message
- [ ] Failure page shows if something goes wrong

---

## B. Admin Panel

### B1. Authentication
- [ ] `/admin/login` shows login form
- [ ] Wrong password shows "Clave incorrecta"
- [ ] Correct password redirects to `/admin` with sidebar
- [ ] Unauthenticated access to `/admin` redirects to login
- [ ] Sidebar shows: LORENZO ADMIN, Inicio, Recursos, Servicios, Horarios, Coaches, Reservas

### B2. Dashboard (Inicio)
- [ ] Date header in Spanish
- [ ] 3 stat cards: Reservas hoy, Sesiones hoy, Pendientes
- [ ] Occupation bar with percentage
- [ ] Upcoming sessions list
- [ ] Quick action buttons navigate correctly

### B3. Recursos
- [ ] List shows all resources with name + capacity
- [ ] Create: add new resource with name + capacity
- [ ] Edit: change resource name/capacity
- [ ] Delete: works for resources without services
- [ ] Delete: shows error "tiene servicios asociados" if services reference it

### B4. Servicios
- [ ] List shows services with type badge, price, duration, active dot
- [ ] Responsive: stacks name/actions on mobile
- [ ] Create: `/admin/services/new` with all fields
- [ ] Edit: pre-filled form, saves changes
- [ ] Toggle active: eye icon toggles active/inactive state
- [ ] Delete: works for services without bookings
- [ ] Delete: shows error "tiene reservas activas" if bookings exist

### B5. Horarios
- [ ] Service dropdown lists all services
- [ ] Selecting service shows 7-day weekly schedule
- [ ] Toggle day on/off with time inputs
- [ ] Add multiple time windows per day ("+ VENTANA")
- [ ] "COPIAR A..." copies schedule to other days
- [ ] Save persists changes

### B6. Coaches
- [ ] List shows coaches with name, phone, role
- [ ] Create/Edit/Delete work

### B7. Reservas
- [ ] List shows all bookings with name, phone, seats, status, total
- [ ] Status badge: pending=amber, approved=green
- [ ] Approve booking changes status
- [ ] WhatsApp link opens with customer phone

---

## C. Edge Cases

- [ ] Root URL `casalorenzo.vercel.app` redirects to `/es`
- [ ] `www.` prefix redirects to non-www
- [ ] Double-booking prevention: two users booking last spot simultaneously
- [ ] Session expired: delete cookie, refresh admin — redirects to login
- [ ] Mobile: sidebar becomes horizontal tab bar
- [ ] Mobile: booking form fully usable, no cropped elements

---

## D. Database Health

Run `supabase-validate-setup.sql` to verify:
- [ ] All 6 tables exist
- [ ] `sessions_with_availability` view exists
- [ ] `create_booking_atomic` function exists
- [ ] `check_resource_overlap` function exists
- [ ] `slug` column exists on services
- [ ] Row counts are reasonable
