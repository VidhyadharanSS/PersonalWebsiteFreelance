import { Fragment } from 'react'

const safeUrl = (value, image = false) => {
  const url = String(value || '').trim()
  if (/^(https?:\/\/|\/)/i.test(url)) return url
  if (!image && /^(mailto:|#)/i.test(url)) return url
  return image ? '' : '#'
}

function inline(text, key = 'md') {
  const source = String(text || '')
  const pattern = /(!?\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*]+)\*)/g
  const output = []
  let cursor = 0
  let match
  while ((match = pattern.exec(source))) {
    if (match.index > cursor) output.push(source.slice(cursor, match.index))
    const token = match[0]
    const tokenKey = `${key}-${match.index}`
    if (token.startsWith('![')) {
      const src = safeUrl(match[3], true)
      output.push(src ? <img key={tokenKey} src={src} alt={match[2]} title={match[4] || undefined} loading="lazy" /> : match[2])
    } else if (token.startsWith('[')) {
      const href = safeUrl(match[3])
      const external = /^https?:\/\//i.test(href)
      output.push(<a key={tokenKey} href={href} title={match[4] || undefined} target={external ? '_blank' : undefined} rel={external ? 'noreferrer noopener' : undefined}>{inline(match[2], tokenKey)}</a>)
    } else if (token.startsWith('`')) output.push(<code key={tokenKey}>{match[5]}</code>)
    else if (token.startsWith('**')) output.push(<strong key={tokenKey}>{inline(match[6], tokenKey)}</strong>)
    else if (token.startsWith('__')) output.push(<strong key={tokenKey}>{inline(match[7], tokenKey)}</strong>)
    else if (token.startsWith('~~')) output.push(<del key={tokenKey}>{inline(match[8], tokenKey)}</del>)
    else output.push(<em key={tokenKey}>{inline(match[9], tokenKey)}</em>)
    cursor = pattern.lastIndex
  }
  if (cursor < source.length) output.push(source.slice(cursor))
  return output
}

const isBlockStart = line => /^(#{1,6})\s+|^```|^>\s?|^\s*[-*+]\s+|^\s*\d+\.\s+|^\s*(---+|\*\*\*+)\s*$/.test(line)
const tableCells = line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim())

export default function MarkdownRenderer({ content, className = '' }) {
  const lines = String(content || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) { index += 1; continue }

    const fence = line.match(/^```([^\s]*)\s*$/)
    if (fence) {
      const code = []
      index += 1
      while (index < lines.length && !/^```/.test(lines[index])) code.push(lines[index++])
      if (index < lines.length) index += 1
      blocks.push(<pre key={`code-${index}`}><code className={fence[1] ? `language-${fence[1]}` : undefined}>{code.join('\n')}</code></pre>)
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      const Tag = `h${heading[1].length}`
      blocks.push(<Tag key={`heading-${index}`}>{inline(heading[2], `heading-${index}`)}</Tag>)
      index += 1; continue
    }

    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { blocks.push(<hr key={`hr-${index}`} />); index += 1; continue }

    if (line.includes('|') && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const headers = tableCells(line)
      index += 2
      const rows = []
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) rows.push(tableCells(lines[index++]))
      blocks.push(<div className="markdown-table-wrap" key={`table-${index}`}><table><thead><tr>{headers.map((cell, cellIndex) => <th key={cellIndex}>{inline(cell, `th-${cellIndex}`)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inline(cell, `td-${rowIndex}-${cellIndex}`)}</td>)}</tr>)}</tbody></table></div>)
      continue
    }

    if (/^>\s?/.test(line)) {
      const quote = []
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ''))
      blocks.push(<blockquote key={`quote-${index}`}>{quote.map((part, quoteIndex) => <Fragment key={quoteIndex}>{inline(part, `quote-${quoteIndex}`)}{quoteIndex < quote.length - 1 && <br />}</Fragment>)}</blockquote>)
      continue
    }

    const listMatch = line.match(/^\s*([-*+]|\d+\.)\s+(.+)$/)
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1])
      const items = []
      const expression = ordered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/
      while (index < lines.length) {
        const item = lines[index].match(expression)
        if (!item) break
        items.push(item[1]); index += 1
      }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(<List key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item, `li-${itemIndex}`)}</li>)}</List>)
      continue
    }

    const paragraph = [line.trim()]
    index += 1
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index]) && !(lines[index].includes('|') && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1]))) paragraph.push(lines[index++].trim())
    blocks.push(<p key={`paragraph-${index}`}>{inline(paragraph.join(' '), `paragraph-${index}`)}</p>)
  }

  return <div className={`markdown-body ${className}`.trim()}>{blocks}</div>
}
