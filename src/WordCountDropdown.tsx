import React, { useState, useRef, useEffect } from 'react';
import type { ThemeColors, Lang } from './types';
import { t } from './i18n';
import { FileText, Clock, Type, BarChart2 } from 'lucide-react';

interface WordCountDropdownProps {
  wordCount: number;
  charCount: number;
  readMin: number;
  theme: ThemeColors;
  uiFont: string;
  lang?: Lang;
  direction?: 'up' | 'down';
  className?: string;
}

export default function WordCountDropdown({ 
  wordCount, 
  charCount, 
  readMin, 
  theme, 
  uiFont, 
  lang = 'vi',
  direction = 'down',
  className = ''
}: WordCountDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const wordsLabel = t(lang, 'words') || 'words';
  const charsLabel = t(lang, 'characters') || t(lang, 'chars') || 'Characters';
  const readingTimeLabel = t(lang, 'readingTime') || t(lang, 'readTime') || 'Reading time';
  const minLabel = t(lang, 'min') || 'm';
  const statsLabel = t(lang, 'stats') || 'Statistics';

  const capitalizedWords = wordsLabel.charAt(0).toUpperCase() + wordsLabel.slice(1);

  return (
    <div className={`relative z-40 flex items-center ${className}`} ref={containerRef}>
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 transition-all hover:opacity-80 active:scale-95 px-2.5 py-1 rounded-lg border shadow-xs cursor-pointer select-none text-xs"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text,
          fontFamily: `'${uiFont}', sans-serif`,
        }}
        title={`${wordCount.toLocaleString()} ${wordsLabel} · ${charCount.toLocaleString()} ${charsLabel} · ~${readMin} ${minLabel} ${readingTimeLabel}`}
      >
        <BarChart2 size={13} style={{ color: theme.textMuted }} className="shrink-0" />
        <span className="font-semibold">{wordCount.toLocaleString()}</span>
        <span style={{ color: theme.textMuted }} className="font-normal">{wordsLabel}</span>
        <span style={{ color: theme.border }} className="mx-0.5">·</span>
        <Clock size={12} style={{ color: theme.textMuted }} className="shrink-0" />
        <span style={{ color: theme.textMuted }} className="font-normal">{readMin} {minLabel}</span>
      </button>

      {open && (
        <div 
          className="absolute right-0 p-3 rounded-xl shadow-xl w-56 border backdrop-blur-md animate-in fade-in duration-150 z-50"
          style={{
            ...(direction === 'up' 
              ? { bottom: 'calc(100% + 6px)' } 
              : { top: 'calc(100% + 6px)' }),
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
            fontFamily: `'${uiFont}', sans-serif`,
          }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1 flex items-center justify-between" style={{ color: theme.textMuted }}>
            <span>{statsLabel}</span>
            <span className="text-[10px] font-normal lowercase opacity-60">live</span>
          </div>

          <div className="flex justify-between items-center py-1.5 px-1 border-b text-xs" style={{ borderColor: theme.borderFaint }}>
            <span className="flex items-center gap-2" style={{ color: theme.textMuted }}>
              <FileText size={13} style={{ color: theme.textMuted }} />
              {capitalizedWords}
            </span>
            <span className="font-semibold font-mono text-xs">{wordCount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 px-1 border-b text-xs" style={{ borderColor: theme.borderFaint }}>
            <span className="flex items-center gap-2" style={{ color: theme.textMuted }}>
              <Type size={13} style={{ color: theme.textMuted }} />
              {charsLabel}
            </span>
            <span className="font-semibold font-mono text-xs">{charCount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 px-1 text-xs">
            <span className="flex items-center gap-2" style={{ color: theme.textMuted }}>
              <Clock size={13} style={{ color: theme.textMuted }} />
              {readingTimeLabel}
            </span>
            <span className="font-semibold font-mono text-xs">~{readMin} {minLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}


