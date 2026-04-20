/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Supabase Configuration
   Project: ZPranavi | Account: VidhyadharanSS
   ═══════════════════════════════════════════════════════════ */

// Supabase Credentials
const SUPABASE_URL = 'https://oqxwvkytyczmldnrqjll.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nU4ihs42_7R5L5F9Cb4Pew_J_0XYxhe';

// Site URL for email redirects
const SITE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? window.location.origin
    : 'https://zenith-pranavi.vercel.app';

// Initialize Supabase Client
var _supabaseLib = window.supabase;
var supabase = _supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});

// Pricing
const PRICING = {
    'Year 1-6': 13,
    'Year 7-10': 20,
    'Year 11-12': 27,
    'Special Needs': 27
};

function getPriceForYear(yearGroup) {
    return PRICING[yearGroup] || 20;
}
