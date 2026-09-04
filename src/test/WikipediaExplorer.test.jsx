import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import WikipediaExplorer from '../components/WikipediaExplorer'

const response = data => Promise.resolve({ ok: true, json: () => Promise.resolve(data) })

describe('WikipediaExplorer', () => {
  afterEach(() => vi.restoreAllMocks())

  it('searches Wikipedia through the safe application endpoint', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(() => response({ results: [{ title: 'Solar System', extract: 'The planetary system around the Sun.', url: 'https://en.wikipedia.org/wiki/Solar_System', thumbnail: null }] }))
    render(<WikipediaExplorer />)
    fireEvent.change(screen.getByLabelText('Search Wikipedia topics'), { target: { value: 'solar system' } })
    fireEvent.click(screen.getByRole('button', { name: /explore/i }))
    expect(await screen.findByText('Solar System')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/wiki?q=solar%20system', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })

  it('opens a selected topic and links to its source', async () => {
    vi.spyOn(global, 'fetch')
      .mockImplementationOnce(() => response({ results: [{ title: 'Algebra', extract: 'A branch of mathematics.', url: 'https://en.wikipedia.org/wiki/Algebra', thumbnail: null }] }))
      .mockImplementationOnce(() => response({ topic: { title: 'Algebra', extract: 'Algebra studies mathematical symbols.', url: 'https://en.wikipedia.org/wiki/Algebra', thumbnail: null } }))
    render(<WikipediaExplorer />)
    fireEvent.click(screen.getByRole('button', { name: 'Algebra' }))
    const resultTitle = await screen.findByText('Algebra', { selector: '.wiki-result strong' })
    fireEvent.click(resultTitle.closest('button'))
    expect(await screen.findByText('Algebra studies mathematical symbols.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /continue on wikipedia/i })).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Algebra')
  })

  it('shows a helpful error for a short query without making a request', async () => {
    const fetchMock = vi.spyOn(global, 'fetch')
    render(<WikipediaExplorer />)
    fireEvent.change(screen.getByLabelText('Search Wikipedia topics'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: /explore/i }))
    await waitFor(() => expect(screen.getByText('Type at least two characters to search.')).toBeInTheDocument())
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
