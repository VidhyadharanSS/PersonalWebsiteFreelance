import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

/**
 * Error Boundary — catches React render errors
 * Prevents entire app from crashing when a component fails
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Log to console in development
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use fallback prop if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: '40px 24px',
          textAlign: 'center', fontFamily: 'Inter, -apple-system, sans-serif'
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(244,67,54,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 24
          }}>
            <AlertTriangle size={36} color="#f44336" />
          </div>

          <h2 style={{
            fontFamily: 'Cinzel, serif', fontSize: '1.5rem',
            fontWeight: 800, marginBottom: 12, color: 'var(--text-dark, #1a1a2e)'
          }}>
            Something went wrong
          </h2>

          <p style={{
            fontSize: '0.95rem', color: 'var(--text-medium, #4a4a5a)',
            maxWidth: 400, marginBottom: 8, lineHeight: 1.6
          }}>
            An unexpected error occurred. This has been logged and we'll look into it.
          </p>

          {this.state.error?.message && (
            <p style={{
              fontSize: '0.78rem', color: 'var(--text-light, #7a7a8a)',
              background: 'var(--bg-input, #f5f0e8)', padding: '10px 18px',
              borderRadius: 8, marginBottom: 24, maxWidth: 500,
              wordBreak: 'break-word', fontFamily: 'monospace'
            }}>
              {this.state.error.message}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <button
              onClick={this.handleHome}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Home size={16} />
              Go Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
