# TEABOX / DEMOBOX — AI RULES & PROJECT INSTRUCTIONS

> **MANDATORY INSTRUCTIONS FOR GEMINI / ANTIGRAVITY AI AGENTS:**
> This repository is a production-ready Next.js 16 (App Router) + Tailwind CSS v4 + Prisma ORM (Neon PostgreSQL) e-commerce application. Follow all instructions below strictly.

---

## 🚫 1. STRICT RESTRICTIONS (DO NOT TOUCH OR MODIFY)

### 🎨 Frontend Design & Aesthetics (LOCKED)
* **DO NOT touch or redesign the frontend UI/UX, layouts, colors, typography, or styling.**
* The Demobox / Teabox design identity (dark forest green aesthetic, luxury gold/green accents, custom fonts, animations, card styles, and responsiveness) is finalized.
* Leave all styling, Tailwind classes, and page structures intact.

### 🗄️ Database & Schema Protection (LOCKED)
* **DO NOT delete, reset, drop, or alter existing Prisma tables or schema definitions.**
* Database: Neon Serverless PostgreSQL with PgBouncer.
* Always preserve connection configurations in `lib/prisma.ts`:
  * `pgbouncer=true`
  * `connect_timeout=30` (Neon cold starts take 5–15 seconds to wake up)
  * `connection_limit=20` (prevents Prisma `P2024` connection pool exhaustion)
  * `pool_timeout=20`
* For schema migrations, `scripts/vercel-build.mjs` uses `DATABASE_URL_UNPOOLED` with `connect_timeout=30`.

### 💬 WhatsApp Integration (DO NOT MODIFY)
* **DO NOT touch or change WhatsApp files, webhook handlers, or environment settings.**
* WhatsApp configuration and environment variables are already deployed and managed directly in Vercel.

### 🧭 Admin Menu Navigation Structure
* **"Abandoned Checkouts" must NEVER be placed in the primary sidebar navigation.**
* Abandoned checkouts is strictly a sub-tab under **Orders**:
  * Switching between `[ Orders ]` and `[ Abandoned Checkouts ]` is done via the tabs header on `/admin/orders` and `/admin/abandoned-checkouts`.
  * The main sidebar navigation in `components/admin/AdminShell.tsx` keeps "Orders" highlighted when viewing abandoned checkouts.

---

## ⚙️ 2. ESTABLISHED ARCHITECTURE & CONVENTIONS

### 🛡️ Admin Session & Authentication
* Admin auth cookie: `teabox_admin_session` (`httpOnly: true`, `sameSite: "lax"`, `path: "/"`).
* Session duration: **30 days (`ADMIN_SESSION_DAYS = 30`)**. Persistent across browser restarts.
* Edge proxy in `proxy.ts` verifies tokens using in-memory **HS256 JWT** (0 database roundtrips).
* Logged-in admins visiting `/admin/login` are automatically redirected to `/admin`.
* Admin email is cached in `localStorage` (`teabox_admin_saved_email`) with a "Remember Me" toggle.

### ⚡ Polling Protection & Database Health
* All high-frequency pollers (such as `/api/admin/gateway/live` and `/api/admin/gateway/overview`) must:
  1. Use `inFlight` ref guards on the client (prevents overlapping requests from stacking up).
  2. Use server-side in-memory caching (`3.5s` TTL) in the route handler.
  3. Include try-catch fallbacks to prevent 500 errors during database wake-up.

### 🖼️ Image Rendering
* For cart thumbnails and user/external URLs, use native `<img loading="lazy" decoding="async" />` instead of Next `<Image />` to prevent unconfigured host runtime exceptions.

### 🛒 Abandoned Checkout System (Shopify-Style)
* Tracked via `POST /api/checkout/abandoned` when customer clicks "Proceed to Payment" in Step 1.
* Restores cart and checkout details via `?recover=<token>` with 1-click welcome banner.
* Auto-marked as recovered when the customer completes payment in `lib/ordersDb.ts` and `lib/gateway/payments.ts`.

---

## 🛠️ 3. QUALITY ASSURANCE COMMAND
Always verify TypeScript compilation before finishing any task:
```bash
npx tsc --noEmit
```
This must exit with code 0.
