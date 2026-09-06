import React, { useState, useMemo } from 'react';
import type { Page, ThemeColors } from './types';
import type { Lang } from './i18n';
import { getArchiveTrashI18n } from './archiveTrashI18n';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

export function TrashPanel({
  bin = [],
  c,
  uiFont,
  lang,
  onRestorePage,
  onPermanentDeletePage,
}: TrashPanelProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const i18n = useMemo(() => getArchiveTrashI18n(lang), [lang]);

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
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {bin.length === 0 ? (
          <div style={{ padding: '30px 12px', textAlign: 'center', color: c.textMuted, fontSize: '0.85rem', fontFamily: (uiFont || 'inherit') }}>
            {i18n.trashEmpty}
          </div>
        ) : (
          bin.map(p => {
            const isExpanded = deleteTargetId === p.id;
            return (
              <div
                key={p.id}
                id={`trash-card-${p.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderBottom: `1px solid ${c.borderFaint}`,
                  padding: '12px 0',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setDeleteTargetId(isExpanded ? null : p.id)}
                >
                  <span
                    style={{
                      fontFamily: (uiFont || 'inherit'),
                      fontSize: '0.9rem',
                      color: c.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={p.title}
                  >
                    {p.title || i18n.untitled}
                  </span>
                  <div style={{ flexShrink: 0, marginLeft: 8 }}>
                    {isExpanded ? <ChevronUp size={16} color={c.text} /> : <ChevronDown size={16} color={c.text} />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginTop: 12 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestorePage(p.id);
                        setDeleteTargetId(null);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: (uiFont || 'inherit'),
                        fontSize: '0.85rem',
                        color: c.text,
                        padding: 0,
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      {i18n.restore}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPermanentDeletePage(p.id);
                        setDeleteTargetId(null);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: (uiFont || 'inherit'),
                        fontSize: '0.85rem',
                        color: c.text,
                        padding: 0,
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      {i18n.deleteConfirm}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TrashPanel;
