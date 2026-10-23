# Teabox shop

Next.js 16 store with its own UPI payment gateway (TeaPay), admin panel at `/admin`, and a
PostgreSQL database (Prisma).

## Run on your computer

```bash
npm install
npm run dev        # starts the local database, the WhatsApp service and the shop
```

Open http://localhost:3000 for the shop and http://localhost:3000/admin/login for the admin.
Local settings live in `.env` (copy `.env.example` to start).

## Deploy to Vercel

### 1. Create the database (Neon, free)

1. Sign up at https://neon.tech and create a project (region: Singapore or Mumbai).
2. Copy two connection strings from the Neon dashboard:
   - **Pooled** (host contains `-pooler`): for Vercel. Add `&pgbouncer=true` at the end.
   - **Direct** (no `-pooler`): only for step 3 below.

### 2. Add the environment variables on Vercel

Import the project on https://vercel.com/new (root directory: `teabox`), then open
**Project → Settings → Environment Variables** and add:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** URL with `&pgbouncer=true` |
| `NEXT_PUBLIC_APP_URL` | your site address, e.g. `https://teabox.vercel.app` |
| `ADMIN_JWT_SECRET` | long random text (`openssl rand -base64 48`) |
| `ADMIN_DEFAULT_EMAIL` | admin sign-in email |
| `ADMIN_DEFAULT_PASSWORD` | strong admin password (12+ random characters) |
| `CRON_SECRET` | long random text (`openssl rand -hex 32`) |
| `UPI_ID`, `UPI_PAYEE_NAME` | the UPI ID that receives payments, and its name |
| `ADMIN_ORDER_NOTIFICATION_EMAIL` | where new-order emails go |
| `RESEND_API_KEY` **or** `GMAIL_USER` + `GMAIL_APP_PASSWORD` | sends customer sign-in codes and order emails |

Optional: `WHATSAPP_SERVICE_URL` + `WHATSAPP_SERVICE_TOKEN` (checkout WhatsApp codes and
alerts; the service in `whatsapp-service/` must run on an always-on host such as Railway, not
Vercel), and `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (Gmail bank alerts).

### 3. Create the tables (once, and again after schema changes)

Run on your computer with the Neon **direct** URL:

```bash
DATABASE_URL="<neon direct url>" npx prisma db push
DATABASE_URL="<neon direct url>" ADMIN_DEFAULT_PASSWORD="<same as on Vercel>" npm run db:seed
```

The seed adds the products and the admin user.

### 4. Deploy

Click **Deploy** on Vercel (or run `vercel --prod`). After it finishes:

1. Open `https://<your-site>/api/health`: it should say `"status":"ok"`.
2. Sign in at `https://<your-site>/admin/login`.
3. Admin → Payment Gateway: pair the Android phone and connect Gmail if you use them.

## Admin security

- Admin pages and APIs need a signed-in session; sessions last 12 hours.
- 5 wrong passwords from one device lock sign-in for 15 minutes (20 per IP address).
- **Admin → Security** shows every sign-in attempt and has **Sign out all devices**.
- To change the admin password, change `ADMIN_DEFAULT_PASSWORD` on Vercel and redeploy.
- Public order and tracking pages hide the street address, phone, email and UTR.
