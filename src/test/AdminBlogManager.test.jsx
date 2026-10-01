import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminBlogManager from '../components/AdminBlogManager'
import * as blogsApi from '../lib/blogs'

vi.mock('../lib/blogs', () => ({
  createBlog: vi.fn(), deleteBlog: vi.fn(), fetchAllBlogs: vi.fn(), updateBlog: vi.fn(),
}))

const toast = { error: vi.fn(), success: vi.fn() }

describe('AdminBlogManager', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    blogsApi.fetchAllBlogs.mockResolvedValue([])
  })

  it('generates a slug and supports formatted preview', async () => {
    render(<AdminBlogManager toast={toast} />)
    await waitFor(() => expect(blogsApi.fetchAllBlogs).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/Title/), { target: { name: 'title', value: 'Inclusive Learning for Every Child' } })
    expect(screen.getByLabelText(/Slug/)).toHaveValue('inclusive-learning-for-every-child')

    fireEvent.change(screen.getByLabelText(/Content/), { target: { name: 'content', value: '## Welcome\n\nThis is **personalised** learning.' } })
fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[0])
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
    expect(screen.getByText('personalised').tagName).toBe('STRONG')
  })

  it('inserts Markdown using the formatting toolbar', async () => {
    render(<AdminBlogManager toast={toast} />)
    await waitFor(() => expect(blogsApi.fetchAllBlogs).toHaveBeenCalled())
    const editor = screen.getByLabelText(/Content/)
    fireEvent.change(editor, { target: { name: 'content', value: 'important' } })
    editor.setSelectionRange(0, 9)
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }))
    expect(editor).toHaveValue('**important**')
  })
})
