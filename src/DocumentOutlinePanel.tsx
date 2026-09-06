import React, { useState, useEffect, useCallback } from 'react';
import type { ThemeColors } from './types';
import { Lang, t } from './i18n';

export interface OutlineNode {
  id: string;
  title: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  isCollapsed?: boolean;
  domElement: HTMLElement;
}

interface DocumentOutlinePanelProps {
  theme: ThemeColors;
  uiFont: string;
  lang: Lang;
  activePageTitle?: string;
}


export function DocumentOutlinePanel({ theme, uiFont, lang, activePageTitle }: DocumentOutlinePanelProps) {
  const [outline, setOutline] = useState<OutlineNode[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const parseOutline = useCallback(() => {
    const root = document.querySelector('.ProseMirror');
    if (!root) return;
    const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
    const parsed: OutlineNode[] = headings.map((h, index) => {
      if (!h.id) {
        h.id = `heading-${index}-${Math.random().toString(36).substring(2, 9)}`;
      }
      return {
        id: h.id,
        title: h.textContent || '',
        level: parseInt(h.tagName[1]) as any,
        domElement: h,
        isCollapsed: h.closest('[data-collapsed="true"]') !== null,
      };
    }).filter(node => node.title.trim().length > 0);
    
    setOutline(prev => {
      if (prev.length !== parsed.length) return parsed;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id !== parsed[i].id || prev[i].title !== parsed[i].title || prev[i].level !== parsed[i].level) {
          return parsed;
        }
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    let timeout: number;
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = window.setTimeout(parseOutline, 250);
    });
    
    const root = document.querySelector('.ProseMirror');
    if (root) {
      observer.observe(root, { childList: true, characterData: true, subtree: true });
    }
    parseOutline();
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [parseOutline]);

  useEffect(() => {
    if (outline.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries.filter(e => e.isIntersecting);
      if (visibleEntries.length > 0) {
        setActiveId(visibleEntries[0].target.id);
      }
    }, { rootMargin: '-10% 0px -50% 0px' }); 
    outline.forEach(node => observer.observe(node.domElement));
    return () => observer.disconnect();
  }, [outline]);

  const scrollToHeading = (node: OutlineNode) => {
    window.dispatchEvent(new CustomEvent('kgv-unfold-all-headings'));
    setTimeout(() => {
      const root = document.querySelector('.ProseMirror');
      if (!root) return;
      const liveHeadings = Array.from(root.querySelectorAll(`h${node.level}`));
      const el = liveHeadings.find((h: Element) => h.textContent === node.title) || document.getElementById(node.id) || node.domElement;
      if (el && document.contains(el)) {
        const scrollContainer = document.querySelector('.kgv-scroll');
        if (scrollContainer && el instanceof HTMLElement) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const scrollTop = scrollContainer.scrollTop;
          const targetTop = elRect.top - containerRect.top + scrollTop - 40;
          
          scrollContainer.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 50);
  };

  const minLevel = outline.length > 0 ? Math.min(...outline.map(n => n.level)) : 1;
  const fileName = activePageTitle ? activePageTitle.toUpperCase() : 'FILE NAME...';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: theme.bg || 'transparent' }}>
      <div style={{ padding: '0 8px 16px 8px' }}>
        <h2 style={{
          fontFamily: (uiFont || 'inherit'),
          fontSize: '1.05rem',
          fontWeight: 400,
          color: theme.text,
          margin: '0 0 16px 0',
          letterSpacing: '0.02em',
          wordBreak: 'break-word'
        }}>
          {fileName}
        </h2>

        {outline.length === 0 ? (
          <div style={{ padding: '10px 0', color: theme.textMuted, fontFamily: (uiFont || 'inherit'), fontSize: '0.9rem', fontStyle: 'italic' }}>
            {t(lang, 'noHeadings') || 'No headings yet.'}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {outline.map(node => {
              const effectiveLevel = node.level - minLevel;
              const isTopLevel = effectiveLevel === 0;
              
              return (
                <li
                  key={node.id}
                  onClick={() => scrollToHeading(node)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: effectiveLevel * 20,
                    cursor: 'pointer',
                    fontFamily: (uiFont || 'inherit'),
                    transition: 'opacity 0.2s ease',
                    opacity: activeId === node.id ? 1 : 0.8,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = activeId === node.id ? '1' : '0.8' }}
                >
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 16, 
                    marginRight: 4,
                    color: isTopLevel ? theme.text : theme.textMuted 
                  }}>
                    {isTopLevel ? (
                      <span style={{ fontSize: '14px', lineHeight: 1 }}>•</span>
                    ) : (
                      <span style={{ fontSize: '10px', lineHeight: 1, opacity: 0.6 }}>•</span>
                    )}
                  </span>
                  <span style={{ 
                    fontSize: isTopLevel ? '0.95rem' : '0.85rem',
                    color: isTopLevel ? theme.text : theme.textMuted,
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {node.title}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
