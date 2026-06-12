# I am (IN) — 2.0

> The whole event journey with your people. **Before, during, after.**

A ground-up redesign of the *I am (IN)* social event app — same feature set, rebuilt with an
ultra-refined dark design system and native-feeling navigation inspired by the best modern
social apps (floating glass dock, spring-physics screen pushes with edge-swipe back,
drag-to-dismiss sheets, swipeable feed pager, live toasts).

## Run it

```bash
npm install
npm run dev        # → http://localhost:5173
```

- `npm run build` — production build into `dist/`
- `npm run test` — jsdom smoke tests (onboarding → every screen)
- `npm run standalone` — builds `dist/iamin-standalone.html`, a single file you can open
  anywhere (or AirDrop to your phone)

It's a mobile-first PWA-style web app: on a phone it's full-bleed, on desktop it renders in a
centered device frame. All data is rich local demo data (persisted to `localStorage`), seeded
**relative to today** so there is always a live event tonight, fresh capsules from last night,
and upcoming plans. *Settings → Demo → Refresh demo timeline* re-seeds it.

## Deploy

A GitHub Actions workflow (`.github/workflows/deploy.yml`) deploys to **GitHub Pages** on every
push. One-time setup: repo **Settings → Pages → Source: GitHub Actions**. The app then lives at
`https://<user>.github.io/iaminnew/`. The build is fully static (`dist/`), so Vercel/Netlify
work with zero config too.

## What's inside

**Before** — create events from a screenshot (AI parse simulation), URL extraction, or manual
form with AI description writer · privacy modes (Circle / List / Public / Ghost) · pacts
("I'll go if you go" — both auto-RSVP) · Bring-what lists with claiming · weather · pulses
("are we actually doing this?") · calendar with long-press day blocking · friend birthdays +
cards · moods (open / not today / lazy week).

**During** — live Radar (who's there / on the way / home) · Line mode with crowd-sourced queue
levels and "ping me when the door clears" · Tab cost splitting with balances, settle & remind.

**After** — Time Capsules per event: shared photos, sealed predictions revealed after the
night, anonymous exit polls (🔥 😐 💀) · friendship receipts · profile DNA (personal social
season, or venue DNA with analytics in organizer mode) · duplicate successful events.

Plus: Inner Circle / City Pulse feeds, semantic search ("house music this weekend"),
follow graph, notifications, EN/DE, dark/light, person ↔ organizer modes, onboarding for both.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Zustand (persisted) ·
lucide-react. No backend required — the entire product is explorable as a prototype.
