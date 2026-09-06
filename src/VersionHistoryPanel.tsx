import React, { useState, useEffect } from 'react';
import { getPageVersionsFromDB, savePageVersionToDB, VersionSnapshot, deletePageVersionFromDB } from './db';
import { format } from 'date-fns';
import { t } from './i18n';

interface Props {
  activePage: any;
  theme: any;
  lang: any;
  uiFont: string;
  onRestore: (content: string, title: string) => void;
}

const CornerButton = ({ children, onClick, disabled, style, uiFont }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, style?: React.CSSProperties, uiFont?: string }) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`relative flex items-center justify-center w-full py-2.5 group transition-opacity ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-70'}`}
      style={{ background: 'transparent', border: 'none', color: 'inherit', ...style }}
    >
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-30 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-30 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-100 transition-opacity" />
      <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 500 }}>{children}</span>
    </button>
  );
};

export default function VersionHistoryPanel({ activePage, theme, lang, uiFont, onRestore }: Props) {
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activePage?.id) {
      loadVersions();
    }
  }, [activePage?.id]);

  const loadVersions = async () => {
    if (!activePage?.id) return;
    setLoading(true);
    try {
      const v = await getPageVersionsFromDB(activePage.id);
      setVersions(v.reverse()); // Newest first
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreateSnapshot = async () => {
    if (!activePage) return;
    const v: VersionSnapshot = {
      id: 'v-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      pageId: activePage.id,
      timestamp: new Date().toISOString(),
      content: activePage.content,
      title: activePage.title,
    };
    await savePageVersionToDB(v);
    await loadVersions();
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col pt-2 pb-6" style={{ fontFamily: (uiFont || 'inherit'), color: theme.text }}>
      <div className="px-10 mb-6 mt-2">
        <CornerButton uiFont={uiFont} onClick={handleCreateSnapshot}>
          {t(lang, 'createNewSnapshot') || 'CREATE NEW SNAPSHOT'}
        </CornerButton>
      </div>

      <div className="flex-1 flex flex-col gap-3 px-4">
        {loading ? (
          <p className="text-center text-sm my-4 opacity-50">{t(lang, 'loading')}...</p>
        ) : versions.length === 0 ? (
          <p className="text-sm opacity-50 text-center">No snapshots yet.</p>
        ) : (
          versions.map((v, i) => (
            <button
              key={v.id}
              onClick={() => {
                if(window.confirm('Restore this snapshot? Current unsaved changes will be lost.')) {
                   onRestore(v.content, v.title || activePage?.title || 'Restored');
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.text,
                fontFamily: (uiFont || 'inherit'),
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'left',
                opacity: 0.9,
                display: 'flex',
                transition: 'opacity 0.2s',
                fontWeight: 500
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.5'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.9'}
            >
              Snapshot {versions.length - i} - {format(new Date(v.timestamp), 'd/M/yyyy - HH:mm')}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
