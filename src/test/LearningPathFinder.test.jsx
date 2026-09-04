import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import LearningPathFinder from '../components/LearningPathFinder'

describe('LearningPathFinder', () => {
  it('shows a useful default recommendation', () => {
    render(<LearningPathFinder onCTA={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Foundation Learning' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Ages 6–10' })).toHaveAttribute('aria-selected', 'true')
  })

  it('updates the recommendation when a learner group is selected', () => {
    render(<LearningPathFinder onCTA={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Inclusive support' }))
    expect(screen.getByRole('heading', { name: 'Personalised Inclusive Learning' })).toBeInTheDocument()
    expect(screen.getByText('Specialist-trained educators')).toBeInTheDocument()
  })

  it('starts the correct discovery flow', () => {
    const onCTA = vi.fn()
    render(<LearningPathFinder onCTA={onCTA} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Ages 15–18' }))
    fireEvent.click(screen.getByRole('button', { name: /build my free learning plan/i }))
    expect(onCTA).toHaveBeenCalledWith('path-senior')
  })
})
