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

## Online (for the shop on Vercel), e.g. Railway

1. Create a new Railway project from this `whatsapp-service` folder (it has a `Dockerfile`).
2. Add a **Volume** mounted at `/app/auth` (keeps the WhatsApp login after restarts).
3. Set the variable `WHATSAPP_SERVICE_TOKEN` to a long random value.
4. Generate a public domain for the service.
5. In Vercel, set `WHATSAPP_SERVICE_URL` to that domain (https://…) and
   `WHATSAPP_SERVICE_TOKEN` to the same value, then redeploy the shop.
6. Scan the QR in **Admin → Payment Gateway**.

Any always-on host works the same way (a VPS, Fly.io, Render paid plan). Free plans that
sleep when idle will log WhatsApp out.

## API (all except `/health` need `Authorization: Bearer <WHATSAPP_SERVICE_TOKEN>`)

| Method | Path            | Purpose                                   |
| ------ | --------------- | ----------------------------------------- |
| GET    | `/health`       | Liveness check                            |
| GET    | `/status`       | `connected`, `phone`, login `qrDataUrl`   |
| POST   | `/qr`           | Fresh login QR                            |
| POST   | `/pairing-code` | `{ phone }` → 8-character link code       |
| POST   | `/send`         | `{ to, text }` (max 20/min, 500/day)      |
| POST   | `/logout`       | Unlink and show a new QR                  |
