import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, BookMarked, Globe2, Search, Sparkles, X } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

const SUGGESTIONS = ['Solar system', 'Algebra', 'Human brain', 'World War II', 'Computer science', 'Climate change']

export default function WikipediaExplorer() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [topic, setTopic] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const requestRef = useRef(null)

  useEffect(() => () => requestRef.current?.abort(), [])

  async function request(params, nextStatus) {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setStatus(nextStatus)
    setError('')
    try {
      const response = await fetch(`/api/wiki?${params}`, { signal: controller.signal })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load this topic')
      return data
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message)
        setStatus('error')
      }
      return null
    }
  }

  async function search(value = query) {
    const clean = value.trim()
    if (clean.length < 2) {
      setError('Type at least two characters to search.')
      setStatus('error')
      return
    }
    setQuery(clean)
    setTopic(null)
    const data = await request(`q=${encodeURIComponent(clean)}`, 'searching')
    if (data) {
      setResults(data.results || [])
      setStatus('results')
    }
  }

  async function openTopic(title) {
    const data = await request(`title=${encodeURIComponent(title)}`, 'reading')
    if (data) {
      setTopic(data.topic)
      setStatus('topic')
    }
  }

  return (
    <section className="wiki-explorer" aria-labelledby="wiki-heading">
      <div className="wiki-orbit wiki-orbit-one" />
      <div className="wiki-orbit wiki-orbit-two" />
      <div className="wiki-intro">
        <span className="wiki-kicker"><Globe2 size={16} /> Open Knowledge Lab</span>
        <h2 id="wiki-heading">Search almost any topic. <em>Learn without limits.</em></h2>
        <p>Explore live, student-friendly introductions from English Wikipedia, then continue to the original article for sources and deeper reading.</p>
        <form className="wiki-search" onSubmit={(event) => { event.preventDefault(); search() }} role="search">
          <Search size={20} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘quantum physics’ or ‘ancient Egypt’" aria-label="Search Wikipedia topics" />
          {query && <button type="button" className="wiki-clear" onClick={() => { setQuery(''); setResults([]); setTopic(null); setStatus('idle') }} aria-label="Clear search"><X size={17} /></button>}
          <button type="submit" className="wiki-submit">Explore <Sparkles size={16} /></button>
        </form>
        <div className="wiki-suggestions" aria-label="Suggested topics">
          <span>Popular:</span>
          {SUGGESTIONS.map(item => <button key={item} onClick={() => search(item)}>{item}</button>)}
        </div>
      </div>

      <div className="wiki-stage" aria-live="polite">
        {status === 'idle' && (
          <div className="wiki-welcome">
            <div className="wiki-globe"><Globe2 size={42} /></div>
            <strong>A whole library in one search</strong>
            <p>Choose a suggestion or enter any school subject, person, event, place, or idea.</p>
            <div className="wiki-trust"><BookMarked size={16} /> Live summaries · Source links · No account needed</div>
          </div>
        )}
        {(status === 'searching' || status === 'reading') && <LoadingSpinner size="large" message={status === 'reading' ? 'Opening the next chapter…' : 'Scanning the knowledge universe…'} />}
        {status === 'error' && <div className="wiki-error"><strong>We hit a quiet patch.</strong><p>{error}</p><button onClick={() => search()}>Try again</button></div>}
        {status === 'results' && (
          <div className="wiki-results">
            <div className="wiki-results-head"><span>{results.length} learning trails</span><strong>Results for “{query}”</strong></div>
            {results.length ? results.map((result, index) => (
              <button className="wiki-result" key={result.title} onClick={() => openTopic(result.title)} style={{ '--result-index': index }}>
                {result.thumbnail ? <img src={result.thumbnail} alt="" loading="lazy" /> : <span className="wiki-result-placeholder"><BookMarked size={20} /></span>}
                <span><strong>{result.title}</strong><small>{result.extract}</small></span>
                <ArrowUpRight size={18} />
              </button>
            )) : <div className="wiki-error"><strong>No matching learning trail</strong><p>Try a broader term or check the spelling.</p></div>}
          </div>
        )}
        {status === 'topic' && topic && (
          <article className="wiki-topic">
            <button className="wiki-topic-back" onClick={() => setStatus('results')}>← Back to results</button>
            {topic.thumbnail && <img src={topic.thumbnail} alt="" />}
            <div className="wiki-topic-copy">
              <span><Globe2 size={14} /> From Wikipedia</span>
              <h3>{topic.title}</h3>
              <p>{topic.extract}</p>
              <a href={topic.url} target="_blank" rel="noreferrer">Continue on Wikipedia <ArrowUpRight size={16} /></a>
              <small>Wikipedia is community-edited. For assignments, verify important facts with primary or teacher-approved sources.</small>
            </div>
          </article>
        )}
      </div>
    </section>
  )
}
