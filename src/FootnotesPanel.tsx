import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Plus, Trash2, ArrowUpRight, Copy, Check, Search, Hash, ExternalLink } from 'lucide-react';
import type { ThemeColors } from './types';
import type { Lang } from './i18n';
import { t } from './i18n';

export interface ParsedFootnote {
  id: string; // e.g. "1", "2", "ref"
  number: number;
  label: string;
  content: string;
  sourcePos?: number;
}

/**
 * Extracts footnote references `[^1]` and definitions `[^1]: Note content` from document text/HTML
 */
export function extractFootnotesFromContent(content: string): ParsedFootnote[] {
  if (!content) return [];

  // 1. Find all footnote definitions e.g., `[^1]: Some explanation` or `[^note]: Text`
  const defMap = new Map<string, string>();
  const defRegex = /\[\^([^\]]+)\]:\s*([^\n<]+)/g;
  let defMatch;
  while ((defMatch = defRegex.exec(content)) !== null) {
    const key = defMatch[1].trim();
    const val = defMatch[2].trim();
    defMap.set(key, val);
  }

  // 2. Find all inline footnote references e.g., `[^1]`, `[^2]`, or HTML sup tags `<sup ... data-footnote-id="1">[^1]</sup>`
  const foundKeys = new Set<string>();
  const list: ParsedFootnote[] = [];
  let autoNum = 1;

  // Match HTML sup footnote markers
  const supRegex = /data-footnote-id="([^"]+)"[^>]*>([^<]+)<\/sup>/g;
  let supMatch;
  while ((supMatch = supRegex.exec(content)) !== null) {
    const key = supMatch[1].trim();
    if (!foundKeys.has(key)) {
      foundKeys.add(key);
      const contentVal = defMap.get(key) || '';
      const num = parseInt(key, 10);
      list.push({
        id: key,
        number: !isNaN(num) ? num : autoNum,
        label: key,
        content: contentVal,
        sourcePos: supMatch.index,
      });
      autoNum++;
    }
  }

  // Match markdown style [^1]
  const inlineRegex = /\[\^([^\]:]+)\](?!:)/g;
  let match;
  while ((match = inlineRegex.exec(content)) !== null) {
    const key = match[1].trim();
    if (!foundKeys.has(key)) {
      foundKeys.add(key);
      const contentVal = defMap.get(key) || '';
      const num = parseInt(key, 10);
      list.push({
        id: key,
        number: !isNaN(num) ? num : autoNum,
        label: key,
        content: contentVal,
        sourcePos: match.index,
      });
      autoNum++;
    }
  }

  // Also check if any definitions exist that weren't in inline list
  defMap.forEach((val, key) => {
    if (!foundKeys.has(key)) {
      const num = parseInt(key, 10);
      list.push({
        id: key,
        number: !isNaN(num) ? num : autoNum++,
        label: key,
        content: val,
      });
    }
  });

  return list;
}

interface FootnotesPanelProps {
  theme: ThemeColors;
  uiFont: string;
  docFont: string;
  lang: Lang;
  rawContent: string;
  onUpdateFootnoteContent: (id: string, newContent: string) => void;
  onInsertNewFootnote: () => void;
  onDeleteFootnote: (id: string) => void;
  onScrollToEditorMarker: (id: string) => void;
  activeHighlightedId?: string | null;
  onClearHighlight?: () => void;
}

export default function FootnotesPanel({
  theme,
  uiFont,
  docFont,
  lang,
  rawContent,
  onUpdateFootnoteContent,
  onInsertNewFootnote,
  onDeleteFootnote,
  onScrollToEditorMarker,
  activeHighlightedId,
  onClearHighlight,
}: FootnotesPanelProps) {
  const [footnotes, setFootnotes] = useState<ParsedFootnote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const parsed = extractFootnotesFromContent(rawContent);
    setFootnotes(parsed);
  }, [rawContent]);

  // Scroll to active highlighted footnote card when triggered from Editor click
  useEffect(() => {
    if (activeHighlightedId && cardRefs.current[activeHighlightedId]) {
      cardRefs.current[activeHighlightedId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
      const timer = setTimeout(() => {
        if (onClearHighlight) onClearHighlight();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeHighlightedId, onClearHighlight]);

  const handleCopyCitation = (fn: ParsedFootnote) => {
    const citation = `[^${fn.label}]: ${fn.content || ''}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(fn.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredFootnotes = footnotes.filter(f => 
    !searchQuery.trim() ||
    f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden select-none" style={{ color: theme.text, fontFamily: uiFont }}>
      {/* Header with Title & Add Action */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b shrink-0" style={{ borderColor: theme.borderFaint || theme.border, backgroundColor: theme.surface }}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Bookmark size={16} className="shrink-0" style={{ color: theme.text }} />
          <span className="font-bold text-sm uppercase tracking-wider truncate min-w-0 flex-1" style={{ color: theme.text }}>
            {t(lang, 'contextualFootnotes') || 'Footnotes'}
          </span>
          <span 
            className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold shrink-0" 
            style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.borderFaint || theme.border}` }}
          >
            {footnotes.length}
          </span>
        </div>

        <button
          onClick={onInsertNewFootnote}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all hover:opacity-90 active:scale-95  shadow-xs font-medium shrink-0"
          style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.border}` }}
          title={t(lang, 'insertNewFootnote')}
        >
          <Plus size={13} />
          <span>{t(lang, 'insertNewFootnote') || 'Add'}</span>
        </button>
      </div>

      {/* Search Input when footnotes exist */}
      {footnotes.length > 2 && (
        <div className="p-3 border-b shrink-0" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 opacity-50" style={{ color: theme.textMuted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(lang, 'searchFootnotes')}
              className="w-full text-xs pl-7 pr-3 py-1.5 rounded-lg border outline-none transition-all"
              style={{
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                borderColor: theme.border,
                color: theme.text,
              }}
            />
          </div>
        </div>
      )}

      {/* List of Footnote Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 kgv-scroll select-text" style={{ backgroundColor: theme.background }}>
        {filteredFootnotes.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed my-4" 
            style={{ borderColor: theme.border, backgroundColor: theme.surface }}
          >
            <Hash size={24} className="mb-2 opacity-40" style={{ color: theme.text }} />
            <p className="text-xs font-medium mb-1" style={{ color: theme.text }}>
              {searchQuery ? (lang === 'vi' ? 'Không tìm thấy kết quả' : 'No results found') : t(lang, 'noFootnotesYet')}
            </p>
            <p className="text-[11px] opacity-60 leading-relaxed mb-3" style={{ color: theme.textMuted }}>
              {lang === 'vi'
                ? 'Bấm nút "Thêm" hoặc gõ [^1] trong bài viết để tạo ghi chú.'
                : 'Click "Add" or type [^1] in the editor to create reference notes.'}
            </p>
            <button
              onClick={onInsertNewFootnote}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 active:scale-95 font-medium flex items-center gap-1.5"
              style={{ borderColor: theme.accent, color: theme.text, backgroundColor: theme.surface }}
            >
              <Plus size={13} />
              <span>{t(lang, 'addFirstFootnote')}</span>
            </button>
          </div>
        ) : (
          filteredFootnotes.map((fn) => {
            const isHighlighted = activeHighlightedId === fn.id;
            return (
              <div
                key={fn.id}
                ref={(el) => { cardRefs.current[fn.id] = el; }}
                className={`rounded-xl border p-3 transition-all duration-200 ${
                  isHighlighted ? 'ring-2 shadow-md' : ''
                }`}
                style={{
                  backgroundColor: isHighlighted ? (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : theme.surface,
                  borderColor: isHighlighted ? theme.text : theme.border,
                  boxShadow: undefined,
                }}
              >
                {/* Footnote Card Topbar */}
                <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b" style={{ borderColor: theme.borderFaint }}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="px-1.5 py-0.5 rounded font-mono font-bold text-[11px] shrink-0"
                      style={{
                        backgroundColor: isHighlighted ? theme.text : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                        color: isHighlighted ? '#ffffff' : theme.text,
                      }}
                    >
                      [^{fn.label}]
                    </span>
                    <span className="text-[11px] truncate opacity-70 font-sans" style={{ color: theme.textMuted }}>
                      {t(lang, 'footnoteNumber')} #{fn.number}
                    </span>
                  </div>

                  {/* Actions: Jump to editor marker, Copy citation, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Jump to marker in editor */}
                    <button
                      onClick={() => onScrollToEditorMarker(fn.id)}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-medium"
                      style={{ color: theme.text }}
                      title={t(lang, 'jumpToText')}
                    >
                      <ArrowUpRight size={13} />
                      <span className="hidden sm:inline text-[10px]">{t(lang, 'jumpToText') || 'Jump'}</span>
                    </button>

                    {/* Copy citation */}
                    <button
                      onClick={() => handleCopyCitation(fn)}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ color: theme.textMuted }}
                      title={t(lang, 'copyCitationText')}
                    >
                      {copiedId === fn.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>

                    {/* Delete footnote */}
                    <button
                      onClick={() => onDeleteFootnote(fn.id)}
                      className="p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-colors"
                      title={t(lang, 'deleteFootnote')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Footnote Content Input Area (Typography: text-xs, italic) */}
                <textarea
                  value={fn.content}
                  onChange={(e) => onUpdateFootnoteContent(fn.id, e.target.value)}
                  placeholder={t(lang, 'footnotePlaceholder')}
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border resize-none focus:outline-none focus:ring-1 transition-all italic"
                  style={{
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    borderColor: theme.border,
                    color: theme.text,
                    fontFamily: `'${docFont}', sans-serif`,
                    lineHeight: '1.5',
                    fontSize: '0.75rem',
                  }}
                />

                {/* Quick link helper preview if text contains URLs */}
                {fn.content && (fn.content.includes('http://') || fn.content.includes('https://')) && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px]" style={{ color: theme.text }}>
                    <ExternalLink size={10} />
                    <span className="truncate opacity-80 font-mono">{t(lang, 'containsActiveLinks')}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Info Tip */}
      <div className="p-3 border-t text-[10px] opacity-70 text-center shrink-0" style={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.textMuted }}>
        {t(lang, 'footnoteTip')}
      </div>
    </div>
  );
}
