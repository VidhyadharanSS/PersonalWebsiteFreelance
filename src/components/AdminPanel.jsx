import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { supabase } from '../lib/supabase'
import {
  Calendar, Users, Mail, Clock, Search,
  ChevronDown, ChevronUp, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Filter
} from 'lucide-react'

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
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    loadBookings()
    loadEnquiries()
  }, [])

  const loadBookings = async () => {
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
  }

  const loadEnquiries = async () => {
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
  }

  const updateBookingStatus = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
      toast(`Booking ${newStatus} successfully.`, 'success')
    } catch (err) {
      toast('Failed to update: ' + err.message, 'error')
    } finally { setUpdatingId(null) }
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

  // Filter & search bookings
  const filteredBookings = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (searchBookings) {
      const q = searchBookings.toLowerCase()
      return (
        (b.student_name || '').toLowerCase().includes(q) ||
        (b.subject || '').toLowerCase().includes(q) ||
        (b.tutor_name || '').toLowerCase().includes(q)
      )
    }
    return true
  })

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
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.price || 0), 0)

  return (
    <main id="admin-panel">
      <section className="admin-hero">
        <div className="container">
          <div className="admin-hero-content">
            <h1>Admin Dashboard</h1>
            <p>Welcome, <strong>{getUserName()}</strong>. Manage bookings and enquiries.</p>
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
              <div className="admin-stat-icon admin-stat-icon-purple"><Mail size={22} /></div>
              <div>
                <div className="admin-stat-number">{enquiries.length}</div>
                <div className="admin-stat-label">Enquiries</div>
              </div>
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
            <button className={`admin-tab${activeTab === 'enquiries' ? ' active' : ''}`} onClick={() => setActiveTab('enquiries')}>
              <Mail size={16} /> Enquiries ({enquiries.length})
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
                    placeholder="Search by student, subject, or year..."
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
                        <th>Student</th>
                        <th>Year Group</th>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => (
                        <tr key={b.id}>
                          <td><strong>{b.student_name || '-'}</strong></td>
                          <td>{b.tutor_name || '-'}</td>
                          <td>{b.subject}</td>
                          <td>{formatDate(b.booking_date)}</td>
                          <td>{b.booking_time}</td>
                          <td className="admin-price">${b.price}</td>
                          <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                          <td className="admin-date-cell">{formatDateTime(b.created_at)}</td>
                          <td>
                            <div className="admin-actions">
                              {b.status === 'pending' && (
                                <>
                                  <button
                                    className="admin-action-btn confirm"
                                    onClick={() => updateBookingStatus(b.id, 'confirmed')}
                                    disabled={updatingId === b.id}
                                    title="Confirm"
                                  >
                                    <CheckCircle size={15} />
                                  </button>
                                  <button
                                    className="admin-action-btn cancel"
                                    onClick={() => updateBookingStatus(b.id, 'cancelled')}
                                    disabled={updatingId === b.id}
                                    title="Cancel"
                                  >
                                    <XCircle size={15} />
                                  </button>
                                </>
                              )}
                              {b.status === 'confirmed' && (
                                <button
                                  className="admin-action-btn complete"
                                  onClick={() => updateBookingStatus(b.id, 'completed')}
                                  disabled={updatingId === b.id}
                                  title="Mark Completed"
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              {(b.status === 'completed' || b.status === 'cancelled') && (
                                <span className="admin-action-done">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                  <input
                    type="text"
                    placeholder="Search by name, email, or message..."
                    value={searchEnquiries}
                    onChange={e => setSearchEnquiries(e.target.value)}
                  />
                </div>
                <button className="admin-refresh-btn" onClick={loadEnquiries} title="Refresh">
                  <RefreshCw size={16} />
                </button>
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
                        <button className="admin-enquiry-delete" onClick={() => deleteEnquiry(e.id)} title="Delete">
                          <XCircle size={16} />
                        </button>
                      </div>
                      <div className="admin-enquiry-body">
                        <p>{e.message}</p>
                      </div>
                      <div className="admin-enquiry-footer">
                        <span>{formatDateTime(e.created_at)}</span>
                        <a href={`mailto:${e.email}?subject=Re: Your enquiry to Zenith Pranavi`} className="admin-reply-btn">
                          Reply
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

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
