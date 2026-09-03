// ═══════════════════════════════════════════════════════════════════════
// DATABASE RESILIENCE LAYER
// Retry logic, circuit breaker, connection health monitoring
// ═══════════════════════════════════════════════════════════════════════

/**
 * Retry a database operation with exponential backoff
 */
export async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 500,
    maxDelay = 5000,
    onRetry = null,
  } = options

  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry on auth errors or validation errors
      if (isNonRetryableError(error)) {
        throw error
      }

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        const jitter = Math.random() * delay * 0.1
        if (onRetry) onRetry(attempt + 1, error)
        await sleep(delay + jitter)
      }
    }
  }
  throw lastError
}

function isNonRetryableError(error) {
  const msg = error?.message?.toLowerCase() || ''
  return (
    msg.includes('not authenticated') ||
    msg.includes('invalid') ||
    msg.includes('permission denied') ||
    msg.includes('row-level security') ||
    msg.includes('duplicate key') ||
    msg.includes('unique constraint')
  )
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Circuit breaker to prevent cascading failures
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.resetTimeout = options.resetTimeout || 30000
    this.failures = 0
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.lastFailureTime = null
    this.listeners = new Set()
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Service temporarily unavailable. Please try again in a moment.')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  onSuccess() {
    this.failures = 0
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      this.notifyListeners()
    }
  }

  onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
      this.notifyListeners()
    }
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notifyListeners() {
    this.listeners.forEach(fn => fn(this.state))
  }

  getState() {
    return this.state
  }
}

// Global circuit breaker instance for database operations
export const dbCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000,
})

/**
 * Execute a database operation with full resilience:
 * - Circuit breaker protection
 * - Automatic retry with exponential backoff
 * - Error normalization
 */
export async function resilientQuery(operation, options = {}) {
  return dbCircuitBreaker.execute(() =>
    withRetry(operation, {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 500,
      onRetry: options.onRetry,
    })
  )
}

/**
 * Connection health check
 */
export class ConnectionMonitor {
  constructor(supabase) {
    this.supabase = supabase
    this.isOnline = navigator.onLine
    this.lastCheck = null
    this.listeners = new Set()

    window.addEventListener('online', () => this.updateStatus(true))
    window.addEventListener('offline', () => this.updateStatus(false))
  }

  updateStatus(isOnline) {
    this.isOnline = isOnline
    this.listeners.forEach(fn => fn(isOnline))
  }

  subscribe(listener) {
    this.listeners.add(listener)
    listener(this.isOnline)
    return () => this.listeners.delete(listener)
  }

  async healthCheck() {
    try {
      const start = Date.now()
      await this.supabase.from('tutors').select('id').limit(1)
      this.lastCheck = { ok: true, latency: Date.now() - start, at: new Date() }
      this.updateStatus(true)
      return this.lastCheck
    } catch {
      this.lastCheck = { ok: false, latency: null, at: new Date() }
      return this.lastCheck
    }
  }
}
