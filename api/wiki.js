const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php'
const MAX_QUERY_LENGTH = 120

function cleanQuery(value) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, MAX_QUERY_LENGTH)
}

async function wikipedia(params) {
  const url = new URL(WIKIPEDIA_API)
  Object.entries({ origin: '*', format: 'json', formatversion: '2', ...params }).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ZPed-Learn/1.0 (https://zped.org; educational topic explorer)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`)
  return response.json()
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const query = cleanQuery(req.query?.q)
  const title = cleanQuery(req.query?.title)
  if (!query && !title) return res.status(400).json({ error: 'Enter a topic to explore' })

  try {
    if (title) {
      const data = await wikipedia({ action: 'query', prop: 'extracts|pageimages|info', exintro: '1', explaintext: '1', inprop: 'url', piprop: 'thumbnail', pithumbsize: '900', redirects: '1', titles: title })
      const page = data.query?.pages?.[0]
      if (!page || page.missing) return res.status(404).json({ error: 'Topic not found' })
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800')
      return res.status(200).json({
        topic: {
          title: page.title,
          extract: page.extract || 'Wikipedia does not yet have an introductory summary for this topic.',
          url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`,
          thumbnail: page.thumbnail?.source || null,
        },
      })
    }

    const data = await wikipedia({ action: 'query', generator: 'search', gsrsearch: query, gsrlimit: '8', gsrnamespace: '0', prop: 'extracts|pageimages|info', exintro: '1', explaintext: '1', exsentences: '2', inprop: 'url', piprop: 'thumbnail', pithumbsize: '320' })
    const results = (data.query?.pages || []).map(page => ({
      title: page.title,
      extract: page.extract || 'Open this topic to read its introduction.',
      url: page.fullurl,
      thumbnail: page.thumbnail?.source || null,
    }))
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json({ results })
  } catch (error) {
    console.error('[api/wiki]', error.message)
    return res.status(502).json({ error: 'Wikipedia is temporarily unavailable. Please try again.' })
  }
}
