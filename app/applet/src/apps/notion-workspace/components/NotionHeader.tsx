import React, { useState } from 'react';
import { ThemeColors } from '../../../types';
import { NotionPage } from '../types';
import {
  Menu,
  Star,
  Download,
  Share2,
  MoreHorizontal,
  ChevronRight,
  Copy,
  Check,
  FileDown
} from 'lucide-react';

interface NotionHeaderProps {
  page: NotionPage | null;
  allPages: NotionPage[];
  isSidebarOpen: boolean;
  theme: ThemeColors;
  onToggleSidebar: () => void;
  onToggleFavorite: (id: string) => void;
  onSelectPage: (id: string) => void;
  onExportMarkdown: () => void;
}

export const NotionHeader: React.FC<NotionHeaderProps> = ({
  page,
  allPages,
  isSidebarOpen,
  theme,
  onToggleSidebar,
  onToggleFavorite,
  onSelectPage,
  onExportMarkdown
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!page) return null;

  // Build breadcrumb trail
  const breadcrumbs: NotionPage[] = [];
  let current: NotionPage | undefined = page;
  while (current) {
    breadcrumbs.unshift(current);
    if (current.parentId) {
      current = allPages.find((p) => p.id === current?.parentId);
    } else {
      break;
    }
  }

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(page.title || 'Untitled');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <header
      className="h-12 w-full flex items-center justify-between px-4 shrink-0 select-none border-b transition-colors z-10"
      style={{
        backgroundColor: theme.bg,
        borderColor: theme.borderFaint,
        color: theme.text
      }}
    >
      {/* Left: Sidebar toggle + Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs overflow-hidden flex-1 mr-2">
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg mr-1 transition-colors hover:opacity-80"
            style={{ color: theme.textMuted }}
            title="Mở Sidebar (Ctrl+\)"
          >
            <Menu size={16} />
          </button>
        )}

        <span className="opacity-60 text-xs truncate">Workspace</span>
        <ChevronRight size={12} className="opacity-40 shrink-0" />

        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.id}>
              {idx > 0 && <ChevronRight size={12} className="opacity-40 shrink-0" />}
              <button
                onClick={() => onSelectPage(crumb.id)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors truncate max-w-[140px] ${
                  isLast ? 'font-semibold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  color: isLast ? theme.text : theme.textMuted
                }}
              >
                <span>{crumb.icon || '📄'}</span>
                <span className="truncate">{crumb.title || 'Untitled'}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Favorite */}
        <button
          onClick={() => onToggleFavorite(page.id)}
          className="p-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ color: page.isFavorite ? '#eab308' : theme.textMuted }}
          title={page.isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
        >
          <Star size={15} fill={page.isFavorite ? '#eab308' : 'none'} />
        </button>

        {/* Export Markdown */}
        <button
          onClick={onExportMarkdown}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-85 border"
          style={{
            backgroundColor: theme.panel,
            borderColor: theme.borderFaint,
            color: theme.text
          }}
          title="Xuất file Markdown"
        >
          <FileDown size={13} style={{ color: theme.accent }} />
          <span>Export .md</span>
        </button>

        {/* More Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: theme.textMuted }}
          >
            <MoreHorizontal size={16} />
          </button>

          {isMenuOpen && (
            <div
              className="absolute top-full right-0 mt-1 w-48 rounded-xl shadow-2xl py-1 z-50 border animate-in fade-in"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              <button
                onClick={handleCopyTitle}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:opacity-80"
              >
                {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{isCopied ? 'Đã sao chép tiêu đề!' : 'Sao chép tiêu đề'}</span>
              </button>
              <button
                onClick={onExportMarkdown}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:opacity-80"
              >
                <Download size={13} />
                <span>Tải về dạng Markdown (.md)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
