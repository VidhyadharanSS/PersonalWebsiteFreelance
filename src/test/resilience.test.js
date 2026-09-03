import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../lib/resilience'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const operation = vi.fn().mockResolvedValue('success')
    const result = await withRetry(operation)
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries on transient failure', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('recovered')

    const result = await withRetry(operation, { maxRetries: 2, baseDelay: 10 })
    expect(result).toBe('recovered')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('throws after exhausting retries', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('persistent error'))

    await expect(
      withRetry(operation, { maxRetries: 2, baseDelay: 10 })
    ).rejects.toThrow('persistent error')

    expect(operation).toHaveBeenCalledTimes(3) // initial + 2 retries
  })

  it('does not retry on auth errors', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Not authenticated'))

    await expect(
      withRetry(operation, { maxRetries: 3, baseDelay: 10 })
    ).rejects.toThrow('Not authenticated')

    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('does not retry on permission denied', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Permission denied'))

    await expect(
      withRetry(operation, { maxRetries: 3, baseDelay: 10 })
    ).rejects.toThrow('Permission denied')

    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('calls onRetry callback', async () => {
    const onRetry = vi.fn()
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok')

    await withRetry(operation, { maxRetries: 2, baseDelay: 10, onRetry })
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
  })
})
