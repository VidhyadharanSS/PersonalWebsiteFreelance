import { useEffect } from 'react'
import { Shield, Mail, Calculator, X } from 'lucide-react'

export default function RefundModal({ open, onClose }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!open) return null

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-refund" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>

        <div className="refund-modal-header">
          <div className="refund-modal-icon">
            <Shield size={28} strokeWidth={1.5} />
          </div>
          <h2 className="refund-modal-title">Refund Policy</h2>
          <p className="refund-modal-sub">Transparent, fair, and student-first</p>
        </div>

        <div className="refund-modal-body">
          <h3 className="refund-section-title">You may request a refund in the following situations:</h3>

          <div className="refund-reason-card">
            <div className="refund-reason-num">1</div>
            <div>
              <h4>Tutor-related issues</h4>
              <ul>
                <li>Tutor misses scheduled classes without prior notice</li>
                <li>Teaching quality or approach is not a good fit</li>
              </ul>
            </div>
          </div>

          <div className="refund-reason-card">
            <div className="refund-reason-num">2</div>
            <div>
              <h4>Curriculum mismatch</h4>
              <ul>
                <li>The program delivered does not match what was promised</li>
              </ul>
            </div>
          </div>

          <div className="refund-reason-card">
            <div className="refund-reason-num">3</div>
            <div>
              <h4>Technical issues</h4>
              <ul>
                <li>Repeated platform disruptions affecting your learning</li>
              </ul>
            </div>
          </div>

          <div className="refund-reason-card">
            <div className="refund-reason-num">4</div>
            <div>
              <h4>Billing concerns</h4>
              <ul>
                <li>Any incorrect charges or payment errors</li>
              </ul>
            </div>
          </div>

          <div className="refund-divider" />

          <div className="refund-calculation">
            <Calculator size={20} />
            <div>
              <h4>Refund Calculation</h4>
              <p className="refund-formula">Total paid &minus; (Sessions attended &times; hourly rate)</p>
            </div>
          </div>

          <div className="refund-contact-strip">
            <Mail size={16} />
            <span>Email <strong>claims@zped.org</strong> &middot; Response in 2 days &middot; Refund in 7 days</span>
          </div>
        </div>
      </div>
    </div>
  )
}
