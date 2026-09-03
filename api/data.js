import { randomUUID } from 'node:crypto'
import { execute, query } from './lib/database.js'
import { requireAdmin, requireUser } from './lib/auth.js'

const BOOKING_STATUSES = new Set(['pending', 'confirmed', 'completed', 'cancelled'])

function bodyOf(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  return req.body || {}
}

async function rowById(table, id) {
  const rows = await query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id])
  return rows[0] || null
}

function requireFields(data, fields) {
  const missing = fields.filter(field => data[field] === undefined || data[field] === null || data[field] === '')
  if (missing.length) throw Object.assign(new Error(`Missing fields: ${missing.join(', ')}`), { status: 400 })
}

async function handlePublic(operation, payload) {
  if (operation !== 'submitEnquiry') return undefined
  requireFields(payload, ['name', 'email', 'message'])
  const id = randomUUID()
  await execute(
    'INSERT INTO enquiries (id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)',
    [id, payload.name, payload.email, payload.phone || null, payload.message]
  )
  return rowById('enquiries', id)
}

async function handleUser(operation, payload, user) {
  if (operation === 'createBooking') {
    requireFields(payload, ['tutor_name', 'subject', 'booking_date', 'booking_time'])
    const id = randomUUID()
    await execute(
      `INSERT INTO bookings
        (id, user_id, student_name, student_email, tutor_name, subject, booking_date, booking_time, price, google_meet)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, user.name, user.email, payload.tutor_name, payload.subject, payload.booking_date,
        payload.booking_time, Number(payload.price) || 0, payload.google_meet ? 1 : 0]
    )
    return rowById('bookings', id)
  }
  if (operation === 'fetchUserBookings') {
    return query('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC', [user.id])
  }
  if (operation === 'submitSessionReview') {
    requireFields(payload, ['booking_id', 'rating'])
    const booking = await query('SELECT id FROM bookings WHERE id = ? AND user_id = ?', [payload.booking_id, user.id])
    if (!booking.length) throw Object.assign(new Error('Booking not found'), { status: 404 })
    const id = randomUUID()
    await execute(
      'INSERT INTO session_reviews (id, booking_id, user_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
      [id, payload.booking_id, user.id, Number(payload.rating), payload.review_text || '']
    )
    return rowById('session_reviews', id)
  }
  if (operation === 'fetchBookingReviews') {
    return query(
      `SELECT reviews.* FROM session_reviews reviews
       JOIN bookings booking ON booking.id = reviews.booking_id
       WHERE reviews.booking_id = ? AND booking.user_id = ? ORDER BY reviews.created_at DESC`,
      [payload.booking_id, user.id]
    )
  }
  if (operation === 'fetchUserNotifications') {
    return query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [user.id])
  }
  if (operation === 'markNotificationRead') {
    await execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [payload.id, user.id])
    return true
  }
  if (operation === 'fetchStudentProgress') {
    return query('SELECT * FROM student_progress WHERE user_id = ? ORDER BY subject', [user.id])
  }
  if (operation === 'upsertStudentProgress') {
    requireFields(payload, ['subject'])
    const id = randomUUID()
    await execute(
      `INSERT INTO student_progress (id, user_id, subject, sessions_completed, avg_rating, notes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE sessions_completed = VALUES(sessions_completed),
         avg_rating = VALUES(avg_rating), notes = VALUES(notes)`,
      [id, user.id, payload.subject, Number(payload.sessions_completed) || 0,
        Number(payload.avg_rating) || 0, payload.notes || '']
    )
    const rows = await query('SELECT * FROM student_progress WHERE user_id = ? AND subject = ?', [user.id, payload.subject])
    return rows[0]
  }
  return undefined
}

async function handleAdmin(operation, payload, admin) {
  if (operation === 'fetchAllBookings') return query('SELECT * FROM bookings ORDER BY created_at DESC')
  if (operation === 'fetchAllEnquiries') return query('SELECT * FROM enquiries ORDER BY created_at DESC')
  if (operation === 'updateBookingStatus') {
    if (!BOOKING_STATUSES.has(payload.status)) throw Object.assign(new Error('Invalid booking status'), { status: 400 })
    await execute('UPDATE bookings SET status = ? WHERE id = ?', [payload.status, payload.id])
    return rowById('bookings', payload.id)
  }
  if (operation === 'updateBookingMeetLink') {
    await execute('UPDATE bookings SET meet_link = ? WHERE id = ?', [payload.meet_link || null, payload.id])
    return rowById('bookings', payload.id)
  }
  if (operation === 'updateBookingNotes') {
    await execute('UPDATE bookings SET admin_notes = ? WHERE id = ?', [payload.notes || '', payload.id])
    return rowById('bookings', payload.id)
  }
  if (operation === 'deleteEnquiry') {
    await execute('DELETE FROM enquiries WHERE id = ?', [payload.id])
    return true
  }
  if (operation === 'bulkUpdateBookingStatus') {
    if (!BOOKING_STATUSES.has(payload.status)) throw Object.assign(new Error('Invalid booking status'), { status: 400 })
    const ids = Array.isArray(payload.ids) ? payload.ids : []
    if (!ids.length) return []
    await execute(`UPDATE bookings SET status = ? WHERE id IN (${ids.map(() => '?').join(',')})`, [payload.status, ...ids])
    return query(`SELECT * FROM bookings WHERE id IN (${ids.map(() => '?').join(',')})`, ids)
  }
  if (operation === 'bulkDeleteBookings') {
    const ids = Array.isArray(payload.ids) ? payload.ids : []
    if (ids.length) await execute(`DELETE FROM bookings WHERE id IN (${ids.map(() => '?').join(',')})`, ids)
    return true
  }
  if (operation === 'createNotification') {
    requireFields(payload, ['user_id', 'title', 'message'])
    const id = randomUUID()
    await execute(
      'INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
      [id, payload.user_id, payload.type || 'info', payload.title, payload.message]
    )
    return rowById('notifications', id)
  }
  if (operation === 'createAuditLog') {
    const id = randomUUID()
    await execute(
      `INSERT INTO audit_logs
        (id, action, severity, entity_type, entity_id, description, metadata, admin_email, admin_name, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, payload.action, payload.severity || 'info', payload.entity_type || null, payload.entity_id || null,
        payload.description || '', payload.metadata || '{}', admin.email, admin.name,
        payload.request_ip || null, payload.user_agent || null]
    )
    return rowById('audit_logs', id)
  }
  if (operation === 'fetchAuditLogs') {
    const limit = Math.min(Math.max(Number(payload.limit) || 100, 1), 500)
    const offset = Math.max(Number(payload.offset) || 0, 0)
    const filters = []
    const params = []
    if (payload.action) { filters.push('action = ?'); params.push(payload.action) }
    if (payload.entity_type) { filters.push('entity_type = ?'); params.push(payload.entity_type) }
    params.push(limit, offset)
    return query(`SELECT * FROM audit_logs ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT ? OFFSET ?`, params)
  }
  if (operation === 'fetchAuditLogCount') {
    const rows = await query('SELECT COUNT(*) AS count FROM audit_logs')
    return Number(rows[0].count)
  }
  return undefined
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { operation, payload = {} } = bodyOf(req)
  if (!operation) return res.status(400).json({ error: 'Missing operation' })

  try {
    const publicResult = await handlePublic(operation, payload)
    if (publicResult !== undefined) return res.status(200).json({ data: publicResult })
    const user = requireUser(req, res)
    if (!user) return
    const userResult = await handleUser(operation, payload, user)
    if (userResult !== undefined) return res.status(200).json({ data: userResult })
    const admin = requireAdmin(req, res)
    if (!admin) return
    const adminResult = await handleAdmin(operation, payload, admin)
    if (adminResult === undefined) return res.status(400).json({ error: 'Unknown operation' })
    return res.status(200).json({ data: adminResult })
  } catch (error) {
    console.error(`[api/data] ${operation}:`, error.code || error.message)
    const status = error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500)
    return res.status(status).json({ error: status === 500 ? 'Database operation failed' : error.message })
  }
}