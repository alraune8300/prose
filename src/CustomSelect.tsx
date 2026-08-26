import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ThemeColors } from './types';

export interface SelectOption {
  value: string;
  label: string;
  fontFamily?: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  theme: ThemeColors;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  dropdownClassName?: string;
  dropdownStyle?: React.CSSProperties;
  renderButtonContent?: (selectedOption: SelectOption | undefined) => React.ReactNode;
  onOpen?: () => void;
  footerNode?: React.ReactNode;
  searchPlaceholder?: string;
  disableSearch?: boolean;
}

export function CustomSelect({
  searchPlaceholder = "Search...",
  disableSearch = false,
  value,
  onChange,
  options,
  groups,
  theme,
  buttonClassName = '',
  buttonStyle = {},
  dropdownClassName = '',
  dropdownStyle = {},
  renderButtonContent,
  onOpen,
  footerNode
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0, windowHeight: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        bottom: rect.bottom,
        windowHeight: window.innerHeight
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allOptions = options || groups?.flatMap(g => g.options) || [];
  const selectedOption = allOptions.find(o => o.value === value);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button type="button" 
        onClick={() => { setIsOpen(!isOpen); if (!isOpen && onOpen) onOpen(); }}
        className={`cursor-pointer ${buttonClassName}`}
        style={buttonStyle}
      >
        {renderButtonContent ? renderButtonContent(selectedOption) : (
          <span className="truncate">{selectedOption?.label || value}</span>
        )}
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className={`fixed z-[9999] rounded-xl shadow-xl flex flex-col overflow-y-auto overflow-x-hidden ${dropdownClassName.replace('bottom-full', '').replace('mb-2', '').replace('!mt-0', '')}`}
          style={{ 
            backgroundColor: theme.surface || (theme.isDark ? '#1f2937' : '#ffffff'), 
            border: `1px solid ${theme.border || (theme.isDark ? '#374151' : '#e5e7eb')}`,
            minWidth: Math.max(200, coords.width),
            maxWidth: Math.max(260, coords.width),
            maxHeight: '320px',
            ...(coords.windowHeight - coords.bottom < 340 ? { top: coords.top - 8, transform: 'translateY(-100%)' } : { top: coords.bottom + 4 }),
            left: coords.left,
            ...dropdownStyle 
          }}
        >
          {!disableSearch && <div className="px-2 py-2 sticky top-0 z-10 border-b backdrop-blur-md" style={{ backgroundColor: theme.surface ? `${theme.surface}e0` : (theme.isDark ? 'rgba(31,41,55,0.9)' : 'rgba(255,255,255,0.9)'), borderColor: theme.borderFaint || (theme.isDark ? '#374151' : '#f3f4f6') }}>
            <div className="relative flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 w-3.5 h-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[13px] rounded-lg border outline-none transition-all"
                style={{ 
                  backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', 
                  borderColor: 'transparent', 
                  color: theme.text 
                }}
                onFocus={e => e.target.style.borderColor = theme.accent || '#3b82f6'}
                onBlur={e => e.target.style.borderColor = 'transparent'}
                autoFocus
              />
            </div>
          </div>}
          <div className="p-1.5 flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-0.5">
            {options && options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase())).map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className="w-full text-left px-3 py-2 text-[13px] transition-colors truncate flex-shrink-0 rounded-md flex items-center justify-between"
                style={{ 
                  color: value === opt.value ? theme.accent : theme.text,
                  backgroundColor: value === opt.value ? (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)') : 'transparent',
                  fontFamily: opt.fontFamily
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = value === opt.value ? (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)') : 'transparent'}
              >
                <span>{opt.label}</span>
                {value === opt.value && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </button>
            ))}
            {groups && groups.map(g => ({ ...g, options: g.options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase())) })).filter(g => g.options.length > 0).map((group, groupIdx) => (
              <div key={group.label} className="flex-shrink-0 mb-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider mt-1 mb-0.5 flex-shrink-0 opacity-50" style={{ color: theme.text }}>
                  {group.label}
                </div>
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-[13px] transition-colors truncate flex-shrink-0 rounded-md flex items-center justify-between"
                    style={{ 
                      color: value === opt.value ? theme.accent : theme.text,
                      backgroundColor: value === opt.value ? (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)') : 'transparent',
                      fontFamily: opt.fontFamily
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = value === opt.value ? (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)') : 'transparent'}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {value === opt.value && <svg xmlns="http://www.w3.org/2000/svg" className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </button>
                ))}
              </div>
            ))}
            {(!options || options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase())).length === 0) && (!groups || groups.filter(g => g.options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase())).length > 0).length === 0) && (
              <div className="px-3 py-4 text-center text-[12px] opacity-50" style={{ color: theme.text }}>
                No options found
              </div>
            )}
          </div>
          {footerNode && (
            <div onClick={() => setIsOpen(false)} className="flex-shrink-0 sticky bottom-0 border-t p-1.5 backdrop-blur-md" style={{ backgroundColor: theme.surface ? `${theme.surface}e0` : (theme.isDark ? 'rgba(31,41,55,0.9)' : 'rgba(255,255,255,0.9)'), borderColor: theme.borderFaint || (theme.isDark ? '#374151' : '#f3f4f6') }}>
              {footerNode}
            </div>
          )}
        </div>
      , document.body)}
    </div>
  );
}
