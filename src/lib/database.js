// ═══════════════════════════════════════════════════════════════════════
// DATABASE SERVICE — Resilient Supabase operations with retry & validation
// ═══════════════════════════════════════════════════════════════════════

import { supabase } from './supabase'
import { resilientQuery } from './resilience'
import { sanitizeBookingData, sanitizeEnquiryData } from './sanitize'
import {
  sendBookingConfirmation,
  sendBookingAdminNotification,
  sendEnquiryConfirmation,
  sendEnquiryAdminNotification,
  sendBookingStatusUpdate,
  sendMeetLinkEmail
} from './email'

/**
 * Create a new booking with resilience and validation
 */
export async function createBooking(bookingData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Sanitize input
  const sanitized = sanitizeBookingData(bookingData)

  const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
  const insertData = {
    user_id: user.id,
    student_name: userName,
    student_email: user.email || null,
    tutor_name: sanitized.tutorName,
    subject: sanitized.subject,
    booking_date: sanitized.date,
    booking_time: sanitized.time,
    price: sanitized.price,
    status: 'pending',
    google_meet: sanitized.googleMeet
  }

  const booking = await resilientQuery(async () => {
    const { data, error } = await supabase.from('bookings').insert([insertData]).select()
    if (error) throw error
    return data?.[0] || null
  })

  // Send confirmation emails (fire-and-forget)
  if (booking && user.email) {
    const emailData = {
      studentName: userName,
      studentEmail: user.email,
      subject: sanitized.subject,
      yearGroup: sanitized.tutorName,
      date: sanitized.date,
      time: sanitized.time,
      price: sanitized.price,
      googleMeet: sanitized.googleMeet
    }
    sendBookingConfirmation(user.email, emailData)
    sendBookingAdminNotification(emailData)
  }

  return booking
}

/**
 * Fetch current user's bookings with retry
 */
export async function fetchUserBookings() {
  return resilientQuery(async () => {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
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
    const { error } = await supabase.from('enquiries').insert([sanitized])
    if (error) throw error
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
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  })
}

/**
 * Fetch all enquiries (admin) with retry
 */
export async function fetchAllEnquiries() {
  return resilientQuery(async () => {
    const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  })
}

/**
 * Update booking status with email notification
 */
export async function updateBookingStatus(id, status, { studentEmail, booking } = {}) {
  const row = await resilientQuery(async () => {
    const { data, error } = await supabase.from('bookings').update({ status }).eq('id', id).select()
    if (error) throw error
    return data?.[0] || null
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
      meetLink: target.meet_link || null
    })
  }

  return row
}

/**
 * Update booking Google Meet link with email notification
 */
export async function updateBookingMeetLink(id, meetLink, { studentEmail, booking } = {}) {
  const row = await resilientQuery(async () => {
    const { data, error } = await supabase.from('bookings').update({ meet_link: meetLink }).eq('id', id).select()
    if (error) throw error
    return data?.[0] || null
  })

  // Send Meet link email (fire-and-forget)
  const target = booking || row
  if (target && studentEmail) {
    sendMeetLinkEmail(studentEmail, {
      studentName: target.student_name,
      subject: target.subject,
      date: target.booking_date,
      time: target.booking_time,
      meetLink
    })
  }

  return row
}

/**
 * Update booking admin notes
 */
export async function updateBookingNotes(id, notes) {
  return resilientQuery(async () => {
    const { data, error } = await supabase.from('bookings').update({ admin_notes: notes }).eq('id', id).select()
    if (error) throw error
    return data?.[0] || null
  })
}

/**
 * Delete an enquiry
 */
export async function deleteEnquiry(id) {
  return resilientQuery(async () => {
    const { error } = await supabase.from('enquiries').delete().eq('id', id)
    if (error) throw error
    return true
  })
}

/**
 * Bulk update booking statuses
 */
export async function bulkUpdateBookingStatus(ids, status) {
  return resilientQuery(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .in('id', ids)
      .select()
    if (error) throw error
    return data || []
  })
}

/**
 * Fetch booking statistics
 */
export async function fetchBookingStats() {
  return resilientQuery(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('status, price, created_at')
    if (error) throw error

    const stats = {
      total: data.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0,
      confirmedRevenue: 0,
    }

    data.forEach(b => {
      stats[b.status] = (stats[b.status] || 0) + 1
      if (b.status === 'confirmed' || b.status === 'completed') {
        stats.totalRevenue += b.price || 0
      }
      if (b.status === 'confirmed') {
        stats.confirmedRevenue += b.price || 0
      }
    })

    return stats
  })
}
