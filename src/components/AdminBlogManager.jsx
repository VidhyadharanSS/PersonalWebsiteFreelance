import { useCallback, useEffect, useRef, useState } from 'react'
import { Bold, Code2, Edit3, Eye, FilePlus2, Heading2, Image, Italic, Link, List, ListOrdered, Quote, RefreshCw, Save, Trash2, X } from 'lucide-react'
import { createBlog, deleteBlog, fetchAllBlogs, updateBlog } from '../lib/blogs'
import MarkdownRenderer from './MarkdownRenderer'

const EMPTY = { title: '', slug: '', excerpt: '', content: '', author: 'Zenith Pranavi Education (ZPed)', status: 'draft' }
const DRAFT_KEY = 'zped-admin-blog-draft'
const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180)
const words = value => String(value || '').trim().split(/\s+/).filter(Boolean).length

export default function AdminBlogManager({ toast }) {
  const [blogs, setBlogs] = useState([])
  const [form, setForm] = useState(() => {
    try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') } } catch { return EMPTY }
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState('write')
  const [slugEdited, setSlugEdited] = useState(Boolean(form.slug))
  const editorRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setBlogs(await fetchAllBlogs()) }
    catch (error) { toast.error(error.message) }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!editingId) localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
  }, [editingId, form])

  const change = event => {
    const { name, value } = event.target
    if (name === 'slug') setSlugEdited(Boolean(value))
    setForm(current => ({ ...current, [name]: value, ...(name === 'title' && !slugEdited ? { slug: slugify(value) } : {}) }))
  }
  const reset = () => {
    setForm(EMPTY); setEditingId(null); setMode('write'); setSlugEdited(false); localStorage.removeItem(DRAFT_KEY)
  }
  const edit = blog => {
    setEditingId(blog.id); setMode('write'); setSlugEdited(true)
    setForm({ title: blog.title, slug: blog.slug, excerpt: blog.excerpt, content: blog.content, author: blog.author, status: blog.status })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const insert = (before, after = '', fallback = 'text') => {
    const editor = editorRef.current
    if (!editor) return
    const start = editor.selectionStart
    const end = editor.selectionEnd
    const selected = form.content.slice(start, end) || fallback
    const next = `${form.content.slice(0, start)}${before}${selected}${after}${form.content.slice(end)}`
    setForm(current => ({ ...current, content: next }))
    requestAnimationFrame(() => { editor.focus(); editor.setSelectionRange(start + before.length, start + before.length + selected.length) })
  }
  const submit = async event => {
    event.preventDefault(); setSaving(true)
    try {
      if (editingId) await updateBlog(editingId, form)
      else await createBlog(form)
      toast.success(editingId ? 'Blog updated' : 'Blog created'); reset(); await load()
    } catch (error) { toast.error(error.message) }
    finally { setSaving(false) }
  }
  const remove = async blog => {
    if (!window.confirm(`Delete “${blog.title}”?`)) return
    try { await deleteBlog(blog.id); toast.success('Blog deleted'); await load() }
    catch (error) { toast.error(error.message) }
  }

  const tools = [
    ['Heading', Heading2, () => insert('## ', '', 'Section heading')], ['Bold', Bold, () => insert('**', '**', 'bold text')],
    ['Italic', Italic, () => insert('*', '*', 'italic text')], ['Link', Link, () => insert('[', '](https://example.com)', 'link text')],
    ['Image', Image, () => insert('![', '](https://example.com/image.jpg)', 'image description')], ['Bulleted list', List, () => insert('- ', '', 'List item')],
    ['Numbered list', ListOrdered, () => insert('1. ', '', 'List item')], ['Quote', Quote, () => insert('> ', '', 'Quote')],
    ['Code', Code2, () => insert('`', '`', 'code')],
  ]

  return <div className="admin-blog-layout">
    <form className="admin-blog-form" onSubmit={submit}>
      <div className="admin-blog-heading"><div><h3>{editingId ? 'Edit blog' : 'Create a blog'}</h3><p>Write with Markdown and preview the article before publishing.</p></div>{editingId && <button type="button" className="admin-icon-btn" onClick={reset} aria-label="Cancel editing"><X size={18} /></button>}</div>
      {!editingId && form.content && <div className="admin-draft-note">Draft automatically saved in this browser. <button type="button" onClick={reset}>Discard</button></div>}
      <label>Title <span className="field-count">{form.title.length}/240</span><input required name="title" maxLength="240" value={form.title} onChange={change} placeholder="A clear, helpful article title" /></label>
      <label>Slug <small>(generated from title; you can customise it)</small><input name="slug" maxLength="180" value={form.slug} onChange={change} placeholder="understanding-autism" /></label>
      <label>Excerpt <span className="field-count">{form.excerpt.length}/500</span><textarea required name="excerpt" maxLength="500" rows="3" value={form.excerpt} onChange={change} placeholder="A short summary shown on the Blogs page." /></label>
      <div className="admin-editor-label"><label htmlFor="blog-content">Content</label><span>{words(form.content)} words · about {Math.max(1, Math.ceil(words(form.content) / 220))} min read</span></div>
      <div className="admin-markdown-editor">
        <div className="admin-editor-tabs"><button type="button" className={mode === 'write' ? 'active' : ''} onClick={() => setMode('write')}><Edit3 size={15} /> Write</button><button type="button" className={mode === 'preview' ? 'active' : ''} onClick={() => setMode('preview')}><Eye size={15} /> Preview</button></div>
        {mode === 'write' ? <><div className="admin-editor-toolbar" aria-label="Markdown formatting toolbar">{tools.map(([label, Icon, action]) => <button type="button" key={label} title={label} aria-label={label} onClick={action}><Icon size={17} /></button>)}</div><textarea id="blog-content" aria-label="Content" ref={editorRef} required name="content" rows="22" value={form.content} onChange={change} placeholder={'Start writing…\n\n## Add section headings\n\nUse **bold**, *italic*, lists, links, images, quotes, tables, and code.'} /></> : <div className="admin-editor-preview">{form.content ? <MarkdownRenderer content={form.content} /> : <p className="admin-preview-empty">Your formatted preview will appear here.</p>}</div>}
      </div>
      <details className="admin-markdown-help"><summary>Markdown quick guide</summary><div><code>## Heading</code><code>**Bold**</code><code>*Italic*</code><code>[Link](https://...)</code><code>![Alt text](https://...)</code><code>- List item</code><code>&gt; Quote</code><code>```js Code ```</code></div></details>
      <div className="admin-blog-fields"><label>Author<input required name="author" maxLength="150" value={form.author} onChange={change} /></label><label>Status<select name="status" value={form.status} onChange={change}><option value="draft">Draft</option><option value="published">Published</option></select></label></div>
      <div className="admin-blog-actions"><button className="btn btn-primary" disabled={saving}>{saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} {editingId ? 'Save changes' : form.status === 'published' ? 'Publish blog' : 'Save draft'}</button><button type="button" className="btn btn-outline-secondary" onClick={() => setMode(mode === 'write' ? 'preview' : 'write')}>{mode === 'write' ? 'Preview' : 'Continue writing'}</button></div>
    </form>
    <div className="admin-blog-list"><div className="admin-blog-heading"><div><h3>All blogs</h3><p>{blogs.length} post{blogs.length === 1 ? '' : 's'} in TiDB</p></div><button type="button" className="admin-icon-btn" onClick={load} disabled={loading} aria-label="Refresh blogs"><RefreshCw size={17} /></button></div>
      {loading ? <p>Loading…</p> : blogs.map(blog => <div className="admin-blog-row" key={blog.id}><div><span className={`admin-blog-status ${blog.status}`}>{blog.status}</span><h4>{blog.title}</h4><small>/blogs/{blog.slug}</small></div><div><button type="button" onClick={() => edit(blog)} title="Edit"><Edit3 size={16} /></button><button type="button" onClick={() => remove(blog)} title="Delete"><Trash2 size={16} /></button></div></div>)}
      {!loading && !blogs.length && <div className="admin-empty"><FilePlus2 size={36} /><p>No blogs yet. Create the first one.</p></div>}
    </div>
  </div>
}
