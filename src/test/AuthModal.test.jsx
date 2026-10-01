import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import AuthModal from '../components/AuthModal'

const auth = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  resetPassword: vi.fn(),
  completePasswordReset: vi.fn(),
  googleEnabled: false,
}

vi.mock('../context/AuthContext', () => ({
  useAuth: () => auth,
}))

vi.mock('../components/Toast', () => ({
  useToast: () => vi.fn(),
}))

describe('AuthModal', () => {
  afterEach(() => {
    document.body.style.overflow = ''
    vi.clearAllMocks()
  })

  it('renders an accessible, visible sign-in dialog', () => {
    render(<AuthModal open onClose={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'Welcome Back' })
    expect(dialog).toBeVisible()
    expect(dialog).toHaveClass('modal-auth')
    expect(screen.getByPlaceholderText('you@example.com')).toBeVisible()
    expect(screen.getByPlaceholderText('Enter your password')).toBeVisible()
    expect(document.body).toHaveStyle({ overflow: 'hidden' })
  })

  it('closes from the close button and restores page scrolling', () => {
    const onClose = vi.fn()
    const { rerender } = render(<AuthModal open onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close sign in dialog' }))
    expect(onClose).toHaveBeenCalledOnce()

    rerender(<AuthModal open={false} onClose={onClose} />)
    expect(document.body.style.overflow).toBe('')
  })
})
