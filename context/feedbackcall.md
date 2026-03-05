# Lorenzo — Feedback Call Notes
**Date:** Mar 4, 2026
**Participants:** Luis (dev), Franco Marsano (founder), Claudio Marsano (co-founder)

---

## Key Decisions

### Brand
- **Drop "Active Hub"** — nobody understands "Hub". People say "Lorenzo Active Hub" which is clunky.
- Target name: **Casa Lorenzo** or just **Lorenzo**
- Domain search: `casalorenzo.com` is $3,000. Checking alternatives (`lorenzo.house` at $13, `.pe` options)
- Instagram handle change from `hub_lorenzo` → TBD

### Design
- Josefina (Jofi) will design the landing page in **Figma**
- Luis converts Figma → code (AI-assisted pixel-perfect conversion)
- Current landing feels "serious" — needs to feel **younger, more alive**
- Must convey the HOUSE as the heart — not just experiences, but the story and identity
- **Reference:** Casa Bonay, Barcelona — similar concept (spaces, café, bar, local experiences, boat)

### Payment & Booking
- **Phase 1:** No payment gateway yet. Form generates pre-filled WhatsApp message (name, service, amount)
- **Phase 2:** Payment gateway (MercadoPago) for full self-service
- Availability: managed weekly, not too far ahead (they can't guarantee months out)
- Concern about filling slots — want to fill sessions before opening more

---

## Product Portfolio (Current + Planned)

### Paddle (Operating Now)
| Experience | Description | Capacity |
|-----------|-------------|----------|
| Paddle — Bahía de Cantolao | SUP in the bay | ~6 per session |
| Paddle — El Camotal | SUP to El Camotal (further) | ~6 per session |
| Paddle Grupal | 5 people row together in one large SUP | 5 per session |

### Boat / Lancha (Operating Now)
Boat for 7 passengers + sailor. Four experiences:

| Experience | Description |
|-----------|-------------|
| Bahía — Anchor & Chill | Anchor in the bay, beach day from the water, piqueos, paddle access |
| El Camotal — Anchor | Anchor in front of El Camotal |
| San Lorenzo Island | Boat trip to the island |
| Wakeboard / Toys | Add-on to any boat experience (not standalone) |

### Alliances (Operating from Lorenzo)
| Partner | Service | Notes |
|---------|---------|-------|
| **Mar Adentro** | Palomino Island tours | 4 boats × 30 people. 98% foreigners. 30-120 tourists daily at 9-10:30am. Potential future acquisition. |
| **Michele** | Sailboat | Velero experience |

### Upcoming
| What | When | Notes |
|------|------|-------|
| **Café** | May 2026 | Partner secured, starting build-out |
| **Event Space Rental** | Active | Premium only (Columbia, GoPro, Lexus-level). Raceto restaurant wants recurring rentals for receptions/weddings. Min S/1,000-2,000/hr positioning. |
| **BigBox Video** | Mar 12 | 3 chefs + Lexus brand, promotional video at the house |

---

## Admin System Requirements (From Call)

### Two Profiles
1. **Admin (Franco/Claudio):** Configure services, set availability, assign coaches, see all bookings, manage CRM
2. **Operator/Coach:** See only their assigned sessions for the day — who's coming, what time, what activity

### Features Discussed
- Weekly availability management (not months ahead)
- Coach assignment → triggers notification to client ("Your guide: Franco Marsano")
- Pre-session comms: Wed reminder, Thu info, Fri final reminder
- Automated WhatsApp (but keep human touch for relationship)
- CRM: Track repeat clients, birthdays, preferences → HubSpot or custom

---

## Growth / Marketing Insights

### SEO & Discoverability
- `llms.txt` file for AI search engines (ChatGPT, etc.) — when people ask "what to do in La Punta", Lorenzo appears
- TripAdvisor reviews: design post-purchase flow to drive reviews
- Google reviews equally important
- Tourist traffic is real and growing — foreigners are the majority at Palomino

### Content
- Documentary-style video: founders explaining what Lorenzo means (not just experiences, but the place, the history, the community)
- "About us" section with video trailer
- Show the HOUSE — the heart, not just the services

### Future AI
- AI chat on site ("Lorencito") — guide visitors about La Punta, activities
- Internal AI assistant for ops (like Felipe in Prisma)
- Costs tokens but cheaper than employees

---

## Strategic Positioning (From Call)

### The Moat
> "La gran diferencia viene del ADN... la casa es como el corazón de todas las cosas que puedes hacer."

The house is the differentiator. Competitors rent from ugly clubs. Lorenzo has:
- The physical space (the house)
- The human element (family, not corporate)
- The location (La Punta)
- The premium positioning
- The multi-experience ecosystem

### B2C vs B2B
- **Website = B2C** (consumer-facing experiences)
- **B2B** (corporate events, space rental) should be separate or minimal on site — a link, not a full section
- Everything on the site must feel premium. No "S/50 per hour" visible.

### Vision
Lorenzo → from paddle startup → full La Punta experience hub:
- Own the paddle experiences
- Partner/acquire boat operations (Mar Adentro)
- Café + food
- Event space
- Gateway to all La Punta water activities

---

## Action Items

| Who | What | Status |
|-----|------|--------|
| Josefina | Design landing page in Figma | Pending |
| Franco/Claudio | Find and buy domain | Pending |
| Franco/Claudio | Decide brand name (Casa Lorenzo vs Lorenzo) | Pending |
| Luis | Structure database for multi-service portfolio | Pending |
| Luis | Build admin panel (services, availability, coaches) | Pending |
| Luis | Convert Figma → code when design is ready | Blocked by Figma |
| Luis | Phase 1 booking: form → WhatsApp message | In progress |
| Luis | Phase 2: MercadoPago integration | Future |
| Luis | llms.txt for AI discoverability | Future |
| Luis | Post-purchase TripAdvisor flow | Future |

---

## Immediate Impact on Current Build

### What Changes Now
1. **Multi-service support** — not just Paddle. The booking system needs to support Paddle, Boat, and future services
2. **Phase 1 payment = WhatsApp** — not MercadoPago yet. Form → pre-filled WhatsApp message
3. **Brand might change** — "Active Hub" being dropped. Prepare for name flexibility
4. **Josefina's Figma will replace current design** — current build is structural/functional foundation
5. **Coach assignment** — sessions need a `coach` field for operator view
6. **Premium positioning** — everything visible must feel premium
