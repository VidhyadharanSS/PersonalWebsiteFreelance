/* ═══════════════════════════════════════════════════════════
   ZENITH PRANAVI — Supabase Configuration
   ═══════════════════════════════════════════════════════════
   Project: ZPranavi
   Account: VidhyadharanSS
   ═══════════════════════════════════════════════════════════ */

// ──────────── SUPABASE CREDENTIALS ────────────
const SUPABASE_URL = 'https://oqxwvkytyczmldnrqjll.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nU4ihs42_7R5L5F9Cb4Pew_J_0XYxhe';

// ──────────── INITIALIZE SUPABASE CLIENT ────────────
// The CDN creates `var supabase` (namespace). We must use `var` again (not const/let)
// to reassign it to the actual client instance for all scripts to use.
var _supabaseLib = window.supabase;  // Save reference to CDN namespace
var supabase = _supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
