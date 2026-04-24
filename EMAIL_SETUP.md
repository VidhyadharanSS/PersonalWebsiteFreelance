# Email Confirmation Setup

The site sends transactional emails via a Vercel serverless function
(`/api/send-email.js`) using [Resend](https://resend.com) as the provider.

Emails are sent for:

| Event                                   | To                      |
| --------------------------------------- | ----------------------- |
| New booking created                     | Student (confirmation)  |
| New booking created                     | Admin (notification)    |
| Booking status changed (confirm/cancel/complete) | Student          |
| Google Meet link added by admin         | Student                 |
| New enquiry submitted                   | Enquirer (confirmation) |
| New enquiry submitted                   | Admin (notification)    |

All email sends are **fire-and-forget** — if the email service is not
configured or temporarily fails, the booking/enquiry still succeeds.

---

## One-time setup

1. **Create a Resend account** — https://resend.com (free tier: 3,000/month).
2. **Verify a sending domain** (recommended: `zped.org`). Resend will guide
   you through adding the DNS records. For quick testing, you can use the
   built-in sender `onboarding@resend.dev` without verification.
3. **Create an API key** in the Resend dashboard.
4. **Add environment variables in Vercel**
   (Project → Settings → Environment Variables):

   ```
   RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM     = Zenith Pranavi <noreply@zped.org>
   ADMIN_EMAIL    = zenithpranavi786@gmail.com
   ```

   > If you haven't verified a domain yet, use
   > `EMAIL_FROM = Zenith Pranavi <onboarding@resend.dev>`.

5. **Redeploy** the project (Vercel → Deployments → Redeploy).

That's it — emails will start flowing automatically.

---

## Database migration (one-time)

The bookings table now stores `student_email` so admin actions can email
the student back. If you have an existing Supabase DB, run:

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS student_email TEXT DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_notes   TEXT DEFAULT NULL;
```

New bookings will automatically populate this column.

---

## Local development

The serverless function only runs on Vercel (or `vercel dev`). Without it,
`fetch('/api/send-email')` returns 404 — that's fine, it's caught and
silently logged so your UI flow is not affected.

To test locally with emails enabled:

```bash
npm i -g vercel
vercel dev
```

This exposes `/api/send-email` alongside the Vite dev server.

---

## Troubleshooting

- **No emails received, no errors** — check that `RESEND_API_KEY` is set
  and the project has been redeployed after adding it.
- **"Domain not verified" from Resend** — either verify the domain in
  Resend or switch `EMAIL_FROM` to `onboarding@resend.dev`.
- **Admin emails missing** — confirm `ADMIN_EMAIL` in Vercel env vars.
- **Emails land in spam** — verify the domain in Resend and set up SPF/DKIM
  as prompted.
