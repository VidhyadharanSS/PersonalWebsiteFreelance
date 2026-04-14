/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Supabase Configuration
   ═══════════════════════════════════════════════════════════
   Project: ZPranavi
   Account: VidhyadharanSS
   ═══════════════════════════════════════════════════════════ */

// ──────────── SUPABASE CREDENTIALS ────────────
const SUPABASE_URL = 'https://oqxwvkytyczmldnrqjll.supabase.co';

// ⚠️  IMPORTANT: Replace this with your REAL Supabase anon key from:
//     Supabase Dashboard → Settings → API → Project API keys → anon (public)
//     It should start with "eyJ..." (it's a JWT token)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.REPLACE_WITH_YOUR_REAL_ANON_KEY';

// ──────────── SITE URL (for email redirects) ────────────
const SITE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? window.location.origin
    : 'https://zenith-pranavi.vercel.app';

// ──────────── INITIALIZE SUPABASE CLIENT ────────────
// The CDN creates `var supabase` (namespace). We must use `var` again (not const/let)
// to reassign it to the actual client instance for all scripts to use.
var _supabaseLib = window.supabase;  // Save reference to CDN namespace
var supabase = _supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,          // Auto-detect email confirmation tokens in URL
        flowType: 'pkce'                    // Use PKCE flow for secure email confirmation redirects
    }
});

// ──────────── PRICING CONFIGURATION ────────────
const PRICING = {
    'Year 1-6':       13,   // Foundation
    'Year 7-10':      20,   // Intermediate
    'Year 11-12':     27,   // Advanced
    'Special Needs':  27,   // Inclusive
};

/**
 * Get price by year group string
 * @param {string} yearGroup - e.g. "Year 1-6", "Year 7-10", etc.
 * @returns {number} Price per hour in USD
 */
function getPriceForYear(yearGroup) {
    return PRICING[yearGroup] || 20;
}

console.log('✅ Supabase client initialized — Project: ZPranavi');
console.log('🔍 Client check — .from():', typeof supabase.from, '| .auth:', typeof supabase.auth);
