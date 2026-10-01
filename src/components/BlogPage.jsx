import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Clock } from 'lucide-react'
import { fetchBlogBySlug, fetchPublishedBlogs } from '../lib/blogs'
import LoadingSpinner from './LoadingSpinner'

const readingTime = content => Math.max(1, Math.ceil(String(content || '').trim().split(/\s+/).length / 220))

export default function BlogPage({ slug, onSelectBlog }) {
  const [blogs, setBlogs] = useState([])
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const load = slug ? fetchBlogBySlug(slug) : fetchPublishedBlogs()
    load.then(data => {
      if (!active) return
      if (slug) setBlog(data)
      else setBlogs(data || [])
    }).catch(err => active && setError(err.message)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [slug])

  if (loading) return <LoadingSpinner message="Opening ZPed stories…" />

  if (slug) {
    if (error || !blog) return <main className="blog-page"><div className="container blog-empty"><h1>Blog not found</h1><p>{error || 'This article is not available.'}</p><button className="btn btn-primary" onClick={() => onSelectBlog()}>View all blogs</button></div></main>
    return (
      <main className="blog-page">
        <article className="container blog-article">
          <button className="blog-back" onClick={() => onSelectBlog()}><ArrowLeft size={16} /> All blogs</button>
          <div className="blog-article-meta"><BookOpen size={15} /> {blog.author} <span>·</span> <Clock size={15} /> {readingTime(blog.content)} min read</div>
          <h1>{blog.title}</h1>
          <p className="blog-lead">{blog.excerpt}</p>
          <div className="blog-body">{blog.content}</div>
        </article>
      </main>
    )
  }

  return (
    <main className="blog-page">
      <section className="blog-hero"><div className="container"><span>ZPed Insights</span><h1>Learning, inclusion, and every child&rsquo;s potential</h1><p>Thoughtful guidance from Zenith Pranavi Education for students, parents, and educators.</p></div></section>
      <section className="container blog-grid-section">
        {error && <div className="blog-empty"><h2>Unable to load blogs</h2><p>{error}</p></div>}
        {!error && blogs.length === 0 && <div className="blog-empty"><h2>Stories are coming soon</h2><p>Please check back shortly.</p></div>}
        <div className="blog-grid">
          {blogs.map(item => (
            <button key={item.id} className="blog-card" onClick={() => onSelectBlog(item.slug)}>
              <div className="blog-card-icon"><BookOpen size={24} /></div>
              <div className="blog-card-meta">{item.author} · {readingTime(item.content)} min read</div>
              <h2>{item.title}</h2><p>{item.excerpt}</p><span>Read article →</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
