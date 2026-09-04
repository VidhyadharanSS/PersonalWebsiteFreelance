import { useEffect, useState } from 'react'

const DEFAULT_MESSAGES = [
  'Sharpening pencils in the cloud…',
  'Connecting curious minds…',
  'Turning questions into discoveries…',
  'Preparing your learning space…',
]

export default function LoadingSpinner({ message, messages = DEFAULT_MESSAGES, size = 'default', fullscreen = false }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const rotating = message === undefined && messages.length > 1

  useEffect(() => {
    if (!rotating) return undefined
    const timer = window.setInterval(() => setMessageIndex(index => (index + 1) % messages.length), 1600)
    return () => window.clearInterval(timer)
  }, [messages, rotating])

  const visibleMessage = message === undefined ? messages[messageIndex] : message
  return (
    <div className={`zp-loader zp-loader-${size}${fullscreen ? ' zp-loader-fullscreen' : ''}`} role="status" aria-live="polite">
      <div className="zp-loader-mark" aria-hidden="true">
        <span className="zp-loader-ring" />
        <span className="zp-loader-ring zp-loader-ring-two" />
        <span className="zp-loader-core">Z</span>
        <i /><i /><i />
      </div>
      {visibleMessage && <p key={visibleMessage} className="zp-loader-message">{visibleMessage}</p>}
      <span className="zp-loader-caption">ZPED LEARNING ENGINE</span>
    </div>
  )
}

export { DEFAULT_MESSAGES }
