// ═══════════════════════════════════════════════════════════════════════
// INPUT SANITIZATION & VALIDATION UTILITIES
// Prevents XSS, SQL injection, and malicious input across the application
// ═══════════════════════════════════════════════════════════════════════

import DOMPurify from 'dompurify'

/**
 * Sanitize a string to remove any HTML/script injection
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
}

/**
 * Sanitize HTML content (allows safe tags)
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return ''
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email.trim()) && email.length <= 254
}

/**
 * Validate phone number (basic international format)
 */
export function isValidPhone(phone) {
  if (typeof phone !== 'string') return false
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^\+?[0-9]{7,15}$/.test(cleaned)
}

/**
 * Sanitize and validate a name
 */
export function sanitizeName(name) {
  if (typeof name !== 'string') return ''
  // Remove anything that isn't letters, spaces, hyphens, apostrophes, or dots
  return name.replace(/[^a-zA-Z\s\-'.À-ÿ]/g, '').trim().slice(0, 100)
}

/**
 * Rate limiter for client-side operations
 */
const rateLimitMap = new Map()

export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now()
  const entry = rateLimitMap.get(key) || { attempts: 0, resetAt: now + windowMs }

  // Reset window if expired
  if (now > entry.resetAt) {
    entry.attempts = 0
    entry.resetAt = now + windowMs
  }

  entry.attempts++
  rateLimitMap.set(key, entry)

  if (entry.attempts > maxAttempts) {
    const waitSeconds = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, waitSeconds }
  }

  return { allowed: true, remaining: maxAttempts - entry.attempts }
}

/**
 * Validate URL format (for meet links etc.)
 */
export function isValidURL(url) {
  if (typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Sanitize booking data before submission
 */
export function sanitizeBookingData(data) {
  return {
    ...data,
    subject: sanitizeText(data.subject || ''),
    tutorName: sanitizeText(data.tutorName || ''),
    date: sanitizeText(data.date || ''),
    time: sanitizeText(data.time || ''),
    price: Math.max(0, Math.min(1000, Number(data.price) || 0)),
    googleMeet: Boolean(data.googleMeet),
  }
}

/**
 * Sanitize enquiry data before submission
 */
export function sanitizeEnquiryData(data) {
  return {
    name: sanitizeName(data.name || ''),
    email: sanitizeText(data.email || '').toLowerCase(),
    message: sanitizeText(data.message || '').slice(0, 2000),
  }
}
