import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider, useTheme } from '../context/ThemeContext'

function ThemeHarness() {
  const { theme, themes, selectTheme } = useTheme()
  return (
    <div>
      <output>{theme}</output>
      <span>{themes.length} themes</span>
      <button onClick={() => selectTheme('ocean')}>Ocean</button>
      <button onClick={() => selectTheme('invalid')}>Invalid</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('offers multiple themes and persists a valid selection', () => {
    render(<ThemeProvider><ThemeHarness /></ThemeProvider>)
    expect(screen.getByText('4 themes')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Ocean'))
    expect(screen.getByText('ocean')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('data-theme', 'ocean')
    expect(localStorage.getItem('zp-theme')).toBe('ocean')
  })

  it('ignores unknown theme identifiers', () => {
    render(<ThemeProvider><ThemeHarness /></ThemeProvider>)
    const initialTheme = screen.getByRole('status').textContent
    fireEvent.click(screen.getByText('Invalid'))
    expect(screen.getByRole('status')).toHaveTextContent(initialTheme)
  })
})
