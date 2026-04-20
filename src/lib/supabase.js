import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://oqxwvkytyczmldnrqjll.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_nU4ihs42_7R5L5F9Cb4Pew_J_0XYxhe'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

export const SITE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? window.location.origin
    : 'https://zenith-pranavi.vercel.app'

export const PRICING = {
  'Year 1-6': 13,
  'Year 7-10': 20,
  'Year 11-12': 27,
  'Special Needs': 27
}

export const ADMIN_EMAILS = [
  'v72653666@gmail.com',
  'admin@zped.org',
  'vidhyadharanss@gmail.com'
]
