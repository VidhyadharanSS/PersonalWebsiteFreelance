import { supabase } from './supabase'

export async function createBooking(bookingData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
  const { data, error } = await supabase.from('bookings').insert([{
    user_id: user.id,
    student_name: userName,
    tutor_name: bookingData.tutorName,
    subject: bookingData.subject,
    booking_date: bookingData.date,
    booking_time: bookingData.time,
    price: bookingData.price,
    status: 'pending'
  }]).select()
  if (error) throw error
  return data?.[0] || null
}

export async function fetchUserBookings() {
  const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function submitEnquiry({ name, email, message }) {
  const { error } = await supabase.from('enquiries').insert([{ name, email, message }])
  if (error) throw error
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

export async function updateBookingStatus(id, status) {
  const { data, error } = await supabase.from('bookings').update({ status }).eq('id', id).select()
  if (error) throw error
  return data?.[0] || null
}

export async function deleteEnquiry(id) {
  const { error } = await supabase.from('enquiries').delete().eq('id', id)
  if (error) throw error
  return true
}
