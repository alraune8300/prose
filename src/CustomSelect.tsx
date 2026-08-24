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
}

export function CustomSelect({
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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
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
          className={`fixed z-[9999] rounded-xl shadow-xl flex flex-col overflow-y-auto ${dropdownClassName.replace('bottom-full', '').replace('mb-2', '').replace('!mt-0', '')}`}
          style={{ 
            backgroundColor: theme.surface, 
            border: `1px solid ${theme.border}`,
            minWidth: Math.max(224, coords.width),
            maxHeight: '300px',
            top: coords.top - 8,
            left: coords.left,
            transform: 'translateY(-100%)',
            ...dropdownStyle 
          }}
        >
          {options && options.map((opt, i) => (
            <React.Fragment key={opt.value}>
              <button
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className="w-full text-left px-4 py-3 text-[13px] md:text-sm transition-colors truncate flex-shrink-0"
                style={{ 
                  color: theme.text,
                  backgroundColor: value === opt.value ? theme.panel : 'transparent',
                  fontFamily: opt.fontFamily
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.panel}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = value === opt.value ? theme.panel : 'transparent'}
              >
                {opt.label}
              </button>
              {i < options.length - 1 && (
                <div className="h-[1px] w-full my-0 flex-shrink-0" style={{ backgroundColor: theme.borderFaint }} />
              )}
            </React.Fragment>
          ))}

          {groups && groups.map((group, groupIdx) => (
            <div key={group.label} className="flex-shrink-0">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider mt-1 flex-shrink-0" style={{ color: theme.textFaint }}>
                {group.label}
              </div>
              {group.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] md:text-sm transition-colors truncate flex-shrink-0"
                  style={{ 
                    color: theme.text,
                    backgroundColor: value === opt.value ? theme.panel : 'transparent',
                    fontFamily: opt.fontFamily
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.panel}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = value === opt.value ? theme.panel : 'transparent'}
                >
                  {opt.label}
                </button>
              ))}
              {groupIdx < groups.length - 1 && (
                <div className="h-[1px] w-full my-1 flex-shrink-0" style={{ backgroundColor: theme.borderFaint }} />
              )}
            </div>
          ))}
          {footerNode && (
            <div onClick={() => setIsOpen(false)} className="flex-shrink-0 sticky bottom-0 border-t" style={{ backgroundColor: theme.surface, borderColor: theme.borderFaint }}>
              {footerNode}
            </div>
          )}
        </div>
      , document.body)}
    </div>
  );
}
