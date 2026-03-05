# Lorenzo Admin — QA Test Checklist

Run through each section after deployment. Mark each item pass/fail.

---

## Prerequisites

- [ ] `ADMIN_API_KEY` is set in Vercel environment variables
- [ ] `supabase-add-slugs.sql` has been run in Supabase SQL Editor
- [ ] Latest code is deployed (check commit hash matches)

---

## 1. Authentication

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1.1 | Login page loads | Go to `/admin/login` | See "LORENZO ADMIN" + password input |
| 1.2 | Wrong password rejected | Enter wrong key, click ENTRAR | "Clave incorrecta" error shown |
| 1.3 | Correct password works | Enter `Lorenzo90`, click ENTRAR | Redirected to `/admin` with sidebar |
| 1.4 | Sidebar visible | After login | Left sidebar: LORENZO ADMIN badge, 6 nav items |
| 1.5 | Unauthenticated redirect | Open `/admin` in incognito | Redirected to `/admin/login` |

---

## 2. Sidebar Navigation

| # | Tab | URL | Expected |
|---|-----|-----|----------|
| 2.1 | Inicio | `/admin` | Dashboard with stats, occupation bar, upcoming sessions, quick actions |
| 2.2 | Recursos | `/admin/resources` | List of resources (Lancha 1, SUP Boards, etc.) |
| 2.3 | Servicios | `/admin/services` | Service list with type badges, prices, edit/create buttons |
| 2.4 | Horarios | `/admin/schedules` | Service dropdown + weekly schedule editor with toggles |
| 2.5 | Coaches | `/admin/coaches` | Coach list with name, phone, role |
| 2.6 | Reservas | `/admin/bookings` | Booking list with status, WhatsApp link |
| 2.7 | Active tab highlight | Click each tab | Active tab highlighted with red icon, bone background |
| 2.8 | Mobile nav | Resize to mobile width | Top bar with horizontal scrollable tabs replaces sidebar |

---

## 3. Recursos (Resources)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 3.1 | List loads | Go to `/admin/resources` | See all resources with name + capacity |
| 3.2 | Create resource | Click create, fill name + capacity, submit | New resource appears in list |
| 3.3 | Edit resource | Click edit on existing, change name, save | Name updated |
| 3.4 | Delete resource | Click delete, confirm | Resource removed from list |

---

## 4. Servicios (Services)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 4.1 | List loads | Go to `/admin/services` | All services with type badge, price, duration |
| 4.2 | Create service | `/admin/services/new` — fill all fields, submit | New service in list |
| 4.3 | Edit service | Click edit on existing service | Pre-filled form, save updates service |
| 4.4 | Type badges | Check list | Each type shows colored badge (paddle=blue, boat=teal, etc.) |
| 4.5 | Slug auto-generated | Create service with name "Test Service" | Slug becomes `test-service` |

---

## 5. Horarios (Schedules)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 5.1 | Service selector | Go to `/admin/schedules` | Dropdown with all services |
| 5.2 | Weekly view | Select a service | 7 day rows (Dom-Sab) with toggle + time inputs |
| 5.3 | Enable day | Toggle a disabled day ON | Time inputs appear (start/end) |
| 5.4 | Set time window | Set Lun 07:00 - 17:00, save | Schedule saved, reloads correctly |
| 5.5 | Add window | Click "+ VENTANA" | Second time window row added |
| 5.6 | Copy to days | Click "COPIAR A..." on a day | Options to copy schedule to other days |
| 5.7 | Disable day | Toggle an enabled day OFF | Time inputs hidden, shows "No disponible" |

---

## 6. Coaches

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 6.1 | List loads | Go to `/admin/coaches` | Coach list with name, phone, role |
| 6.2 | Create coach | Fill name, phone, role, submit | New coach in list |
| 6.3 | Edit coach | Click edit, change phone, save | Phone updated |
| 6.4 | Delete coach | Click delete, confirm | Coach removed |

---

## 7. Reservas (Bookings)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 7.1 | List loads | Go to `/admin/bookings` | Booking list (may be empty) |
| 7.2 | Status badge | Check booking entries | Colored badge: pending=amber, confirmed=green |
| 7.3 | WhatsApp link | Click WhatsApp icon on a booking | Opens WhatsApp with customer phone |
| 7.4 | Update status | Change booking status | Status badge updates |

---

## 8. Dashboard (Inicio)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 8.1 | Date header | Go to `/admin` | "Hoy — [weekday], [date]" in Spanish |
| 8.2 | Stat cards | Check dashboard | 3 cards: Reservas hoy, Sesiones hoy, Pendientes |
| 8.3 | Occupation bar | Check dashboard | Progress bar with percentage |
| 8.4 | Upcoming sessions | Check dashboard | Next sessions with time, service name, occupation |
| 8.5 | Quick actions | Check bottom | Buttons: HORARIOS, VER RESERVAS, SERVICIOS |
| 8.6 | Quick action links | Click each button | Navigates to correct admin page |

---

## 9. Customer Booking Flow (Frontend)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 9.1 | Landing page | Go to `/es` | Hero + discipline section + photo grid + footer |
| 9.2 | Service cards | Go to `/es/book` | All active services with price, duration, availability |
| 9.3 | Service detail | Click any service card | Service page loads with name, price, booking calendar |
| 9.4 | Slug routing | Click "Paddle Bahia" card | URL is `/es/book/bay-paddle`, page loads correctly |
| 9.5 | Slug routing 2 | Click "El Camotal" card | URL is `/es/book/el-camotal-anchor`, page loads |
| 9.6 | Calendar | On service detail | Available dates shown, selectable |
| 9.7 | Time slots | Select a date | Time slots shown with availability |
| 9.8 | Booking form | Select a time slot | Name, phone, seats form appears |
| 9.9 | Submit booking | Fill form, submit | Redirects to success page |
| 9.10 | English version | Go to `/en/book` | All text in English |
| 9.11 | Language toggle | Click ES/EN toggle | Switches language, preserves page |

---

## 10. Edge Cases

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 10.1 | Invalid slug | Go to `/es/book/nonexistent` | "Servicio no encontrado" + back link |
| 10.2 | No availability | Service with no schedules | "Elegir" button disabled |
| 10.3 | Session expired | Delete admin-session cookie, refresh `/admin` | Redirected to login |
| 10.4 | Root URL redirect | Go to `casalorenzo.vercel.app` | Redirected to `/es` |

---

## Deployment Checklist

Before marking complete:

1. Run `supabase-add-slugs.sql` in Supabase SQL Editor
2. Add to Vercel env vars: `ADMIN_API_KEY=Lorenzo90`
3. Push latest code and verify deployment
4. Run through sections 1-10 above on production
