import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { supabase } from '../lib/supabase'
import { sendBookingStatusUpdate, sendMeetLinkEmail } from '../lib/email'
import {
  logBookingStatusChange, logMeetLinkAdded, logNoteSaved,
  logBulkStatusChange, logBulkDelete, logCSVExport,
  logEnquiryDeleted, logCalendarSync, logEmailSent,
  logAdminPanelViewed, fetchAuditLogs, AUDIT_ACTIONS, SEVERITY
} from '../lib/auditLog'
import {
  Calendar, Mail, Clock, Search, Video, Link2,
  RefreshCw, CheckCircle, XCircle, Filter, DollarSign,
  CalendarPlus, ChevronLeft, ChevronRight, Download,
  Eye, Activity, TrendingUp,
  FileText, Send, AlertCircle, ChevronDown, ChevronUp,
  BarChart3, Zap, Users, Trash2, Shield,
  BookOpen, ArrowUpRight, Sparkles
} from 'lucide-react'

// ── Google Calendar URL builder with Google Meet conferencing ──
function buildGoogleCalendarUrl(booking) {
  const base = 'https://calendar.google.com/calendar/render'
  const params = new URLSearchParams()
  params.set('action', 'TEMPLATE')
  params.set('text', `Zenith Pranavi — ${booking.subject} (${booking.tutor_name || 'Session'})`)

  if (booking.booking_date && booking.booking_time) {
    const dateStr = booking.booking_date
    const timeStr = booking.booking_time
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (match) {
      let hours = parseInt(match[1], 10)
      const mins = parseInt(match[2], 10)
      const ampm = match[3].toUpperCase()
      if (ampm === 'PM' && hours !== 12) hours += 12
      if (ampm === 'AM' && hours === 12) hours = 0
      const startDt = new Date(`${dateStr}T${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00`)
      const endDt = new Date(startDt.getTime() + 60 * 60 * 1000)
      const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
      params.set('dates', `${fmt(startDt)}/${fmt(endDt)}`)
    }
  }

  params.set('details', [
    `Student: ${booking.student_name || 'N/A'}`,
    `Year Group: ${booking.tutor_name || 'N/A'}`,
    `Subject: ${booking.subject}`,
    `Price: $${booking.price}/hr`,
    '',
    'This event was created by Zenith Pranavi Education.',
    'A Google Meet link will be auto-attached to this event.'
  ].join('\n'))

  params.set('location', 'Google Meet (auto-generated)')
  params.set('crm', 'AVAILABLE')
  params.set('add', booking.student_email || '')

  return `${base}?${params.toString()}`
}

// ── Audit Action Labels & Icons ──
const AUDIT_ACTION_LABELS = {
  [AUDIT_ACTIONS.BOOKING_STATUS_CHANGE]: { label: 'Status Change', color: '#2196f3', icon: '🔄' },
  [AUDIT_ACTIONS.BOOKING_MEET_LINK_ADDED]: { label: 'Meet Link Added', color: '#4caf50', icon: '🔗' },
  [AUDIT_ACTIONS.BOOKING_NOTE_SAVED]: { label: 'Note Saved', color: '#9c27b0', icon: '📝' },
  [AUDIT_ACTIONS.BOOKING_CALENDAR_SYNC]: { label: 'Calendar Sync', color: '#1a73e8', icon: '📅' },
  [AUDIT_ACTIONS.BOOKING_BULK_STATUS]: { label: 'Bulk Update', color: '#ff9800', icon: '⚡' },
  [AUDIT_ACTIONS.BOOKING_BULK_DELETE]: { label: 'Bulk Delete', color: '#f44336', icon: '🗑️' },
  [AUDIT_ACTIONS.BOOKING_CSV_EXPORT]: { label: 'CSV Export', color: '#607d8b', icon: '📊' },
  [AUDIT_ACTIONS.BOOKING_EMAIL_SENT]: { label: 'Email Sent', color: '#00bcd4', icon: '✉️' },
  [AUDIT_ACTIONS.ENQUIRY_DELETED]: { label: 'Enquiry Deleted', color: '#f44336', icon: '🗑️' },
  [AUDIT_ACTIONS.ENQUIRY_REPLIED]: { label: 'Enquiry Replied', color: '#4caf50', icon: '↩️' },
  [AUDIT_ACTIONS.ADMIN_LOGIN]: { label: 'Admin Login', color: '#673ab7', icon: '🔐' },
  [AUDIT_ACTIONS.ADMIN_PANEL_VIEWED]: { label: 'Panel Viewed', color: '#795548', icon: '👁️' },
}

const SEVERITY_CONFIG = {
  [SEVERITY.INFO]: { color: '#2196f3', bg: 'rgba(33,150,243,0.08)', label: 'Info' },
  [SEVERITY.WARNING]: { color: '#ff9800', bg: 'rgba(255,152,0,0.08)', label: 'Warning' },
  [SEVERITY.CRITICAL]: { color: '#f44336', bg: 'rgba(244,67,54,0.08)', label: 'Critical' },
}

export default function AdminPanel() {
  const { user, getUserName } = useAuth()
  const toast = useToast()

  // Admin info for audit logs
  const adminInfo = useMemo(() => ({
    email: user?.email,
    name: getUserName(),
  }), [user, getUserName])

  const [activeTab, setActiveTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingEnquiries, setLoadingEnquiries] = useState(true)
  const [searchBookings, setSearchBookings] = useState('')
  const [searchEnquiries, setSearchEnquiries] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)
  const [meetLinkInputs, setMeetLinkInputs] = useState({})
  const [showMeetInput, setShowMeetInput] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [detailBooking, setDetailBooking] = useState(null)
  const [noteInputs, setNoteInputs] = useState({})
  const [savingNote, setSavingNote] = useState(null)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [activityLog, setActivityLog] = useState([])

  // ── Audit Log State ──
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false)
  const [auditFilter, setAuditFilter] = useState('all')
  const [auditSeverityFilter, setAuditSeverityFilter] = useState('all')
  const [auditSearch, setAuditSearch] = useState('')

  // ── Log admin panel viewed on mount ──
  const hasLoggedView = useRef(false)
  useEffect(() => {
    if (!hasLoggedView.current && adminInfo.email) {
      hasLoggedView.current = true
      logAdminPanelViewed(adminInfo)
    }
  }, [adminInfo])

  // ── Load audit logs when tab is active ──
  const loadAuditLogs = useCallback(async () => {
    setLoadingAuditLogs(true)
    try {
      const data = await fetchAuditLogs({ limit: 200 })
      setAuditLogs(data || [])
    } catch (err) {
      console.warn('Failed to load audit logs:', err)
    } finally {
      setLoadingAuditLogs(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs()
    }
  }, [activeTab, loadAuditLogs])

  // ── Load data + real-time subscription ──
  const loadBookings = useCallback(async () => {
    setLoadingBookings(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setBookings(data || [])
    } catch (err) {
      toast('Failed to load bookings: ' + err.message, 'error')
    } finally { setLoadingBookings(false) }
  }, [toast])

  const loadEnquiries = useCallback(async () => {
    setLoadingEnquiries(true)
    try {
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setEnquiries(data || [])
    } catch (err) {
      toast('Failed to load enquiries: ' + err.message, 'error')
    } finally { setLoadingEnquiries(false) }
  }, [toast])

  useEffect(() => {
    loadBookings()
    loadEnquiries()

    const bookingSub = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBookings(prev => [payload.new, ...prev])
          setActivityLog(prev => [{
            type: 'booking_new',
            message: `New booking from ${payload.new.student_name || 'Student'} — ${payload.new.subject}`,
            time: new Date().toISOString()
          }, ...prev].slice(0, 50))
          toast(`New booking received from ${payload.new.student_name || 'a student'}!`, 'info')
        } else if (payload.eventType === 'UPDATE') {
          setBookings(prev => prev.map(b => b.id === payload.new.id ? payload.new : b))
        } else if (payload.eventType === 'DELETE') {
          setBookings(prev => prev.filter(b => b.id !== payload.old.id))
        }
      })
      .subscribe()

    const enquirySub = supabase
      .channel('admin-enquiries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setEnquiries(prev => [payload.new, ...prev])
          setActivityLog(prev => [{
            type: 'enquiry_new',
            message: `New enquiry from ${payload.new.name || 'Someone'} — ${(payload.new.message || '').slice(0, 50)}`,
            time: new Date().toISOString()
          }, ...prev].slice(0, 50))
          toast(`New enquiry from ${payload.new.name || 'someone'}!`, 'info')
        } else if (payload.eventType === 'DELETE') {
          setEnquiries(prev => prev.filter(e => e.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(bookingSub)
      supabase.removeChannel(enquirySub)
    }
  }, [loadBookings, loadEnquiries, toast])

  // ── AUDITED: Update Booking Status ──
  const updateBookingStatus = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      const booking = bookings.find(b => b.id === id)
      const oldStatus = booking?.status || 'unknown'

      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
      setActivityLog(prev => [{
        type: `booking_${newStatus}`,
        message: `Booking for ${booking?.student_name || 'Student'} marked as ${newStatus}`,
        time: new Date().toISOString()
      }, ...prev].slice(0, 50))

      // 🔒 AUDIT LOG
      logBookingStatusChange(booking, oldStatus, newStatus, adminInfo)

      if (booking?.student_email) {
        sendBookingStatusUpdate(booking.student_email, {
          studentName: booking.student_name,
          subject: booking.subject,
          date: booking.booking_date,
          time: booking.booking_time,
          status: newStatus,
          meetLink: booking.meet_link || null
        })
      }

      toast(`Booking ${newStatus} successfully.`, 'success')
    } catch (err) {
      toast('Failed to update: ' + err.message, 'error')
    } finally { setUpdatingId(null) }
  }

  // ── AUDITED: Add Meet Link ──
  const addMeetLink = async (id) => {
    const link = meetLinkInputs[id]?.trim()
    if (!link) return toast('Please enter a Google Meet link.', 'warning')
    if (!link.includes('meet.google.com') && !link.includes('google.com')) {
      return toast('Please enter a valid Google Meet link.', 'warning')
    }
    setUpdatingId(id)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ meet_link: link })
        .eq('id', id)
      if (error) throw error
      setBookings(prev => prev.map(b => b.id === id ? { ...b, meet_link: link } : b))
      setShowMeetInput(null)
      setMeetLinkInputs(prev => ({ ...prev, [id]: '' }))

      const booking = bookings.find(b => b.id === id)

      // 🔒 AUDIT LOG
      logMeetLinkAdded(booking, link, adminInfo)

      if (booking?.student_email) {
        sendMeetLinkEmail(booking.student_email, {
          studentName: booking.student_name,
          subject: booking.subject,
          date: booking.booking_date,
          time: booking.booking_time,
          meetLink: link
        })
      }

      toast('Google Meet link added successfully!', 'success')
    } catch (err) {
      toast('Failed to add meet link: ' + err.message, 'error')
    } finally { setUpdatingId(null) }
  }

  // ── AUDITED: Save admin notes ──
  const saveNote = async (id) => {
    const note = noteInputs[id]?.trim()
    if (!note) return
    setSavingNote(id)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ admin_notes: note })
        .eq('id', id)
      if (error) throw error
      setBookings(prev => prev.map(b => b.id === id ? { ...b, admin_notes: note } : b))

      const booking = bookings.find(b => b.id === id)
      // 🔒 AUDIT LOG
      logNoteSaved(booking, note, adminInfo)

      toast('Note saved.', 'success')
    } catch (err) {
      toast('Failed to save note: ' + err.message, 'error')
    } finally { setSavingNote(null) }
  }

  // ── AUDITED: Calendar event ──
  const createCalendarEvent = (booking) => {
    const url = buildGoogleCalendarUrl(booking)
    window.open(url, '_blank', 'noopener,noreferrer')
    // 🔒 AUDIT LOG
    logCalendarSync(booking, adminInfo)
    toast('Google Calendar opened — save the event to auto-generate a Meet link.', 'info')
    setShowMeetInput(booking.id)
  }

  const bulkCreateCalendarEvents = () => {
    const pendingMeet = bookings.filter(b => b.google_meet && !b.meet_link && (b.status === 'pending' || b.status === 'confirmed'))
    if (pendingMeet.length === 0) return toast('No pending Meet requests to sync.', 'info')
    if (!window.confirm(`Open Google Calendar for ${pendingMeet.length} booking(s)?`)) return
    pendingMeet.forEach((b, i) => {
      setTimeout(() => {
        window.open(buildGoogleCalendarUrl(b), '_blank', 'noopener,noreferrer')
      }, i * 600)
    })
    toast(`Opened ${pendingMeet.length} calendar event(s).`, 'success')
  }

  // ── AUDITED: Export CSV ──
  const exportCSV = () => {
    if (filteredBookings.length === 0) return toast('No bookings to export.', 'warning')
    const headers = ['Student', 'Email', 'Year Group', 'Subject', 'Date', 'Time', 'Price', 'Status', 'Google Meet', 'Meet Link', 'Notes', 'Created']
    const rows = filteredBookings.map(b => [
      b.student_name || '', b.student_email || '', b.tutor_name || '', b.subject || '',
      b.booking_date || '', b.booking_time || '', b.price || '', b.status || '',
      b.google_meet ? 'Yes' : 'No', b.meet_link || '', (b.admin_notes || '').replace(/,/g, ';'),
      b.created_at ? new Date(b.created_at).toLocaleString() : ''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zenith-bookings-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)

    // 🔒 AUDIT LOG
    logCSVExport(filteredBookings.length, adminInfo)
    toast(`Exported ${filteredBookings.length} bookings to CSV.`, 'success')
  }

  // ── AUDITED: Email student ──
  const emailStudent = (booking) => {
    const subject = encodeURIComponent(`Zenith Pranavi — Your ${booking.subject} Session on ${formatDate(booking.booking_date)}`)
    const body = encodeURIComponent(
      `Hi ${booking.student_name || 'Student'},\n\nRegarding your ${booking.subject} session scheduled for ${formatDate(booking.booking_date)} at ${booking.booking_time}.\n\n${booking.meet_link ? `Google Meet Link: ${booking.meet_link}\n\n` : ''}Best regards,\nZenith Pranavi Education`
    )
    window.open(`mailto:${booking.student_email || ''}?subject=${subject}&body=${body}`, '_self')
    // 🔒 AUDIT LOG
    logEmailSent(booking, adminInfo)
  }

  // ── AUDITED: Delete enquiry ──
  const deleteEnquiry = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return
    const enquiry = enquiries.find(e => e.id === id)
    try {
      const { error } = await supabase.from('enquiries').delete().eq('id', id)
      if (error) throw error
      setEnquiries(prev => prev.filter(e => e.id !== id))
      // 🔒 AUDIT LOG
      logEnquiryDeleted(enquiry, adminInfo)
      toast('Enquiry deleted.', 'success')
    } catch (err) {
      toast('Failed to delete: ' + err.message, 'error')
    }
  }

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const timeAgo = (d) => {
    if (!d) return ''
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  // ── Sorting ──
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Filter & search bookings
  const filteredBookings = useMemo(() => {
    let result = bookings.filter(b => {
      if (filterStatus !== 'all' && b.status !== filterStatus) return false
      if (searchBookings) {
        const q = searchBookings.toLowerCase()
        return (
          (b.student_name || '').toLowerCase().includes(q) ||
          (b.subject || '').toLowerCase().includes(q) ||
          (b.tutor_name || '').toLowerCase().includes(q) ||
          (b.student_email || '').toLowerCase().includes(q)
        )
      }
      return true
    })
    result.sort((a, b) => {
      let aVal, bVal
      if (sortField === 'booking_date') {
        aVal = a.booking_date || ''; bVal = b.booking_date || ''
      } else if (sortField === 'price') {
        aVal = a.price || 0; bVal = b.price || 0
      } else if (sortField === 'student_name') {
        aVal = (a.student_name || '').toLowerCase(); bVal = (b.student_name || '').toLowerCase()
      } else {
        aVal = a.created_at || ''; bVal = b.created_at || ''
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [bookings, filterStatus, searchBookings, sortField, sortDir])

  // Filter & search enquiries
  const filteredEnquiries = enquiries.filter(e => {
    if (searchEnquiries) {
      const q = searchEnquiries.toLowerCase()
      return (
        (e.name || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.message || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  // Filter audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (auditFilter !== 'all' && log.action !== auditFilter) return false
      if (auditSeverityFilter !== 'all' && log.severity !== auditSeverityFilter) return false
      if (auditSearch) {
        const q = auditSearch.toLowerCase()
        return (
          (log.description || '').toLowerCase().includes(q) ||
          (log.admin_email || '').toLowerCase().includes(q) ||
          (log.action || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [auditLogs, auditFilter, auditSeverityFilter, auditSearch])

  // Stats
  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
  const completedBookings = bookings.filter(b => b.status === 'completed').length
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.price || 0), 0)
  const meetRequests = bookings.filter(b => b.google_meet && !b.meet_link).length
  const meetLinked = bookings.filter(b => b.google_meet && b.meet_link).length

  const todayStr = new Date().toISOString().slice(0, 10)
  const todaysBookings = bookings.filter(b => b.booking_date?.slice(0,10) === todayStr)
  const upcomingBookings = bookings
    .filter(b => b.booking_date && b.booking_date >= todayStr && (b.status === 'pending' || b.status === 'confirmed'))
    .sort((a, b) => (a.booking_date + a.booking_time).localeCompare(b.booking_date + b.booking_time))
    .slice(0, 5)

  const revenueByStatus = {
    confirmed: bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.price || 0), 0),
    completed: bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.price || 0), 0)
  }

  // Analytics data
  const bookingsByMonth = useMemo(() => {
    const months = {}
    bookings.forEach(b => {
      if (!b.created_at) return
      const d = new Date(b.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
      if (!months[key]) months[key] = { label, count: 0, revenue: 0 }
      months[key].count++
      if (b.status === 'confirmed' || b.status === 'completed') months[key].revenue += (b.price || 0)
    })
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v)
  }, [bookings])

  const subjectBreakdown = useMemo(() => {
    const subjects = {}
    bookings.forEach(b => {
      const s = b.subject || 'Other'
      if (!subjects[s]) subjects[s] = 0
      subjects[s]++
    })
    return Object.entries(subjects).sort(([, a], [, b]) => b - a).slice(0, 6)
  }, [bookings])

  const avgSessionPrice = totalBookings > 0 ? (bookings.reduce((s, b) => s + (b.price || 0), 0) / totalBookings).toFixed(0) : 0
  const conversionRate = totalBookings > 0 ? ((confirmedBookings + completedBookings) / totalBookings * 100).toFixed(1) : 0

  // Bulk actions
  const [selectedBookings, setSelectedBookings] = useState(new Set())
  const toggleBookingSelect = (id) => {
    setSelectedBookings(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAllVisible = () => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set())
    } else {
      setSelectedBookings(new Set(filteredBookings.map(b => b.id)))
    }
  }

  // ── AUDITED: Bulk update status ──
  const bulkUpdateStatus = async (newStatus) => {
    if (selectedBookings.size === 0) return toast('No bookings selected.', 'warning')
    if (!window.confirm(`Update ${selectedBookings.size} booking(s) to "${newStatus}"?`)) return
    setUpdatingId('bulk')
    try {
      const ids = Array.from(selectedBookings)
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .in('id', ids)
      if (error) throw error
      setBookings(prev => prev.map(b => ids.includes(b.id) ? { ...b, status: newStatus } : b))
      setSelectedBookings(new Set())

      // 🔒 AUDIT LOG
      logBulkStatusChange(ids.length, newStatus, adminInfo)

      toast(`${ids.length} booking(s) updated to ${newStatus}.`, 'success')
    } catch (err) {
      toast('Bulk update failed: ' + err.message, 'error')
    } finally { setUpdatingId(null) }
  }

  // ── AUDITED: Bulk delete ──
  const bulkDelete = async () => {
    if (selectedBookings.size === 0) return toast('No bookings selected.', 'warning')
    if (!window.confirm(`Permanently delete ${selectedBookings.size} booking(s)? This cannot be undone.`)) return
    setUpdatingId('bulk')
    try {
      const ids = Array.from(selectedBookings)
      const { error } = await supabase
        .from('bookings')
        .delete()
        .in('id', ids)
      if (error) throw error
      setBookings(prev => prev.filter(b => !ids.includes(b.id)))
      setSelectedBookings(new Set())

      // 🔒 AUDIT LOG
      logBulkDelete(ids.length, adminInfo)

      toast(`${ids.length} booking(s) deleted.`, 'success')
    } catch (err) {
      toast('Bulk delete failed: ' + err.message, 'error')
    } finally { setUpdatingId(null) }
  }

  // ── Calendar view data ──
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [calendarMonth])

  const bookingsByDate = useMemo(() => {
    const map = {}
    bookings.forEach(b => {
      if (!b.booking_date) return
      const key = b.booking_date.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(b)
    })
    return map
  }, [bookings])

  const calendarMonthStr = calendarMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return <span style={{ fontSize: '0.6rem', marginLeft: 3 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  return (
    <main id="admin-panel">
      {/* ── Enhanced Hero with gradient mesh ── */}
      <section className="admin-hero admin-hero-enhanced">
        <div className="admin-hero-mesh" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="admin-hero-content">
            <div className="admin-hero-badge">
              <Shield size={14} /> Admin Portal
            </div>
            <h1>Dashboard</h1>
            <p>Welcome, <strong>{getUserName()}</strong>. Manage bookings, calendar sync, enquiries, and Meet links.</p>
            {todaysBookings.length > 0 && (
              <div className="admin-hero-alert">
                <AlertCircle size={16} />
                <span>You have <strong>{todaysBookings.length}</strong> session{todaysBookings.length > 1 ? 's' : ''} today</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Enhanced Stats Cards ── */}
      <section className="admin-section">
        <div className="container">
          <div className="admin-stats-grid admin-stats-enhanced">
            <div className="admin-stat-card admin-stat-glow admin-stat-glow-blue">
              <div className="admin-stat-icon admin-stat-icon-blue"><Calendar size={22} /></div>
              <div>
                <div className="admin-stat-number">{totalBookings}</div>
                <div className="admin-stat-label">Total Bookings</div>
              </div>
              <div className="admin-stat-trend"><TrendingUp size={14} /></div>
            </div>
            <div className="admin-stat-card admin-stat-glow admin-stat-glow-amber">
              <div className="admin-stat-icon admin-stat-icon-amber"><Clock size={22} /></div>
              <div>
                <div className="admin-stat-number">{pendingBookings}</div>
                <div className="admin-stat-label">Pending</div>
              </div>
              {pendingBookings > 0 && <div className="admin-stat-pulse" />}
            </div>
            <div className="admin-stat-card admin-stat-glow admin-stat-glow-green">
              <div className="admin-stat-icon admin-stat-icon-green"><CheckCircle size={22} /></div>
              <div>
                <div className="admin-stat-number">{confirmedBookings}</div>
                <div className="admin-stat-label">Confirmed</div>
              </div>
            </div>
            <div className="admin-stat-card admin-stat-glow admin-stat-glow-purple">
              <div className="admin-stat-icon admin-stat-icon-purple"><Video size={22} /></div>
              <div>
                <div className="admin-stat-number">{meetLinked} / {meetLinked + meetRequests}</div>
                <div className="admin-stat-label">Meet Linked</div>
              </div>
            </div>
            <div className="admin-stat-card admin-stat-glow admin-stat-glow-emerald">
              <div className="admin-stat-icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}><DollarSign size={22} /></div>
              <div>
                <div className="admin-stat-number">${totalRevenue}</div>
                <div className="admin-stat-label">Revenue</div>
              </div>
            </div>
            <div className="admin-stat-card admin-stat-glow admin-stat-glow-orange">
              <div className="admin-stat-icon" style={{ background: '#fff3e0', color: '#e65100' }}><Mail size={22} /></div>
              <div>
                <div className="admin-stat-number">{enquiries.length}</div>
                <div className="admin-stat-label">Enquiries</div>
              </div>
            </div>
          </div>

          {/* ── Quick Overview Panel ── */}
          {(todaysBookings.length > 0 || upcomingBookings.length > 0) && (
            <div className="admin-overview-panel">
              {todaysBookings.length > 0 && (
                <div className="admin-overview-section admin-overview-glass">
                  <h4 className="admin-overview-title"><Activity size={16} /> Today&rsquo;s Sessions ({todaysBookings.length})</h4>
                  <div className="admin-overview-list">
                    {todaysBookings.map(b => (
                      <div key={b.id} className="admin-overview-item">
                        <span className={`status-dot status-dot-${b.status}`} />
                        <div className="admin-overview-item-info">
                          <strong>{b.student_name || 'Student'}</strong>
                          <span>{b.subject} — {b.booking_time}</span>
                        </div>
                        <div className="admin-overview-item-actions">
                          {b.meet_link && (
                            <a href={b.meet_link} target="_blank" rel="noopener noreferrer" className="admin-meet-link" title="Join Meet">
                              <Video size={12} /> Join
                            </a>
                          )}
                          <span className={`status-badge ${b.status}`}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {upcomingBookings.length > 0 && (
                <div className="admin-overview-section admin-overview-glass">
                  <h4 className="admin-overview-title"><TrendingUp size={16} /> Upcoming Sessions</h4>
                  <div className="admin-overview-list">
                    {upcomingBookings.map(b => (
                      <div key={b.id} className="admin-overview-item">
                        <span className={`status-dot status-dot-${b.status}`} />
                        <div className="admin-overview-item-info">
                          <strong>{b.student_name || 'Student'}</strong>
                          <span>{b.subject} — {formatDate(b.booking_date)} at {b.booking_time}</span>
                        </div>
                        <span className={`status-badge ${b.status}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Revenue Breakdown ── */}
          <div className="admin-revenue-breakdown">
            <div className="admin-revenue-bar">
              {totalRevenue > 0 ? (
                <>
                  <div className="admin-revenue-segment admin-revenue-confirmed" style={{ width: `${(revenueByStatus.confirmed / totalRevenue) * 100}%` }} title={`Confirmed: $${revenueByStatus.confirmed}`} />
                  <div className="admin-revenue-segment admin-revenue-completed" style={{ width: `${(revenueByStatus.completed / totalRevenue) * 100}%` }} title={`Completed: $${revenueByStatus.completed}`} />
                </>
              ) : (
                <div className="admin-revenue-segment admin-revenue-empty" style={{ width: '100%' }} />
              )}
            </div>
            <div className="admin-revenue-legend">
              <span className="admin-revenue-legend-item"><span className="admin-revenue-dot confirmed" /> Confirmed: ${revenueByStatus.confirmed}</span>
              <span className="admin-revenue-legend-item"><span className="admin-revenue-dot completed" /> Completed: ${revenueByStatus.completed}</span>
              <span className="admin-revenue-legend-item"><span className="admin-revenue-dot total" /> Total: ${totalRevenue}</span>
              <span className="admin-revenue-legend-item" style={{ marginLeft: 'auto', opacity: 0.6 }}>
                {completedBookings} completed · {cancelledBookings} cancelled
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Enhanced Tabs ── */}
      <section className="admin-section">
        <div className="container">
          <div className="admin-tabs admin-tabs-enhanced">
            <button className={`admin-tab${activeTab === 'bookings' ? ' active' : ''}`} onClick={() => setActiveTab('bookings')}>
              <Calendar size={16} /> <span>Bookings</span> <span className="admin-tab-count">{bookings.length}</span>
            </button>
            <button className={`admin-tab${activeTab === 'calendar' ? ' active' : ''}`} onClick={() => setActiveTab('calendar')}>
              <CalendarPlus size={16} /> <span>Calendar</span>
            </button>
            <button className={`admin-tab${activeTab === 'enquiries' ? ' active' : ''}`} onClick={() => setActiveTab('enquiries')}>
              <Mail size={16} /> <span>Enquiries</span> <span className="admin-tab-count">{enquiries.length}</span>
            </button>
            <button className={`admin-tab${activeTab === 'analytics' ? ' active' : ''}`} onClick={() => setActiveTab('analytics')}>
              <BarChart3 size={16} /> <span>Analytics</span>
            </button>
            <button className={`admin-tab${activeTab === 'audit' ? ' active' : ''}`} onClick={() => setActiveTab('audit')}>
              <Shield size={16} /> <span>Audit Log</span>
              {auditLogs.length > 0 && <span className="admin-tab-count admin-tab-count-audit">{auditLogs.length}</span>}
            </button>
            <button className={`admin-tab${activeTab === 'activity' ? ' active' : ''}`} onClick={() => setActiveTab('activity')}>
              <Activity size={16} /> <span>Activity</span>
            </button>
          </div>

          {/* ═══ Bookings Tab ═══ */}
          {activeTab === 'bookings' && (
            <div className="admin-tab-content admin-tab-fade">
              <div className="admin-toolbar">
                <div className="admin-search-box admin-search-enhanced">
                  <Search size={16} />
                  <input type="text" placeholder="Search by student, email, subject, or year..." value={searchBookings} onChange={e => setSearchBookings(e.target.value)} />
                </div>
                <div className="admin-filter-row">
                  <div className="admin-filter-select">
                    <Filter size={14} />
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  {meetRequests > 0 && (
                    <button className="admin-gcal-bulk-btn" onClick={bulkCreateCalendarEvents}>
                      <CalendarPlus size={14} /> Sync All ({meetRequests})
                    </button>
                  )}
                  <button className="admin-refresh-btn" onClick={exportCSV} title="Export CSV"><Download size={16} /></button>
                  <button className="admin-refresh-btn" onClick={loadBookings} title="Refresh"><RefreshCw size={16} /></button>
                </div>
              </div>

              {loadingBookings ? (
                <div className="admin-loading">
                  <div className="admin-spinner" />
                  <span>Loading bookings...</span>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="admin-empty admin-empty-enhanced">
                  <div className="admin-empty-icon"><BookOpen size={48} strokeWidth={1} /></div>
                  <h3>No bookings found</h3>
                  <p>{searchBookings || filterStatus !== 'all' ? 'Try adjusting your filters.' : 'No bookings have been made yet.'}</p>
                </div>
              ) : (
                <>
                {selectedBookings.size > 0 && (
                  <div className="admin-bulk-bar admin-bulk-enhanced">
                    <span className="admin-bulk-count"><Zap size={14} /> {selectedBookings.size} selected</span>
                    <div className="admin-bulk-actions">
                      <button className="admin-bulk-btn admin-bulk-confirm" onClick={() => bulkUpdateStatus('confirmed')} disabled={updatingId === 'bulk'}><CheckCircle size={14} /> Confirm</button>
                      <button className="admin-bulk-btn admin-bulk-complete" onClick={() => bulkUpdateStatus('completed')} disabled={updatingId === 'bulk'}><CheckCircle size={14} /> Complete</button>
                      <button className="admin-bulk-btn admin-bulk-cancel" onClick={() => bulkUpdateStatus('cancelled')} disabled={updatingId === 'bulk'}><XCircle size={14} /> Cancel</button>
                      <button className="admin-bulk-btn admin-bulk-delete" onClick={bulkDelete} disabled={updatingId === 'bulk'}><Trash2 size={14} /> Delete</button>
                    </div>
                    <button className="admin-bulk-clear" onClick={() => setSelectedBookings(new Set())}>Clear</button>
                  </div>
                )}
                <div className="admin-table-wrapper admin-table-enhanced">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}><input type="checkbox" checked={selectedBookings.size === filteredBookings.length && filteredBookings.length > 0} onChange={selectAllVisible} className="admin-checkbox" /></th>
                        <th style={{ width: 30 }} />
                        <th className="admin-th-sortable" onClick={() => handleSort('student_name')}>Student <SortIcon field="student_name" /></th>
                        <th>Year</th>
                        <th>Subject</th>
                        <th className="admin-th-sortable" onClick={() => handleSort('booking_date')}>Date <SortIcon field="booking_date" /></th>
                        <th>Time</th>
                        <th className="admin-th-sortable" onClick={() => handleSort('price')}>Price <SortIcon field="price" /></th>
                        <th>Meet / Calendar</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => (
                        <>
                          <tr key={b.id} className={`${expandedRows.has(b.id) ? 'admin-row-expanded' : ''}${selectedBookings.has(b.id) ? ' admin-row-selected' : ''}`}>
                            <td><input type="checkbox" checked={selectedBookings.has(b.id)} onChange={() => toggleBookingSelect(b.id)} className="admin-checkbox" /></td>
                            <td>
                              <button className="admin-expand-btn" onClick={() => toggleRow(b.id)} title={expandedRows.has(b.id) ? 'Collapse' : 'Expand'}>
                                {expandedRows.has(b.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </td>
                            <td>
                              <strong>{b.student_name || '-'}</strong>
                              {b.student_email && <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: 2 }}>{b.student_email}</div>}
                            </td>
                            <td>{b.tutor_name || '-'}</td>
                            <td>{b.subject}</td>
                            <td>{formatDate(b.booking_date)}</td>
                            <td>{b.booking_time}</td>
                            <td className="admin-price">${b.price}</td>
                            <td>
                              <div className="admin-meet-cell">
                                {b.google_meet ? (
                                  b.meet_link ? (
                                    <a href={b.meet_link} target="_blank" rel="noopener noreferrer" className="admin-meet-link"><Video size={13} /> Join Meet</a>
                                  ) : (
                                    <div className="admin-meet-actions-col">
                                      <button className="admin-gcal-btn" onClick={() => createCalendarEvent(b)}><CalendarPlus size={13} /> Calendar + Meet</button>
                                      <button className="admin-meet-add-btn" onClick={() => setShowMeetInput(showMeetInput === b.id ? null : b.id)}><Link2 size={13} /> Paste Link</button>
                                    </div>
                                  )
                                ) : (
                                  <span className="meet-none">—</span>
                                )}
                                {showMeetInput === b.id && (
                                  <div className="admin-meet-input-row">
                                    <input type="url" placeholder="meet.google.com/..." value={meetLinkInputs[b.id] || ''} onChange={e => setMeetLinkInputs(prev => ({ ...prev, [b.id]: e.target.value }))} className="admin-meet-input" />
                                    <button className="admin-meet-save" onClick={() => addMeetLink(b.id)} disabled={updatingId === b.id}>Save</button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td><span className={`status-badge status-badge-enhanced ${b.status}`}>{b.status}</span></td>
                            <td>
                              <div className="admin-actions">
                                {b.status === 'pending' && (
                                  <>
                                    <button className="admin-action-btn confirm" onClick={() => updateBookingStatus(b.id, 'confirmed')} disabled={updatingId === b.id} title="Confirm"><CheckCircle size={15} /></button>
                                    <button className="admin-action-btn cancel" onClick={() => updateBookingStatus(b.id, 'cancelled')} disabled={updatingId === b.id} title="Cancel"><XCircle size={15} /></button>
                                  </>
                                )}
                                {b.status === 'confirmed' && (
                                  <button className="admin-action-btn complete" onClick={() => updateBookingStatus(b.id, 'completed')} disabled={updatingId === b.id} title="Complete"><CheckCircle size={15} /></button>
                                )}
                                {(b.status === 'completed' || b.status === 'cancelled') && <span className="admin-action-done">—</span>}
                                <button className="admin-action-btn" onClick={() => setDetailBooking(b)} title="View Details" style={{ color: 'var(--text-medium)' }}><Eye size={15} /></button>
                                {b.student_email && <button className="admin-action-btn" onClick={() => emailStudent(b)} title="Email Student" style={{ color: '#1a73e8' }}><Send size={14} /></button>}
                              </div>
                            </td>
                          </tr>
                          {expandedRows.has(b.id) && (
                            <tr key={`${b.id}-detail`} className="admin-expanded-detail-row">
                              <td colSpan={11}>
                                <div className="admin-expanded-detail admin-expanded-enhanced">
                                  <div className="admin-detail-grid">
                                    <div className="admin-detail-item"><span className="admin-detail-label">Student Email</span><span className="admin-detail-value">{b.student_email || '—'}</span></div>
                                    <div className="admin-detail-item"><span className="admin-detail-label">Phone</span><span className="admin-detail-value">{b.phone || '—'}</span></div>
                                    <div className="admin-detail-item"><span className="admin-detail-label">Booked On</span><span className="admin-detail-value">{formatDateTime(b.created_at)}</span></div>
                                    <div className="admin-detail-item"><span className="admin-detail-label">Google Meet</span><span className="admin-detail-value">{b.google_meet ? (b.meet_link ? 'Linked ✓' : 'Requested — awaiting link') : 'Not requested'}</span></div>
                                  </div>
                                  <div className="admin-note-section">
                                    <label className="admin-note-label"><FileText size={14} /> Admin Notes</label>
                                    <div className="admin-note-input-row">
                                      <textarea className="admin-note-textarea" placeholder="Add a note about this booking..." value={noteInputs[b.id] !== undefined ? noteInputs[b.id] : (b.admin_notes || '')} onChange={e => setNoteInputs(prev => ({ ...prev, [b.id]: e.target.value }))} rows={2} />
                                      <button className="admin-meet-save" onClick={() => saveNote(b.id)} disabled={savingNote === b.id}>{savingNote === b.id ? '...' : 'Save'}</button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          )}

          {/* ═══ Calendar Sync Tab ═══ */}
          {activeTab === 'calendar' && (
            <div className="admin-tab-content admin-tab-fade">
              <div className="admin-calendar-header">
                <div className="admin-calendar-nav">
                  <button className="admin-cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
                  <h3 className="admin-cal-month">{calendarMonthStr}</h3>
                  <button className="admin-cal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
                </div>
                <div className="admin-calendar-actions">
                  {meetRequests > 0 && (
                    <button className="admin-gcal-bulk-btn" onClick={bulkCreateCalendarEvents}><CalendarPlus size={14} /> Sync All Pending ({meetRequests})</button>
                  )}
                  <button className="admin-refresh-btn" onClick={loadBookings} title="Refresh"><RefreshCw size={16} /></button>
                </div>
              </div>

              <div className="admin-calendar-grid">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="admin-cal-day-header">{d}</div>
                ))}
                {calendarDays.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} className="admin-cal-cell admin-cal-cell-empty" />
                  const dateKey = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const dayBookings = bookingsByDate[dateKey] || []
                  const isToday = dateKey === todayStr
                  return (
                    <div key={dateKey} className={`admin-cal-cell${isToday ? ' admin-cal-today' : ''}${dayBookings.length ? ' admin-cal-has-bookings' : ''}`}>
                      <div className="admin-cal-day-num">{day}</div>
                      {dayBookings.slice(0, 3).map(b => (
                        <div key={b.id} className={`admin-cal-event admin-cal-event-${b.status}`}>
                          <span className="admin-cal-event-time">{b.booking_time?.replace(':00 ', '')}</span>
                          <span className="admin-cal-event-name">{b.student_name?.split(' ')[0] || 'Student'}</span>
                          {b.google_meet && !b.meet_link && <button className="admin-cal-event-sync" onClick={() => createCalendarEvent(b)}><CalendarPlus size={10} /></button>}
                          {b.google_meet && b.meet_link && <a href={b.meet_link} target="_blank" rel="noopener noreferrer" className="admin-cal-event-meet"><Video size={10} /></a>}
                        </div>
                      ))}
                      {dayBookings.length > 3 && <div className="admin-cal-more">+{dayBookings.length - 3} more</div>}
                    </div>
                  )
                })}
              </div>

              {meetRequests > 0 && (
                <div className="admin-meet-pending-summary">
                  <div className="admin-meet-pending-header"><Video size={18} /><h4>{meetRequests} Booking{meetRequests > 1 ? 's' : ''} Awaiting Google Meet Link</h4></div>
                  <div className="admin-meet-pending-list">
                    {bookings.filter(b => b.google_meet && !b.meet_link).map(b => (
                      <div key={b.id} className="admin-meet-pending-item">
                        <div className="admin-meet-pending-info">
                          <strong>{b.student_name || 'Student'}</strong>
                          <span>{b.subject} — {formatDate(b.booking_date)} at {b.booking_time}</span>
                        </div>
                        <div className="admin-meet-pending-actions">
                          <button className="admin-gcal-btn" onClick={() => createCalendarEvent(b)}><CalendarPlus size={13} /> Calendar + Meet</button>
                          <button className="admin-meet-add-btn" onClick={() => { setActiveTab('bookings'); setShowMeetInput(b.id) }}><Link2 size={13} /> Paste Link</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ Enquiries Tab ═══ */}
          {activeTab === 'enquiries' && (
            <div className="admin-tab-content admin-tab-fade">
              <div className="admin-toolbar">
                <div className="admin-search-box admin-search-enhanced"><Search size={16} /><input type="text" placeholder="Search by name, email, or message..." value={searchEnquiries} onChange={e => setSearchEnquiries(e.target.value)} /></div>
                <button className="admin-refresh-btn" onClick={loadEnquiries} title="Refresh"><RefreshCw size={16} /></button>
              </div>
              {loadingEnquiries ? (
                <div className="admin-loading"><div className="admin-spinner" /><span>Loading enquiries...</span></div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="admin-empty admin-empty-enhanced"><div className="admin-empty-icon"><Mail size={48} strokeWidth={1} /></div><h3>No enquiries found</h3><p>{searchEnquiries ? 'Try a different search term.' : 'No enquiries submitted yet.'}</p></div>
              ) : (
                <div className="admin-enquiries-grid">
                  {filteredEnquiries.map(e => (
                    <div key={e.id} className="admin-enquiry-card admin-enquiry-enhanced">
                      <div className="admin-enquiry-header">
                        <div className="admin-enquiry-avatar">{(e.name || 'U').charAt(0).toUpperCase()}</div>
                        <div className="admin-enquiry-meta"><strong>{e.name}</strong><a href={`mailto:${e.email}`}>{e.email}</a></div>
                        <button className="admin-enquiry-delete" onClick={() => deleteEnquiry(e.id)} title="Delete"><XCircle size={16} /></button>
                      </div>
                      <div className="admin-enquiry-body"><p>{e.message}</p></div>
                      <div className="admin-enquiry-footer">
                        <span>{formatDateTime(e.created_at)}</span>
                        <a href={`mailto:${e.email}?subject=Re: Your enquiry to Zenith Pranavi`} className="admin-reply-btn">Reply <ArrowUpRight size={12} /></a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ Analytics Tab ═══ */}
          {activeTab === 'analytics' && (
            <div className="admin-tab-content admin-tab-fade">
              <div className="analytics-header">
                <h3 className="analytics-title"><BarChart3 size={18} /> Booking Analytics</h3>
                <span className="analytics-sub">Visual overview of your booking performance</span>
              </div>

              <div className="analytics-kpi-grid">
                <div className="analytics-kpi-card analytics-kpi-enhanced">
                  <div className="analytics-kpi-value">{totalBookings}</div>
                  <div className="analytics-kpi-label">Total Bookings</div>
                  <div className="analytics-kpi-bar"><div className="analytics-kpi-fill analytics-kpi-fill-blue" style={{ width: '100%' }} /></div>
                </div>
                <div className="analytics-kpi-card analytics-kpi-enhanced">
                  <div className="analytics-kpi-value">{conversionRate}%</div>
                  <div className="analytics-kpi-label">Conversion Rate</div>
                  <div className="analytics-kpi-bar"><div className="analytics-kpi-fill analytics-kpi-fill-green" style={{ width: `${conversionRate}%` }} /></div>
                </div>
                <div className="analytics-kpi-card analytics-kpi-enhanced">
                  <div className="analytics-kpi-value">${avgSessionPrice}</div>
                  <div className="analytics-kpi-label">Avg Session Price</div>
                  <div className="analytics-kpi-bar"><div className="analytics-kpi-fill analytics-kpi-fill-gold" style={{ width: `${Math.min((avgSessionPrice / 27) * 100, 100)}%` }} /></div>
                </div>
                <div className="analytics-kpi-card analytics-kpi-enhanced">
                  <div className="analytics-kpi-value">${totalRevenue}</div>
                  <div className="analytics-kpi-label">Total Revenue</div>
                  <div className="analytics-kpi-bar"><div className="analytics-kpi-fill analytics-kpi-fill-purple" style={{ width: '100%' }} /></div>
                </div>
              </div>

              <div className="analytics-charts-row">
                <div className="analytics-chart-card">
                  <h4 className="analytics-chart-title">Bookings by Status</h4>
                  <div className="analytics-status-bars">
                    {[
                      { label: 'Pending', count: pendingBookings, color: '#ff9800', pct: totalBookings > 0 ? (pendingBookings / totalBookings * 100) : 0 },
                      { label: 'Confirmed', count: confirmedBookings, color: '#4caf50', pct: totalBookings > 0 ? (confirmedBookings / totalBookings * 100) : 0 },
                      { label: 'Completed', count: completedBookings, color: '#2196f3', pct: totalBookings > 0 ? (completedBookings / totalBookings * 100) : 0 },
                      { label: 'Cancelled', count: cancelledBookings, color: '#f44336', pct: totalBookings > 0 ? (cancelledBookings / totalBookings * 100) : 0 }
                    ].map(s => (
                      <div key={s.label} className="analytics-bar-row">
                        <span className="analytics-bar-label">{s.label}</span>
                        <div className="analytics-bar-track"><div className="analytics-bar-fill" style={{ width: `${Math.max(s.pct, 2)}%`, background: s.color }} /></div>
                        <span className="analytics-bar-value">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analytics-chart-card">
                  <h4 className="analytics-chart-title">Top Subjects</h4>
                  <div className="analytics-status-bars">
                    {subjectBreakdown.length === 0 ? (
                      <p style={{ color: 'var(--text-light)', fontSize: '0.82rem', textAlign: 'center', padding: 20 }}>No data yet</p>
                    ) : subjectBreakdown.map(([subject, count], i) => (
                      <div key={subject} className="analytics-bar-row">
                        <span className="analytics-bar-label" title={subject}>{subject.length > 14 ? subject.slice(0, 14) + '…' : subject}</span>
                        <div className="analytics-bar-track"><div className="analytics-bar-fill" style={{ width: `${(count / (subjectBreakdown[0]?.[1] || 1)) * 100}%`, background: ['var(--gold)', 'var(--pink)', '#2196f3', '#4caf50', '#ff9800', '#9c27b0'][i % 6] }} /></div>
                        <span className="analytics-bar-value">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {bookingsByMonth.length > 0 && (
                <div className="analytics-chart-card analytics-chart-wide">
                  <h4 className="analytics-chart-title">Monthly Trend (Last 6 Months)</h4>
                  <div className="analytics-monthly-chart">
                    {bookingsByMonth.map((m, i) => {
                      const maxCount = Math.max(...bookingsByMonth.map(x => x.count), 1)
                      return (
                        <div key={i} className="analytics-month-col">
                          <span className="analytics-month-value">{m.count}</span>
                          <div className="analytics-month-bar-wrap"><div className="analytics-month-bar" style={{ height: `${(m.count / maxCount) * 100}%` }} /></div>
                          <span className="analytics-month-label">{m.label}</span>
                          <span className="analytics-month-revenue">${m.revenue}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="analytics-quick-stats">
                <div className="analytics-quick-stat"><Users size={16} /><span>Unique Students: <strong>{new Set(bookings.map(b => b.student_email).filter(Boolean)).size}</strong></span></div>
                <div className="analytics-quick-stat"><Video size={16} /><span>Meet Requests: <strong>{meetRequests + meetLinked}</strong> ({meetLinked} linked)</span></div>
                <div className="analytics-quick-stat"><Mail size={16} /><span>Enquiries: <strong>{enquiries.length}</strong></span></div>
                <div className="analytics-quick-stat"><TrendingUp size={16} /><span>This Month: <strong>{bookings.filter(b => { const d = new Date(b.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length}</strong> bookings</span></div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
               🔒 AUDIT LOG TAB — NEW FEATURE
               ═══════════════════════════════════════════════ */}
          {activeTab === 'audit' && (
            <div className="admin-tab-content admin-tab-fade">
              <div className="audit-header">
                <div className="audit-header-text">
                  <h3 className="audit-title"><Shield size={20} /> Audit Log</h3>
                  <p className="audit-subtitle">Complete record of all admin actions — who did what, when, and to which entity.</p>
                </div>
                <button className="admin-refresh-btn" onClick={loadAuditLogs} title="Refresh Audit Logs"><RefreshCw size={16} /></button>
              </div>

              {/* Audit Filters */}
              <div className="audit-toolbar">
                <div className="admin-search-box admin-search-enhanced">
                  <Search size={16} />
                  <input type="text" placeholder="Search audit logs..." value={auditSearch} onChange={e => setAuditSearch(e.target.value)} />
                </div>
                <div className="audit-filter-row">
                  <div className="admin-filter-select">
                    <Filter size={14} />
                    <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)}>
                      <option value="all">All Actions</option>
                      {Object.entries(AUDIT_ACTION_LABELS).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-filter-select">
                    <AlertCircle size={14} />
                    <select value={auditSeverityFilter} onChange={e => setAuditSeverityFilter(e.target.value)}>
                      <option value="all">All Severity</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Audit Stats Summary */}
              <div className="audit-stats-row">
                <div className="audit-stat-pill">
                  <span className="audit-stat-num">{auditLogs.length}</span>
                  <span>Total Entries</span>
                </div>
                <div className="audit-stat-pill audit-stat-warning">
                  <span className="audit-stat-num">{auditLogs.filter(l => l.severity === 'warning').length}</span>
                  <span>Warnings</span>
                </div>
                <div className="audit-stat-pill audit-stat-critical">
                  <span className="audit-stat-num">{auditLogs.filter(l => l.severity === 'critical').length}</span>
                  <span>Critical</span>
                </div>
                <div className="audit-stat-pill">
                  <span className="audit-stat-num">{new Set(auditLogs.map(l => l.admin_email).filter(Boolean)).size}</span>
                  <span>Admins Active</span>
                </div>
              </div>

              {/* Audit Log List */}
              {loadingAuditLogs ? (
                <div className="admin-loading"><div className="admin-spinner" /><span>Loading audit logs...</span></div>
              ) : filteredAuditLogs.length === 0 ? (
                <div className="admin-empty admin-empty-enhanced">
                  <div className="admin-empty-icon"><Shield size={48} strokeWidth={1} /></div>
                  <h3>No audit logs found</h3>
                  <p>{auditSearch || auditFilter !== 'all' || auditSeverityFilter !== 'all' ? 'Try adjusting your filters.' : 'Admin actions will be recorded here automatically.'}</p>
                </div>
              ) : (
                <div className="audit-log-list">
                  {filteredAuditLogs.map((log, idx) => {
                    const actionConfig = AUDIT_ACTION_LABELS[log.action] || { label: log.action, color: '#607d8b', icon: '📋' }
                    const sevConfig = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info
                    let meta = {}
                    try { meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : (log.metadata || {}) } catch { meta = {} }
                    
                    return (
                      <div key={log.id || idx} className={`audit-log-item audit-log-severity-${log.severity}`}>
                        <div className="audit-log-icon" style={{ background: sevConfig.bg, color: actionConfig.color }}>
                          <span>{actionConfig.icon}</span>
                        </div>
                        <div className="audit-log-content">
                          <div className="audit-log-top">
                            <span className="audit-log-action-badge" style={{ background: `${actionConfig.color}15`, color: actionConfig.color, borderColor: `${actionConfig.color}30` }}>
                              {actionConfig.label}
                            </span>
                            <span className="audit-log-severity-badge" style={{ background: sevConfig.bg, color: sevConfig.color }}>
                              {sevConfig.label}
                            </span>
                            {log.entity_type && (
                              <span className="audit-log-entity-badge">
                                {log.entity_type === 'booking' ? <Calendar size={10} /> : log.entity_type === 'enquiry' ? <Mail size={10} /> : <Sparkles size={10} />}
                                {log.entity_type}
                              </span>
                            )}
                          </div>
                          <p className="audit-log-desc">{log.description}</p>
                          {/* Metadata pills */}
                          {Object.keys(meta).length > 0 && (
                            <div className="audit-log-meta">
                              {Object.entries(meta).slice(0, 4).map(([k, v]) => (
                                <span key={k} className="audit-log-meta-pill" title={`${k}: ${v}`}>
                                  <strong>{k.replace(/_/g, ' ')}:</strong> {String(v).slice(0, 40)}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="audit-log-footer">
                            <span className="audit-log-admin">
                              <Shield size={11} /> {log.admin_name || log.admin_email || 'System'}
                            </span>
                            <span className="audit-log-time">
                              <Clock size={11} /> {formatDateTime(log.created_at)} ({timeAgo(log.created_at)})
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ Activity Log Tab ═══ */}
          {activeTab === 'activity' && (
            <div className="admin-tab-content admin-tab-fade">
              <div className="admin-activity-header">
                <h3 className="admin-activity-title"><Activity size={18} /> Recent Activity</h3>
                <span className="admin-activity-sub">Real-time updates from bookings and enquiries</span>
              </div>
              {activityLog.length === 0 ? (
                <div className="admin-empty admin-empty-enhanced">
                  <div className="admin-empty-icon"><Activity size={48} strokeWidth={1} /></div>
                  <h3>No activity yet</h3>
                  <p>Actions performed during this session will appear here in real-time.</p>
                </div>
              ) : (
                <div className="admin-activity-list">
                  {activityLog.map((log, i) => (
                    <div key={i} className={`admin-activity-item admin-activity-${log.type.split('_')[0]}`}>
                      <div className={`admin-activity-icon admin-activity-icon-${log.type.includes('new') ? 'new' : log.type.includes('confirmed') ? 'confirmed' : log.type.includes('completed') ? 'completed' : log.type.includes('cancelled') ? 'cancelled' : 'default'}`}>
                        {log.type.includes('booking') ? <Calendar size={14} /> : <Mail size={14} />}
                      </div>
                      <div className="admin-activity-content">
                        <span className="admin-activity-msg">{log.message}</span>
                        <span className="admin-activity-time">{timeAgo(log.time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Booking Detail Modal ── */}
      {detailBooking && (
        <div className="modal-overlay active" onClick={() => setDetailBooking(null)}>
          <div className="modal admin-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDetailBooking(null)}>&times;</button>
            <div className="admin-detail-modal-header">
              <div className="admin-enquiry-avatar" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                {(detailBooking.student_name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: 2 }}>
                  {detailBooking.student_name || 'Student'}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{detailBooking.student_email || 'No email'}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 20 }}>
              {[
                ['Subject', detailBooking.subject],
                ['Year Group', detailBooking.tutor_name],
                ['Date', formatDate(detailBooking.booking_date)],
                ['Time', detailBooking.booking_time],
                ['Price', `$${detailBooking.price}/hr`],
                ['Status', detailBooking.status],
                ['Google Meet', detailBooking.google_meet ? (detailBooking.meet_link ? 'Linked ✓' : 'Pending') : 'No'],
                ['Booked', formatDateTime(detailBooking.created_at)]
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 500 }}>{val || '—'}</div>
                </div>
              ))}
            </div>
            {detailBooking.meet_link && (
              <div style={{ marginTop: 16 }}>
                <a href={detailBooking.meet_link} target="_blank" rel="noopener noreferrer" className="admin-meet-link" style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
                  <Video size={15} /> Join Google Meet
                </a>
              </div>
            )}
            {detailBooking.admin_notes && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 4 }}>Admin Notes</div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-warm)', whiteSpace: 'pre-wrap' }}>{detailBooking.admin_notes}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {detailBooking.student_email && <button className="btn btn-outline btn-sm" onClick={() => emailStudent(detailBooking)}><Send size={14} /> Email Student</button>}
              {detailBooking.google_meet && !detailBooking.meet_link && <button className="btn btn-primary btn-sm" onClick={() => { createCalendarEvent(detailBooking); setDetailBooking(null) }}><CalendarPlus size={14} /> Create Calendar Event</button>}
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2026 Zenith Pranavi Education. Admin Panel.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
