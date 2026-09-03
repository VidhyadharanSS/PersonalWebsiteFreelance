/**
 * Reusable loading spinner with optional message
 */
export default function LoadingSpinner({ message = 'Loading...', size = 'default' }) {
  const spinnerSize = size === 'small' ? 24 : size === 'large' ? 48 : 36
  const fontSize = size === 'small' ? '0.76rem' : size === 'large' ? '1rem' : '0.88rem'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, padding: size === 'small' ? '20px' : '48px 24px',
      color: 'var(--text-light)'
    }}>
      <div style={{
        width: spinnerSize, height: spinnerSize,
        border: `3px solid var(--gold-pale, rgba(197,165,90,0.1))`,
        borderTopColor: 'var(--gold, #c5a55a)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      {message && (
        <p style={{
          fontFamily: 'var(--font-elegant)', fontSize, fontStyle: 'italic',
          color: 'var(--text-light)', margin: 0
        }}>
          {message}
        </p>
      )}
    </div>
  )
}
