import React, { useState, useRef, useEffect } from 'react';
import type { ThemeColors, Lang } from './types';
import { t } from './i18n';

interface WordCountDropdownProps {
  wordCount: number;
  charCount: number;
  readMin: number;
  theme: ThemeColors;
  uiFont: string;
  lang?: Lang;
}

export default function WordCountDropdown({ wordCount, charCount, readMin, theme, uiFont, lang = 'vi' }: WordCountDropdownProps) {
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

  // Capitalize first letter helper for table row
  const capitalizedWords = wordsLabel.charAt(0).toUpperCase() + wordsLabel.slice(1);

  return (
    <div className="relative z-50 flex items-center h-[34px]" ref={containerRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 transition-all hover:opacity-80 active:scale-95 px-2 py-1 outline-none rounded-md"
        style={{
          color: theme.text,
          fontFamily: uiFont,
          fontSize: '0.85rem',
          fontWeight: 600,
          background: 'transparent',
        }}
        title={`${wordCount.toLocaleString()} ${wordsLabel} · ${charCount.toLocaleString()} ${charsLabel}`}
      >
        <span style={{ fontWeight: 700 }}>{wordCount.toLocaleString()}</span> <span style={{ opacity: 0.8, fontWeight: 400 }}>{wordsLabel}</span>
      </button>

      {open && (
        <div 
          className="absolute right-0 mt-2 p-3 rounded-2xl shadow-2xl w-56 border backdrop-blur-md"
          style={{
            top: '100%',
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
            fontFamily: uiFont,
          }}
        >
          <div className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: theme.borderFaint }}>
            <span style={{ fontSize: '0.95rem' }}>{capitalizedWords}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{wordCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: theme.borderFaint }}>
            <span style={{ fontSize: '0.95rem' }}>{charsLabel}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{charCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2.5">
            <span style={{ fontSize: '0.95rem' }}>{readingTimeLabel}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{readMin} {minLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
