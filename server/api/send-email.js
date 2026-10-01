// ═══════════════════════════════════════════════════════════════════════
// Zenith Pranavi — Email Sender (Vercel Serverless Function)
// ═══════════════════════════════════════════════════════════════════════
// Uses Resend (https://resend.com) — free tier: 3,000 emails/month.
//
// SETUP (one-time):
//   1. Sign up at https://resend.com and verify a domain (e.g. zped.org).
//      (For testing you can use the built-in onboarding@resend.dev sender.)
//   2. Create an API key.
//   3. In Vercel → Project → Settings → Environment Variables, add:
//        RESEND_API_KEY   = re_xxx...
//        EMAIL_FROM       = "Zenith Pranavi <noreply@zped.org>"   (or onboarding@resend.dev)
//        ADMIN_EMAIL      = zenithpranavi786@gmail.com
//   4. Redeploy the project.
//
// If RESEND_API_KEY is missing the function falls back to a no-op 200 so
// the UI flow never breaks in local/dev environments.
// ═══════════════════════════════════════════════════════════════════════

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

// ── CORS helper ────────────────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// ── Basic HTML escape ──────────────────────────────────────────────────
function esc(s) {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── Shared email wrapper ───────────────────────────────────────────────
function wrap(title, body) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f3ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2a2a2a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f3ec;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <tr><td style="background:linear-gradient(135deg,#1a2542 0%,#2b3a5c 100%);padding:28px 32px;text-align:center;">
            <div style="color:#c5a55a;font-size:12px;letter-spacing:3px;font-weight:700;text-transform:uppercase;margin-bottom:6px;">Zenith Pranavi</div>
            <div style="color:#ffffff;font-size:22px;font-weight:700;">${esc(title)}</div>
          </td></tr>
          <tr><td style="padding:32px;font-size:15px;line-height:1.6;color:#2a2a2a;">${body}</td></tr>
          <tr><td style="background:#f7f3ec;padding:20px 32px;text-align:center;font-size:12px;color:#7a7a7a;border-top:1px solid #e7e0d1;">
            <div style="margin-bottom:4px;">&copy; ${new Date().getFullYear()} Zenith Pranavi Education</div>
            <div><a href="https://zped.org" style="color:#c5a55a;text-decoration:none;">zped.org</a> &middot; Where Every Child Reaches Their Zenith</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

// ── Booking confirmation (student) ─────────────────────────────────────
function bookingConfirmationEmail({ studentName, subject, yearGroup, date, time, price, googleMeet }) {
  const body = `
    <p>Hi ${esc(studentName)},</p>
    <p>Thanks for booking a session with <strong>Zenith Pranavi</strong>. Your request has been received and is currently <strong style="color:#c5a55a;">pending confirmation</strong> from our team.</p>
    <table cellspacing="0" cellpadding="10" style="width:100%;background:#faf7f0;border:1px solid #e7e0d1;border-radius:12px;margin:16px 0;">
      <tr><td style="font-weight:600;width:140px;color:#7a7a7a;">Subject</td><td>${esc(subject)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Year Group</td><td>${esc(yearGroup)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Date</td><td>${esc(date)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Time</td><td>${esc(time)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Rate</td><td>$${esc(price)}/hour</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Google Meet</td><td>${googleMeet ? 'Requested — link will follow' : 'Not requested'}</td></tr>
    </table>
    <p>We'll email you again once the booking is confirmed${googleMeet ? ' along with your Google Meet link' : ''}.</p>
    <p style="margin-top:24px;">Warmly,<br/><strong>The Zenith Pranavi Team</strong></p>
  `
  return { subject: `Booking received — ${subject} on ${date}`, html: wrap('Booking Received', body) }
}

// ── Admin notification for new booking ─────────────────────────────────
function bookingAdminEmail({ studentName, studentEmail, subject, yearGroup, date, time, price, googleMeet }) {
  const body = `
    <p><strong>New booking received</strong></p>
    <table cellspacing="0" cellpadding="10" style="width:100%;background:#faf7f0;border:1px solid #e7e0d1;border-radius:12px;margin:16px 0;">
      <tr><td style="font-weight:600;width:140px;color:#7a7a7a;">Student</td><td>${esc(studentName)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Email</td><td>${esc(studentEmail)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Year Group</td><td>${esc(yearGroup)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Subject</td><td>${esc(subject)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Date</td><td>${esc(date)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Time</td><td>${esc(time)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Rate</td><td>$${esc(price)}/hour</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Google Meet</td><td>${googleMeet ? 'Yes — needs link' : 'No'}</td></tr>
    </table>
    <p>Log in to the <a href="https://zped.org" style="color:#c5a55a;">admin panel</a> to confirm this booking.</p>
  `
  return { subject: `[Admin] New booking — ${studentName} (${subject})`, html: wrap('New Booking', body) }
}

// ── Booking status update (confirmed / cancelled / completed) ──────────
function bookingStatusEmail({ studentName, subject, date, time, status, meetLink }) {
  const statusLabel = {
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    pending: 'Pending'
  }[status] || status

  const statusColor = {
    confirmed: '#2e7d32',
    cancelled: '#c62828',
    completed: '#1565c0',
    pending: '#c5a55a'
  }[status] || '#c5a55a'

  const intro = {
    confirmed: 'Great news — your session has been <strong>confirmed</strong>.',
    cancelled: 'Your session has been <strong>cancelled</strong>. If this is a mistake or you\'d like to rebook, please reply to this email.',
    completed: 'Your session has been marked as <strong>completed</strong>. We hope it was valuable!',
    pending: 'Your booking is currently pending confirmation.'
  }[status] || 'There has been an update to your booking.'

  const meetBlock = meetLink
    ? `<p style="margin:16px 0;"><a href="${esc(meetLink)}" style="display:inline-block;background:#c5a55a;color:#1a2542;font-weight:700;padding:12px 22px;border-radius:10px;text-decoration:none;">Join Google Meet</a></p>
       <p style="font-size:13px;color:#7a7a7a;">Or copy this link: ${esc(meetLink)}</p>`
    : ''

  const body = `
    <p>Hi ${esc(studentName)},</p>
    <p>${intro}</p>
    <table cellspacing="0" cellpadding="10" style="width:100%;background:#faf7f0;border:1px solid #e7e0d1;border-radius:12px;margin:16px 0;">
      <tr><td style="font-weight:600;width:140px;color:#7a7a7a;">Subject</td><td>${esc(subject)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Date</td><td>${esc(date)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Time</td><td>${esc(time)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Status</td><td><span style="color:${statusColor};font-weight:700;">${esc(statusLabel)}</span></td></tr>
    </table>
    ${meetBlock}
    <p style="margin-top:24px;">Warmly,<br/><strong>The Zenith Pranavi Team</strong></p>
  `
  return { subject: `Session ${statusLabel} — ${subject} on ${date}`, html: wrap(`Session ${statusLabel}`, body) }
}

// ── Google Meet link email ─────────────────────────────────────────────
function meetLinkEmail({ studentName, subject, date, time, meetLink }) {
  const body = `
    <p>Hi ${esc(studentName)},</p>
    <p>Your Google Meet link for the upcoming session is ready.</p>
    <table cellspacing="0" cellpadding="10" style="width:100%;background:#faf7f0;border:1px solid #e7e0d1;border-radius:12px;margin:16px 0;">
      <tr><td style="font-weight:600;width:140px;color:#7a7a7a;">Subject</td><td>${esc(subject)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Date</td><td>${esc(date)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Time</td><td>${esc(time)}</td></tr>
    </table>
    <p style="margin:20px 0;"><a href="${esc(meetLink)}" style="display:inline-block;background:#c5a55a;color:#1a2542;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;">Join Google Meet</a></p>
    <p style="font-size:13px;color:#7a7a7a;">Or copy this link: ${esc(meetLink)}</p>
    <p style="margin-top:24px;">Warmly,<br/><strong>The Zenith Pranavi Team</strong></p>
  `
  return { subject: `Your Google Meet link — ${subject} on ${date}`, html: wrap('Google Meet Link Ready', body) }
}

// ── Enquiry confirmation (user) ────────────────────────────────────────
function enquiryConfirmationEmail({ name, message }) {
  const body = `
    <p>Hi ${esc(name)},</p>
    <p>Thanks for reaching out to <strong>Zenith Pranavi</strong>. We've received your message and a member of our team will reply within 24 hours.</p>
    <blockquote style="background:#faf7f0;border-left:3px solid #c5a55a;padding:12px 16px;border-radius:8px;margin:16px 0;color:#555;">
      ${esc(message).replace(/\n/g, '<br/>')}
    </blockquote>
    <p style="margin-top:24px;">Warmly,<br/><strong>The Zenith Pranavi Team</strong></p>
  `
  return { subject: 'We received your enquiry', html: wrap('Enquiry Received', body) }
}

// ── Admin notification for new enquiry ─────────────────────────────────
function enquiryAdminEmail({ name, email, message }) {
  const body = `
    <p><strong>New enquiry received</strong></p>
    <table cellspacing="0" cellpadding="10" style="width:100%;background:#faf7f0;border:1px solid #e7e0d1;border-radius:12px;margin:16px 0;">
      <tr><td style="font-weight:600;width:100px;color:#7a7a7a;">Name</td><td>${esc(name)}</td></tr>
      <tr><td style="font-weight:600;color:#7a7a7a;">Email</td><td>${esc(email)}</td></tr>
    </table>
    <blockquote style="background:#faf7f0;border-left:3px solid #c5a55a;padding:12px 16px;border-radius:8px;margin:16px 0;color:#555;">
      ${esc(message).replace(/\n/g, '<br/>')}
    </blockquote>
  `
  return { subject: `[Admin] New enquiry from ${name}`, html: wrap('New Enquiry', body) }
}

// ── Dispatch table ─────────────────────────────────────────────────────
function buildEmail(type, data) {
  switch (type) {
    case 'booking_confirmation': return bookingConfirmationEmail(data)
    case 'booking_admin':         return bookingAdminEmail(data)
    case 'booking_status':        return bookingStatusEmail(data)
    case 'meet_link':             return meetLinkEmail(data)
    case 'enquiry_confirmation':  return enquiryConfirmationEmail(data)
    case 'enquiry_admin':         return enquiryAdminEmail(data)
    default: return null
  }
}

// ── Send via Resend ────────────────────────────────────────────────────
async function sendViaResend({ from, to, subject, html, apiKey }) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html })
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${text}`)
  }
  try { return JSON.parse(text) } catch { return { raw: text } }
}

// ── Main handler ───────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.RESEND_API_KEY
  const fromAddr = process.env.EMAIL_FROM || 'Zenith Pranavi <onboarding@resend.dev>'
  const adminEmail = process.env.ADMIN_EMAIL || 'zenithpranavi786@gmail.com'

  // If not configured, don't fail the user flow — just skip silently.
  if (!apiKey) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'RESEND_API_KEY not set — email skipped. See api/send-email.js for setup.'
    })
  }

  let payload = req.body
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) } catch { payload = {} }
  }
  payload = payload || {}

  const { type, to, data } = payload
  if (!type || !data) return res.status(400).json({ error: 'Missing type or data' })

  const email = buildEmail(type, data)
  if (!email) return res.status(400).json({ error: `Unknown email type: ${type}` })

  // Admin-routed types always go to ADMIN_EMAIL; others need an explicit "to"
  const recipient = (type === 'booking_admin' || type === 'enquiry_admin') ? adminEmail : to
  if (!recipient) return res.status(400).json({ error: 'Missing recipient "to"' })

  try {
    const result = await sendViaResend({
      from: fromAddr,
      to: recipient,
      subject: email.subject,
      html: email.html,
      apiKey
    })
    return res.status(200).json({ ok: true, id: result?.id || null })
  } catch (err) {
    // Never crash the UI — log and return 200 with error info
    console.error('[send-email] failed:', err.message)
    return res.status(200).json({ ok: false, error: err.message })
  }
}
