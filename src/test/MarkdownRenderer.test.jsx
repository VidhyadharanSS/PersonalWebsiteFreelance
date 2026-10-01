import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MarkdownRenderer from '../components/MarkdownRenderer'

describe('MarkdownRenderer', () => {
  it('renders common blog markdown as semantic content', () => {
    render(<MarkdownRenderer content={'## Helpful heading\n\nA **bold** paragraph with [ZPed](https://zped.org).\n\n- First item\n- Second item\n\n> A useful note\n\n```js\nconst safe = true\n```'} />)
    expect(screen.getByRole('heading', { name: 'Helpful heading' })).toBeInTheDocument()
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByRole('link', { name: 'ZPed' })).toHaveAttribute('rel', 'noreferrer noopener')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('A useful note').closest('blockquote')).toBeInTheDocument()
    expect(screen.getByText('const safe = true')).toBeInTheDocument()
  })

  it('does not create unsafe links or raw HTML', () => {
    const { container } = render(<MarkdownRenderer content={'[Unsafe](javascript:alert(1))\n\n<script>alert(1)</script>'} />)
    expect(screen.getByRole('link', { name: 'Unsafe' })).toHaveAttribute('href', '#')
    expect(container.querySelector('script')).not.toBeInTheDocument()
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
  })

  it('renders tables and lazy-loaded images', () => {
    render(<MarkdownRenderer content={'| Topic | Support |\n| --- | --- |\n| Maths | Visuals |\n\n![Learning](https://zped.org/learning.jpg)'} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Learning' })).toHaveAttribute('loading', 'lazy')
  })
})
