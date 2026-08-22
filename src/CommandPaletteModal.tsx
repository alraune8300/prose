import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Terminal, X, CornerDownLeft, Command, Hash } from 'lucide-react';
import type { ThemeColors } from './types';
import type { Lang } from './i18n';

export interface CommandItem {
  id: string;
  label: string;
  category: 'Actions & Tools' | 'View & Layout' | 'Navigation & Search' | 'System & Export';
  icon: React.ReactNode;
  shortcut?: string;
  description: string;
  perform: () => void;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColors;
  lang: Lang;
  uiFont: string;
  commands: CommandItem[];
};

export default function CommandPaletteModal({
  isOpen,
  onClose,
  theme,
  lang = 'vi',
  uiFont,
  commands,
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Check if query is in Prefix / Command-only mode
  const isCommandOnlyMode = query.startsWith('>') || query.startsWith('/');
  const cleanQuery = isCommandOnlyMode ? query.slice(1).trim().toLowerCase() : query.trim().toLowerCase();

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!cleanQuery) {
      return commands;
    }
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(cleanQuery) ||
      cmd.description.toLowerCase().includes(cleanQuery) ||
      cmd.category.toLowerCase().includes(cleanQuery) ||
      cmd.id.toLowerCase().includes(cleanQuery)
    );
  }, [commands, cleanQuery]);

  // Group commands by category for display
  const groupedCommands = useMemo(() => {
    const groups: { [key: string]: CommandItem[] } = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          const item = filteredCommands[selectedIndex];
          onClose();
          item.perform();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndexCounter = 0;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 pointer-events-auto select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[75vh] transition-all"
        style={{
          backgroundColor: theme.surface || '#18181b',
          borderColor: theme.border || '#27272a',
          color: theme.text || '#f4f4f5',
          fontFamily: `'${uiFont}', sans-serif`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div
          className="relative flex items-center px-4 py-3.5 border-b gap-3 shrink-0"
          style={{ borderColor: theme.borderFaint || theme.border }}
        >
          {isCommandOnlyMode ? (
            <Terminal size={17} style={{ color: theme.text }} className="shrink-0 opacity-80" />
          ) : (
            <Search size={17} style={{ color: theme.textMuted || theme.text }} className="shrink-0 opacity-60" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={
              lang === 'vi'
                ? 'Tìm kiếm câu lệnh, công cụ (Gõ > hoặc / để lọc nhanh)...'
                : 'Type a command or > / / to filter...'
            }
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:opacity-40"
            style={{ color: theme.text }}
          />

          {isCommandOnlyMode && (
            <span
              className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded border uppercase tracking-wider shrink-0"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: theme.text,
              }}
            >
              Command
            </span>
          )}

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md hover:bg-white/10 opacity-50 hover:opacity-100 transition-all cursor-pointer shrink-0"
              title="Xóa"
            >
              <X size={14} />
            </button>
          )}

          <kbd
            className="px-1.5 py-0.5 rounded border text-[10px] font-mono opacity-40 shrink-0"
            style={{ borderColor: theme.border }}
          >
            ESC
          </kbd>
        </div>

        {/* Categories & Filter Bar */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 border-b text-xs overflow-x-auto shrink-0 select-none"
          style={{ borderColor: theme.borderFaint || theme.border, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)' }}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider opacity-40 shrink-0 pr-1">Lọc:</span>
          {[
            { label: 'Bảng (Table)', cmd: '> insert table' },
            { label: 'Gập Đề Mục', cmd: '> fold all' },
            { label: 'Focus Mode', cmd: '> toggle focus' },
            { label: 'So Sánh', cmd: '> split diff' },
          ].map((quick, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(quick.cmd);
                inputRef.current?.focus();
              }}
              className="px-2 py-0.5 rounded text-[11px] font-mono border transition-all hover:opacity-100 cursor-pointer shrink-0 opacity-60"
              style={{
                borderColor: theme.borderFaint || theme.border,
                color: theme.text,
              }}
            >
              {quick.label}
            </button>
          ))}
        </div>

        {/* Command List Container */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-3">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center opacity-40 flex flex-col items-center justify-center gap-2 text-xs">
              <span>{lang === 'vi' ? 'Không tìm thấy lệnh nào phù hợp' : 'No matching commands found'}</span>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="space-y-1">
                {/* Category Header */}
                <div
                  className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-40"
                  style={{ color: theme.text }}
                >
                  <Hash size={10} />
                  <span>{category}</span>
                </div>

                {/* Items */}
                {items.map(item => {
                  const currentIndex = flatIndexCounter++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      data-selected={isSelected}
                      onClick={() => {
                        onClose();
                        item.perform();
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-100`}
                      style={{
                        backgroundColor: isSelected
                          ? (theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)')
                          : 'transparent',
                        borderLeft: isSelected
                          ? `3px solid ${theme.text}`
                          : '3px solid transparent',
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className="p-1.5 rounded-lg shrink-0 opacity-70"
                          style={{
                            backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                            color: theme.text,
                          }}
                        >
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'opacity-100' : 'opacity-85'}`}>
                            {item.label}
                          </span>
                          <span className="text-[11px] opacity-50 truncate font-normal">{item.description}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.shortcut && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono border opacity-50"
                            style={{ borderColor: theme.borderFaint || theme.border }}
                          >
                            {item.shortcut}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft size={12} className="opacity-60 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Help Bar */}
        <div
          className="px-4 py-2 border-t text-[10px] flex items-center justify-between opacity-50 font-mono select-none"
          style={{ borderColor: theme.borderFaint || theme.border, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded border">↑↓</kbd> Di chuyển
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded border">↵</kbd> Chọn
            </span>
          </div>
          <div className="flex items-center gap-1 font-sans font-medium">
            <Command size={11} />
            <span>Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
