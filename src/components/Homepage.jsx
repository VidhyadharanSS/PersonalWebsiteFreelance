import { useState, useEffect, useRef } from 'react'
import { useToast } from './Toast'
import { submitEnquiry } from '../lib/database'
import {
  Globe, Shield, Heart, Flower2,
  BookOpen, Rocket, Award, Users, Languages, Star,
  Video, HelpCircle, Focus, BarChart3,
  Lock, MessageCircle, UserCheck,
  Mail, Clock, Instagram, ArrowRight, Sparkles, GraduationCap, Play,
  ChevronDown, ChevronUp, Quote, ArrowUp, X
} from 'lucide-react'

function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={`fade-in${visible ? ' visible' : ''} ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

function IconCircle({ icon: Icon, size = 40, iconSize = 18, className = '' }) {
  return (
    <div className={`icon-circle ${className}`} style={{ width: size, height: size, minWidth: size }}>
      <Icon size={iconSize} strokeWidth={1.8} />
    </div>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item${open ? ' faq-item-open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(!open)}>
        <span>{question}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <div className={`faq-answer${open ? ' faq-answer-open' : ''}`}>
        <p>{answer}</p>
      </div>
    </div>
  )
}

function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <button
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      <ArrowUp size={20} />
    </button>
  )
}

export default function Homepage({ onCTA, onRefund }) {
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

  const programs = [
    { num: '01', icon: BookOpen, name: 'Foundation Learning', desc: <>Grades 1&ndash;5. Building the <strong>unshakeable foundation</strong> through curiosity, play and wonder.</>, age: 'Ages 6-11' },
    { num: '02', icon: Rocket, name: 'Accelerated Track', desc: <>Grades 6&ndash;10. <strong>Fast-paced</strong> deep-dive learning for students who hunger for more.</>, age: 'Ages 11-16' },
    { num: '03', icon: Award, name: 'Exam Mastery', desc: <><strong>IGCSE, IB, SAT, JEE, NEET</strong> &mdash; targeted preparation with expert coaches.</>, age: 'Ages 14-18' },
    { num: '04', icon: Heart, name: 'Inclusive Learning', desc: <>Specialists for <strong>autism, ADHD, dyslexia</strong> and all neurodiverse learning profiles.</>, age: 'All Ages' },
    { num: '05', icon: Languages, name: 'Language & Literacy', desc: <>English, Hindi, regional languages &mdash; learning in <strong>your language</strong> is learning freely.</>, age: 'All Grades' },
    { num: '06', icon: Star, name: 'Gifted & Talented', desc: <>For children who think <strong>three steps ahead</strong>. Advanced projects and mentorship.</>, age: 'Selective' }
  ]

  const whyFeatures = [
    { icon: Globe, title: 'Global Curricula', desc: <><strong>CBSE, IGCSE, IB, US Common Core</strong> &mdash; every major curriculum worldwide.</> },
    { icon: Users, title: 'Inclusive by Design', desc: <><strong>Autism, ADHD, dyslexia</strong> support &mdash; not as an afterthought, as a <strong>foundation</strong>.</> },
    { icon: Shield, title: 'Fair Global Pricing', desc: <>Fees modulated by country. <strong>Quality education</strong> is not a privilege of geography.</> },
    { icon: Flower2, title: 'The Lily Promise', desc: <>Like the lily that blooms anywhere &mdash; we nurture <strong>every child</strong> to blossom.</> }
  ]

  const experiences = [
    { icon: Video, title: 'Live Interaction', desc: <>Every session is <strong>fully live</strong>, face to face with a qualified tutor. No recorded videos.</> },
    { icon: HelpCircle, title: 'Real-Time Doubt Solving', desc: <>The moment your child does not understand, we <strong>stop and solve it</strong> right there.</> },
    { icon: Focus, title: 'Focused Attention', desc: <><strong>One tutor. One child. Zero distractions.</strong> Built around your child's pace.</> },
    { icon: BarChart3, title: 'Progress Tracking', desc: <>Parents receive <strong>monthly reports</strong> showing exactly what was covered and improved.</> }
  ]

  const pricingCards = [
    { badge: 'Foundation Years', badgeClass: 'pricing-badge-pink', amount: 13, amountClass: 'pricing-amount-gold', year: 'Year 1 - 6', btnClass: 'pricing-btn-navy', btnLabel: 'Start Year 1-6' },
    { badge: 'Middle School', badgeClass: 'pricing-badge-navy', amount: 20, amountClass: 'pricing-amount-navy', year: 'Year 7 - 10', btnClass: 'pricing-btn-navy', btnLabel: 'Start Year 7-10' },
    { badge: 'Senior Years', badgeClass: 'pricing-badge-gold', amount: 27, amountClass: 'pricing-amount-gold', year: 'Year 11 - 12', btnClass: 'pricing-btn-gold', btnLabel: 'Start Year 11-12', popular: true },
    { badge: 'Inclusive Support', badgeClass: 'pricing-badge-pink-deep', amount: 27, amountClass: 'pricing-amount-pink', year: 'Special Needs Support', btnClass: 'pricing-btn-pink', btnLabel: 'Start Inclusive Plan', inclusive: true,
      features: ['Specialist trained educators','Personalised learning plan','3-month structured plan','Doubt sessions included','Monthly parent meetings','Refund for unused classes'] }
  ]
  const defaultFeatures = ['Live one-on-one sessions','3-month structured plan','Doubt sessions included','Monthly parent meetings','Refund for unused classes']

  return (
    <main id="homepage">

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-content">
          <FadeIn>
            <div className="hero-visual">
              <div className="hero-image-container">
                <img 
                  src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=700&h=500&fit=crop" 
                  alt="Children learning online" 
                  className="hero-main-image" 
                />
                <div className="hero-floating-card hero-card-1">
                  <div className="hero-card-icon">🎓</div>
                  <div className="hero-card-text">
                    <strong>98%</strong>
                    <span>Success Rate</span>
                  </div>
                </div>
                <div className="hero-floating-card hero-card-2">
                  <div className="hero-card-icon">🌍</div>
                  <div className="hero-card-text">
                    <strong>50+</strong>
                    <span>Countries</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="hero-title">Zenith Pranavi</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="hero-subtitle">Where Every Child Reaches Their Zenith</p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="hero-desc">
              World-class online tutoring for <strong>every child</strong> &mdash; every grade, every curriculum, every ability. Learning that feels <strong>personal</strong>, because it is.
            </p>
          </FadeIn>
          <FadeIn delay={0.35}>
            <p className="hero-quote">&ldquo;We don&rsquo;t refund moods. We refund mistakes.&rdquo;</p>
          </FadeIn>
          <FadeIn delay={0.4}>
            <div className="hero-cta-row">
              <button className="btn btn-primary btn-lg hero-primary-btn" onClick={() => onCTA('hero')}>
                <Play size={16} />
                <span className="btn-text-full">Schedule Free Discovery Call</span>
                <span className="btn-text-short">Free Discovery Call</span>
              </button>
              <a href="#programs" className="btn btn-outline btn-lg hero-learn-btn" onClick={e => { e.preventDefault(); document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' }) }}>
                Learn More <ArrowRight size={16} />
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={0.5}>
            <div className="hero-stats">
              <div className="stat"><span className="stat-number gold">50+</span><span className="stat-label">Countries</span></div>
              <div className="stat-divider" />
              <div className="stat"><span className="stat-number dark">12K+</span><span className="stat-label">Students</span></div>
              <div className="stat-divider" />
              <div className="stat"><span className="stat-number pink">98%</span><span className="stat-label">Satisfaction</span></div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* WHY US */}
      <section className="section why-section" id="why">
        <div className="container">
          <div className="why-grid">
            <div className="why-emblem-col">
              <FadeIn>
                <div className="why-image-wrapper">
                  <img 
                    src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=600&fit=crop&crop=faces" 
                    alt="Kids studying together" 
                    className="why-hero-image" 
                  />
                  <div className="why-image-badge">
                    <span className="why-badge-number">12K+</span>
                    <span className="why-badge-text">Happy Students</span>
                  </div>
                </div>
              </FadeIn>
            </div>
            <div className="why-content-col">
              <FadeIn>
                <p className="section-badge-left">Why Zenith Pranavi</p>
                <h2 className="section-title-left">Learning That <em>Sees</em><br /><strong>Every Child</strong></h2>
                <div className="section-underline" />
                <p className="why-description">
                  Most platforms teach to the average. We teach to the <em>individual</em>.
                  Whether your child is <strong>gifted</strong>, needs <strong>extra support</strong>, or simply learns
                  differently &mdash; we meet them <em>exactly where they are</em>.
                </p>
              </FadeIn>
              <div className="why-features">
                {whyFeatures.map((f, i) => (
                  <FadeIn key={f.title} delay={i * 0.1}>
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

      {/* PROGRAMS */}
      <section className="section programs-section" id="programs">
        <div className="container">
          <FadeIn>
            <p className="section-badge"><Sparkles size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />Our Programs</p>
            <h2 className="section-title">Every Child Has a Path.<br />We Help Them <strong>Walk It</strong>.</h2>
            <p className="section-desc">Six unique learning pathways, crafted for every kind of <strong>brilliant mind</strong>.</p>
          </FadeIn>
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

      {/* PRICING */}
      <section className="section pricing-section" id="pricing">
        <div className="container">
          <FadeIn>
            <p className="pricing-label">SIMPLE, HONEST PRICING</p>
            <h2 className="pricing-title">No Surprises. Just Learning.</h2>
            <div className="section-underline-center" />
            <p className="pricing-sub">Every price below is <strong>per hour, one-on-one</strong>, with a fully qualified tutor. First session free. Adjusted fairly by country and curriculum level.</p>
          </FadeIn>
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
                  <p className="pricing-terms">
                    <a href="#" onClick={e => { e.preventDefault(); onRefund() }}>View refund policy</a>
                  </p>
                  <button className={`btn pricing-btn ${card.btnClass}`} onClick={() => onCTA('pricing')}>{card.btnLabel}</button>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="pricing-trust-strip">
            <FadeIn><div className="trust-pill"><IconCircle icon={Lock} size={32} iconSize={14} className="trust-icon" /><span className="trust-text"><strong>100% Secure Payments</strong> &mdash; SSL encrypted</span></div></FadeIn>
            <FadeIn delay={0.08}><div className="trust-pill"><IconCircle icon={MessageCircle} size={32} iconSize={14} className="trust-icon" /><span className="trust-text"><strong>Doubt Sessions Included</strong> &mdash; never leave a question unanswered</span></div></FadeIn>
            <FadeIn delay={0.16}><div className="trust-pill"><IconCircle icon={UserCheck} size={32} iconSize={14} className="trust-icon" /><span className="trust-text"><strong>Parent Meetings Included</strong> &mdash; you are part of every step</span></div></FadeIn>
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="section experience-section" id="experience">
        <div className="container">
          <FadeIn>
            <p className="experience-label">THE LEARNING EXPERIENCE</p>
            <h2 className="experience-title">Not Just Teaching. Truly Learning.</h2>
            <div className="section-underline-center" />
            <p className="experience-sub">Every session at Zenith Pranavi is designed around one question &mdash; is this child genuinely <strong>understanding</strong>, <strong>growing</strong>, and <strong>loving the process</strong>?</p>
          </FadeIn>
          <div className="experience-grid">
            {experiences.map((exp, i) => (
              <FadeIn key={exp.title} delay={i * 0.1}>
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

      {/* QUOTE */}
      <section className="quote-section">
        <div className="container">
          <FadeIn>
            <blockquote className="philosophy-quote">
              &ldquo;The goal is not to make every child the <span className="underline-text">same kind of smart</span> &mdash; it&rsquo;s to
              help every child discover the <span className="underline-text">kind of smart they already are</span>. At
              Zenith Pranavi, that is not a philosophy. It is our daily practice.&rdquo;
            </blockquote>
            <p className="quote-attribution">&mdash; zped (Zenith Pranavi Education)</p>
          </FadeIn>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section process-section" id="how-it-works">
        <div className="container">
          <FadeIn>
            <p className="section-badge"><GraduationCap size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />The Process</p>
            <h2 className="section-title process-title">Simple to Start.<br />Profound in Impact.</h2>
            <div className="section-underline-center" />
          </FadeIn>
          <div className="process-steps">
            {[
              { num: '01', title: 'Free Discovery Call', desc: <><strong>30 minutes</strong> understanding your child &mdash; strengths, challenges, curriculum, and dreams. No forms. No pressure. Just a <strong>real conversation</strong>.</>, tags: ['30 Minutes','Free','Google Meet'] },
              { num: '02', title: "Your Child's Learning Map", desc: <>Our educators design a <strong>personalised path</strong> &mdash; not a template, a bespoke map drawn specifically for your child.</>, tags: ['Personalised','48hrs'] },
              { num: '03', title: 'Meet Your Matched Tutor', desc: <>We match your child with an <strong>expert</strong> who specialises in their curriculum, learning style, and specific needs.</>, tags: ['Expert-Matched'] },
              { num: '04', title: 'Learn, Grow, Ascend', desc: <><strong>Live online sessions via Google Meet</strong>, flexible scheduling, parent progress reports, and monthly reviews.</>, tags: ['Live','Google Meet','Adaptive'] }
            ].map((s, i) => (
              <FadeIn key={s.num} delay={i * 0.12}>
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
          <FadeIn delay={0.3}>
            <div className="process-cta">
              <p className="process-cta-text">To book a session, schedule your free discovery call first.</p>
              <button className="btn btn-primary btn-lg" onClick={() => onCTA('process')}>
                <Play size={16} /> Schedule Free Call
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* IMPACT */}
      <section className="section impact-section">
        <div className="container">
          <FadeIn>
            <p className="section-badge">Our Impact</p>
            <h2 className="section-title impact-title">Numbers That Matter</h2>
          </FadeIn>
          <div className="impact-grid">
            {[
              { num: '50', suffix: '+', label: 'Countries', desc: 'Students from six continents', cls: 'gold' },
              { num: '12000', suffix: '+', label: 'Students', desc: "Children whose paths we've shaped", cls: 'navy' },
              { num: '98', suffix: '%', label: 'Satisfaction', desc: 'Parents say their child improved', cls: 'pink' },
              { num: '200', suffix: '+', label: 'Educators', desc: 'Expert tutors across every grade', cls: 'navy' }
            ].map((item, i) => (
              <FadeIn key={item.label} delay={i * 0.1}>
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

      {/* BANNER */}
      <section className="get-started-banner">
        <div className="container">
          <div className="get-started-inner">
            <h2 className="get-started-text">Global Learning. Every Grade. Every Child.</h2>
            <button className="btn btn-primary btn-lg get-started-cta-btn" onClick={() => onCTA('banner')}>Schedule Free Call</button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section cta-section" id="final-cta">
        <div className="container">
          <FadeIn>
            <div className="cta-card cta-card-final">
              <Sparkles size={32} color="var(--gold)" strokeWidth={1.5} style={{ margin: '0 auto 16px', display: 'block' }} />
              <h2 className="cta-title">Your Child&rsquo;s Zenith<br /><span className="cta-title-accent">Starts Here</span></h2>
              <p className="cta-desc">Join <strong>thousands of families</strong> worldwide who trust Zenith Pranavi. Your first session is <strong>completely free</strong>.</p>
              <div className="cta-btn-row">
                <button className="btn btn-primary btn-lg" onClick={() => onCTA('final')}>Claim Free Session</button>
              </div>
              <p className="cta-note">No credit card &middot; No commitment &middot; Just learning</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW WE'RE DIFFERENT ── */}
      <section className="section comparison-section" id="comparison">
        <div className="container">
          <FadeIn>
            <p className="section-badge"><Award size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />The Difference</p>
            <h2 className="section-title">How We Stand <strong>Apart</strong></h2>
            <p className="section-desc">See why families choose Zenith Pranavi over traditional tutoring.</p>
          </FadeIn>
          <div className="comparison-grid">
            <FadeIn>
              <div className="comparison-card comparison-card-other">
                <div className="comparison-header">
                  <span className="comparison-label">Traditional Tutoring</span>
                </div>
                <ul className="comparison-list">
                  <li className="comparison-item comparison-item-bad">
                    <X size={16} />
                    <span>One-size-fits-all approach</span>
                  </li>
                  <li className="comparison-item comparison-item-bad">
                    <X size={16} />
                    <span>Random tutor assignment</span>
                  </li>
                  <li className="comparison-item comparison-item-bad">
                    <X size={16} />
                    <span>No progress tracking</span>
                  </li>
                  <li className="comparison-item comparison-item-bad">
                    <X size={16} />
                    <span>Limited curriculum support</span>
                  </li>
                  <li className="comparison-item comparison-item-bad">
                    <X size={16} />
                    <span>No special needs expertise</span>
                  </li>
                  <li className="comparison-item comparison-item-bad">
                    <X size={16} />
                    <span>Rigid scheduling</span>
                  </li>
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="comparison-card comparison-card-us">
                <div className="comparison-header">
                  <span className="comparison-label">Zenith Pranavi</span>
                  <span className="comparison-badge">Recommended</span>
                </div>
                <ul className="comparison-list">
                  <li className="comparison-item comparison-item-good">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    <span><strong>Personalised</strong> learning paths</span>
                  </li>
                  <li className="comparison-item comparison-item-good">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    <span><strong>Expert-matched</strong> tutors</span>
                  </li>
                  <li className="comparison-item comparison-item-good">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    <span><strong>Monthly reports</strong> for parents</span>
                  </li>
                  <li className="comparison-item comparison-item-good">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    <span><strong>All curricula</strong> worldwide</span>
                  </li>
                  <li className="comparison-item comparison-item-good">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    <span><strong>Specialist</strong> SEN support</span>
                  </li>
                  <li className="comparison-item comparison-item-good">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    <span><strong>Flexible</strong> 24/7 scheduling</span>
                  </li>
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── MEET OUR TUTORS ── */}
      <section className="section tutors-section" id="tutors">
        <div className="container">
          <FadeIn>
            <p className="section-badge"><Users size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />Our Team</p>
            <h2 className="section-title">Meet Our <strong>Expert Tutors</strong></h2>
            <p className="section-desc">Carefully selected educators who are passionate about student success.</p>
          </FadeIn>
          <div className="tutors-grid">
            {[
              { name: 'Dr. Sarah Chen', role: 'IB Mathematics', exp: '12 years', rating: '4.9', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces', badge: 'Top Rated' },
              { name: 'James Wilson', role: 'IGCSE Sciences', exp: '8 years', rating: '4.8', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces', badge: 'Expert' },
              { name: 'Priya Sharma', role: 'Special Needs', exp: '10 years', rating: '5.0', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces', badge: 'SEN Specialist' },
              { name: 'Michael Torres', role: 'SAT/ACT Prep', exp: '7 years', rating: '4.9', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces', badge: 'Test Expert' }
            ].map((tutor, i) => (
              <FadeIn key={tutor.name} delay={i * 0.1}>
                <div className="tutor-card">
                  <div className="tutor-image-wrap">
                    <img src={tutor.photo} alt={tutor.name} className="tutor-image" />
                    <span className="tutor-badge">{tutor.badge}</span>
                  </div>
                  <h3 className="tutor-name">{tutor.name}</h3>
                  <p className="tutor-role">{tutor.role}</p>
                  <div className="tutor-meta">
                    <span className="tutor-exp">{tutor.exp} exp</span>
                    <span className="tutor-rating">
                      <Star size={12} fill="var(--gold)" color="var(--gold)" />
                      {tutor.rating}
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.4}>
            <p className="tutors-cta-text">All tutors are background-checked, certified, and continuously trained.</p>
          </FadeIn>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section testimonials-section" id="testimonials">
        <div className="container">
          <FadeIn>
            <p className="section-badge"><Quote size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />Testimonials</p>
            <h2 className="section-title">What Parents &amp; Students Say</h2>
            <p className="section-desc">Real stories from <strong>real families</strong> who chose Zenith Pranavi.</p>
          </FadeIn>
          <div className="testimonials-grid">
            {[
              { name: 'Sarah M.', location: 'London, UK', rating: 5, text: 'My son was struggling with maths for years. After just 3 months with Zenith Pranavi, he went from a C to an A*. The tutor understood exactly how he learns.', avatar: 'S' },
              { name: 'Rajesh K.', location: 'Mumbai, India', rating: 5, text: 'As a parent of an autistic child, finding the right tutor felt impossible. Zenith Pranavi matched us with someone who truly understands my daughter. She looks forward to every session.', avatar: 'R' },
              { name: 'Emily C.', location: 'Sydney, Australia', rating: 5, text: 'The IB curriculum support is outstanding. My daughter\'s predicted grades improved significantly. The personalised learning map they created was a game-changer.', avatar: 'E' },
              { name: 'Ahmed H.', location: 'Dubai, UAE', rating: 5, text: 'Fair pricing and world-class quality. We tried 4 other platforms before finding Zenith Pranavi. The difference is night and day — truly personalised teaching.', avatar: 'A' },
              { name: 'Maria L.', location: 'São Paulo, Brazil', rating: 5, text: 'My twins have completely different learning styles. Zenith Pranavi gave each of them a different tutor perfectly matched to their needs. Both are thriving now.', avatar: 'M' },
              { name: 'James T.', location: 'Toronto, Canada', rating: 5, text: 'The progress reports are incredible. I can see exactly what my son covered, where he improved, and what needs work. Complete transparency.', avatar: 'J' }
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.08}>
                <div className="testimonial-card">
                  <div className="testimonial-stars">
                    {Array.from({ length: t.rating }).map((_, si) => (
                      <Star key={si} size={14} fill="var(--gold)" color="var(--gold)" />
                    ))}
                  </div>
                  <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{t.avatar}</div>
                    <div>
                      <strong className="testimonial-name">{t.name}</strong>
                      <span className="testimonial-location">{t.location}</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section faq-section" id="faq">
        <div className="container">
          <FadeIn>
            <p className="section-badge"><HelpCircle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />FAQ</p>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-desc">Everything you need to know about learning with <strong>Zenith Pranavi</strong>.</p>
          </FadeIn>
          <div className="faq-list">
            {[
              { q: 'How does the free discovery call work?', a: 'The discovery call is a free 30-minute conversation via Google Meet. We learn about your child — their strengths, challenges, curriculum, and goals. There\'s no obligation, no sales pitch. Just a real conversation about how we can help.' },
              { q: 'What curricula do you support?', a: 'We support all major international curricula including CBSE, IGCSE, IB (MYP & DP), US Common Core, Australian Curriculum, UK National Curriculum, and more. Our tutors are specialists in their respective curricula.' },
              { q: 'How are tutors matched to students?', a: 'We match based on three factors: curriculum expertise, learning style compatibility, and specific needs (such as neurodiverse support). Every match is carefully considered — we don\'t just assign the next available tutor.' },
              { q: 'What if my child has special learning needs?', a: 'We have specialist-trained educators for autism, ADHD, dyslexia, and other neurodiverse profiles. These aren\'t general tutors with basic training — they\'re professionals with deep expertise in inclusive education.' },
              { q: 'Can I get a refund if I\'m not satisfied?', a: 'Yes. We offer refunds for unused sessions. If a session doesn\'t happen due to tutor absence or technical issues on our end, you get a full refund for that session. See our refund policy for complete details.' },
              { q: 'How do sessions work technically?', a: 'All sessions are conducted live via Google Meet. You\'ll receive a unique link before each session. Sessions are one-on-one, fully interactive, and recorded only with your permission for revision purposes.' },
              { q: 'What age groups do you teach?', a: 'We teach students from Year 1 (age 5-6) through Year 12 (age 17-18), plus university entrance exam preparation for SAT, JEE, NEET, and other competitive exams.' },
              { q: 'How often should my child have sessions?', a: 'Most students benefit from 2-3 sessions per week for consistent progress. However, we\'re flexible — some families prefer intensive daily sessions before exams, while others start with one session weekly.' }
            ].map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <FAQItem question={faq.q} answer={faq.a} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="section contact-section" id="contact">
        <div className="container">
          <FadeIn>
            <p className="section-badge">GET IN TOUCH</p>
            <h2 className="section-title">Talk To Us</h2>
            <p className="section-desc">Have questions? We&rsquo;d <strong>love to hear from you</strong>. Send us a message and we&rsquo;ll respond promptly.</p>
          </FadeIn>
          <div className="contact-wrapper">
            <FadeIn>
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
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="contact-info">
                <div className="contact-info-card">
                  <IconCircle icon={Mail} />
                  <div><h3>Email Us</h3><p><a href="mailto:hello@zped.org">hello@zped.org</a></p></div>
                </div>
                <div className="contact-info-card">
                  <IconCircle icon={Globe} />
                  <div><h3>Website</h3><p><a href="https://zped.org" rel="canonical">zped.org</a></p></div>
                </div>
                <div className="contact-info-card">
                  <IconCircle icon={Clock} />
                  <div><h3>Hours</h3><p>Mon&ndash;Sat, 9 AM &ndash; 8 PM</p></div>
                </div>
                <a href="https://www.instagram.com/mathmatisa?igsh=eWc3cXc3ODB2ODJy" target="_blank" rel="noopener noreferrer" className="contact-info-card contact-info-card-link">
                  <IconCircle icon={Instagram} />
                  <div><h3>Follow Us</h3><p>@mathmatisa on Instagram</p></div>
                  <ArrowRight size={16} className="contact-card-arrow" />
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <div className="footer-brand-row">
                <img src="/logo-icon.jpeg" alt="zped — Zenith Pranavi" className="footer-logo-img" />
                <span className="brand-name">zped</span>
              </div>
              <p className="footer-tagline">by Zenith Pranavi — Where Every Child Reaches Their Zenith</p>
              <div className="footer-social">
                <a href="https://www.instagram.com/mathmatisa?igsh=eWc3cXc3ODB2ODJy" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Instagram">
                  <Instagram size={18} />
                </a>
              </div>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Quick Links</h4>
              <ul className="footer-col-links">
                <li><a href="#why">Why Us</a></li>
                <li><a href="#programs">Programs</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#testimonials">Testimonials</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Contact</h4>
              <ul className="footer-col-links">
                <li>hello@zped.org</li>
                <li>claims@zped.org</li>
                <li>Mon&ndash;Sat, 9 AM &ndash; 8 PM</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Legal</h4>
              <ul className="footer-col-links">
                <li><a href="#" onClick={e => { e.preventDefault(); onRefund() }}>Refund Policy</a></li>
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
            <p>&copy; 2026 zped (Zenith Pranavi Education). All rights reserved. <a href="https://zped.org" style={{color:'var(--gold)',textDecoration:'none'}}>zped.org</a></p>
          </div>
        </div>
      </footer>
      <BackToTop />
    </main>
  )
}
