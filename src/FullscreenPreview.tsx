import React, { useEffect, useState } from 'react'
import { Theme } from './theme'
import { Page, FormatState } from './types'

interface FullscreenPreviewProps {
  c: Theme
  pages: Page[]
  activePageId: string
  formatState: FormatState
  bodyFont: string
  headingFont: string
  onClose: () => void
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function renderMarkdown(text: string, bodyFont: string, headingFont: string, c: Theme): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const paras = text.split(/\n\n+/).filter(p => p.trim())

  paras.forEach((para, i) => {
    const t = para.trim()

    if (t.startsWith('#### ')) {
      nodes.push(<h4 key={i} style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.05rem', fontWeight: 600, color: c.text, margin: '1.4em 0 0.5em', lineHeight: 1.3 }}>{inlineRender(t.slice(5))}</h4>)
    } else if (t.startsWith('### ')) {
      nodes.push(<h3 key={i} style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.2rem', fontWeight: 600, color: c.text, margin: '1.6em 0 0.5em', lineHeight: 1.3 }}>{inlineRender(t.slice(4))}</h3>)
    } else if (t.startsWith('## ')) {
      nodes.push(<h2 key={i} style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.45rem', fontWeight: 600, color: c.text, margin: '1.8em 0 0.6em', lineHeight: 1.25 }}>{inlineRender(t.slice(3))}</h2>)
    } else if (t.startsWith('# ')) {
      nodes.push(<h1 key={i} style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.8rem', fontWeight: 700, color: c.text, margin: '2em 0 0.6em', lineHeight: 1.2 }}>{inlineRender(t.slice(2))}</h1>)
    } else if (t.startsWith('> ')) {
      nodes.push(
        <blockquote key={i} style={{
          borderLeft: `3px solid ${c.accentMid}`, margin: '1em 0', padding: '0.5em 1.2em',
          color: c.textMuted, fontStyle: 'italic', fontFamily: `'${bodyFont}', serif`,
        }}>
          {inlineRender(t.slice(2))}
        </blockquote>
      )
    } else if (t.startsWith('```')) {
      const code = t.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
      nodes.push(
        <pre key={i} style={{
          background: c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          border: `1px solid ${c.borderFaint}`,
          borderRadius: 8, padding: '1rem', overflowX: 'auto',
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', lineHeight: 1.6,
          color: c.text, margin: '1em 0',
        }}>
          <code>{code}</code>
        </pre>
      )
    } else if (t.match(/^[-*] /m)) {
      const items = t.split('\n').filter(l => l.match(/^[-*] /))
      nodes.push(
        <ul key={i} style={{ margin: '0.8em 0', paddingLeft: '1.5em', fontFamily: `'${bodyFont}', serif` }}>
          {items.map((item, j) => (
            <li key={j} style={{ color: c.text, marginBottom: '0.3em', lineHeight: 1.7 }}>
              {inlineRender(item.replace(/^[-*] /, ''))}
            </li>
          ))}
        </ul>
      )
    } else if (t.match(/^\d+\. /m)) {
      const items = t.split('\n').filter(l => l.match(/^\d+\. /))
      nodes.push(
        <ol key={i} style={{ margin: '0.8em 0', paddingLeft: '1.5em', fontFamily: `'${bodyFont}', serif` }}>
          {items.map((item, j) => (
            <li key={j} style={{ color: c.text, marginBottom: '0.3em', lineHeight: 1.7 }}>
              {inlineRender(item.replace(/^\d+\. /, ''))}
            </li>
          ))}
        </ol>
      )
    } else {
      nodes.push(
        <p key={i} style={{ fontFamily: `'${bodyFont}', serif`, lineHeight: 1.85, color: c.text, margin: '0 0 1.1em' }}>
          {inlineRender(t)}
        </p>
      )
    }
  })

  return nodes
}

function inlineRender(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  const patterns: [RegExp, (match: string, inner: string) => React.ReactNode][] = [
    [/\*\*(.+?)\*\*/, (_, inner) => <strong key={key++}>{inner}</strong>],
    [/~~(.+?)~~/, (_, inner) => <s key={key++}>{inner}</s>],
    [/\*(.+?)\*/, (_, inner) => <em key={key++}>{inner}</em>],
    [/`(.+?)`/, (_, inner) => <code key={key++} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.88em', background: 'rgba(128,128,128,0.15)', padding: '0 3px', borderRadius: 3 }}>{inner}</code>],
  ]

  while (remaining.length > 0) {
    let earliest: { index: number, length: number, node: React.ReactNode } | null = null

    for (const [pattern, renderer] of patterns) {
      const match = remaining.match(pattern)
      if (match && match.index !== undefined) {
        if (!earliest || match.index < earliest.index) {
          earliest = {
            index: match.index,
            length: match[0].length,
            node: renderer(match[0], match[1]),
          }
        }
      }
    }

    if (!earliest) {
      parts.push(remaining)
      break
    }

    if (earliest.index > 0) parts.push(remaining.slice(0, earliest.index))
    parts.push(earliest.node)
    remaining = remaining.slice(earliest.index + earliest.length)
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

export default function FullscreenPreview({
  c,
  pages,
  activePageId,
  formatState,
  bodyFont,
  headingFont,
  onClose,
}: FullscreenPreviewProps) {
  const [currentPageId, setCurrentPageId] = useState(activePageId)

  const currentPage = pages.find(p => p.id === currentPageId) ?? pages[0]
  const currentIndex = pages.findIndex(p => p.id === currentPageId)
  const wc = countWords(currentPage.content)
  const readMin = Math.ceil(wc / 200)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentPageId(pages[currentIndex - 1].id)
      if (e.key === 'ArrowRight' && currentIndex < pages.length - 1) setCurrentPageId(pages[currentIndex + 1].id)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, currentIndex, pages])

  const topBarBtnStyle: React.CSSProperties = {
    padding: '5px 11px', borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${c.border}`,
    background: 'transparent',
    color: c.text,
    fontFamily: "'Source Sans 3', sans-serif", fontSize: '0.76rem',
    transition: 'all 0.15s',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: c.bg,
      overflowY: 'auto',
    }}>
      {/* Fixed top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        height: 48,
        background: c.header,
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${c.borderFaint}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        {/* Left: title + read time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1rem', fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>
            {currentPage.title}
          </span>
          <span style={{ fontSize: '0.7rem', color: c.textFaint, fontFamily: "'Source Sans 3', sans-serif", flexShrink: 0 }}>
            ~{readMin} min
          </span>
        </div>
        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button onClick={() => window.print()} style={topBarBtnStyle}>
            ⎙ Print
          </button>
          {pages.length > 1 && (
            <>
              <button
                onClick={() => currentIndex > 0 && setCurrentPageId(pages[currentIndex - 1].id)}
                disabled={currentIndex === 0}
                style={{ ...topBarBtnStyle, opacity: currentIndex === 0 ? 0.35 : 1 }}
              >
                ← Prev
              </button>
              <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '0.7rem', color: c.textFaint }}>
                {currentIndex + 1}/{pages.length}
              </span>
              <button
                onClick={() => currentIndex < pages.length - 1 && setCurrentPageId(pages[currentIndex + 1].id)}
                disabled={currentIndex === pages.length - 1}
                style={{ ...topBarBtnStyle, opacity: currentIndex === pages.length - 1 ? 0.35 : 1 }}
              >
                Next →
              </button>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              ...topBarBtnStyle,
              width: 32, height: 32, borderRadius: '50%',
              padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Scroll content */}
      <div style={{
        paddingTop: 48,
        minHeight: '100%',
        background: c.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 680, padding: '4rem 2rem 6rem' }}>
          <h1 style={{
            fontFamily: `'${headingFont}', serif`,
            fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.2,
            color: c.text, marginBottom: '2rem',
          }}>
            {currentPage.title}
          </h1>
          <div style={{ fontSize: formatState.fontSize, lineHeight: formatState.lineH }}>
            {renderMarkdown(currentPage.content, bodyFont, headingFont, c)}
          </div>
        </div>
      </div>
    </div>
  )
}
