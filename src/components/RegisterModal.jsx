import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { submitEnquiry } from '../lib/database'
import { CheckCircle } from 'lucide-react'

const COUNTRY_CODES = [
  { code: '+91', label: 'IN +91' }, { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' }, { code: '+61', label: 'AU +61' },
  { code: '+971', label: 'AE +971' }, { code: '+65', label: 'SG +65' },
  { code: '+60', label: 'MY +60' }, { code: '+49', label: 'DE +49' },
  { code: '+33', label: 'FR +33' }, { code: '+81', label: 'JP +81' },
  { code: '+86', label: 'CN +86' }, { code: '+82', label: 'KR +82' },
  { code: '+55', label: 'BR +55' }, { code: '+27', label: 'ZA +27' },
  { code: '+234', label: 'NG +234' }, { code: '+254', label: 'KE +254' }
]

const GRADES = ['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Year 7','Year 8','Year 9','Year 10','Year 11','Year 12','Special Needs']
const CURRICULA = ['CBSE','ICSE','State Board','IGCSE (Cambridge)','IB (PYP, MYP, DP)','British (GCSE, A-Level)','US Common Core','Australian (ATAR)']
const TIME_SLOTS = ['Morning (9 AM - 12 PM)','Afternoon (12 - 3 PM)','Evening (3 - 6 PM)','Night (6 - 9 PM)']

export default function RegisterModal({ open, onClose }) {
  const { user, signUp, signIn, resetPassword, getUserName } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [authMode, setAuthMode] = useState('create') // create | signin | forgot
  const [loading, setLoading] = useState(false)

  // Step 1 fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signinEmail, setSigninEmail] = useState('')
  const [signinPassword, setSigninPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')

  // Step 2 fields
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [phoneCode, setPhoneCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [waCode, setWaCode] = useState('+91')
  const [whatsapp, setWhatsapp] = useState('')
  const [studentName, setStudentName] = useState('')
  const [grade, setGrade] = useState('')
  const [curriculum, setCurriculum] = useState('')

  // Step 3 fields
  const [subject, setSubject] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [mode, setMode] = useState('Online')

  // Summary
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (open) {
      setStep(1)
      if (user) {
        setParentName(getUserName())
        setParentEmail(user.email || '')
      }
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [open, user])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const goTo = (s) => setStep(s)

  const handleCreate = async () => {
    if (!fullName || !email || !password) return toast('Please fill in all fields.', 'warning')
    if (password.length < 6) return toast('Password must be at least 6 characters.', 'warning')
    setLoading(true)
    try {
      await signUp(email, password, fullName)
      toast(`Account created! Welcome, ${fullName}!`, 'success')
      setParentName(fullName)
      setParentEmail(email)
      goTo(2)
    } catch (err) {
      toast(err.message || 'Signup failed.', 'error')
    } finally { setLoading(false) }
  }

  const handleSignIn = async () => {
    if (!signinEmail || !signinPassword) return toast('Please enter email and password.', 'warning')
    setLoading(true)
    try {
      const data = await signIn(signinEmail, signinPassword)
      const name = data.user?.user_metadata?.name || signinEmail.split('@')[0]
      toast(`Welcome back, ${name}!`, 'success')
      setParentName(name)
      setParentEmail(signinEmail)
      goTo(2)
    } catch (err) {
      toast(err.message || 'Login failed.', 'error')
    } finally { setLoading(false) }
  }

  const handleForgot = async () => {
    if (!forgotEmail) return toast('Please enter your email.', 'warning')
    setLoading(true)
    try {
      await resetPassword(forgotEmail)
      toast('Password reset link sent! Check your email.', 'success')
    } catch (err) {
      toast(err.message || 'Failed.', 'error')
    } finally { setLoading(false) }
  }

  const validateStep2 = () => {
    if (!parentName || !parentEmail || !phone || !whatsapp || !studentName || !grade || !curriculum) {
      toast('Please fill in all required fields.', 'warning'); return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
      toast('Please enter a valid email address.', 'warning'); return false
    }
    if (phone.length < 6) { toast('Please enter a valid phone number.', 'warning'); return false }
    if (whatsapp.length < 6) { toast('Please enter a valid WhatsApp number.', 'warning'); return false }
    return true
  }

  const validateStep3 = () => {
    if (!subject || !timeSlot) { toast('Please fill in subject and time slot.', 'warning'); return false }
    return true
  }

  const handleSubmit = async () => {
    if (!validateStep3()) return
    setLoading(true)
    try {
      const message = [
        'FREE DISCOVERY CALL REQUEST',
        `Parent: ${parentName}`,
        `Email: ${parentEmail}`,
        `Phone: ${phoneCode} ${phone}`,
        `WhatsApp: ${waCode} ${whatsapp}`,
        `Student: ${studentName}`,
        `Grade: ${grade}`,
        `Curriculum: ${curriculum}`,
        `Subject: ${subject}`,
        `Time: ${timeSlot}`,
        `Mode: ${mode}`
      ].join('\n')

      await submitEnquiry({ name: parentName, email: parentEmail, message })
      setSummary({ studentName, grade, curriculum, subject, timeSlot, mode, parentEmail })
      goTo(4)
    } catch {
      toast('Something went wrong. Please try again.', 'error')
    } finally { setLoading(false) }
  }

  const handleDone = () => {
    setStep(1); setAuthMode('create')
    setFullName(''); setEmail(''); setPassword('')
    setSigninEmail(''); setSigninPassword('')
    setPhone(''); setWhatsapp(''); setStudentName('')
    setGrade(''); setCurriculum(''); setSubject('')
    setTimeSlot(''); setMode('Online'); setSummary(null)
    onClose()
  }

  if (!open) return null

  const progress = (step / 4) * 100

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-register" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="reg-progress"><div className="reg-progress-bar" style={{ width: `${progress}%` }} /></div>
        <div className="reg-step-indicator">
          {[1,2,3,4].map(s => (
            <span key={s} className={`reg-step-dot${s === step ? ' active' : s < step ? ' completed' : ''}`}>{s}</span>
          ))}
        </div>

        {/* STEP 1: Auth */}
        {step === 1 && (
          <div className="reg-step active">
            <div className="reg-step-header">
              <img src="/logo-icon.jpeg" alt="ZP" className="reg-logo" />
              <h3 className="reg-step-title">Create Your Account</h3>
              <p className="reg-step-sub">Join Zenith Pranavi and book your free discovery call</p>
            </div>

            {user ? (
              <div>
                <div className="reg-logged-msg">
                  <div className="reg-logged-check">&#10003;</div>
                  <div>
                    <strong>Signed in as {getUserName()}</strong>
                    <p>Continue to fill in your details</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-full" onClick={() => goTo(2)}>Continue</button>
              </div>
            ) : (
              <>
                {authMode !== 'forgot' && (
                  <div className="reg-auth-tabs">
                    <button
                      className={`reg-auth-tab${authMode === 'create' ? ' active' : ''}`}
                      onClick={() => setAuthMode('create')}
                    >Create Account</button>
                    <button
                      className={`reg-auth-tab${authMode === 'signin' ? ' active' : ''}`}
                      onClick={() => setAuthMode('signin')}
                    >Sign In</button>
                  </div>
                )}

                {authMode === 'create' && (
                  <div className="reg-auth-panel active">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleCreate} disabled={loading}>
                      {loading ? <span className="btn-loader" /> : 'Create Account & Continue'}
                    </button>
                  </div>
                )}

                {authMode === 'signin' && (
                  <div className="reg-auth-panel active">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" placeholder="you@example.com" value={signinEmail} onChange={e => setSigninEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input type="password" placeholder="Enter your password" value={signinPassword} onChange={e => setSigninPassword(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleSignIn} disabled={loading}>
                      {loading ? <span className="btn-loader" /> : 'Sign In & Continue'}
                    </button>
                    <p className="reg-forgot-link">
                      <a href="#" onClick={e => { e.preventDefault(); setAuthMode('forgot') }}>Forgot Password?</a>
                    </p>
                  </div>
                )}

                {authMode === 'forgot' && (
                  <div className="reg-auth-panel active">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleForgot} disabled={loading}>
                      {loading ? <span className="btn-loader" /> : 'Send Reset Link'}
                    </button>
                    <p className="reg-back-link">
                      <a href="#" onClick={e => { e.preventDefault(); setAuthMode('signin') }}>Back to Sign In</a>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 2: Parent & Student Details */}
        {step === 2 && (
          <div className="reg-step active">
            <div className="reg-step-header">
              <h3 className="reg-step-title">Parent & Student Details</h3>
              <p className="reg-step-sub">Help us personalise the learning experience</p>
            </div>

            <div className="reg-section-label">Parent Information</div>
            <div className="form-group">
              <label>Parent Full Name <span className="required">*</span></label>
              <input type="text" placeholder="Parent's full name" value={parentName} onChange={e => setParentName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email Address <span className="required">*</span></label>
              <input type="email" placeholder="you@example.com" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone Number <span className="required">*</span></label>
              <div className="phone-input-row">
                <select className="phone-country-code" value={phoneCode} onChange={e => setPhoneCode(e.target.value)}>
                  {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>WhatsApp Number <span className="required">*</span></label>
              <div className="phone-input-row">
                <select className="phone-country-code" value={waCode} onChange={e => setWaCode(e.target.value)}>
                  {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <input type="tel" placeholder="WhatsApp number" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              </div>
            </div>

            <div className="reg-section-label" style={{ marginTop: 28 }}>Student Information</div>
            <div className="form-group">
              <label>Student Name <span className="required">*</span></label>
              <input type="text" placeholder="Child's full name" value={studentName} onChange={e => setStudentName(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Grade / Class <span className="required">*</span></label>
                <select value={grade} onChange={e => setGrade(e.target.value)}>
                  <option value="">Select grade...</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Curriculum <span className="required">*</span></label>
                <select value={curriculum} onChange={e => setCurriculum(e.target.value)}>
                  <option value="">Select curriculum...</option>
                  {CURRICULA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="reg-nav-row">
              <button className="btn btn-outline reg-back-btn" onClick={() => goTo(1)}>Back</button>
              <button className="btn btn-primary reg-next-btn" onClick={() => { if (validateStep2()) goTo(3) }}>Continue</button>
            </div>
          </div>
        )}

        {/* STEP 3: Session Preferences */}
        {step === 3 && (
          <div className="reg-step active">
            <div className="reg-step-header">
              <h3 className="reg-step-title">Session Preferences</h3>
              <p className="reg-step-sub">Tell us when and what works best</p>
            </div>
            <div className="form-group">
              <label>Subject <span className="required">*</span></label>
              <input type="text" placeholder="e.g. Mathematics, Science" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Preferred Time Slot <span className="required">*</span></label>
              <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                <option value="">Select time slot...</option>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value)}>
                <option value="Online">Online (Google Meet)</option>
                <option value="In-person">In-person (if available)</option>
              </select>
            </div>
            <div className="reg-nav-row">
              <button className="btn btn-outline reg-back-btn" onClick={() => goTo(2)}>Back</button>
              <button className="btn btn-primary reg-next-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="btn-loader" /> : 'Book Free Discovery Call'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Confirmation */}
        {step === 4 && (
          <div className="reg-step active">
            <div className="reg-confirmation">
              <CheckCircle size={64} color="var(--gold)" strokeWidth={1.5} />
              <h3 className="reg-confirm-title">Discovery Call Scheduled</h3>
              <p className="reg-confirm-desc">
                Your free discovery call request has been received.<br />
                <strong>Our team will contact you within 24 hours</strong> to confirm details.
              </p>
              {summary && (
                <div className="reg-confirm-details">
                  <strong>Student:</strong> {summary.studentName} ({summary.grade})<br />
                  <strong>Curriculum:</strong> {summary.curriculum}<br />
                  <strong>Subject:</strong> {summary.subject}<br />
                  <strong>Time:</strong> {summary.timeSlot} ({summary.mode})<br />
                  <strong>Contact:</strong> {summary.parentEmail}
                </div>
              )}
              <div className="reg-confirm-trust">
                <span>No credit card required</span>
                <span>30-min free call</span>
                <span>Cancel anytime</span>
              </div>
              <button className="btn btn-primary btn-full" onClick={handleDone}>Done — Return to Site</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
