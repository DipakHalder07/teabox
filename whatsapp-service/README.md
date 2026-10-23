# TeaPay WhatsApp service

Keeps the shop's WhatsApp logged in (like WhatsApp Web) and sends the checkout verification
codes. It must run all the time, so it cannot run on Vercel.

> Uses WhatsApp Web linking, which WhatsApp does not officially support. Use a spare number if
> you can: WhatsApp may block numbers that send automated messages. If the service is down or
> logged out, checkout simply skips the code; payments keep working.

## On your computer

From the `teabox` folder:

```bash
npm run dev   # database + this service + the shop (installs this service on first run)
```

Then open **Admin → Payment Gateway** and scan the QR with WhatsApp
(**Settings → Linked devices → Link a device**).

## Online for free: Render

The free plan sleeps after 15 minutes without visitors and wipes its disk on restart. The
service handles both: it keeps the WhatsApp login in the shop's database and calls its own
`/health` every 10 minutes so it stays awake.

1. Push the shop to GitHub, then on https://render.com choose **New → Blueprint** and pick the
   repo. Render reads `render.yaml` and creates `teabox-whatsapp` (free, Singapore).
2. When asked for `WHATSAPP_SESSION_DB_URL`, paste the Neon **direct** connection string: in
   Vercel → Settings → Environment Variables, copy the value of `DATABASE_URL_UNPOOLED`
   (no `-pooler` in it, and no `&pgbouncer=true`).
3. After it deploys, copy from Render: the service address (`https://teabox-whatsapp.onrender.com`)
   and the generated `WHATSAPP_SERVICE_TOKEN` (Environment tab).
4. In Vercel, set `WHATSAPP_SERVICE_URL` to that address and `WHATSAPP_SERVICE_TOKEN` to the same
   token, then redeploy the shop.
5. Scan the QR in **Admin → Payment Gateway**.

Free plan limits: 750 hours a month, enough for this one service running all month (do not run
a second free Render service). A Render restart reconnects by itself; no new scan is needed.

## Paid / other hosts (Railway, a VPS, …)

1. Deploy this folder (it has a `Dockerfile`).
2. Either mount a **Volume** at `/app/auth`, or set `WHATSAPP_SESSION_DB_URL` as above.
3. Set `WHATSAPP_SERVICE_TOKEN` to a long random value and give the service a public https address.
4. In Vercel, set `WHATSAPP_SERVICE_URL` and `WHATSAPP_SERVICE_TOKEN`, redeploy, and scan the QR.

## API (all except `/health` need `Authorization: Bearer <WHATSAPP_SERVICE_TOKEN>`)

| Method | Path            | Purpose                                   |
| ------ | --------------- | ----------------------------------------- |
| GET    | `/health`       | Liveness check                            |
| GET    | `/status`       | `connected`, `phone`, login `qrDataUrl`   |
| POST   | `/qr`           | Fresh login QR                            |
| POST   | `/pairing-code` | `{ phone }` → 8-character link code       |
| POST   | `/send`         | `{ to, text }` (max 20/min, 500/day)      |
| POST   | `/logout`       | Unlink and show a new QR                  |
