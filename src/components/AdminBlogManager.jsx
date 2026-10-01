import { useCallback, useEffect, useState } from 'react'
import { Edit3, FilePlus2, RefreshCw, Save, Trash2, X } from 'lucide-react'
import { createBlog, deleteBlog, fetchAllBlogs, updateBlog } from '../lib/blogs'

const EMPTY = { title: '', slug: '', excerpt: '', content: '', author: 'Zenith Pranavi Education (ZPed)', status: 'draft' }

export default function AdminBlogManager({ toast }) {
  const [blogs, setBlogs] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setBlogs(await fetchAllBlogs()) }
    catch (error) { toast.error(error.message) }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const reset = () => { setForm(EMPTY); setEditingId(null) }
  const edit = blog => {
    setEditingId(blog.id)
    setForm({ title: blog.title, slug: blog.slug, excerpt: blog.excerpt, content: blog.content, author: blog.author, status: blog.status })
  }
  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingId) await updateBlog(editingId, form)
      else await createBlog(form)
      toast.success(editingId ? 'Blog updated' : 'Blog created')
      reset()
      await load()
    } catch (error) { toast.error(error.message) }
    finally { setSaving(false) }
  }
  const remove = async blog => {
    if (!window.confirm(`Delete “${blog.title}”?`)) return
    try { await deleteBlog(blog.id); toast.success('Blog deleted'); await load() }
    catch (error) { toast.error(error.message) }
  }

  return <div className="admin-blog-layout">
    <form className="admin-blog-form" onSubmit={submit}>
      <div className="admin-blog-heading"><div><h3>{editingId ? 'Edit blog' : 'Create a blog'}</h3><p>Published posts appear immediately on the public Blogs page.</p></div>{editingId && <button type="button" className="admin-icon-btn" onClick={reset}><X size={18} /></button>}</div>
      <label>Title<input required name="title" maxLength="240" value={form.title} onChange={change} /></label>
      <label>Slug <small>(optional; generated from title)</small><input name="slug" maxLength="180" value={form.slug} onChange={change} placeholder="understanding-autism" /></label>
      <label>Excerpt<textarea required name="excerpt" maxLength="500" rows="3" value={form.excerpt} onChange={change} /></label>
      <label>Content<textarea required name="content" rows="18" value={form.content} onChange={change} placeholder="Use blank lines between paragraphs." /></label>
      <div className="admin-blog-fields"><label>Author<input required name="author" maxLength="150" value={form.author} onChange={change} /></label><label>Status<select name="status" value={form.status} onChange={change}><option value="draft">Draft</option><option value="published">Published</option></select></label></div>
      <button className="btn btn-primary" disabled={saving}>{saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} {editingId ? 'Save changes' : 'Create blog'}</button>
    </form>
    <div className="admin-blog-list"><div className="admin-blog-heading"><div><h3>All blogs</h3><p>{blogs.length} post{blogs.length === 1 ? '' : 's'} in TiDB</p></div><button className="admin-icon-btn" onClick={load} disabled={loading}><RefreshCw size={17} /></button></div>
      {loading ? <p>Loading…</p> : blogs.map(blog => <div className="admin-blog-row" key={blog.id}><div><span className={`admin-blog-status ${blog.status}`}>{blog.status}</span><h4>{blog.title}</h4><small>/blogs/{blog.slug}</small></div><div><button onClick={() => edit(blog)} title="Edit"><Edit3 size={16} /></button><button onClick={() => remove(blog)} title="Delete"><Trash2 size={16} /></button></div></div>)}
      {!loading && !blogs.length && <div className="admin-empty"><FilePlus2 size={36} /><p>No blogs yet. Create the first one.</p></div>}
    </div>
  </div>
}
