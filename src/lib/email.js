// ═══════════════════════════════════════════════════════════════════════
// Client-side email dispatcher
// Calls the /api/send-email Vercel serverless function.
// Fails silently (logs to console) so UI flows are never blocked by email.
// ═══════════════════════════════════════════════════════════════════════

const ENDPOINT = '/api/send-email'

async function send(type, { to, data }) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to, data })
    })
    const json = await res.json().catch(() => ({}))
    if (!json.ok) {
      // eslint-disable-next-line no-console
      console.warn('[email] non-ok response:', json)
    }
    return json
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[email] send failed:', err?.message || err)
    return { ok: false, error: err?.message || String(err) }
  }
}

// Fire-and-forget helpers — never await these in UI critical paths unless needed
export const sendBookingConfirmation = (to, data) =>
  send('booking_confirmation', { to, data })

export const sendBookingAdminNotification = (data) =>
  send('booking_admin', { data })

export const sendBookingStatusUpdate = (to, data) =>
  send('booking_status', { to, data })

export const sendMeetLinkEmail = (to, data) =>
  send('meet_link', { to, data })

export const sendEnquiryConfirmation = (to, data) =>
  send('enquiry_confirmation', { to, data })

export const sendEnquiryAdminNotification = (data) =>
  send('enquiry_admin', { data })
