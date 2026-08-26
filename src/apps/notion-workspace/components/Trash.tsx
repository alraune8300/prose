/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Search, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { NotionPage } from '../../../types';
import { LucideIconRenderer } from './LucideIconRenderer';
import { getNotionI18n } from '../i18n';
import { Lang } from '../../../i18n';
import { ThemeColors } from '../../../theme';

interface TrashProps {
  pages: Record<string, NotionPage>;
  onClose: () => void;
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
  onEmptyTrash?: () => void;
  lang?: Lang;
  theme?: ThemeColors;
}

export function Trash({
  pages,
  onClose,
  onRestore,
  onPermanentlyDelete,
  onEmptyTrash,
  lang = 'en',
  theme
}: TrashProps) {
  const [search, setSearch] = useState('');
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);

  const t = getNotionI18n(lang);

  const deletedPages = Object.values(pages)
    .filter((p) => p.isDeleted)
    .filter((p) => (p.title || t.untitled).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleEmptyTrash = () => {
    if (onEmptyTrash) {
      onEmptyTrash();
    } else {
      deletedPages.forEach((p) => onPermanentlyDelete(p.id));
    }
    setShowConfirmEmpty(false);
  };

  const bgSurface = theme?.surface || theme?.panel || (theme as any)?.bgSurface || 'var(--bg-surface, #ffffff)';
  const bgPrimary = theme?.bg || (theme as any)?.bgPrimary || 'var(--bg-primary, #ffffff)';
  const bgSecondary = theme?.surface || theme?.panel || (theme as any)?.bgSecondary || 'var(--bg-secondary, #f3f4f6)';
  const textPrimary = theme?.text || (theme as any)?.textPrimary || 'var(--text-primary, #111827)';
  const textMuted = theme?.textMuted || theme?.textFaint || (theme as any)?.textMuted || 'var(--text-muted, #6b7280)';
  const borderSubtle = theme?.border || theme?.borderFaint || (theme as any)?.borderSubtle || 'var(--border-subtle, #e5e7eb)';
  const isDark = theme?.isDark ?? false;

  return createPortal(
    <div
      className="notion-trash-portal fixed inset-0 z-[9990] flex items-center justify-center p-4 select-none"
      style={{
        '--bg-primary': bgPrimary,
        '--bg-surface': bgSurface,
        '--bg-secondary': bgSecondary,
        '--text-primary': textPrimary,
        '--text-muted': textMuted,
        '--border-subtle': borderSubtle,
      } as React.CSSProperties}
    >
      {/* Solid Dark Overlay */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Main Solid Modal Window */}
      <div
        className="relative z-[9995] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border animate-in fade-in zoom-in-95 duration-150"
        style={{
          backgroundColor: bgSurface,
          borderColor: borderSubtle,
          color: textPrimary,
          maxHeight: '85vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: borderSubtle }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl border"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: borderSubtle,
                color: textPrimary
              }}
            >
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: textPrimary }}>{t.trash}</h3>
              <p className="text-[11px]" style={{ color: textMuted }}>
                {deletedPages.length} {deletedPages.length === 1 ? 'page' : 'pages'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {deletedPages.length > 0 && (
              <button
                onClick={() => setShowConfirmEmpty(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)',
                  color: isDark ? '#fca5a5' : '#dc2626'
                }}
              >
                <Trash2 size={13} />
                <span>{t.emptyTrash}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: textMuted }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Filter */}
        <div className="p-3 border-b" style={{ borderColor: borderSubtle }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : bgPrimary,
              borderColor: borderSubtle
            }}
          >
            <Search size={14} style={{ color: textMuted }} />
            <input
              type="text"
              placeholder={t.searchTrash}
              className="bg-transparent outline-none text-xs w-full placeholder:opacity-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ color: textPrimary }}
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                style={{ color: textMuted }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* List of Deleted Pages */}
        <div className="flex-1 overflow-y-auto p-3 min-h-[260px] max-h-[420px] space-y-2">
          {deletedPages.length === 0 ? (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  borderColor: borderSubtle
                }}
              >
                <Trash2 size={22} style={{ color: textMuted }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: textPrimary }}>{t.trashEmpty}</p>
              <p className="text-xs mt-1" style={{ color: textMuted }}>
                {t.trashEmptyDesc}
              </p>
            </div>
          ) : (
            deletedPages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-3 rounded-xl border transition-all shadow-xs"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : bgPrimary,
                  borderColor: borderSubtle
                }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="shrink-0 text-base" style={{ color: textPrimary }}>
                    <LucideIconRenderer name={page.icon || 'FileText'} size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-medium truncate" style={{ color: textPrimary }}>
                      {page.title || t.untitled}
                    </span>
                    <span className="text-[10px] mt-0.5" style={{ color: textMuted }}>
                      {t.deletedAt}: {page.deletedAt ? new Date(page.deletedAt).toLocaleString(lang) : new Date(page.updatedAt).toLocaleDateString(lang)}
                    </span>
                  </div>
                </div>

                {/* Persistent Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onRestore(page.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border shadow-xs"
                    style={{
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.08)',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.25)',
                      color: isDark ? '#93c5fd' : '#2563eb'
                    }}
                    title={t.restore}
                  >
                    <RefreshCw size={12} />
                    <span>{t.restore}</span>
                  </button>

                  <button
                    onClick={() => onPermanentlyDelete(page.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border shadow-xs"
                    style={{
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.08)',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.25)',
                      color: isDark ? '#fca5a5' : '#dc2626'
                    }}
                    title={t.deletePermanently}
                  >
                    <Trash2 size={12} />
                    <span>{t.deletePermanently}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Empty Trash */}
      {showConfirmEmpty && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setShowConfirmEmpty(false)}
          />
          <div
            className="relative z-[10005] w-full max-w-sm rounded-2xl shadow-2xl p-5 border flex flex-col gap-3.5"
            style={{
              backgroundColor: bgSurface,
              borderColor: borderSubtle,
              color: textPrimary
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl shrink-0 border"
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                  color: isDark ? '#f87171' : '#dc2626'
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: textPrimary }}>{t.confirmEmptyTrashTitle}</h4>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                  {t.confirmEmptyTrashMsg}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: borderSubtle }}>
              <button
                type="button"
                onClick={() => setShowConfirmEmpty(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border"
                style={{
                  color: textMuted,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  borderColor: borderSubtle
                }}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleEmptyTrash}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-sm"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
