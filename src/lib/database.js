// ═══════════════════════════════════════════════════════════════════════
// DATABASE SERVICE — Zoho Catalyst Data Store with resilience & validation
// ═══════════════════════════════════════════════════════════════════════
//
// Table Mapping (create these in Catalyst Console → Data Store):
//   Bookings        — user_id, student_name, student_email, tutor_name,
//                     subject, booking_date, booking_time, price, status,
//                     google_meet, meet_link, admin_notes
//   Enquiries       — name, email, phone, message
//   SessionReviews  — booking_id, user_id, rating, review_text
//   Notifications   — user_id, type, title, message, is_read
//   StudentProgress — user_id, subject, sessions_completed, avg_rating, notes
//
// ═══════════════════════════════════════════════════════════════════════

import { catalyst } from './catalyst'
import { resilientQuery } from './resilience'
import { sanitizeBookingData, sanitizeEnquiryData } from './sanitize'
import {
  sendBookingConfirmation,
  sendBookingAdminNotification,
  sendEnquiryConfirmation,
  sendEnquiryAdminNotification,
  sendBookingStatusUpdate,
  sendMeetLinkEmail,
} from './email'

// ═══════════════════════════════════════════════════════════════
// HELPER: Normalize Catalyst row to flat object
// Catalyst returns rows with ROWID, CREATORID, CREATEDTIME, MODIFIEDTIME
// We map ROWID → id for consistency with existing UI code
// ═══════════════════════════════════════════════════════════════

function normalizeRow(row) {
  if (!row) return null
  return {
    ...row,
    id: row.ROWID || row.id,
    created_at: row.CREATEDTIME || row.created_at,
    updated_at: row.MODIFIEDTIME || row.updated_at,
  }
}

function normalizeRows(rows) {
  return (rows || []).map(normalizeRow)
}

// ═══════════════════════════════════════════════════════════════
// CURRENT USER HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get current authenticated user info from local session
 * This reads from the auth context stored in sessionStorage/localStorage
 */
function getCurrentUserFromSession() {
  try {
    const stored = sessionStorage.getItem('catalyst_user') || localStorage.getItem('catalyst_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════════
// BOOKING OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new booking with resilience and validation
 */
export async function createBooking(bookingData) {
  const user = getCurrentUserFromSession()
  if (!user) throw new Error('Not authenticated')

  const sanitized = sanitizeBookingData(bookingData)
  const userName = user.name || user.full_name || user.first_name || user.email?.split('@')[0] || 'Student'

  const insertData = {
    user_id: String(user.user_id || user.id || ''),
    student_name: userName,
    student_email: user.email || user.email_id || '',
    tutor_name: sanitized.tutorName,
    subject: sanitized.subject,
    booking_date: sanitized.date,
    booking_time: sanitized.time,
    price: sanitized.price,
    status: 'pending',
    google_meet: sanitized.googleMeet || '',
    meet_link: '',
    admin_notes: '',
  }

  const booking = await resilientQuery(async () => {
    const rows = await catalyst.insertRow('Bookings', insertData)
    return normalizeRow(rows?.[0] || null)
  })

  // Send confirmation emails (fire-and-forget)
  const email = user.email || user.email_id
  if (booking && email) {
    const emailData = {
      studentName: userName,
      studentEmail: email,
      subject: sanitized.subject,
      yearGroup: sanitized.tutorName,
      date: sanitized.date,
      time: sanitized.time,
      price: sanitized.price,
      googleMeet: sanitized.googleMeet,
    }
    sendBookingConfirmation(email, emailData)
    sendBookingAdminNotification(emailData)
  }

  return booking
}

/**
 * Fetch current user's bookings with retry
 */
export async function fetchUserBookings() {
  const user = getCurrentUserFromSession()
  if (!user) return []

  const userId = String(user.user_id || user.id || '')
  return resilientQuery(async () => {
    const rows = await catalyst.getAllRows('Bookings')
    // Filter by user_id and sort by created_at descending
    const filtered = rows.filter(r => String(r.user_id) === userId)
    return normalizeRows(filtered).sort((a, b) =>
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )
  })
}

/**
 * Submit an enquiry with sanitization and retry
 */
export async function submitEnquiry(rawData) {
  const sanitized = sanitizeEnquiryData(rawData)

  if (!sanitized.name || !sanitized.email || !sanitized.message) {
    throw new Error('Please fill in all required fields.')
  }

  await resilientQuery(async () => {
    await catalyst.insertRow('Enquiries', sanitized)
  })

  // Send confirmation emails (fire-and-forget)
  sendEnquiryConfirmation(sanitized.email, { name: sanitized.name, message: sanitized.message })
  sendEnquiryAdminNotification(sanitized)

  return true
}

// ═══════════════════════════════════════════════════════════════
// ADMIN OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all bookings (admin) with retry
 */
export async function fetchAllBookings() {
  return resilientQuery(async () => {
    const rows = await catalyst.getAllRows('Bookings')
    return normalizeRows(rows).sort((a, b) =>
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )
  })
}

/**
 * Fetch all enquiries (admin) with retry
 */
export async function fetchAllEnquiries() {
  return resilientQuery(async () => {
    const rows = await catalyst.getAllRows('Enquiries')
    return normalizeRows(rows).sort((a, b) =>
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )
  })
}

/**
 * Update booking status with email notification
 */
export async function updateBookingStatus(id, status, { studentEmail, booking } = {}) {
  const row = await resilientQuery(async () => {
    const updated = await catalyst.updateRow('Bookings', { ROWID: id, status })
    return normalizeRow(updated?.[0] || null)
  })

  // Send status-update email (fire-and-forget)
  const target = booking || row
  if (target && studentEmail) {
    sendBookingStatusUpdate(studentEmail, {
      studentName: target.student_name,
      subject: target.subject,
      date: target.booking_date,
      time: target.booking_time,
      status,
      meetLink: target.meet_link || null,
    })
  }

  return row
}

/**
 * Update booking Google Meet link with email notification
 */
export async function updateBookingMeetLink(id, meetLink, { studentEmail, booking } = {}) {
  const row = await resilientQuery(async () => {
    const updated = await catalyst.updateRow('Bookings', { ROWID: id, meet_link: meetLink })
    return normalizeRow(updated?.[0] || null)
  })

  // Send Meet link email (fire-and-forget)
  const target = booking || row
  if (target && studentEmail) {
    sendMeetLinkEmail(studentEmail, {
      studentName: target.student_name,
      subject: target.subject,
      date: target.booking_date,
      time: target.booking_time,
      meetLink,
    })
  }

  return row
}

/**
 * Update booking admin notes
 */
export async function updateBookingNotes(id, notes) {
  return resilientQuery(async () => {
    const updated = await catalyst.updateRow('Bookings', { ROWID: id, admin_notes: notes })
    return normalizeRow(updated?.[0] || null)
  })
}

/**
 * Delete an enquiry
 */
export async function deleteEnquiry(id) {
  return resilientQuery(async () => {
    await catalyst.deleteRow('Enquiries', id)
    return true
  })
}

/**
 * Bulk update booking statuses
 */
export async function bulkUpdateBookingStatus(ids, status) {
  return resilientQuery(async () => {
    const updatePayload = ids.map(id => ({ ROWID: id, status }))
    const data = await catalyst.updateRow('Bookings', updatePayload)
    return normalizeRows(data)
  })
}

/**
 * Fetch booking statistics
 */
export async function fetchBookingStats() {
  return resilientQuery(async () => {
    const rows = await catalyst.getAllRows('Bookings')

    const stats = {
      total: rows.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0,
      confirmedRevenue: 0,
    }

    rows.forEach(b => {
      stats[b.status] = (stats[b.status] || 0) + 1
      const price = parseFloat(b.price) || 0
      if (b.status === 'confirmed' || b.status === 'completed') {
        stats.totalRevenue += price
      }
      if (b.status === 'confirmed') {
        stats.confirmedRevenue += price
      }
    })

    return stats
  })
}

// ═══════════════════════════════════════════════════════════════
// SESSION REVIEWS
// ═══════════════════════════════════════════════════════════════

/**
 * Submit a session review
 */
export async function submitSessionReview({ bookingId, rating, reviewText }) {
  const user = getCurrentUserFromSession()
  if (!user) throw new Error('Not authenticated')

  return resilientQuery(async () => {
    const rows = await catalyst.insertRow('SessionReviews', {
      booking_id: String(bookingId),
      user_id: String(user.user_id || user.id || ''),
      rating: rating,
      review_text: reviewText || '',
    })
    return normalizeRow(rows?.[0] || null)
  })
}

/**
 * Fetch reviews for a booking
 */
export async function fetchBookingReviews(bookingId) {
  return resilientQuery(async () => {
    const rows = await catalyst.getAllRows('SessionReviews')
    return normalizeRows(rows.filter(r => String(r.booking_id) === String(bookingId)))
  })
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch user notifications
 */
export async function fetchUserNotifications() {
  const user = getCurrentUserFromSession()
  if (!user) return []

  const userId = String(user.user_id || user.id || '')
  return resilientQuery(async () => {
    const rows = await catalyst.getAllRows('Notifications')
    return normalizeRows(rows.filter(r => String(r.user_id) === userId))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  })
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(id) {
  return resilientQuery(async () => {
    await catalyst.updateRow('Notifications', { ROWID: id, is_read: 'true' })
    return true
  })
}

/**
 * Create a notification
 */
export async function createNotification({ userId, type, title, message }) {
  return resilientQuery(async () => {
    const rows = await catalyst.insertRow('Notifications', {
      user_id: String(userId),
      type: type || 'info',
      title: title,
      message: message,
      is_read: 'false',
    })
    return normalizeRow(rows?.[0] || null)
  })
}

// ═══════════════════════════════════════════════════════════════
// STUDENT PROGRESS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch student progress
 */
export async function fetchStudentProgress() {
  const user = getCurrentUserFromSession()
  if (!user) return []

  const userId = String(user.user_id || user.id || '')
  return resilientQuery(async () => {
    const rows = await catalyst.getAllRows('StudentProgress')
    return normalizeRows(rows.filter(r => String(r.user_id) === userId))
  })
}

/**
 * Update or create student progress for a subject
 */
export async function upsertStudentProgress({ subject, sessionsCompleted, avgRating, notes }) {
  const user = getCurrentUserFromSession()
  if (!user) throw new Error('Not authenticated')

  const userId = String(user.user_id || user.id || '')

  return resilientQuery(async () => {
    // Check if progress record exists for this user + subject
    const allRows = await catalyst.getAllRows('StudentProgress')
    const existing = allRows.find(
      r => String(r.user_id) === userId && r.subject === subject
    )

    if (existing) {
      const updated = await catalyst.updateRow('StudentProgress', {
        ROWID: existing.ROWID,
        sessions_completed: sessionsCompleted,
        avg_rating: avgRating,
        notes: notes || '',
      })
      return normalizeRow(updated?.[0] || null)
    } else {
      const rows = await catalyst.insertRow('StudentProgress', {
        user_id: userId,
        subject,
        sessions_completed: sessionsCompleted,
        avg_rating: avgRating,
        notes: notes || '',
      })
      return normalizeRow(rows?.[0] || null)
    }
  })
}
