async function request(operation, payload = {}) {
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ operation, payload }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Blog request failed')
  return result.data
}

export const fetchPublishedBlogs = () => request('fetchPublishedBlogs')
export const fetchBlogBySlug = slug => request('fetchBlogBySlug', { slug })
export const fetchAllBlogs = () => request('fetchAllBlogs')
export const createBlog = blog => request('createBlog', blog)
export const updateBlog = (id, blog) => request('updateBlog', { id, ...blog })
export const deleteBlog = id => request('deleteBlog', { id })
