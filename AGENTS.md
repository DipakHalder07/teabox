<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TEABOX / DEMOBOX — AI AGENT GUIDELINES & RESTRICTIONS

> **CRITICAL NOTICE FOR ALL AI AGENTS & CODING ASSISTANTS:**
> Read and strictly follow the boundaries below before making any modifications to this codebase. These rules are finalized by the store owner and must NOT be violated.

---

## 🚫 STRICT BOUNDARIES & RESTRICTIONS (DO NOT TOUCH)

### 1. 🎨 Frontend Design & Aesthetics (LOCKED)
* **DO NOT change, redesign, or alter the UI/UX design, layout, styling, themes, or color palette.**
* The visual identity (dark green `#0e1d15`, `#162a20`, accent `#02cb5a`, custom fonts, animations, and typography) is finalized.
* Component structures, cards, headers, footers, checkout modals, and storefront pages must preserve their existing styling and responsiveness.

### 2. 🗄️ Database & Schema Protection (LOCKED)
* **DO NOT drop, wipe, reset, or destructively alter existing database tables or Prisma models.**
* You are connected to **Neon Serverless PostgreSQL** through PgBouncer.
* **Connection Pool Integrity**: Always preserve the connection parameters configured in `lib/prisma.ts`:
  * `pgbouncer=true`
  * `connect_timeout=30` (Neon cold starts take 5–15 seconds to wake up)
  * `connection_limit=20` (prevents Prisma `P2024` connection pool exhaustion)
  * `pool_timeout=20`
* For database schema updates, always use `DATABASE_URL_UNPOOLED` with `connect_timeout=30` (see `scripts/vercel-build.mjs`).

### 3. 💬 WhatsApp Integration (DO NOT MODIFY)
* **DO NOT touch or modify WhatsApp configuration, endpoints, or environment variables.**
* The store owner has already configured the production WhatsApp service and environment variables in Vercel. Leave all WhatsApp service and webhook routes intact as-is.

### 4. 🧭 Admin Navigation & Tab Structure
* **"Abandoned Checkouts" must NEVER be added to the main sidebar navigation menu.**
* Abandoned checkouts is strictly a sub-tab located under the **Orders** section:
  * `/admin/orders` → Tab 1: Orders, Tab 2: Abandoned Checkouts
  * `/admin/abandoned-checkouts` → Tab 1: Orders, Tab 2: Abandoned Checkouts
* The primary sidebar navigation in `components/admin/AdminShell.tsx` must keep Orders highlighted when browsing abandoned checkouts.

---

## ⚙️ CORE ARCHITECTURE & STABLE CONVENTIONS

### 1. 🛡️ Admin Authentication & Session
* Admin session uses an `HttpOnly`, `SameSite: Lax`, `Secure` cookie named `teabox_admin_session`.
* Duration: **30 days (`ADMIN_SESSION_DAYS = 30`)**. Persistent across browser restarts.
* Next.js Edge proxy middleware in `proxy.ts` verifies tokens using **in-memory HS256 JWT** without database roundtrips.
* Authenticated admins visiting `/admin/login` are automatically redirected straight to `/admin`.
* Admin email is preserved in `localStorage` (`teabox_admin_saved_email`) with a "Remember Me" toggle.

### 2. ⚡ Polling Protection & In-Flight Guards
* Polling routes (such as `/api/admin/gateway/live` and `/api/admin/gateway/overview`) must **ALWAYS** have:
  1. `inFlight` ref protection on the frontend (e.g. `if (inFlight.current) return;`) to prevent concurrent overlapping fetches from stacking up ("request stampedes").
  2. Short server-side in-memory caching (`3.5s` TTL) in route handlers to serve rapid polls with zero database overhead.
  3. Safe try/catch fallbacks so database cold-start latency never throws 500 errors.

### 3. 🖼️ Dynamic Image Loading
* External or user-uploaded product thumbnails (e.g. Unsplash or external CDN URLs) in admin tables and abandoned checkout drawers should use native `<img loading="lazy" decoding="async" />` instead of `<Image />` to prevent unconfigured hostname runtime errors.

### 4. 🛒 Storefront Cart Persistence
* Customer cart uses Zustand with `localStorage` persistence under `teabox_cart_storage`.
* Multi-tab sync is handled automatically via `lib/store/cartSync.ts`.
* Abandoned checkout sessions are debounced and recorded via `POST /api/checkout/abandoned` only when proceeding past step 1 of checkout.
* Recovery links use `?recover=<token>` to restore the customer's cart, coupon, and shipping details with a 1-click welcome banner.

---

## 🛠️ CODE VERIFICATION REQUIREMENT
* Before completing any task, ALWAYS run:
  ```bash
  npx tsc --noEmit
  ```
* All code must compile with **0 errors**. Never leave unresolved type errors or broken imports.

