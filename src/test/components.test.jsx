import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../components/LoadingSpinner'
import NotFound from '../components/NotFound'
import ErrorBoundary from '../components/ErrorBoundary'

describe('LoadingSpinner', () => {
  it('renders with a distinctive default learning message', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Sharpening pencils in the cloud…')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Fetching data..." />)
    expect(screen.getByText('Fetching data...')).toBeInTheDocument()
  })

  it('renders without message when empty', () => {
    const { container } = render(<LoadingSpinner message="" />)
    expect(container.querySelector('p')).toBeNull()
  })
})

describe('NotFound', () => {
  it('renders 404 text', () => {
    render(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    render(<NotFound />)
    expect(screen.getByText('Back to Home')).toBeInTheDocument()
    expect(screen.getByText('Explore Lessons')).toBeInTheDocument()
  })
})

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders error UI when child throws', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()

    spy.mockRestore()
  })
})

import { vi } from 'vitest'
