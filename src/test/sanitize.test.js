import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  isValidEmail,
  isValidPhone,
  sanitizeName,
  isValidURL,
  checkRateLimit,
  sanitizeBookingData,
  sanitizeEnquiryData,
} from '../lib/sanitize'

describe('sanitizeText', () => {
  it('removes HTML tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('')
    expect(sanitizeText('<b>Bold</b>')).toBe('Bold')
  })

  it('handles empty and non-string inputs', () => {
    expect(sanitizeText('')).toBe('')
    expect(sanitizeText(null)).toBe('')
    expect(sanitizeText(undefined)).toBe('')
    expect(sanitizeText(123)).toBe('')
  })

  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello')
  })

  it('passes through safe text', () => {
    expect(sanitizeText('Hello World')).toBe('Hello World')
  })
})

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('name.last@domain.co.uk')).toBe(true)
    expect(isValidEmail('user+tag@gmail.com')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('@no-user.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail(null)).toBe(false)
    expect(isValidEmail(123)).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('accepts valid phone numbers', () => {
    expect(isValidPhone('+447911123456')).toBe(true)
    expect(isValidPhone('+1 555 123 4567')).toBe(true)
    expect(isValidPhone('07911123456')).toBe(true)
  })

  it('rejects invalid phone numbers', () => {
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('123')).toBe(false)
    expect(isValidPhone('abc')).toBe(false)
    expect(isValidPhone(null)).toBe(false)
  })
})

describe('sanitizeName', () => {
  it('keeps valid name characters', () => {
    expect(sanitizeName('John Doe')).toBe('John Doe')
    expect(sanitizeName("O'Brien")).toBe("O'Brien")
    expect(sanitizeName('Jean-Pierre')).toBe('Jean-Pierre')
  })

  it('removes invalid characters', () => {
    expect(sanitizeName('John<script>')).toBe('Johnscript')
    expect(sanitizeName('Name123')).toBe('Name')
  })

  it('truncates long names', () => {
    const longName = 'A'.repeat(200)
    expect(sanitizeName(longName).length).toBeLessThanOrEqual(100)
  })
})

describe('isValidURL', () => {
  it('accepts valid URLs', () => {
    expect(isValidURL('https://meet.google.com/abc-defg-hij')).toBe(true)
    expect(isValidURL('http://example.com')).toBe(true)
  })

  it('rejects invalid URLs', () => {
    expect(isValidURL('')).toBe(false)
    expect(isValidURL('not-a-url')).toBe(false)
    expect(isValidURL('ftp://invalid.com')).toBe(false)
    expect(isValidURL(null)).toBe(false)
  })
})

describe('checkRateLimit', () => {
  it('allows requests within limit', () => {
    const result = checkRateLimit('test-unique-key-1', 3, 60000)
    expect(result.allowed).toBe(true)
  })

  it('blocks after exceeding limit', () => {
    const key = 'test-unique-key-2'
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 3, 60000)
    }
    const result = checkRateLimit(key, 3, 60000)
    expect(result.allowed).toBe(false)
  })
})

describe('sanitizeBookingData', () => {
  it('sanitizes booking fields', () => {
    const result = sanitizeBookingData({
      subject: '<b>Mathematics</b>',
      tutorName: 'Dr. Smith<img onerror="alert(1)">',
      date: '2025-01-15',
      time: '10:00',
      price: 25,
      googleMeet: true,
    })
    expect(result.subject).toBe('Mathematics')
    expect(result.tutorName).toBe('Dr. Smith')
    expect(result.price).toBe(25)
    expect(result.googleMeet).toBe(true)
  })

  it('clamps price to valid range', () => {
    expect(sanitizeBookingData({ price: -10 }).price).toBe(0)
    expect(sanitizeBookingData({ price: 9999 }).price).toBe(1000)
  })
})

describe('sanitizeEnquiryData', () => {
  it('sanitizes enquiry fields', () => {
    const result = sanitizeEnquiryData({
      name: 'John<script>',
      email: 'JOHN@EXAMPLE.COM',
      message: 'Hello <b>World</b>',
    })
    expect(result.name).toBe('Johnscript')
    expect(result.email).toBe('john@example.com')
    expect(result.message).toBe('Hello World')
  })

  it('truncates long messages', () => {
    const longMsg = 'A'.repeat(3000)
    const result = sanitizeEnquiryData({ name: 'Test', email: 'a@b.com', message: longMsg })
    expect(result.message.length).toBeLessThanOrEqual(2000)
  })
})
