import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { createBooking, fetchUserBookings } from '../lib/database'

export default function Dashboard() {
  const { getUserName } = useAuth()
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  // Form state
  const [subject, setSubject] = useState('')
  const [yearGroup, setYearGroup] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [displayPrice, setDisplayPrice] = useState(null)

  useEffect(() => { loadBookings() }, [])

  const loadBookings = async () => {
    try {
      const data = await fetchUserBookings()
      setBookings(data)
    } catch { /* silent */ }
  }

  const yearOptions = [
    { group: 'Foundation ($13/hr)', items: [
      { value: 'Year 1', price: 13 },{ value: 'Year 2', price: 13 },{ value: 'Year 3', price: 13 },
      { value: 'Year 4', price: 13 },{ value: 'Year 5', price: 13 },{ value: 'Year 6', price: 13 }
    ]},
    { group: 'Middle School ($20/hr)', items: [
      { value: 'Year 7', price: 20 },{ value: 'Year 8', price: 20 },
      { value: 'Year 9', price: 20 },{ value: 'Year 10', price: 20 }
    ]},
    { group: 'Senior Years ($27/hr)', items: [
      { value: 'Year 11', price: 27 },{ value: 'Year 12', price: 27 }
    ]},
    { group: 'Inclusive ($27/hr)', items: [
      { value: 'Special Needs', price: 27 }
    ]}
  ]

  const times = ['09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM']

  const getPrice = (val) => {
    for (const g of yearOptions) {
      const found = g.items.find(i => i.value === val)
      if (found) return found.price
    }
    return 20
  }

  const handleYearChange = (val) => {
    setYearGroup(val)
    setDisplayPrice(val ? getPrice(val) : null)
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    if (!yearGroup || !subject || !date || !time) return toast('Please fill in all fields.', 'warning')
    if (new Date(date) < new Date(new Date().toDateString())) return toast('Please select a future date.', 'warning')

    setLoading(true)
    try {
      await createBooking({ tutorName: yearGroup, subject, date, time, price: getPrice(yearGroup) })
      toast('Session booked successfully!', 'success')
      setSubject(''); setYearGroup(''); setDate(''); setTime(''); setDisplayPrice(null)
      await loadBookings()
    } catch {
      toast('Failed to create booking. Please try again.', 'error')
    } finally { setLoading(false) }
  }

  const today = new Date().toISOString().split('T')[0]
  const total = bookings.length
  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  const pending = bookings.filter(b => b.status === 'pending').length

  return (
    <main id="dashboard">
      <section className="dashboard-hero">
        <div className="container">
          <div className="dashboard-welcome">
            <h1>Welcome back, <span>{getUserName()}</span></h1>
            <p>Your learning dashboard &mdash; manage bookings and track your progress.</p>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="container">
          <div className="dashboard-stats">
            <div className="dash-stat-card"><div className="dash-stat-number">{total}</div><div className="dash-stat-label">Total Sessions</div></div>
            <div className="dash-stat-card"><div className="dash-stat-number">{confirmed}</div><div className="dash-stat-label">Confirmed</div></div>
            <div className="dash-stat-card"><div className="dash-stat-number">{pending}</div><div className="dash-stat-label">Pending</div></div>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="container">
          <h2 className="dash-section-title">Book a Session</h2>
          <div className="booking-form-wrapper">
            <form className="booking-form" onSubmit={handleBooking}>
              <div className="form-group">
                <label>Subject</label>
                <input type="text" placeholder="e.g. Mathematics" value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Year Group</label>
                  <select value={yearGroup} onChange={e => handleYearChange(e.target.value)} required>
                    <option value="">Select year...</option>
                    {yearOptions.map(g => (
                      <optgroup key={g.group} label={g.group}>
                        {g.items.map(i => <option key={i.value} value={i.value}>{i.value}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} min={today} required />
                </div>
              </div>
              <div className="form-group">
                <label>Time</label>
                <select value={time} onChange={e => setTime(e.target.value)} required>
                  <option value="">Select time...</option>
                  {times.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {displayPrice !== null && (
                <div className="booking-price-display">
                  <span>Session Price: </span><strong>${displayPrice}/hour</strong>
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="btn-loader" /> : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="container">
          <h2 className="dash-section-title">My Sessions</h2>
          <div className="bookings-table-wrapper">
            <table className="bookings-table">
              <thead>
                <tr><th>Year</th><th>Subject</th><th>Date</th><th>Time</th><th>Price</th><th>Status</th></tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr className="empty-row"><td colSpan="6">No sessions yet. Book your first session above.</td></tr>
                ) : bookings.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.tutor_name || '-'}</strong></td>
                    <td>{b.subject}</td>
                    <td>{new Date(b.booking_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{b.booking_time}</td>
                    <td>${b.price}</td>
                    <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2026 Zenith Pranavi Education. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
