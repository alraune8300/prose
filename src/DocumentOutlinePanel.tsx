import React, { useState, useEffect, useCallback } from 'react';
import type { ThemeColors } from './types';
import { Lang, t } from './i18n';
import { List } from 'lucide-react';

export interface OutlineNode {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  isCollapsed?: boolean;
  domElement: HTMLElement;
}

interface DocumentOutlinePanelProps {
  theme: ThemeColors;
  uiFont: string;
  lang: Lang;
}

export function DocumentOutlinePanel({ theme, uiFont, lang }: DocumentOutlinePanelProps) {
  const [outline, setOutline] = useState<OutlineNode[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const parseOutline = useCallback(() => {
    // Tự động quét theo thời gian thực toàn bộ các thẻ tiêu đề (H1, H2, H3) trong tài liệu đang soạn thảo
    const root = document.querySelector('.ProseMirror');
    if (!root) return;

    const headings = Array.from(root.querySelectorAll('h1, h2, h3')) as HTMLElement[];
    const parsed: OutlineNode[] = headings.map((h, index) => {
      if (!h.id) {
        h.id = `heading-${index}-${Math.random().toString(36).substring(2, 9)}`;
      }
      return {
        id: h.id,
        title: h.textContent || '',
        level: parseInt(h.tagName[1]) as 1 | 2 | 3,
        domElement: h,
        isCollapsed: h.closest('[data-collapsed="true"]') !== null,
      };
    }).filter(node => node.title.trim().length > 0);
    
    setOutline(prev => {
      // Check if outline actually changed
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
      timeout = window.setTimeout(parseOutline, 250); // debounce 250ms
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

  // Active Scrollspy: Chỉ báo vị trí đọc hiện tại
  useEffect(() => {
    if (outline.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      // Find the currently visible headings
      const visibleEntries = entries.filter(e => e.isIntersecting);
      if (visibleEntries.length > 0) {
        // Just take the first one visible from top
        setActiveId(visibleEntries[0].target.id);
      }
    }, { rootMargin: '-10% 0px -50% 0px' }); 

    outline.forEach(node => observer.observe(node.domElement));

    return () => observer.disconnect();
  }, [outline]);

  const scrollToHeading = (node: OutlineNode) => {
    // Tự động mở rộng khối bị gập (Auto-Expand on Jump)
    // Để đảm bảo block không bị ẩn (kgv-folded-hidden) hoặc đang gập, ta gửi event unfold tất cả
    window.dispatchEvent(new CustomEvent('kgv-unfold-all-headings'));

    // Cần một timeout nhỏ để ProseMirror render lại (xóa display:none) trước khi scroll
    setTimeout(() => {
      const root = document.querySelector('.ProseMirror');
      if (!root) return;
      const liveHeadings = Array.from(root.querySelectorAll(`h${node.level}`));
      const el = liveHeadings.find((h: Element) => h.textContent === node.title) || document.getElementById(node.id) || node.domElement;

      if (el && document.contains(el)) {
        const scrollContainer = document.querySelector('.kgv-scroll');
        if (scrollContainer && el instanceof HTMLElement) {
          // Calculate absolute position robustly against DOM hierarchy
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: theme.bg || 'transparent' }}>
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b shrink-0" style={{ borderColor: theme.borderFaint || theme.border, backgroundColor: theme.surface || 'transparent' }}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <List size={16} className="shrink-0" style={{ color: theme.text }} />
          <span className="font-bold text-sm uppercase tracking-wider truncate min-w-0 flex-1" style={{ color: theme.text, fontFamily: uiFont }}>
            {t(lang, 'documentOutline') || t(lang, 'outline') || 'Document Outline'}
          </span>
          {outline.length > 0 && (
            <span 
              className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold shrink-0" 
              style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.borderFaint || theme.border}` }}
            >
              {outline.length}
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 8px', paddingBottom: 32 }}>
        {outline.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: theme.textMuted, fontFamily: uiFont, fontSize: '0.85rem' }}>
            {t(lang, 'noHeadings') || 'No headings found in the document.'}
          </div>
        ) : (
          outline.map(node => {
            const effectiveLevel = node.level - minLevel;
            return (
            <div
              key={node.id}
              onClick={() => scrollToHeading(node)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: `6px 8px 6px ${8 + effectiveLevel * 16}px`,
            cursor: 'pointer',
            color: activeId === node.id ? theme.text : theme.textMuted,
            backgroundColor: activeId === node.id ? (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
            transition: 'all 0.15s ease',
            fontFamily: uiFont,
            fontSize: '0.85rem',
            lineHeight: 1.4,
            borderRadius: 6,
          }}
          onMouseEnter={e => {
            if (activeId !== node.id) {
              e.currentTarget.style.color = theme.text;
              e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
            }
          }}
          onMouseLeave={e => {
            if (activeId !== node.id) {
              e.currentTarget.style.color = theme.textMuted;
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span style={{ marginRight: 8, fontSize: '0.65rem', opacity: activeId === node.id ? 1 : 0.5, display: 'flex', alignItems: 'center' }}>
            {node.level === 1 ? (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="3" /></svg>
            ) : node.level === 2 ? (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="3" /></svg>
            ) : (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3.5" width="4" height="1" /></svg>
            )}
          </span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: activeId === node.id ? 500 : 400 }}>
            {node.title}
          </span>
        </div>
        );
      })
    )}
      </div>
    </div>
  );
}
