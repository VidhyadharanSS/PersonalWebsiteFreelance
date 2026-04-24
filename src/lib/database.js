import { supabase } from './supabase'
import {
  sendBookingConfirmation,
  sendBookingAdminNotification,
  sendEnquiryConfirmation,
  sendEnquiryAdminNotification,
  sendBookingStatusUpdate,
  sendMeetLinkEmail
} from './email'

export async function createBooking(bookingData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
  const insertData = {
    user_id: user.id,
    student_name: userName,
    student_email: user.email || null,
    tutor_name: bookingData.tutorName,
    subject: bookingData.subject,
    booking_date: bookingData.date,
    booking_time: bookingData.time,
    price: bookingData.price,
    status: 'pending',
    google_meet: bookingData.googleMeet ?? true
  }

  const { data, error } = await supabase.from('bookings').insert([insertData]).select()
  if (error) throw error
  const booking = data?.[0] || null

  // ── Send confirmation emails (fire-and-forget) ──
  if (booking && user.email) {
    const emailData = {
      studentName: userName,
      studentEmail: user.email,
      subject: bookingData.subject,
      yearGroup: bookingData.tutorName,
      date: bookingData.date,
      time: bookingData.time,
      price: bookingData.price,
      googleMeet: insertData.google_meet
    }
    // Student confirmation
    sendBookingConfirmation(user.email, emailData)
    // Admin notification
    sendBookingAdminNotification(emailData)
  }

  return booking
}

export async function fetchUserBookings() {
  const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function submitEnquiry({ name, email, message }) {
  const { error } = await supabase.from('enquiries').insert([{ name, email, message }])
  if (error) throw error

  // ── Send confirmation emails (fire-and-forget) ──
  sendEnquiryConfirmation(email, { name, message })
  sendEnquiryAdminNotification({ name, email, message })

  return true
}

// Admin functions
export async function fetchAllBookings() {
  const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchAllEnquiries() {
  const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Helper: given a user_id, look up the auth email (via admin).
// Since we can't query auth.users from the client, we rely on
// the admin caller passing `studentEmail` directly (e.g. from the
// bookings row augmented with an email column or RPC). For now we
// accept an optional email in the update call.
export async function updateBookingStatus(id, status, { studentEmail, booking } = {}) {
  const { data, error } = await supabase.from('bookings').update({ status }).eq('id', id).select()
  if (error) throw error
  const row = data?.[0] || null

  // ── Send status-update email (fire-and-forget) ──
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

export async function updateBookingMeetLink(id, meetLink, { studentEmail, booking } = {}) {
  const { data, error } = await supabase.from('bookings').update({ meet_link: meetLink }).eq('id', id).select()
  if (error) throw error
  const row = data?.[0] || null

  // ── Send Meet link email (fire-and-forget) ──
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

export async function deleteEnquiry(id) {
  const { error } = await supabase.from('enquiries').delete().eq('id', id)
  if (error) throw error
  return true
}
