<div align="center">


# CausalFunnel Analytics

**Session tracking. Click heatmaps. User journey reconstruction.**  
Built without a single third-party analytics SDK.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

[**Live Demo →**](https://causalfunnel-analytics-demo.vercel.app/) &nbsp;·&nbsp; [Dashboard](https://causalfunnel-analytics-demo.vercel.app/dashboard) &nbsp;·&nbsp; [Demo Page](https://causalfunnel-analytics-demo.vercel.app/demo)

</div>

---

<div align="center">

<img width="985" height="812" alt="image" src="https://github.com/user-attachments/assets/434c0aa0-0645-49f6-a63c-3395c745952a" />


</div>

---

## What this is

A production-grade, full-stack user analytics platform built for the CausalFunnel Full Stack Engineer assignment. Tracks real user sessions, visualizes click heatmaps, and reconstructs user journeys — all without any third-party analytics SDK.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | SSR + API routes in one deploy unit |
| Language | TypeScript 5 | Types shared end-to-end: API → client |
| Database | MongoDB + Mongoose 9 | Compound indexes on hot query paths |
| UI | React 19 + Tailwind v4 | Utility-first, no style drift |
| Animations | Framer Motion 12 | Layout animations, mount/unmount transitions |
| Heatmap | HTML5 Canvas (native) | Renders 2 000 points in one GPU pass |
| Tracker | Vanilla JS — zero deps | Drop-in `<script>` tag, no bundler needed |
| Font | Geist | Designed for data-dense UI |
| Deployment | Vercel + MongoDB Atlas | Serverless-safe connection pooling |

---

## Architecture

```
Browser (any site)
│
│  tracker.js — zero deps, drop-in
│  ├─ session ID persisted to localStorage + Cookie
│  ├─ requestIdleCallback queue (zero main-thread impact)
│  ├─ navigator.sendBeacon on page hide (unload-safe)
│  ├─ 500ms debounce → single batched POST
│  └─ patches pushState + popstate for SPA routes
│
│  POST /api/events  (CORS: *)
▼
Next.js 16 — App Router (serverless functions)
│
├─ /api/events          validate + insertMany (batched)
├─ /api/sessions        $group aggregation, last 500
├─ /api/sessions/[id]   timeline sorted by timestamp
├─ /api/heatmap         click coords, capped 2 000, lean()
├─ /api/pages           distinct page_url values
└─ /api/seed            synthetic data + ensureIndexes
│
▼
MongoDB
  collection: events
  indexes:
    { session_id: 1, timestamp: 1 }   ← session journey
    { page_url: 1, event_type: 1 }    ← heatmap filter
    { timestamp: 1 }                   ← time-range scans
```

---

## Features

### Client-Side Tracker (`public/tracker.js`)

A drop-in, dependency-free tracking script embeddable on any webpage:

```html
<script src="https://your-app.com/tracker.js"
        data-endpoint="https://your-app.com/api/events">
</script>
```

**What it captures:**

| Field | Description |
|---|---|
| `session_id` | Persisted in `localStorage` + Cookie (30-day TTL) |
| `event_type` | `page_view` or `click` |
| `page_url` | Full `window.location.href` |
| `timestamp` | ISO 8601, captured at event time |
| `x`, `y` | Click coordinates (client viewport) |
| `viewport_width/height` | For coordinate scaling in heatmap |
| `user_agent` | Browser UA string |
| `referrer` | Document referrer |

**Performance guarantees:**
- `requestIdleCallback` ensures event capture never blocks the main thread (zero INP/FID impact)
- `navigator.sendBeacon` for unload-safe delivery; XHR fallback for older browsers
- 500ms debounce batching — multiple rapid events are sent in a single HTTP request
- SPA-aware: patches `history.pushState` and listens to `popstate` for seamless Next.js/React Router support

**Manual API:**
```javascript
// Fire a custom event
window.CausalFunnel.track('custom_event', { extra: 'data' });

// Force-flush the queue
window.CausalFunnel.flush();

// Get current session ID
console.log(window.CausalFunnel.sessionId);
```

---

### Backend API

All routes follow a consistent typed response envelope:

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/events` | Ingest single or batched events. Validates schema, rejects unknown `event_type`. |
| `GET` | `/api/sessions` | Aggregated session list (last 500, sorted by `last_seen`). Returns `total_events`, `page_views`, `clicks`, `duration_seconds`, `pages_visited`. |
| `GET` | `/api/sessions/[sessionId]` | Ordered event timeline for a specific session. |
| `GET` | `/api/heatmap?page_url=...` | Click coordinates for a given page (up to 2,000 points). |
| `GET` | `/api/pages` | Distinct page URLs with recorded events. |
| `POST` | `/api/seed` | Populates DB with 15 synthetic sessions and clustered click data for heatmap demo. Also explicitly calls `createIndexes()`. |

CORS is handled at both the middleware layer (`src/middleware.ts`) and the `/api/events` OPTIONS handler — enabling cross-origin tracking from any domain.

---

### Database Schema

```typescript
// src/models/Event.ts
{
  session_id:      String,   // indexed
  event_type:      "page_view" | "click",
  page_url:        String,   // indexed
  timestamp:       Date,     // indexed
  x?:              Number,   // click X (client coords)
  y?:              Number,   // click Y (client coords)
  viewport_width?: Number,   // for coordinate normalization
  viewport_height?: Number,
  user_agent?:     String,
  referrer?:       String,
  metadata?:       Mixed,    // extensible
}

// Compound indexes
{ session_id: 1, timestamp: 1 }  // O(log n) user journey lookups
{ page_url: 1, event_type: 1 }   // instant heatmap filtering
```

---

### Dashboard (`/dashboard`)

Built with React 19 + Tailwind v4 + Framer Motion:

**Sessions View**
- Lists all sessions with event counts, duration, pages visited
- Click any session → expands an ordered event timeline (user journey)
- Relative timestamps ("2 minutes ago"), event-type icons, page path display

**Heatmap View**
- Select any tracked page URL from a dropdown
- Renders click positions on an HTML5 Canvas
- Coordinates are **viewport-normalized**: `x_scaled = point.x / point.viewport_width * canvas.width` — accurate across all screen sizes
- Up to 2,000 data points rendered with radial alpha gradients

---

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas](https://cloud.mongodb.com))

### 1. Clone

```bash
git clone https://github.com/<your-username>/causalfunnel-analytics.git
cd causalfunnel-analytics
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local` in the project root:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/causalfunnel

# Or MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/causalfunnel
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Generate Sample Data

Two options:

**Option A — Dashboard Seed Button**
Navigate to `http://localhost:3000/dashboard` and click **"Seed Database"** (top right). Inserts 15 synthetic sessions with realistic clustered click data.

**Option B — Real Tracking**
Navigate to `http://localhost:3000/demo` and click around. The tracker script fires real `page_view` and `click` events to your local backend.

### 6. Build for Production

```bash
npm run build
npm run start
```

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel --prod
```

Set `MONGODB_URI` in your Vercel project's Environment Variables dashboard.

---

## Project Structure

```
causalfunnel-analytics/
├── public/
│   └── tracker.js              # Drop-in tracking script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── events/route.ts         # POST ingest
│   │   │   ├── sessions/route.ts       # GET all sessions
│   │   │   ├── sessions/[sessionId]/   # GET session timeline
│   │   │   ├── heatmap/route.ts        # GET click coords
│   │   │   ├── pages/route.ts          # GET distinct URLs
│   │   │   └── seed/route.ts           # POST seed data
│   │   ├── dashboard/page.tsx          # Analytics dashboard
│   │   ├── demo/page.tsx               # Instrumented demo page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── SessionsView.tsx            # Session list + journey
│   │   ├── HeatmapView.tsx             # Canvas heatmap
│   │   └── AnimatedFeatures.tsx        # Landing page animations
│   ├── lib/
│   │   └── mongodb.ts                  # Connection pool + error helpers
│   ├── models/
│   │   └── Event.ts                    # Mongoose schema + compound indexes
│   ├── types/
│   │   └── index.ts                    # Shared TypeScript interfaces
│   └── middleware.ts                   # CORS headers for /api/*
├── .env.local                          # (gitignored) — add MONGODB_URI
├── next.config.ts
├── tsconfig.json
└── vercel.json
```

---

## Design Decisions & Trade-offs

### Session Persistence: `localStorage` + Cookie

Using both storage mechanisms is intentional. `localStorage` is the primary store (reliable, inspectable via DevTools). The cookie is a fallback for contexts where `localStorage` is restricted (e.g., private browsing on Safari with ITP). This dual-write pattern maximizes session continuity without requiring a server-side session.

**Trade-off accepted:** Not using `HttpOnly` cookies means the session ID is readable by JS. For a telemetry ID (not authentication), this is the correct trade-off — it enables the `window.CausalFunnel.sessionId` API.

### NoSQL over Relational for Event Storage

MongoDB absorbs high-frequency write bursts without locking. Event data is naturally document-shaped (varying fields per event type: clicks have `x/y`, page views don't). The `metadata: Mixed` field allows schema extension without migrations.

**Trade-off accepted:** MongoDB requires careful index design to avoid collection scans. Mitigated with explicit compound indexes on the two hottest query patterns.

### HTML5 Canvas for Heatmap

Rendering 2,000 DOM elements as individual `<div>` dots would trigger 2,000 layout/paint operations. A single `<canvas>` renders them all in one GPU-accelerated pass. The implementation uses radial gradients (`arc` + `fillStyle` with alpha) for a density-accurate visual.

**Trade-off accepted:** Canvas content is not accessible to screen readers. For an internal analytics tool, this is acceptable.

### Coordinate Normalization

Raw click coordinates are captured in the user's viewport space. Since analysts' screens differ from the user's screen, the heatmap normalizes coordinates at render time:

```
scaled_x = (raw_x / captured_viewport_width) * canvas_width
scaled_y = (raw_y / captured_viewport_height) * canvas_height
```

This ensures the heatmap is accurate regardless of the dashboard user's screen resolution.

### MongoDB Connection Pooling in Serverless

Next.js serverless functions are stateless — each invocation would open a new DB connection without caching. `src/lib/mongodb.ts` stores the connection promise on `global.__mongoose`, so warm Lambda/V8 isolates reuse the existing connection. Cold starts create one connection per isolate, not one per request.

---

## API Reference

### `POST /api/events`

Accepts single event or array. All fields below except starred are optional.

```json
{
  "session_id": "cf_abc123*",
  "event_type": "click | page_view*",
  "page_url": "https://example.com/pricing*",
  "timestamp": "2025-06-20T10:30:00.000Z",
  "x": 640,
  "y": 380,
  "viewport_width": 1440,
  "viewport_height": 900,
  "user_agent": "Mozilla/5.0...",
  "referrer": "https://google.com"
}
```

Response `201`:
```json
{ "success": true, "data": { "inserted": 1 } }
```

### `GET /api/sessions`

```json
{
  "success": true,
  "data": [
    {
      "session_id": "cf_abc123",
      "total_events": 14,
      "page_views": 3,
      "clicks": 11,
      "first_seen": "2025-06-19T08:00:00.000Z",
      "last_seen": "2025-06-19T08:12:30.000Z",
      "pages_visited": ["/", "/pricing", "/demo"],
      "duration_seconds": 750
    }
  ]
}
```

### `GET /api/heatmap?page_url=https://example.com/demo`

```json
{
  "success": true,
  "data": [
    { "x": 640, "y": 520, "timestamp": "...", "viewport_width": 1440, "viewport_height": 900 }
  ]
}
```

---


## License

MIT License © 2026 Manish Kumar
