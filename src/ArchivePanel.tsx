import React, { useState, useMemo } from 'react';
import type { Page, ThemeColors } from './types';
import type { Lang } from './i18n';
import { getArchiveTrashI18n } from './archiveTrashI18n';
import { Accordion } from './components/Accordion';

export interface ArchivePanelProps {
  archive: Page[];
  theme?: ThemeColors;
  c: ThemeColors;
  uiFont: string;
  lang: Lang;
  onUnarchivePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onSelectPage?: (pageId: string) => void;
}


export function ArchivePanel({
  archive = [],
  c,
  uiFont,
  lang,
  onUnarchivePage,
  onDeletePage,
}: ArchivePanelProps) {
  const i18n = useMemo(() => getArchiveTrashI18n(lang), [lang]);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 8px 16px 8px' }}>
      <Accordion title={i18n.archiveTitle || 'ARCHIVE'} uiFont={uiFont} c={c}>
        <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column' }}>
          
          {archive.length === 0 ? (
            <div style={{ padding: '20px 8px', color: c.textMuted, fontFamily: (uiFont || 'inherit'), fontSize: '0.85rem' }}>
              {i18n.archiveEmpty || 'Archive is empty'}
            </div>
          ) : (
            archive.map(p => {
              const isOpen = openItems[p.id] || false;
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: 4 }}>
                  <button 
                    onClick={() => toggleItem(p.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0', borderBottom: `1px solid ${c.borderFaint}`,
                      color: c.text, fontFamily: (uiFont || 'inherit'), fontSize: '0.85rem'
                    }}
                  >
                    <span>{p.title || i18n.untitled}</span>
                    <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: '0.6rem' }}>
                      ▲
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '8px 0 12px 0', borderBottom: `1px solid ${c.borderFaint}` }}>
                      <button 
                        onClick={() => onUnarchivePage(p.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, fontFamily: (uiFont || 'inherit'), fontSize: '0.85rem', padding: '4px 0' }}
                      >
                        {i18n.unarchive || 'Unarchive'}
                      </button>
                      <button 
                        onClick={() => onDeletePage(p.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, fontFamily: (uiFont || 'inherit'), fontSize: '0.85rem', padding: '4px 0' }}
                      >
                        {i18n.delete || 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

        </div>
      </Accordion>
    </div>
  );
}

export default ArchivePanel;
