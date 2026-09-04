import React, { useState, useMemo } from 'react';
import type { Page, ThemeColors } from './types';
import type { Lang } from './i18n';
import { getArchiveTrashI18n } from './archiveTrashI18n';
import { Trash2, RotateCcw, Search, X, FileText, StickyNote, FileEdit } from 'lucide-react';

export interface TrashPanelProps {
  bin: Page[];
  theme?: ThemeColors;
  c: ThemeColors;
  uiFont: string;
  lang: Lang;
  onRestorePage: (pageId: string) => void;
  onPermanentDeletePage: (pageId: string) => void;
  onEmptyBin: () => void;
}

function stripHtml(html: string): string {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}

export function TrashPanel({
  bin = [],
  c,
  uiFont,
  lang,
  onRestorePage,
  onPermanentDeletePage,
  onEmptyBin,
}: TrashPanelProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pages' | 'drafts' | 'scratchpad'>('all');
  const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const i18n = useMemo(() => getArchiveTrashI18n(lang), [lang]);

  const filteredItems = useMemo(() => {
    return bin.filter(p => {
      if (filterType === 'pages' && (p.isDraft || p.isScratchpad)) return false;
      if (filterType === 'drafts' && !p.isDraft) return false;
      if (filterType === 'scratchpad' && !p.isScratchpad) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const titleMatch = (p.title || '').toLowerCase().includes(q);
      const textMatch = stripHtml(p.content || '').toLowerCase().includes(q);
      return titleMatch || textMatch;
    });
  }, [bin, search, filterType]);

  const handleEmptyAll = () => {
    onEmptyBin();
    setConfirmEmptyAll(false);
  };

  const handlePermanentDelete = (id: string) => {
    onPermanentDeletePage(id);
    setDeleteTargetId(null);
  };

  return (
    <div
      id="trash-panel-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        background: c.panel,
        fontFamily: uiFont,
      }}
    >
      {/* Header Info & Search */}
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: `1px solid ${c.borderFaint}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trash2 size={15} style={{ color: c.textMuted }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {i18n.trash}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: c.textMuted,
                background: c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                padding: '1px 6px',
                borderRadius: 10,
              }}
            >
              {bin.length}
            </span>
          </div>

          {bin.length > 0 && (
            <div>
              {confirmEmptyAll ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    id="btn-confirm-empty-trash"
                    onClick={handleEmptyAll}
                    style={{
                      fontSize: '0.68rem',
                      color: c.text,
                      background: c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      border: `1px solid ${c.border}`,
                      borderRadius: 4,
                      padding: '2px 7px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {i18n.confirmEmptyTrash}
                  </button>
                  <button
                    id="btn-cancel-empty-trash"
                    onClick={() => setConfirmEmptyAll(false)}
                    style={{
                      fontSize: '0.68rem',
                      color: c.textMuted,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {i18n.cancel}
                  </button>
                </div>
              ) : (
                <button
                  id="btn-empty-trash-trigger"
                  onClick={() => setConfirmEmptyAll(true)}
                  style={{
                    fontSize: '0.7rem',
                    color: c.textMuted,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title={i18n.emptyTrash}
                >
                  <Trash2 size={12} />
                  <span>{i18n.emptyTrash}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: c.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
            borderRadius: 7,
            padding: '4px 8px',
            border: `1px solid ${c.borderFaint}`,
            gap: 6,
          }}
        >
          <Search size={13} style={{ color: c.textMuted, flexShrink: 0 }} />
          <input
            id="trash-search-input"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={i18n.searchTrash}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.76rem',
              color: c.text,
              width: '100%',
              fontFamily: uiFont,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 0 }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        {bin.length > 0 && (
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
            {(
              [
                { id: 'all', label: i18n.all },
                { id: 'pages', label: i18n.pages },
                { id: 'drafts', label: i18n.drafts },
                { id: 'scratchpad', label: i18n.notes },
              ] as const
            ).map(tab => {
              const active = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`trash-filter-${tab.id}`}
                  onClick={() => setFilterType(tab.id)}
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: 12,
                    border: `1px solid ${active ? '#e05050' : c.borderFaint}`,
                    background: active ? 'rgba(224, 80, 80, 0.1)' : 'transparent',
                    color: active ? '#e05050' : c.textMuted,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.12s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Item List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bin.length === 0 ? (
          <div
            id="trash-empty-state"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 16px',
              textAlign: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: c.textMuted,
              }}
            >
              <Trash2 size={22} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: c.text }}>
              {i18n.trashEmpty}
            </span>
            <span style={{ fontSize: '0.72rem', color: c.textMuted, maxWidth: 220, lineHeight: 1.4 }}>
              {i18n.trashDesc}
            </span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 12px', color: c.textMuted, fontSize: '0.75rem' }}>
            {i18n.noMatchingDeleted}
          </div>
        ) : (
          filteredItems.map(p => {
            const preview = stripHtml(p.content || '');
            const typeLabel = p.isScratchpad
              ? i18n.noteType
              : p.isDraft
              ? i18n.draftType
              : i18n.pageType;

            const TypeIcon = p.isScratchpad ? StickyNote : p.isDraft ? FileEdit : FileText;
            const isDeletingThis = deleteTargetId === p.id;

            return (
              <div
                key={p.id}
                id={`trash-card-${p.id}`}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.borderFaint}`,
                  borderRadius: 8,
                  padding: '9px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'all 0.12s',
                  boxShadow: c.isDark ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                    <TypeIcon size={14} style={{ color: '#e05050', flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: c.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={p.title}
                    >
                      {p.title || i18n.untitled}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {isDeletingThis ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <button
                          id={`btn-confirm-delete-${p.id}`}
                          onClick={() => handlePermanentDelete(p.id)}
                          style={{
                            fontSize: '0.66rem',
                            color: '#ffffff',
                            background: '#e05050',
                            border: 'none',
                            borderRadius: 4,
                            padding: '2px 6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {i18n.deleteConfirm}
                        </button>
                        <button
                          id={`btn-cancel-delete-${p.id}`}
                          onClick={() => setDeleteTargetId(null)}
                          style={{
                            fontSize: '0.66rem',
                            color: c.textMuted,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {i18n.cancel}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          id={`btn-restore-${p.id}`}
                          onClick={() => onRestorePage(p.id)}
                          title={i18n.restoreTooltip}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '3px 7px',
                            background: c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                            color: c.accent,
                            borderRadius: 5,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.68rem',
                            fontWeight: 500,
                            transition: 'all 0.12s',
                          }}
                        >
                          <RotateCcw size={12} />
                          <span>{i18n.restore}</span>
                        </button>

                        <button
                          id={`btn-perm-delete-${p.id}`}
                          onClick={() => setDeleteTargetId(p.id)}
                          title={i18n.deleteForeverTooltip}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '3px 5px',
                            background: c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            color: c.textMuted,
                            borderRadius: 5,
                            border: `1px solid ${c.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.12s',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {preview && (
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: c.textMuted,
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {preview}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', color: c.textMuted, paddingTop: 2 }}>
                  <span
                    style={{
                      background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      padding: '1px 5px',
                      borderRadius: 4,
                    }}
                  >
                    {typeLabel}
                  </span>
                  {p.lastModified && (
                    <span>
                      {new Date(p.lastModified).toLocaleDateString(i18n.dateLocale, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TrashPanel;
