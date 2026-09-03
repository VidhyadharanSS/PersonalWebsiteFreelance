import { resilientQuery } from './resilience'
import { sanitizeBookingData, sanitizeEnquiryData } from './sanitize'
import {
  sendBookingConfirmation, sendBookingAdminNotification,
  sendEnquiryConfirmation, sendEnquiryAdminNotification,
  sendBookingStatusUpdate, sendMeetLinkEmail,
} from './email'

async function request(operation, payload = {}) {
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ operation, payload }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Database request failed')
  return result.data
}

export async function createBooking(bookingData) {
  const sanitized = sanitizeBookingData(bookingData)
  const booking = await resilientQuery(() => request('createBooking', {
    tutor_name: sanitized.tutorName,
    subject: sanitized.subject,
    booking_date: sanitized.date,
    booking_time: sanitized.time,
    price: sanitized.price,
    google_meet: Boolean(sanitized.googleMeet),
  }))
  if (booking?.student_email) {
    const emailData = {
      studentName: booking.student_name, studentEmail: booking.student_email,
      subject: booking.subject, yearGroup: booking.tutor_name,
      date: booking.booking_date, time: booking.booking_time,
      price: booking.price, googleMeet: booking.google_meet,
    }
    sendBookingConfirmation(booking.student_email, emailData)
    sendBookingAdminNotification(emailData)
  }
  return booking
}

export const fetchUserBookings = () => resilientQuery(() => request('fetchUserBookings'))

export async function submitEnquiry(rawData) {
  const sanitized = sanitizeEnquiryData(rawData)
  if (!sanitized.name || !sanitized.email || !sanitized.message) throw new Error('Please fill in all required fields.')
  await resilientQuery(() => request('submitEnquiry', sanitized))
  sendEnquiryConfirmation(sanitized.email, { name: sanitized.name, message: sanitized.message })
  sendEnquiryAdminNotification(sanitized)
  return true
}

export const fetchAllBookings = () => resilientQuery(() => request('fetchAllBookings'))
export const fetchAllEnquiries = () => resilientQuery(() => request('fetchAllEnquiries'))

export async function updateBookingStatus(id, status, { studentEmail, booking } = {}) {
  const row = await resilientQuery(() => request('updateBookingStatus', { id, status }))
  const target = booking || row
  if (target && studentEmail) sendBookingStatusUpdate(studentEmail, {
    studentName: target.student_name, subject: target.subject,
    date: target.booking_date, time: target.booking_time, status,
    meetLink: target.meet_link || null,
  })
  return row
}

export async function updateBookingMeetLink(id, meetLink, { studentEmail, booking } = {}) {
  const row = await resilientQuery(() => request('updateBookingMeetLink', { id, meet_link: meetLink }))
  const target = booking || row
  if (target && studentEmail) sendMeetLinkEmail(studentEmail, {
    studentName: target.student_name, subject: target.subject,
    date: target.booking_date, time: target.booking_time, meetLink,
  })
  return row
}

export const updateBookingNotes = (id, notes) => resilientQuery(() => request('updateBookingNotes', { id, notes }))
export const deleteEnquiry = id => resilientQuery(() => request('deleteEnquiry', { id }))
export const bulkUpdateBookingStatus = (ids, status) => resilientQuery(() => request('bulkUpdateBookingStatus', { ids, status }))
export const bulkDeleteBookings = ids => resilientQuery(() => request('bulkDeleteBookings', { ids }))

export async function fetchBookingStats() {
  const rows = await fetchAllBookings()
  return rows.reduce((stats, booking) => {
    stats.total += 1
    stats[booking.status] = (stats[booking.status] || 0) + 1
    const price = Number(booking.price) || 0
    if (booking.status === 'confirmed' || booking.status === 'completed') stats.totalRevenue += price
    if (booking.status === 'confirmed') stats.confirmedRevenue += price
    return stats
  }, { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, totalRevenue: 0, confirmedRevenue: 0 })
}

export const submitSessionReview = ({ bookingId, rating, reviewText }) => resilientQuery(() => request('submitSessionReview', {
  booking_id: bookingId, rating, review_text: reviewText || '',
}))
export const fetchBookingReviews = bookingId => resilientQuery(() => request('fetchBookingReviews', { booking_id: bookingId }))
export const fetchUserNotifications = () => resilientQuery(() => request('fetchUserNotifications'))
export const markNotificationRead = id => resilientQuery(() => request('markNotificationRead', { id }))
export const createNotification = ({ userId, type, title, message }) => resilientQuery(() => request('createNotification', {
  user_id: userId, type, title, message,
}))
export const fetchStudentProgress = () => resilientQuery(() => request('fetchStudentProgress'))
export const upsertStudentProgress = ({ subject, sessionsCompleted, avgRating, notes }) => resilientQuery(() => request('upsertStudentProgress', {
  subject, sessions_completed: sessionsCompleted, avg_rating: avgRating, notes,
}))
export const createAuditLog = entry => request('createAuditLog', entry)
export const fetchStoredAuditLogs = options => request('fetchAuditLogs', options)
export const fetchStoredAuditLogCount = () => request('fetchAuditLogCount')