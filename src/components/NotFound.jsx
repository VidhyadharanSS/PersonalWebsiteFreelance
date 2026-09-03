import { ArrowLeft, Home, BookOpen, Search } from 'lucide-react'

/**
 * 404 Not Found page — beautiful, on-brand error page
 */
export default function NotFound({ onHome, onLearn }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '80vh', padding: '40px 24px',
      textAlign: 'center'
    }}>
      {/* Large 404 */}
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(5rem, 15vw, 10rem)',
        fontWeight: 900, lineHeight: 1,
        background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 40%, var(--gold-light) 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text', marginBottom: 8, letterSpacing: -4
      }}>
        404
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
        fontWeight: 800, color: 'var(--text-dark)', marginBottom: 12,
        letterSpacing: 0.5
      }}>
        Page Not Found
      </h2>

      <p style={{
        fontFamily: 'var(--font-elegant)', fontSize: '1.05rem',
        color: 'var(--text-warm)', fontStyle: 'italic',
        maxWidth: 480, marginBottom: 36, lineHeight: 1.7
      }}>
        The page you're looking for doesn't exist or has been moved.
        Let's get you back on track.
      </p>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={onHome || (() => { window.location.href = '/' })}
          className="btn btn-primary btn-lg"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Home size={18} />
          <span>Back to Home</span>
        </button>

        <button
          onClick={onLearn || (() => { window.location.href = '/learn' })}
          className="btn btn-outline btn-lg"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <BookOpen size={18} />
          <span>Explore Lessons</span>
        </button>
      </div>

      {/* Subtle decoration */}
      <div style={{
        marginTop: 64, display: 'flex', alignItems: 'center', gap: 10,
        color: 'var(--text-muted)', fontSize: '0.82rem'
      }}>
        <Search size={14} />
        <span>zped.org — Where Every Child Reaches Their Zenith</span>
      </div>
    </div>
  )
}
