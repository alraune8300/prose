import React, { useState, useRef, useEffect } from 'react';
import type { ThemeColors } from './types';

interface WordCountDropdownProps {
  wordCount: number;
  charCount: number;
  readMin: number;
  theme: ThemeColors;
  uiFont: string;
}

export default function WordCountDropdown({ wordCount, charCount, readMin, theme, uiFont }: WordCountDropdownProps) {
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

  return (
    <div className="relative z-50 flex items-center h-[34px]" ref={containerRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 transition-all hover:opacity-80 active:scale-95 px-2 py-1 outline-none"
        style={{
          color: theme.text,
          fontFamily: uiFont,
          fontSize: '0.85rem',
          fontWeight: 600,
          background: 'transparent',
        }}
      >
        <span style={{ fontWeight: 700 }}>{wordCount.toLocaleString()}</span> <span style={{ opacity: 0.8, fontWeight: 400 }}>words</span>
      </button>

      {open && (
        <div 
          className="absolute right-0 mt-2 p-3 rounded-2xl shadow-2xl w-56 border"
          style={{
            top: '100%',
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
            fontFamily: uiFont,
          }}
        >
          <div className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: theme.borderFaint }}>
            <span style={{ fontSize: '0.95rem' }}>Words</span>
            <span style={{ fontSize: '0.95rem' }}>{wordCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: theme.borderFaint }}>
            <span style={{ fontSize: '0.95rem' }}>Characters</span>
            <span style={{ fontSize: '0.95rem' }}>{charCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2.5">
            <span style={{ fontSize: '0.95rem' }}>Reading time</span>
            <span style={{ fontSize: '0.95rem' }}>{readMin}m</span>
          </div>
        </div>
      )}
    </div>
  );
}
