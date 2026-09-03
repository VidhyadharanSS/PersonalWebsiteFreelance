import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

/**
 * OfflineBanner — Shows a persistent banner when the user loses internet
 * Automatically hides when connection is restored
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setShowReconnected(true)
      setTimeout(() => setShowReconnected(false), 3000)
    }
    const handleOffline = () => {
      setIsOffline(true)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline && !showReconnected) return null

  return (
    <div
      style={{
        position: 'fixed', top: 72, left: 0, right: 0, zIndex: 998,
        padding: '10px 24px',
        background: isOffline
          ? 'linear-gradient(90deg, #d32f2f, #c62828)'
          : 'linear-gradient(90deg, #2e7d32, #388e3c)',
        color: 'white', textAlign: 'center',
        fontSize: '0.84rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        animation: 'slideDown 0.3s ease',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      {isOffline ? (
        <>
          <WifiOff size={16} />
          <span>You're offline. Some features may not be available.</span>
        </>
      ) : (
        <>
          <Wifi size={16} />
          <span>Connection restored!</span>
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
