import React, { useState, useEffect } from 'react';
import { Clock, Plus, RotateCcw, Trash2, ChevronRight, Save } from 'lucide-react';
import { getPageVersionsFromDB, savePageVersionToDB, deletePageVersionFromDB } from './db';
import type { ThemeColors, VersionSnapshot, Lang, Page } from './types';
import { t } from './i18n';
import { format } from 'date-fns';

interface Props {
  activePage: Page | null;
  theme: ThemeColors;
  lang: Lang;
  uiFont: string;
  onRestore: (content: string, title: string) => void;
}

export default function VersionHistoryPanel({
  activePage,
  theme,
  lang,
  uiFont,
  onRestore,
}: Props) {
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (activePage?.id) {
      loadVersions();
    }
  }, [activePage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      label: newLabel.trim() || undefined,
    };
    await savePageVersionToDB(v);
    setNewLabel('');
    setIsCreating(false);
    await loadVersions();
  };

  const executeDelete = async (id: string) => {
    await deletePageVersionFromDB(id);
    if (selectedVersionId === id) setSelectedVersionId(null);
    setConfirmDeleteId(null);
    await loadVersions();
  };


  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col" style={{ fontFamily: `'${uiFont}', sans-serif` }}>
      {isCreating ? (
        <div className="p-4 mb-4 rounded-xl border shadow-sm animate-fade-in-up" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <h4 className="text-sm font-medium mb-2" style={{ color: theme.text }}>{t(lang, 'createSnapshot') || 'Create Snapshot'}</h4>
          <input
            type="text"
            placeholder={t(lang, 'snapshotLabelPlaceholder') || 'E.g., Before rewrite...'}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full bg-transparent border-b outline-none px-1 py-1 text-sm mb-3"
            style={{ borderColor: theme.borderFaint, color: theme.text }}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSnapshot()}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: theme.text }}
            >
              {t(lang, 'cancel')}
            </button>
            <button
              onClick={handleCreateSnapshot}
              className="px-3 py-1.5 text-xs rounded  font-medium flex items-center gap-1 transition-transform active:scale-95"
              style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.border}` }}
            >
              <Save size={13} />
              {t(lang, 'save')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full py-3 px-4 mb-6 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <Plus size={16} />
          <span>{t(lang, 'createNewSnapshot') || 'Create New Snapshot'}</span>
        </button>
      )}

      <div className="flex-1 flex flex-col gap-2">
        {loading ? (
          <p className="text-center text-sm my-4 opacity-50" style={{ color: theme.text }}>{t(lang, 'loading')}...</p>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-50" style={{ color: theme.text }}>
            <Clock size={32} className="mb-2" />
            <p className="text-sm">{t(lang, 'noVersionsFound') || 'No snapshots yet.'}</p>
          </div>
        ) : (
          versions.map((v) => (
            <div
              key={v.id}
              className="group w-full text-left"
            >
              <div 
                onClick={() => setSelectedVersionId(prev => prev === v.id ? null : v.id)}
                className={`px-4 py-3 rounded-lg border cursor-pointer transition-all ${selectedVersionId === v.id ? 'shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ 
                  borderColor: selectedVersionId === v.id ? theme.text : theme.borderFaint,
                  backgroundColor: selectedVersionId === v.id ? theme.surface : 'transparent'
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium mb-0.5" style={{ color: theme.text }}>{format(new Date(v.timestamp), 'MMM d, yyyy - h:mm a')}</p>
                    {v.label && (
                      <p className="text-xs" style={{ color: theme.textMuted }}>{v.label}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {confirmDeleteId === v.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); executeDelete(v.id); }} className="px-2 py-1 text-xs rounded bg-red-500  hover:bg-red-600 transition-colors">
                          {t(lang, 'delete') || 'Delete'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} className="px-2 py-1 text-xs rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors" style={{ color: theme.text }}>
                          {t(lang, 'cancel') || 'Cancel'}
                        </button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(v.id); }} className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-500/10">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <ChevronRight size={16} className={`transition-transform opacity-50 ${selectedVersionId === v.id ? 'rotate-90' : ''}`} style={{ color: theme.text }} />
                  </div>
                </div>
              </div>

              {selectedVersionId === v.id && (
                <div className="mt-2 mb-4 p-4 rounded-lg border shadow-inner animate-fade-in-up" style={{ background: theme.bg, borderColor: theme.borderFaint }}>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: theme.borderFaint }}>
                    <h5 className="text-xs font-semibold tracking-wider uppercase opacity-60" style={{ color: theme.text }}>{t(lang, 'preview') || 'Preview'}</h5>
                    <button
                      onClick={() => onRestore(v.content, v.title || activePage?.title || 'Restored')}
                      className="px-3 py-1.5 text-xs rounded  font-medium flex items-center gap-1.5 transition-transform active:scale-95"
                      style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.border}` }}
                    >
                      <RotateCcw size={13} />
                      {t(lang, 'restoreThisVersion') || 'Restore'}
                    </button>
                  </div>
                  
                  <div 
                    className="text-sm prose prose-sm max-w-none opacity-80"
                    style={{ maxHeight: '250px', overflowY: 'auto', color: theme.text }}
                    dangerouslySetInnerHTML={{ __html: v.content }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
