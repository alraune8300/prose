import React, { useState } from 'react';
import { NotionPage } from '../types';
import { Trash2, RotateCcw, Search, X, AlertTriangle } from 'lucide-react';
import { LucideIconRenderer } from './LucideIconRenderer';
import { getNotionI18n } from '../i18n';
import { Lang } from '../../../i18n';
import { ThemeColors } from '../../../types';

interface Props {
  pages: NotionPage[];
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
}: Props) {
  const [search, setSearch] = useState('');
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);
  const t = getNotionI18n(lang);

  const deletedPages = pages.filter((p) => p.isDeleted);
  const filteredPages = deletedPages.filter((p) =>
    (p.title || t.untitled).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Solid Backdrop - No Blur */}
      <div
        className="fixed inset-0 bg-black/75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog with Solid System Colors */}
      <div
        className="relative w-full max-w-xl rounded-2xl shadow-2xl border flex flex-col max-h-[85vh] z-10 overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderColor: 'var(--border-subtle, #e5e7eb)',
          color: 'var(--text-primary, #111827)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)', color: 'var(--text-primary)' }}
            >
              <Trash2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold">{t.trash}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted, #6b7280)' }}>
                {deletedPages.length} {t.pages.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {deletedPages.length > 0 && onEmptyTrash && (
              <button
                onClick={() => setShowConfirmEmpty(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                {t.emptyTrash}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted, #6b7280)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div
          className="px-5 py-3 border-b"
          style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
            style={{
              backgroundColor: 'var(--bg-primary, #ffffff)',
              borderColor: 'var(--border-subtle, #e5e7eb)'
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted, #6b7280)' }} />
            <input
              type="text"
              placeholder={t.searchTrashPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
              style={{ color: 'var(--text-primary, #111827)' }}
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-xs"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Deleted Pages List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-[220px]">
          {filteredPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="p-3.5 rounded-full mb-3"
                style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)', color: 'var(--text-muted)' }}
              >
                <Trash2 size={24} />
              </div>
              <p className="text-sm font-medium">{t.trashEmpty}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted, #6b7280)' }}>
                {t.trashEmptyDesc}
              </p>
            </div>
          ) : (
            filteredPages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-2.5 rounded-xl border transition-colors"
                style={{
                  backgroundColor: 'var(--bg-primary, #ffffff)',
                  borderColor: 'var(--border-subtle, #e5e7eb)'
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  <div className="shrink-0 text-base">
                    <LucideIconRenderer name={page.icon || 'FileText'} size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block" style={{ color: 'var(--text-primary)' }}>
                      {page.title || t.untitled}
                    </span>
                    {page.deletedAt && (
                      <span className="text-[11px]" style={{ color: 'var(--text-muted, #6b7280)' }}>
                        {new Date(page.deletedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Persistent Action Buttons - Always visible without hover */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onRestore(page.id)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 border transition-colors cursor-pointer"
                    style={{
                      borderColor: 'var(--border-subtle, #e5e7eb)',
                      color: 'var(--text-primary)'
                    }}
                    title={t.restore}
                  >
                    <RotateCcw size={13} className="text-blue-500" />
                    <span>{t.restore}</span>
                  </button>

                  <button
                    onClick={() => onPermanentlyDelete(page.id)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={t.deletePermanently}
                  >
                    <Trash2 size={13} />
                    <span>{t.deletePermanently}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Confirmation Modal for Empty Trash */}
        {showConfirmEmpty && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60">
            <div
              className="w-full max-w-sm rounded-2xl p-5 border shadow-2xl flex flex-col gap-4"
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderColor: 'var(--border-subtle, #e5e7eb)',
                color: 'var(--text-primary, #111827)'
              }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {t.confirmEmptyTrashTitle}
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {t.confirmEmptyTrashDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => setShowConfirmEmpty(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => {
                    if (onEmptyTrash) onEmptyTrash();
                    setShowConfirmEmpty(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                >
                  {t.emptyTrash}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
