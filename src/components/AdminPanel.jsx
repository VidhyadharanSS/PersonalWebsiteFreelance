import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { supabase } from '../lib/supabase'
import {
  Calendar, Mail, Clock, Search, Video, Link2,
  RefreshCw, CheckCircle, XCircle, Filter, DollarSign,
  CalendarPlus, ChevronLeft, ChevronRight, Download,
  Eye, Activity, TrendingUp,
  FileText, Send, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react'

// ── Google Calendar URL builder with Google Meet conferencing ──
function buildGoogleCalendarUrl(booking) {
  const base = 'https://calendar.google.com/calendar/render'
  const params = new URLSearchParams()
  params.set('action', 'TEMPLATE')
  params.set('text', `Zenith Pranavi — ${booking.subject} (${booking.tutor_name || 'Session'})`)

  // Build start/end datetime in UTC-ish format YYYYMMDDTHHMMSS
  if (booking.booking_date && booking.booking_time) {
    const dateStr = booking.booking_date // "YYYY-MM-DD"
    const timeStr = booking.booking_time  // "09:00 AM"
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (match) {
      let hours = parseInt(match[1], 10)
      const mins = parseInt(match[2], 10)
      const ampm = match[3].toUpperCase()
      if (ampm === 'PM' && hours !== 12) hours += 12
      if (ampm === 'AM' && hours === 12) hours = 0
      const startDt = new Date(`${dateStr}T${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00`)
      const endDt = new Date(startDt.getTime() + 60 * 60 * 1000) // 1 hour session
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
  // Request Google Meet conferencing
  params.set('crm', 'AVAILABLE')
  params.set('add', booking.student_email || '')

  return `${base}?${params.toString()}`
}

export default function AdminPanel() {
  const { getUserName } = useAuth()
  const toast = useToast()

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
  // ── New: Booking detail modal ──
  const [detailBooking, setDetailBooking] = useState(null)
  // ── New: Admin notes ──
  const [noteInputs, setNoteInputs] = useState({})
  const [savingNote, setSavingNote] = useState(null)
  // ── New: Expanded rows ──
  const [expandedRows, setExpandedRows] = useState(new Set())
  // ── New: Recent Activity ──
  const [activityLog, setActivityLog] = useState([])

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

    // Real-time subscription so new bookings appear immediately
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

  const updateBookingStatus = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
      const booking = bookings.find(b => b.id === id)
      setActivityLog(prev => [{
        type: `booking_${newStatus}`,
        message: `Booking for ${booking?.student_name || 'Student'} marked as ${newStatus}`,
        time: new Date().toISOString()
      }, ...prev].slice(0, 50))
      toast(`Booking ${newStatus} successfully.`, 'success')
    } catch (err) {
      toast('Failed to update: ' + err.message, 'error')
    } finally { setUpdatingId(null) }
  }

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
      toast('Google Meet link added successfully!', 'success')
    } catch (err) {
      toast('Failed to add meet link: ' + err.message, 'error')
    } finally { setUpdatingId(null) }
  }

  // ── NEW: Save admin notes on a booking ──
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
      toast('Note saved.', 'success')
    } catch (err) {
      toast('Failed to save note: ' + err.message, 'error')
    } finally { setSavingNote(null) }
  }

  // ── Create Google Calendar event + sync Meet link ──
  const createCalendarEvent = (booking) => {
    const url = buildGoogleCalendarUrl(booking)
    window.open(url, '_blank', 'noopener,noreferrer')
    toast('Google Calendar opened — save the event to auto-generate a Meet link. Then paste the Meet link back here.', 'info')
    setShowMeetInput(booking.id)
  }

  // ── Bulk: open calendar events for all pending Meet requests ──
  const bulkCreateCalendarEvents = () => {
    const pendingMeet = bookings.filter(b => b.google_meet && !b.meet_link && (b.status === 'pending' || b.status === 'confirmed'))
    if (pendingMeet.length === 0) return toast('No pending Meet requests to sync.', 'info')
    if (!window.confirm(`Open Google Calendar for ${pendingMeet.length} booking(s)? Each will open in a new tab.`)) return
    pendingMeet.forEach((b, i) => {
      setTimeout(() => {
        window.open(buildGoogleCalendarUrl(b), '_blank', 'noopener,noreferrer')
      }, i * 600)
    })
    toast(`Opened ${pendingMeet.length} calendar event(s). Save each to generate Meet links.`, 'success')
  }

  // ── NEW: Export bookings to CSV ──
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
    toast(`Exported ${filteredBookings.length} bookings to CSV.`, 'success')
  }

  // ── NEW: Email student directly ──
  const emailStudent = (booking) => {
    const subject = encodeURIComponent(`Zenith Pranavi — Your ${booking.subject} Session on ${formatDate(booking.booking_date)}`)
    const body = encodeURIComponent(
      `Hi ${booking.student_name || 'Student'},\n\nRegarding your ${booking.subject} session scheduled for ${formatDate(booking.booking_date)} at ${booking.booking_time}.\n\n${booking.meet_link ? `Google Meet Link: ${booking.meet_link}\n\n` : ''}Best regards,\nZenith Pranavi Education`
    )
    window.open(`mailto:${booking.student_email || ''}?subject=${subject}&body=${body}`, '_self')
  }

  const deleteEnquiry = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return
    try {
      const { error } = await supabase.from('enquiries').delete().eq('id', id)
      if (error) throw error
      setEnquiries(prev => prev.filter(e => e.id !== id))
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

  // Toggle row expansion
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

  // ── NEW: Today's bookings & upcoming ──
  const todayStr = new Date().toISOString().slice(0, 10)
  const todaysBookings = bookings.filter(b => b.booking_date?.slice(0,10) === todayStr)
  const upcomingBookings = bookings
    .filter(b => b.booking_date && b.booking_date >= todayStr && (b.status === 'pending' || b.status === 'confirmed'))
    .sort((a, b) => (a.booking_date + a.booking_time).localeCompare(b.booking_date + b.booking_time))
    .slice(0, 5)

  // ── NEW: Revenue breakdown ──
  const revenueByStatus = {
    confirmed: bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.price || 0), 0),
    completed: bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.price || 0), 0)
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
      <section className="admin-hero">
        <div className="container">
          <div className="admin-hero-content">
            <h1>Admin Dashboard</h1>
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

      {/* Stats Cards */}
      <section className="admin-section">
        <div className="container">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon-blue"><Calendar size={22} /></div>
              <div>
                <div className="admin-stat-number">{totalBookings}</div>
                <div className="admin-stat-label">Total Bookings</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon-amber"><Clock size={22} /></div>
              <div>
                <div className="admin-stat-number">{pendingBookings}</div>
                <div className="admin-stat-label">Pending</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon-green"><CheckCircle size={22} /></div>
              <div>
                <div className="admin-stat-number">{confirmedBookings}</div>
                <div className="admin-stat-label">Confirmed</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon-purple"><Video size={22} /></div>
              <div>
                <div className="admin-stat-number">{meetLinked} / {meetLinked + meetRequests}</div>
                <div className="admin-stat-label">Meet Linked</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}><DollarSign size={22} /></div>
              <div>
                <div className="admin-stat-number">${totalRevenue}</div>
                <div className="admin-stat-label">Revenue</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: '#fff3e0', color: '#e65100' }}><Mail size={22} /></div>
              <div>
                <div className="admin-stat-number">{enquiries.length}</div>
                <div className="admin-stat-label">Enquiries</div>
              </div>
            </div>
          </div>

          {/* ── NEW FEATURE 1: Quick Overview Panel — Today & Upcoming ── */}
          {(todaysBookings.length > 0 || upcomingBookings.length > 0) && (
            <div className="admin-overview-panel">
              {todaysBookings.length > 0 && (
                <div className="admin-overview-section">
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
                <div className="admin-overview-section">
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

          {/* ── NEW FEATURE 2: Revenue Breakdown ── */}
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

      {/* Tabs */}
      <section className="admin-section">
        <div className="container">
          <div className="admin-tabs">
            <button className={`admin-tab${activeTab === 'bookings' ? ' active' : ''}`} onClick={() => setActiveTab('bookings')}>
              <Calendar size={16} /> Bookings ({bookings.length})
            </button>
            <button className={`admin-tab${activeTab === 'calendar' ? ' active' : ''}`} onClick={() => setActiveTab('calendar')}>
              <CalendarPlus size={16} /> Calendar Sync
            </button>
            <button className={`admin-tab${activeTab === 'enquiries' ? ' active' : ''}`} onClick={() => setActiveTab('enquiries')}>
              <Mail size={16} /> Enquiries ({enquiries.length})
            </button>
            <button className={`admin-tab${activeTab === 'activity' ? ' active' : ''}`} onClick={() => setActiveTab('activity')}>
              <Activity size={16} /> Activity
            </button>
          </div>

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="admin-tab-content">
              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by student, email, subject, or year..."
                    value={searchBookings}
                    onChange={e => setSearchBookings(e.target.value)}
                  />
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
                    <button className="admin-gcal-bulk-btn" onClick={bulkCreateCalendarEvents} title="Sync all pending Meet requests to Google Calendar">
                      <CalendarPlus size={14} /> Sync All ({meetRequests})
                    </button>
                  )}
                  <button className="admin-refresh-btn" onClick={exportCSV} title="Export CSV">
                    <Download size={16} />
                  </button>
                  <button className="admin-refresh-btn" onClick={loadBookings} title="Refresh">
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {loadingBookings ? (
                <div className="admin-loading">
                  <div className="btn-loader" style={{ width: 28, height: 28, borderWidth: 3, borderColor: 'var(--gold-pale)', borderTopColor: 'var(--gold)' }} />
                  <span>Loading bookings...</span>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="admin-empty">
                  <Calendar size={48} strokeWidth={1} />
                  <h3>No bookings found</h3>
                  <p>{searchBookings || filterStatus !== 'all' ? 'Try adjusting your filters.' : 'No bookings have been made yet.'}</p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
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
                          <tr key={b.id} className={expandedRows.has(b.id) ? 'admin-row-expanded' : ''}>
                            <td>
                              <button
                                className="admin-expand-btn"
                                onClick={() => toggleRow(b.id)}
                                title={expandedRows.has(b.id) ? 'Collapse' : 'Expand details'}
                              >
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
                                    <a href={b.meet_link} target="_blank" rel="noopener noreferrer" className="admin-meet-link">
                                      <Video size={13} /> Join Meet
                                    </a>
                                  ) : (
                                    <div className="admin-meet-actions-col">
                                      <button className="admin-gcal-btn" onClick={() => createCalendarEvent(b)} title="Create Google Calendar event with Meet">
                                        <CalendarPlus size={13} /> Calendar + Meet
                                      </button>
                                      <button className="admin-meet-add-btn" onClick={() => setShowMeetInput(showMeetInput === b.id ? null : b.id)} title="Paste Meet link manually">
                                        <Link2 size={13} /> Paste Link
                                      </button>
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
                            <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                            <td>
                              <div className="admin-actions">
                                {b.status === 'pending' && (
                                  <>
                                    <button className="admin-action-btn confirm" onClick={() => updateBookingStatus(b.id, 'confirmed')} disabled={updatingId === b.id} title="Confirm"><CheckCircle size={15} /></button>
                                    <button className="admin-action-btn cancel" onClick={() => updateBookingStatus(b.id, 'cancelled')} disabled={updatingId === b.id} title="Cancel"><XCircle size={15} /></button>
                                  </>
                                )}
                                {b.status === 'confirmed' && (
                                  <button className="admin-action-btn complete" onClick={() => updateBookingStatus(b.id, 'completed')} disabled={updatingId === b.id} title="Mark Completed"><CheckCircle size={15} /></button>
                                )}
                                {(b.status === 'completed' || b.status === 'cancelled') && (
                                  <span className="admin-action-done">—</span>
                                )}
                                <button className="admin-action-btn" onClick={() => setDetailBooking(b)} title="View Details" style={{ color: 'var(--text-medium)' }}><Eye size={15} /></button>
                                {b.student_email && (
                                  <button className="admin-action-btn" onClick={() => emailStudent(b)} title="Email Student" style={{ color: '#1a73e8' }}><Send size={14} /></button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {/* ── Expanded row details ── */}
                          {expandedRows.has(b.id) && (
                            <tr key={`${b.id}-detail`} className="admin-expanded-detail-row">
                              <td colSpan={10}>
                                <div className="admin-expanded-detail">
                                  <div className="admin-detail-grid">
                                    <div className="admin-detail-item">
                                      <span className="admin-detail-label">Student Email</span>
                                      <span className="admin-detail-value">{b.student_email || '—'}</span>
                                    </div>
                                    <div className="admin-detail-item">
                                      <span className="admin-detail-label">Phone</span>
                                      <span className="admin-detail-value">{b.phone || '—'}</span>
                                    </div>
                                    <div className="admin-detail-item">
                                      <span className="admin-detail-label">Booked On</span>
                                      <span className="admin-detail-value">{formatDateTime(b.created_at)}</span>
                                    </div>
                                    <div className="admin-detail-item">
                                      <span className="admin-detail-label">Google Meet</span>
                                      <span className="admin-detail-value">{b.google_meet ? (b.meet_link ? 'Linked ✓' : 'Requested — awaiting link') : 'Not requested'}</span>
                                    </div>
                                  </div>
                                  {/* Admin notes */}
                                  <div className="admin-note-section">
                                    <label className="admin-note-label"><FileText size={14} /> Admin Notes</label>
                                    <div className="admin-note-input-row">
                                      <textarea
                                        className="admin-note-textarea"
                                        placeholder="Add a note about this booking..."
                                        value={noteInputs[b.id] !== undefined ? noteInputs[b.id] : (b.admin_notes || '')}
                                        onChange={e => setNoteInputs(prev => ({ ...prev, [b.id]: e.target.value }))}
                                        rows={2}
                                      />
                                      <button
                                        className="admin-meet-save"
                                        onClick={() => saveNote(b.id)}
                                        disabled={savingNote === b.id}
                                      >
                                        {savingNote === b.id ? '...' : 'Save'}
                                      </button>
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
              )}
            </div>
          )}

          {/* Calendar Sync Tab */}
          {activeTab === 'calendar' && (
            <div className="admin-tab-content">
              <div className="admin-calendar-header">
                <div className="admin-calendar-nav">
                  <button className="admin-cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
                  <h3 className="admin-cal-month">{calendarMonthStr}</h3>
                  <button className="admin-cal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
                </div>
                <div className="admin-calendar-actions">
                  {meetRequests > 0 && (
                    <button className="admin-gcal-bulk-btn" onClick={bulkCreateCalendarEvents}>
                      <CalendarPlus size={14} /> Sync All Pending ({meetRequests})
                    </button>
                  )}
                  <button className="admin-refresh-btn" onClick={loadBookings} title="Refresh">
                    <RefreshCw size={16} />
                  </button>
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
                          {b.google_meet && !b.meet_link && (
                            <button className="admin-cal-event-sync" onClick={() => createCalendarEvent(b)} title="Sync to Google Calendar"><CalendarPlus size={10} /></button>
                          )}
                          {b.google_meet && b.meet_link && (
                            <a href={b.meet_link} target="_blank" rel="noopener noreferrer" className="admin-cal-event-meet" title="Join Meet"><Video size={10} /></a>
                          )}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="admin-cal-more">+{dayBookings.length - 3} more</div>
                      )}
                    </div>
                  )
                })}
              </div>

              {meetRequests > 0 && (
                <div className="admin-meet-pending-summary">
                  <div className="admin-meet-pending-header">
                    <Video size={18} />
                    <h4>{meetRequests} Booking{meetRequests > 1 ? 's' : ''} Awaiting Google Meet Link</h4>
                  </div>
                  <div className="admin-meet-pending-list">
                    {bookings.filter(b => b.google_meet && !b.meet_link).map(b => (
                      <div key={b.id} className="admin-meet-pending-item">
                        <div className="admin-meet-pending-info">
                          <strong>{b.student_name || 'Student'}</strong>
                          <span>{b.subject} — {formatDate(b.booking_date)} at {b.booking_time}</span>
                        </div>
                        <div className="admin-meet-pending-actions">
                          <button className="admin-gcal-btn" onClick={() => createCalendarEvent(b)}>
                            <CalendarPlus size={13} /> Calendar + Meet
                          </button>
                          <button className="admin-meet-add-btn" onClick={() => { setActiveTab('bookings'); setShowMeetInput(b.id) }}>
                            <Link2 size={13} /> Paste Link
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enquiries Tab */}
          {activeTab === 'enquiries' && (
            <div className="admin-tab-content">
              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <Search size={16} />
                  <input type="text" placeholder="Search by name, email, or message..." value={searchEnquiries} onChange={e => setSearchEnquiries(e.target.value)} />
                </div>
                <button className="admin-refresh-btn" onClick={loadEnquiries} title="Refresh"><RefreshCw size={16} /></button>
              </div>

              {loadingEnquiries ? (
                <div className="admin-loading">
                  <div className="btn-loader" style={{ width: 28, height: 28, borderWidth: 3, borderColor: 'var(--gold-pale)', borderTopColor: 'var(--gold)' }} />
                  <span>Loading enquiries...</span>
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="admin-empty">
                  <Mail size={48} strokeWidth={1} />
                  <h3>No enquiries found</h3>
                  <p>{searchEnquiries ? 'Try a different search term.' : 'No enquiries have been submitted yet.'}</p>
                </div>
              ) : (
                <div className="admin-enquiries-grid">
                  {filteredEnquiries.map(e => (
                    <div key={e.id} className="admin-enquiry-card">
                      <div className="admin-enquiry-header">
                        <div className="admin-enquiry-avatar">{(e.name || 'U').charAt(0).toUpperCase()}</div>
                        <div className="admin-enquiry-meta">
                          <strong>{e.name}</strong>
                          <a href={`mailto:${e.email}`}>{e.email}</a>
                        </div>
                        <button className="admin-enquiry-delete" onClick={() => deleteEnquiry(e.id)} title="Delete"><XCircle size={16} /></button>
                      </div>
                      <div className="admin-enquiry-body"><p>{e.message}</p></div>
                      <div className="admin-enquiry-footer">
                        <span>{formatDateTime(e.created_at)}</span>
                        <a href={`mailto:${e.email}?subject=Re: Your enquiry to Zenith Pranavi`} className="admin-reply-btn">Reply</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NEW FEATURE 3: Activity Log Tab ── */}
          {activeTab === 'activity' && (
            <div className="admin-tab-content">
              <div className="admin-activity-header">
                <h3 className="admin-activity-title"><Activity size={18} /> Recent Activity</h3>
                <span className="admin-activity-sub">Real-time updates from bookings and enquiries</span>
              </div>
              {activityLog.length === 0 ? (
                <div className="admin-empty">
                  <Activity size={48} strokeWidth={1} />
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
              {detailBooking.student_email && (
                <button className="btn btn-outline btn-sm" onClick={() => emailStudent(detailBooking)}>
                  <Send size={14} /> Email Student
                </button>
              )}
              {detailBooking.google_meet && !detailBooking.meet_link && (
                <button className="btn btn-primary btn-sm" onClick={() => { createCalendarEvent(detailBooking); setDetailBooking(null) }}>
                  <CalendarPlus size={14} /> Create Calendar Event
                </button>
              )}
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
