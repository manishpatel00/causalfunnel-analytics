# CausalFunnel Analytics

An advanced, full-stack, Next.js-powered user analytics application. This project was engineered to deliver scalable, real-time user session tracking and high-fidelity data visualization (Heatmaps & Session Journeys).

## 🚀 Features

- **Real-Time Event Tracking:** Client-side asynchronous tracking script (`tracker.js`) capturing page views, clicks, timestamps, and viewport data without impacting main thread performance.
- **Advanced Dashboard:** A premium, Next.js / MagicUI-inspired dark mode interface with glassmorphism, pure CSS tech-grid patterns, and high-performance React components.
- **Session Intelligence:** Detailed user journey recreation. View exactly when and where a user clicked, including CSS selectors and element IDs.
- **Heatmap Generation:** Visual overlays demonstrating click-density across specified URLs using HTML5 Canvas.
- **Scalable Architecture:** Next.js App Router, highly optimized API routes, and MongoDB aggregation pipelines.

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4, custom MagicUI patterns
- **Database:** MongoDB (Native NodeJS Driver for optimal performance)
- **Tracking:** Vanilla JS injected client-side script (`public/tracker.js`)

## 📦 Setup & Local Development

1. **Clone & Install**
   ```bash
   git clone https://github.com/manishpatel00/causalfunnel-analytics.git
   cd causalfunnel-analytics
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/causalfunnel
   # Or use a MongoDB Atlas URI for cloud deployments
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000/dashboard`.

4. **Seed Sample Data (Optional)**
   Click the "Load Sample Data" button in the dashboard header to populate MongoDB with synthetic session data.

## 🧠 Architecture & Trade-offs

### 1. Tracking Script Implementation
**Approach:** Built a lightweight, dependency-free vanilla JS script (`tracker.js`).
**Trade-off:** We rely on `localStorage` for cross-page session persistence instead of HttpOnly cookies. This avoids complex cross-domain cookie configurations for a simple demo but sacrifices some security against XSS. 
**Optimization:** Events are dispatched asynchronously using `fetch` to ensure tracking requests do not block the page unload or First Input Delay (FID).

### 2. Database Selection (MongoDB)
**Approach:** Using a NoSQL document database.
**Trade-off:** Analytics data is inherently unstructured and high-volume. MongoDB is perfectly suited for fast write-heavy workloads (events). Relational integrity (SQL) isn't strictly necessary here. Aggregation pipelines are used to group events into distinct sessions efficiently.

### 3. Rendering Strategy
**Approach:** Dynamic client-side rendering for the dashboard (`next/dynamic` with `ssr: false` for canvas elements).
**Trade-off:** The heatmap relies heavily on the `window` object and HTML5 canvas APIs, making SSR impossible. By dynamically importing these components, we prevent hydration mismatches and reduce the initial server bundle size.

## 🚢 Deployment

This application is configured for seamless deployment on **Vercel**. Ensure that you provide a remote `MONGODB_URI` (like MongoDB Atlas) in your Vercel Environment Variables to allow the serverless functions to connect to your database.
