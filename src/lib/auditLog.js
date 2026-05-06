// ═══════════════════════════════════════════════════════════════════════
// AUDIT LOGGING SERVICE — Tracks all admin actions for accountability
// Logs to Supabase `audit_logs` table + keeps in-memory session log
// ═══════════════════════════════════════════════════════════════════════

import { supabase } from './supabase'

// ── Action Types ──
export const AUDIT_ACTIONS = {
  BOOKING_STATUS_CHANGE: 'booking_status_change',
  BOOKING_MEET_LINK_ADDED: 'booking_meet_link_added',
  BOOKING_NOTE_SAVED: 'booking_note_saved',
  BOOKING_CALENDAR_SYNC: 'booking_calendar_sync',
  BOOKING_BULK_STATUS: 'booking_bulk_status',
  BOOKING_BULK_DELETE: 'booking_bulk_delete',
  BOOKING_CSV_EXPORT: 'booking_csv_export',
  BOOKING_EMAIL_SENT: 'booking_email_sent',
  ENQUIRY_DELETED: 'enquiry_deleted',
  ENQUIRY_REPLIED: 'enquiry_replied',
  ADMIN_LOGIN: 'admin_login',
  ADMIN_PANEL_VIEWED: 'admin_panel_viewed',
}

// ── Severity Levels ──
export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
}

// In-memory session log (for UI display when DB is unavailable)
let sessionLogs = []
let listeners = []

function notifyListeners() {
  listeners.forEach(fn => fn([...sessionLogs]))
}

export function subscribeToAuditLog(fn) {
  listeners.push(fn)
  fn([...sessionLogs])
  return () => {
    listeners = listeners.filter(l => l !== fn)
  }
}

export function getSessionLogs() {
  return [...sessionLogs]
}

// ── Log an audit event ──
export async function logAudit({
  action,
  severity = SEVERITY.INFO,
  entityType = null, // 'booking' | 'enquiry' | 'system'
  entityId = null,
  description = '',
  metadata = {},
  adminEmail = null,
  adminName = null,
}) {
  const timestamp = new Date().toISOString()

  // Build log entry
  const entry = {
    action,
    severity,
    entity_type: entityType,
    entity_id: entityId,
    description,
    metadata: JSON.stringify(metadata),
    admin_email: adminEmail,
    admin_name: adminName,
    ip_address: null, // client-side can't reliably get this
    user_agent: navigator.userAgent?.slice(0, 255) || null,
    created_at: timestamp,
  }

  // Add to session memory
  const memEntry = {
    ...entry,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    metadata, // keep as object in memory
  }
  sessionLogs = [memEntry, ...sessionLogs].slice(0, 200)
  notifyListeners()

  // Persist to Supabase (fire-and-forget)
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([entry])
    if (error) {
      console.warn('[AuditLog] DB insert failed:', error.message)
    }
  } catch (err) {
    console.warn('[AuditLog] DB insert error:', err.message)
  }

  return memEntry
}

// ── Fetch historical audit logs from DB ──
export async function fetchAuditLogs({ limit = 100, offset = 0, action = null, entityType = null } = {}) {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action) query = query.eq('action', action)
  if (entityType) query = query.eq('entity_type', entityType)

  const { data, error } = await query
  if (error) {
    console.warn('[AuditLog] Fetch failed:', error.message)
    return sessionLogs // fallback to session logs
  }
  return data || []
}

// ── Fetch audit log count ──
export async function fetchAuditLogCount() {
  const { count, error } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
  if (error) return sessionLogs.length
  return count || 0
}

// ── Clear session logs ──
export function clearSessionLogs() {
  sessionLogs = []
  notifyListeners()
}

// ── Convenience helpers for common actions ──

export function logBookingStatusChange(booking, oldStatus, newStatus, admin) {
  return logAudit({
    action: AUDIT_ACTIONS.BOOKING_STATUS_CHANGE,
    severity: newStatus === 'cancelled' ? SEVERITY.WARNING : SEVERITY.INFO,
    entityType: 'booking',
    entityId: booking.id,
    description: `Changed booking status from "${oldStatus}" to "${newStatus}" for ${booking.student_name || 'Student'} (${booking.subject})`,
    metadata: {
      student_name: booking.student_name,
      student_email: booking.student_email,
      subject: booking.subject,
      booking_date: booking.booking_date,
      old_status: oldStatus,
      new_status: newStatus,
    },
    adminEmail: admin?.email,
    adminName: admin?.name,
  })
}

export function logMeetLinkAdded(booking, meetLink, admin) {
  return logAudit({
    action: AUDIT_ACTIONS.BOOKING_MEET_LINK_ADDED,
    severity: SEVERITY.INFO,
    entityType: 'booking',
    entityId: booking.id,
    description: `Added Google Meet link for ${booking.student_name || 'Student'} (${booking.subject})`,
    metadata: {
      student_name: booking.student_name,
      subject: booking.subject,
      meet_link: meetLink,
    },
    adminEmail: admin?.email,
    adminName: admin?.name,
  })
}

export function logNoteSaved(booking, note, admin) {
  return logAudit({
    action: AUDIT_ACTIONS.BOOKING_NOTE_SAVED,
    severity: SEVERITY.INFO,
    entityType: 'booking',
    entityId: booking.id,
    description: `Saved admin note for ${booking.student_name || 'Student'} (${booking.subject})`,
    metadata: {
      student_name: booking.student_name,
      note_preview: note?.slice(0, 100),
    },
    adminEmail: admin?.email,
    adminName: admin?.name,
  })
}

export function logBulkStatusChange(count, newStatus, admin) {
  return logAudit({
    action: AUDIT_ACTIONS.BOOKING_BULK_STATUS,
    severity: newStatus === 'cancelled' ? SEVERITY.WARNING : SEVERITY.INFO,
    entityType: 'booking',
    entityId: null,
    description: `Bulk updated ${count} booking(s) to "${newStatus}"`,
    metadata: { count, new_status: newStatus },
    adminEmail: admin?.email,
    adminName: admin?.name,
  })
}

export function logBulkDelete(count, admin) {
  return logAudit({
    action: AUDIT_ACTIONS.BOOKING_BULK_DELETE,
    severity: SEVERITY.CRITICAL,
    entityType: 'booking',
    entityId: null,
    description: `Permanently deleted ${count} booking(s)`,
    metadata: { count },
    adminEmail: admin?.email,
    adminName: admin?.name,
  })
}

export function logCSVExport(count, admin) {
  return logAudit({
    action: AUDIT_ACTIONS.BOOKING_CSV_EXPORT,
    severity: SEVERITY.INFO,
    entityType: 'system',
    entityId: null,
    description: `Exported ${count} bookings to CSV`,
    metadata: { count },
    adminEmail: admin?.email,
    adminName: admin?.name,
  })
}

export function logEnquiryDeleted(enquiry, admin) {
  return logAudit({
    action: AUDIT_ACTIONS.ENQUIRY_DELETED,
    severity: SEVERITY.WARNING,
    entityType: 'enquiry',
    entityId: enquiry.id,
    description: `Deleted enquiry from ${enquiry.name || 'Unknown'} (${enquiry.email || 'no email'})`,
    metadata: {
      enquiry_name: enquiry.name,
      enquiry_email: enquiry.email,
      message_preview: enquiry.message?.slice(0, 80),
    },
    adminEmail: admin?.email,
    adminName: admin?.name,
  })
}

export function logCalendarSync(booking, admin) {
  return logAudit({
    action: AUDIT_ACTIONS.BOOKING_CALENDAR_SYNC,
    severity: SEVERITY.INFO,
    entityType: 'booking',
    entityId: booking.id,
    description: `Synced calendar event for ${booking.student_name || 'Student'} (${booking.subject})`,
    metadata: {
      student_name: booking.student_name,
      subject: booking.subject,
      booking_date: booking.booking_date,
    },
    adminEmail: admin?.email,
    adminName: admin?.name,
  })
}

export function logEmailSent(booking, admin) {
  return logAudit({
    action: AUDIT_ACTIONS.BOOKING_EMAIL_SENT,
    severity: SEVERITY.INFO,
    entityType: 'booking',
    entityId: booking.id,
    description: `Sent email to ${booking.student_name || 'Student'} (${booking.student_email || 'N/A'})`,
    metadata: {
      student_name: booking.student_name,
      student_email: booking.student_email,
      subject: booking.subject,
    },
    adminEmail: admin?.email,
    adminName: admin?.name,
  })
}

export function logAdminPanelViewed(admin) {
  return logAudit({
    action: AUDIT_ACTIONS.ADMIN_PANEL_VIEWED,
    severity: SEVERITY.INFO,
    entityType: 'system',
    entityId: null,
    description: `Admin panel accessed by ${admin?.name || admin?.email || 'Unknown'}`,
    metadata: {},
    adminEmail: admin?.email,
    adminName: admin?.name,
  })
}
