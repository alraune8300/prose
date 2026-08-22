import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Plus, Trash2, ArrowUpRight, Copy, Check, Search, Hash } from 'lucide-react';
import type { ThemeColors } from './types';
import type { Lang } from './i18n';

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

  // 2. Find all inline footnote references e.g., `[^1]`, `[^2]`, `<sup class="kgv-footnote-marker" data-footnote-id="1">`
  const inlineRegex = /\[\^([^\]:]+)\](?!:)/g;
  const foundKeys = new Set<string>();
  const list: ParsedFootnote[] = [];
  let match;
  let autoNum = 1;

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
    <div className="flex flex-col h-full overflow-hidden" style={{ color: theme.text, fontFamily: uiFont }}>
      {/* Header with Title & Add Action */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b shrink-0" style={{ borderColor: theme.borderFaint }}>
        <div className="flex items-center gap-1.5">
          <Bookmark size={15} style={{ color: theme.accent }} />
          <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: theme.text }}>
            {lang === 'vi' ? 'Chú thích (Footnotes)' : 'Footnotes'}
          </span>
          <span 
            className="text-[11px] px-1.5 py-0.5 rounded-full font-bold" 
            style={{ backgroundColor: theme.accentLight, color: theme.accent }}
          >
            {footnotes.length}
          </span>
        </div>

        <button
          onClick={onInsertNewFootnote}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-all hover:opacity-90 active:scale-95 text-white shadow-xs font-medium"
          style={{ backgroundColor: theme.accent }}
          title={lang === 'vi' ? 'Thêm chú thích mới [^n]' : 'Insert new footnote [^n]'}
        >
          <Plus size={13} />
          <span>{lang === 'vi' ? 'Thêm mới' : 'Add'}</span>
        </button>
      </div>

      {/* Search Input when footnotes exist */}
      {footnotes.length > 3 && (
        <div className="relative mb-3 shrink-0">
          <Search size={13} className="absolute left-2.5 top-2.5 opacity-50" style={{ color: theme.textMuted }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'vi' ? 'Tìm trong chú thích...' : 'Search footnotes...'}
            className="w-full text-xs pl-7 pr-3 py-1.5 rounded-lg border outline-none transition-all"
            style={{
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor: theme.borderFaint,
              color: theme.text,
            }}
          />
        </div>
      )}

      {/* List of Footnote Cards */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 kgv-scroll select-text">
        {filteredFootnotes.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed my-4" 
            style={{ borderColor: theme.borderFaint, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
          >
            <Hash size={24} className="mb-2 opacity-40" style={{ color: theme.accent }} />
            <p className="text-xs font-medium mb-1" style={{ color: theme.text }}>
              {searchQuery ? (lang === 'vi' ? 'Không tìm thấy kết quả' : 'No results found') : (lang === 'vi' ? 'Chưa có chú thích' : 'No footnotes yet')}
            </p>
            <p className="text-[11px] opacity-60 leading-relaxed mb-3" style={{ color: theme.textMuted }}>
              {lang === 'vi'
                ? 'Bấm nút "Thêm mới" hoặc gõ [^1] trong bài viết để tạo chú thích trích dẫn.'
                : 'Click "Add" or type [^1] in the editor to create reference notes.'}
            </p>
            <button
              onClick={onInsertNewFootnote}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 active:scale-95 font-medium flex items-center gap-1.5"
              style={{ borderColor: theme.accent, color: theme.accent }}
            >
              <Plus size={13} />
              <span>{lang === 'vi' ? 'Thêm chú thích đầu tiên' : 'Add First Footnote'}</span>
            </button>
          </div>
        ) : (
          filteredFootnotes.map((fn) => {
            const isHighlighted = activeHighlightedId === fn.id;
            return (
              <div
                key={fn.id}
                ref={(el) => { cardRefs.current[fn.id] = el; }}
                className={`rounded-xl border p-2.5 transition-all duration-200 ${
                  isHighlighted ? 'ring-2 shadow-md' : 'hover:border-opacity-100'
                }`}
                style={{
                  backgroundColor: isHighlighted ? theme.accentLight : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                  borderColor: isHighlighted ? theme.accent : theme.borderFaint,
                  boxShadow: isHighlighted ? `0 0 0 2px ${theme.accent}` : undefined,
                }}
              >
                {/* Footnote Card Topbar */}
                <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b" style={{ borderColor: theme.borderFaint }}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="px-1.5 py-0.5 rounded font-mono font-bold text-[11px] shrink-0"
                      style={{
                        backgroundColor: isHighlighted ? theme.accent : theme.accentLight,
                        color: isHighlighted ? '#ffffff' : theme.accent,
                      }}
                    >
                      [^{fn.label}]
                    </span>
                    <span className="text-[11px] truncate opacity-60 font-sans" style={{ color: theme.textMuted }}>
                      {lang === 'vi' ? `Chú thích #${fn.number}` : `Footnote #${fn.number}`}
                    </span>
                  </div>

                  {/* Actions: Jump to editor marker, Copy citation, Delete */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Jump to marker in editor */}
                    <button
                      onClick={() => onScrollToEditorMarker(fn.id)}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ color: theme.accent }}
                      title={lang === 'vi' ? 'Đến vị trí đặt trong bài viết' : 'Jump to marker in text'}
                    >
                      <ArrowUpRight size={13} />
                    </button>

                    {/* Copy citation */}
                    <button
                      onClick={() => handleCopyCitation(fn)}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      style={{ color: theme.textMuted }}
                      title={lang === 'vi' ? 'Sao chép cú pháp chú thích' : 'Copy citation text'}
                    >
                      {copiedId === fn.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                    </button>

                    {/* Delete footnote */}
                    <button
                      onClick={() => onDeleteFootnote(fn.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                      title={lang === 'vi' ? 'Xóa chú thích' : 'Delete footnote'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Footnote Content Input Area */}
                <textarea
                  value={fn.content}
                  onChange={(e) => onUpdateFootnoteContent(fn.id, e.target.value)}
                  placeholder={lang === 'vi' ? 'Nhập nội dung giải nghĩa chú thích...' : 'Enter footnote citation or note...'}
                  rows={2}
                  className="w-full text-xs p-1.5 rounded-md border resize-none focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: theme.surface || '#ffffff',
                    borderColor: theme.borderFaint,
                    color: theme.text,
                    fontFamily: `'${docFont}', sans-serif`,
                    lineHeight: '1.4',
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Info Tip */}
      <div className="pt-2 mt-2 border-t text-[10px] opacity-60 text-center shrink-0" style={{ borderColor: theme.borderFaint, color: theme.textMuted }}>
        {lang === 'vi' 
          ? 'Mẹo: Gõ [^tên_chú_thích] trực tiếp khi soạn thảo để neo ghi chú'
          : 'Tip: Type [^note_name] directly in editor to anchor citations'}
      </div>
    </div>
  );
}
