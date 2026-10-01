import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBlog, fetchPublishedBlogs } from '../lib/blogs'

describe('blog API client', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('loads published blogs through the consolidated data endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ slug: 'welcome' }] }),
    })
    await expect(fetchPublishedBlogs()).resolves.toEqual([{ slug: 'welcome' }])
    expect(fetchMock).toHaveBeenCalledWith('/api/data', expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).operation).toBe('fetchPublishedBlogs')
  })

  it('sends admin blog content and reports API errors', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Administrator access required' }),
    })
    await expect(createBlog({ title: 'New post' })).rejects.toThrow('Administrator access required')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).operation).toBe('createBlog')
  })
})
