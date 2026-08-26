import React, { useState, useEffect } from 'react';
import { ThemeColors } from '../../../types';
import { NotionPage } from '../types';
import { Search, FileText, ArrowRight, X } from 'lucide-react';

interface NotionSearchModalProps {
  isOpen: boolean;
  pages: NotionPage[];
  theme: ThemeColors;
  onSelectPage: (id: string) => void;
  onClose: () => void;
}

export const NotionSearchModal: React.FC<NotionSearchModalProps> = ({
  isOpen,
  pages,
  theme,
  onSelectPage,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setQuery('');
    setSelectedIndex(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPages = pages.filter((page) => {
    const titleMatch = page.title.toLowerCase().includes(query.toLowerCase());
    const tagMatch = Array.isArray(page.properties?.tags) &&
      page.properties.tags.some((t: string) => t.toLowerCase().includes(query.toLowerCase()));
    return titleMatch || tagMatch;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredPages.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredPages.length) % (filteredPages.length || 1));
    } else if (e.key === 'Enter' && filteredPages[selectedIndex]) {
      e.preventDefault();
      onSelectPage(filteredPages[selectedIndex].id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-150"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ borderColor: theme.borderFaint }}
        >
          <Search size={18} style={{ color: theme.textMuted }} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm kiếm nhanh trang trong Notion Workspace..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: theme.text }}
            autoFocus
          />
          <span
            className="text-[11px] px-2 py-0.5 rounded font-mono border"
            style={{
              backgroundColor: theme.panel,
              borderColor: theme.borderFaint,
              color: theme.textMuted
            }}
          >
            ESC
          </span>
          <button onClick={onClose} className="p-1 hover:opacity-75" style={{ color: theme.textMuted }}>
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 kgv-scroll">
          {filteredPages.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: theme.textMuted }}>
              Không tìm thấy trang nào khớp với từ khóa "{query}"
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredPages.map((page, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={page.id}
                    onClick={() => {
                      onSelectPage(page.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors text-sm"
                    style={{
                      backgroundColor: isSelected ? theme.accentLight : 'transparent',
                      color: isSelected ? theme.text : theme.text
                    }}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="text-lg shrink-0">{page.icon || '📄'}</span>
                      <div className="flex flex-col truncate">
                        <span className="font-medium truncate">{page.title || 'Untitled'}</span>
                        {page.properties?.status && (
                          <span className="text-[10px] opacity-75" style={{ color: theme.textMuted }}>
                            Status: {page.properties.status}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <ArrowRight size={14} style={{ color: theme.accent }} className="shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          className="flex items-center justify-between px-4 py-2 text-[11px] border-t"
          style={{
            borderColor: theme.borderFaint,
            backgroundColor: theme.panel,
            color: theme.textMuted
          }}
        >
          <span>Dùng ↑ ↓ để di chuyển, Enter để mở trang</span>
          <span>{filteredPages.length} kết quả</span>
        </div>
      </div>
    </div>
  );
};
