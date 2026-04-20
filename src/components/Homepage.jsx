import { useState, useEffect, useRef } from 'react'
import { useToast } from './Toast'
import { submitEnquiry } from '../lib/database'
import {
  Globe, Shield, Heart, Flower2,
  BookOpen, Rocket, Award, Users, Languages, Star,
  Video, HelpCircle, Focus, BarChart3,
  Lock, MessageCircle, UserCheck,
  Mail, Clock, GraduationCap
} from 'lucide-react'

/* ── Section wrapper with scroll animation ── */
function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={`fade-in${visible ? ' visible' : ''} ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

/* ── Icon wrapper for Why Us / Programs / Experience ── */
function IconCircle({ icon: Icon, size = 40, iconSize = 18, className = '' }) {
  return (
    <div className={`icon-circle ${className}`} style={{ width: size, height: size, minWidth: size }}>
      <Icon size={iconSize} strokeWidth={1.8} />
    </div>
  )
}

export default function Homepage({ onCTA }) {
  const toast = useToast()
  const [enquiryLoading, setEnquiryLoading] = useState(false)

  const handleEnquiry = async (e) => {
    e.preventDefault()
    const form = e.target
    const name = form.elements['enquiry-name'].value.trim()
    const email = form.elements['enquiry-email'].value.trim()
    const message = form.elements['enquiry-message'].value.trim()
    if (!name || !email || !message) return toast('Please fill in all fields.', 'warning')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Please enter a valid email.', 'warning')
    setEnquiryLoading(true)
    try {
      await submitEnquiry({ name, email, message })
      toast('Message sent! We will get back to you soon.', 'success')
      form.reset()
    } catch {
      toast('Failed to send message. Please try again.', 'error')
    } finally { setEnquiryLoading(false) }
  }

  /* ── Programs data with real icons ── */
  const programs = [
    { num: '01', icon: BookOpen, name: 'Foundation Learning', desc: <>Grades 1&ndash;5. Building the <strong>unshakeable foundation</strong> through curiosity, play and wonder.</>, age: 'Ages 6–11' },
    { num: '02', icon: Rocket, name: 'Accelerated Track', desc: <>Grades 6&ndash;10. <strong>Fast-paced</strong> deep-dive learning for students who hunger for more.</>, age: 'Ages 11–16' },
    { num: '03', icon: Award, name: 'Exam Mastery', desc: <><strong>IGCSE, IB, SAT, JEE, NEET</strong> &mdash; targeted preparation with expert coaches.</>, age: 'Ages 14–18' },
    { num: '04', icon: Heart, name: 'Inclusive Learning', desc: <>Specialists for <strong>autism, ADHD, dyslexia</strong> and all neurodiverse learning profiles.</>, age: 'All Ages' },
    { num: '05', icon: Languages, name: 'Language & Literacy', desc: <>English, Hindi, regional languages &mdash; learning in <strong>your language</strong> is learning freely.</>, age: 'All Grades' },
    { num: '06', icon: Star, name: 'Gifted & Talented', desc: <>For children who think <strong>three steps ahead</strong>. Advanced projects and mentorship.</>, age: 'Selective' }
  ]

  /* ── Why Us features with real icons ── */
  const whyFeatures = [
    { icon: Globe, title: 'Global Curricula', desc: <><strong>CBSE, IGCSE, IB, US Common Core</strong> &mdash; every major curriculum worldwide.</> },
    { icon: Users, title: 'Inclusive by Design', desc: <><strong>Autism, ADHD, dyslexia</strong> support &mdash; not as an afterthought, as a <strong>foundation</strong>.</> },
    { icon: Shield, title: 'Fair Global Pricing', desc: <>Fees modulated by country. <strong>Quality education</strong> is not a privilege of geography.</> },
    { icon: Flower2, title: 'The Lily Promise', desc: <>Like the lily that blooms anywhere &mdash; we nurture <strong>every child</strong> to blossom.</> }
  ]

  /* ── Experience cards ── */
  const experiences = [
    { icon: Video, title: 'Live Interaction', desc: <>Every session is <strong>fully live</strong>, face to face with a qualified tutor. No recorded videos.</> },
    { icon: HelpCircle, title: 'Real-Time Doubt Solving', desc: <>The moment your child does not understand, we <strong>stop and solve it</strong> right there.</> },
    { icon: Focus, title: 'Focused Attention', desc: <><strong>One tutor. One child. Zero distractions.</strong> Built around your child's pace.</> },
    { icon: BarChart3, title: 'Progress Tracking', desc: <>Parents receive <strong>monthly reports</strong> showing exactly what was covered and improved.</> }
  ]

  /* ── Pricing cards ── */
  const pricingCards = [
    { badge: 'Foundation Years', badgeClass: 'pricing-badge-pink', amount: 13, amountClass: 'pricing-amount-gold', year: 'Year 1 – 6', btnClass: 'pricing-btn-navy', btnLabel: 'Start Year 1–6' },
    { badge: 'Middle School', badgeClass: 'pricing-badge-navy', amount: 20, amountClass: 'pricing-amount-navy', year: 'Year 7 – 10', btnClass: 'pricing-btn-navy', btnLabel: 'Start Year 7–10' },
    { badge: 'Senior Years', badgeClass: 'pricing-badge-gold', amount: 27, amountClass: 'pricing-amount-gold', year: 'Year 11 – 12', btnClass: 'pricing-btn-gold', btnLabel: 'Start Year 11–12', popular: true },
    { badge: 'Inclusive Support', badgeClass: 'pricing-badge-pink-deep', amount: 27, amountClass: 'pricing-amount-pink', year: 'Special Needs Support', btnClass: 'pricing-btn-pink', btnLabel: 'Start Inclusive Plan', inclusive: true,
      features: ['Specialist trained educators','Personalised learning plan','3-month structured plan','Doubt sessions included','Monthly parent meetings','Refund for unused classes'] }
  ]
  const defaultFeatures = ['Live one-on-one sessions','3-month structured plan','Doubt sessions included','Monthly parent meetings','Refund for unused classes']

  return (
    <main id="homepage">

      {/* ════ HERO ════ */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-emblem">
            <div className="emblem-outer">
              <img src="/logo-main.jpeg" alt="Zenith Pranavi" className="hero-logo-img" />
            </div>
          </div>
          <h1 className="hero-title">Zenith Pranavi</h1>
          <p className="hero-subtitle">Where Every Child Reaches Their Zenith</p>
          <p className="hero-desc">
            World-class online tutoring for <strong>every child</strong> &mdash; every grade, every curriculum, every ability. Learning that feels <strong>personal</strong>, because it is.
          </p>
          <p className="hero-quote">&ldquo;We don&rsquo;t refund moods. We refund mistakes.&rdquo;</p>
          <div className="hero-cta-row">
            <button className="btn btn-primary btn-lg" onClick={() => onCTA('hero')}>SCHEDULE FREE DISCOVERY CALL</button>
            <a href="#programs" className="btn btn-outline btn-lg hero-learn-btn" onClick={e => { e.preventDefault(); document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' }) }}>LEARN MORE</a>
          </div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-number gold">50+</span><span className="stat-label">Countries</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-number dark">12K+</span><span className="stat-label">Students</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-number pink">98%</span><span className="stat-label">Satisfaction</span></div>
          </div>
        </div>
      </section>

      {/* ════ WHY US ════ */}
      <section className="section why-section" id="why">
        <div className="container">
          <div className="why-grid">
            <div className="why-emblem-col">
              <div className="why-emblem-wrapper">
                <div className="why-emblem-circle">
                  <img src="/logo-main.jpeg" alt="Zenith Pranavi" className="why-logo-img" />
                </div>
              </div>
            </div>
            <div className="why-content-col">
              <p className="section-badge-left">Why Zenith Pranavi</p>
              <h2 className="section-title-left">Learning That <em>Sees</em><br /><strong>Every Child</strong></h2>
              <div className="section-underline" />
              <p className="why-description">
                Most platforms teach to the average. We teach to the <em>individual</em>.
                Whether your child is <strong>gifted</strong>, needs <strong>extra support</strong>, or simply learns
                differently &mdash; we meet them <em>exactly where they are</em>.
              </p>
              <div className="why-features">
                {whyFeatures.map((f, i) => (
                  <FadeIn key={f.title} delay={i * 0.08}>
                    <div className="why-feature-card">
                      <IconCircle icon={f.icon} />
                      <div>
                        <strong>{f.title}</strong>
                        <span>{f.desc}</span>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ PROGRAMS ════ */}
      <section className="section programs-section" id="programs">
        <div className="container">
          <p className="section-badge">Our Programs</p>
          <h2 className="section-title">Every Child Has a Path.<br />We Help Them <strong>Walk It</strong>.</h2>
          <p className="section-desc">Six unique learning pathways, crafted for every kind of <strong>brilliant mind</strong>.</p>
          <div className="programs-grid">
            {programs.map((p, i) => (
              <FadeIn key={p.num} delay={i * 0.08}>
                <div className="program-card">
                  <div className="program-number">{p.num}</div>
                  <IconCircle icon={p.icon} size={48} iconSize={22} className="program-icon" />
                  <h3 className="program-name">{p.name}</h3>
                  <p className="program-desc">{p.desc}</p>
                  <div className="program-age">{p.age}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════ PRICING ════ */}
      <section className="section pricing-section" id="pricing">
        <div className="container">
          <p className="pricing-label">SIMPLE, HONEST PRICING</p>
          <h2 className="pricing-title">No Surprises. Just Learning.</h2>
          <div className="section-underline-center" />
          <p className="pricing-sub">Every price below is <strong>per hour, one-on-one</strong>, with a fully qualified tutor. First session free. Adjusted fairly by country and curriculum level.</p>
          <div className="pricing-grid">
            {pricingCards.map((card, i) => (
              <FadeIn key={card.badge} delay={i * 0.08}>
                <div className={`pricing-card${card.popular ? ' pricing-card-popular' : ''}${card.inclusive ? ' pricing-card-inclusive' : ''}`}>
                  {card.popular && <div className="popular-ribbon">Most Popular</div>}
                  <div className={`pricing-badge ${card.badgeClass}`}>{card.badge}</div>
                  <div className={`pricing-amount ${card.amountClass}`}>
                    ${card.amount}<span className="pricing-per">/ hour</span>
                  </div>
                  <div className="pricing-year">{card.year}</div>
                  <p className="pricing-free-note">First session free. Then from ${card.amount}/hour.</p>
                  <div className="pricing-divider" />
                  <ul className={`pricing-features${card.inclusive ? ' pricing-features-pink' : ''}`}>
                    {(card.features || defaultFeatures).map(f => (
                      <li key={f}>
                        <span className={`check ${card.inclusive ? 'pink-deep' : 'gold'}`}>&#10003;</span> {f}
                      </li>
                    ))}
                  </ul>
                  <p className="pricing-terms"><a href="#refund-policy">View refund policy</a></p>
                  <button className={`btn pricing-btn ${card.btnClass}`} onClick={() => onCTA('pricing')}>{card.btnLabel}</button>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Trust Strip */}
          <div className="pricing-trust-strip">
            <FadeIn><div className="trust-pill"><IconCircle icon={Lock} size={32} iconSize={14} className="trust-icon" /><span className="trust-text"><strong>100% Secure Payments</strong> &mdash; SSL encrypted. Your information is protected.</span></div></FadeIn>
            <FadeIn delay={0.08}><div className="trust-pill"><IconCircle icon={MessageCircle} size={32} iconSize={14} className="trust-icon" /><span className="trust-text"><strong>Doubt Sessions Included</strong> &mdash; never leave a question unanswered</span></div></FadeIn>
            <FadeIn delay={0.16}><div className="trust-pill"><IconCircle icon={UserCheck} size={32} iconSize={14} className="trust-icon" /><span className="trust-text"><strong>Parent Meetings Included</strong> &mdash; you are part of every step</span></div></FadeIn>
          </div>
        </div>
      </section>

      {/* ════ EXPERIENCE ════ */}
      <section className="section experience-section" id="experience">
        <div className="container">
          <p className="experience-label">THE LEARNING EXPERIENCE</p>
          <h2 className="experience-title">Not Just Teaching. Truly Learning.</h2>
          <div className="section-underline-center" />
          <p className="experience-sub">Every session at Zenith Pranavi is designed around one question &mdash; is this child genuinely <strong>understanding</strong>, <strong>growing</strong>, and <strong>loving the process</strong>?</p>
          <div className="experience-grid">
            {experiences.map((exp, i) => (
              <FadeIn key={exp.title} delay={i * 0.08}>
                <div className="experience-card">
                  <IconCircle icon={exp.icon} size={56} iconSize={24} className="exp-icon" />
                  <h3 className="exp-card-title">{exp.title}</h3>
                  <p className="exp-card-desc">{exp.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════ QUOTE ════ */}
      <section className="quote-section">
        <div className="container">
          <blockquote className="philosophy-quote">
            &ldquo;The goal is not to make every child the <span className="underline-text">same kind of smart</span> &mdash; it&rsquo;s to
            help every child discover the <span className="underline-text">kind of smart they already are</span>. At
            Zenith Pranavi, that is not a philosophy. It is our daily practice.&rdquo;
          </blockquote>
          <p className="quote-attribution">&mdash; Zenith Pranavi Education</p>
        </div>
      </section>

      {/* ════ PROCESS ════ */}
      <section className="section process-section" id="how-it-works">
        <div className="container">
          <p className="section-badge">The Process</p>
          <h2 className="section-title process-title">Simple to Start.<br />Profound in Impact.</h2>
          <div className="section-underline-center" />
          <div className="process-steps">
            {[
              { num: '01', title: 'Free Discovery Call', desc: <><strong>30 minutes</strong> understanding your child &mdash; strengths, challenges, curriculum, and dreams. No forms. No pressure. Just a <strong>real conversation</strong>.</>, tags: ['30 Minutes','Free'] },
              { num: '02', title: "Your Child's Learning Map", desc: <>Our educators design a <strong>personalised path</strong> &mdash; not a template, a bespoke map drawn specifically for your child.</>, tags: ['Personalised','48hrs'] },
              { num: '03', title: 'Meet Your Matched Tutor', desc: <>We match your child with an <strong>expert</strong> who specialises in their curriculum, learning style, and specific needs.</>, tags: ['Expert-Matched'] },
              { num: '04', title: 'Learn, Grow, Ascend', desc: <><strong>Live online sessions</strong>, flexible scheduling, parent progress reports, and monthly reviews.</>, tags: ['Live','Flexible','Adaptive'] }
            ].map((s, i) => (
              <FadeIn key={s.num} delay={i * 0.1}>
                <div className="process-step">
                  <div className="step-number-circle">{s.num}</div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                  <div className="step-tags">
                    {s.tags.map((tag, ti) => (
                      <span key={tag}>{ti > 0 && <span className="step-tag-dot">&middot;</span>}<span className="step-tag">{tag}</span></span>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <div className="process-cta">
            <p className="process-cta-text">To book a session, schedule your free discovery call first.</p>
            <button className="btn btn-primary btn-lg" onClick={() => onCTA('process')}>SCHEDULE FREE CALL</button>
          </div>
        </div>
      </section>

      {/* ════ IMPACT ════ */}
      <section className="section impact-section">
        <div className="container">
          <p className="section-badge">Our Impact</p>
          <h2 className="section-title impact-title">Numbers That Matter</h2>
          <div className="impact-grid">
            {[
              { num: '50', suffix: '+', label: 'Countries', desc: 'Students from six continents', cls: 'gold' },
              { num: '12000', suffix: '+', label: 'Students', desc: "Children whose paths we've shaped", cls: 'navy' },
              { num: '98', suffix: '%', label: 'Satisfaction', desc: 'Parents say their child improved', cls: 'pink' },
              { num: '200', suffix: '+', label: 'Educators', desc: 'Expert tutors across every grade', cls: 'navy' }
            ].map((item, i) => (
              <FadeIn key={item.label} delay={i * 0.08}>
                <div className="impact-card">
                  <div className={`impact-number ${item.cls}`}>{item.num}<span className="impact-plus">{item.suffix}</span></div>
                  <div className="impact-label">{item.label}</div>
                  <div className="impact-desc">{item.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════ BANNER ════ */}
      <section className="get-started-banner">
        <div className="container">
          <div className="get-started-inner">
            <h2 className="get-started-text">Global Learning. Every Grade. Every Child.</h2>
            <button className="btn btn-primary btn-lg get-started-cta-btn" onClick={() => onCTA('banner')}>SCHEDULE FREE CALL</button>
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA (one only) ════ */}
      <section className="section cta-section" id="final-cta">
        <div className="container">
          <FadeIn>
            <div className="cta-card cta-card-final">
              <h2 className="cta-title">Your Child&rsquo;s Zenith<br /><span className="cta-title-accent">Starts Here</span></h2>
              <p className="cta-desc">Join <strong>thousands of families</strong> worldwide who trust Zenith Pranavi. Your first session is <strong>completely free</strong>.</p>
              <div className="cta-btn-row">
                <button className="btn btn-primary btn-lg" onClick={() => onCTA('final')}>CLAIM FREE SESSION</button>
              </div>
              <p className="cta-note">No credit card &middot; No commitment &middot; Just learning</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════ CONTACT ════ */}
      <section className="section contact-section" id="contact">
        <div className="container">
          <p className="section-badge">GET IN TOUCH</p>
          <h2 className="section-title">Talk To Us</h2>
          <p className="section-desc">Have questions? We&rsquo;d <strong>love to hear from you</strong>. Send us a message and we&rsquo;ll respond promptly.</p>
          <div className="contact-wrapper">
            <form className="contact-form" onSubmit={handleEnquiry}>
              <div className="form-group">
                <label htmlFor="enquiry-name">Your Name</label>
                <input type="text" name="enquiry-name" id="enquiry-name" placeholder="Enter your full name" required />
              </div>
              <div className="form-group">
                <label htmlFor="enquiry-email">Email Address</label>
                <input type="email" name="enquiry-email" id="enquiry-email" placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="enquiry-message">Message</label>
                <textarea name="enquiry-message" id="enquiry-message" rows="5" placeholder="How can we help you?" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={enquiryLoading}>
                {enquiryLoading ? <span className="btn-loader" /> : 'Send Message'}
              </button>
            </form>
            <div className="contact-info">
              <div className="contact-info-card">
                <IconCircle icon={Mail} />
                <div><h3>Email Us</h3><p>hello@zped.org</p></div>
              </div>
              <div className="contact-info-card">
                <IconCircle icon={Globe} />
                <div><h3>Website</h3><p>www.zped.org</p></div>
              </div>
              <div className="contact-info-card">
                <IconCircle icon={Clock} />
                <div><h3>Hours</h3><p>Mon&ndash;Sat, 9 AM &ndash; 8 PM</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ REFUND POLICY ════ */}
      <section className="section refund-section" id="refund-policy">
        <div className="container">
          <div className="refund-card">
            <h2 className="refund-title">Refund Policy</h2>
            <div className="section-underline" />
            <div className="refund-content">
              <h3>You may request a refund in the following situations:</h3>

              <h4>1. Tutor-related issues</h4>
              <ul>
                <li>Tutor misses scheduled classes without prior notice</li>
                <li>Teaching quality or approach is not a good fit</li>
              </ul>

              <h4>2. Curriculum mismatch</h4>
              <ul>
                <li>The program delivered does not match what was promised</li>
              </ul>

              <h4>3. Technical issues</h4>
              <ul>
                <li>Repeated platform disruptions affecting your learning</li>
              </ul>

              <h4>4. Billing concerns</h4>
              <ul>
                <li>Any incorrect charges or payment errors</li>
              </ul>

              <h3>No refund for:</h3>
              <p>&ldquo;Child not interested&rdquo;, &ldquo;Found cheaper option&rdquo;, or missing class without 6-hour notice.</p>

              <h3>7-Day Rule:</h3>
              <p>Miss 3 classes in 7 days without 6-hour notice = remaining sessions forfeited.</p>

              <h3>Refund Calculation:</h3>
              <p>Total paid &minus; (Sessions attended &times; hourly rate)</p>

              <div className="refund-contact">
                <p>Email <strong>claims@zped.org</strong> &middot; Response in 2 days &middot; Refund in 7 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <div className="footer-brand-row">
                <img src="/logo-icon.jpeg" alt="Zenith Pranavi" className="footer-logo-img" />
                <span className="brand-name">Zenith Pranavi</span>
              </div>
              <p className="footer-tagline">Where Every Child Reaches Their Zenith</p>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Quick Links</h4>
              <ul className="footer-col-links">
                <li><a href="#why">Why Us</a></li>
                <li><a href="#programs">Programs</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Contact</h4>
              <ul className="footer-col-links">
                <li>hello@zped.org</li>
                <li>Mon&ndash;Sat, 9 AM &ndash; 8 PM</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Legal</h4>
              <ul className="footer-col-links">
                <li><a href="#refund-policy">Refund Policy</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-security">
            <span>100% secure payments</span>
            <span>&middot;</span>
            <span>SSL encrypted</span>
            <span>&middot;</span>
            <span>Your information is protected</span>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Zenith Pranavi Education. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
