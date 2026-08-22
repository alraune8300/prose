import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, GitCompare, RotateCcw, CheckCircle2, 
  Clock, Sparkles, Lock, Unlock, Pilcrow, CornerDownLeft 
} from 'lucide-react';
import * as Diff from 'diff';
import { getPageVersionsFromDB } from './db';
import type { ThemeColors, VersionSnapshot, Lang, Page } from './types';
import { t } from './i18n';
import { format } from 'date-fns';

interface SplitRevisionStudioProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: Page | null;
  theme: ThemeColors;
  lang: Lang;
  uiFont: string;
  docFont: string;
  onUpdateContent: (newContent: string) => void;
}

export default function SplitRevisionStudio({
  isOpen,
  onClose,
  activePage,
  theme,
  lang,
  uiFont,
  docFont,
  onUpdateContent,
}: SplitRevisionStudioProps) {
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<VersionSnapshot | null>(null);
  const [liveText, setLiveText] = useState<string>('');
  const [debouncedLiveText, setDebouncedLiveText] = useState<string>('');
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [hoveredDiffIndex, setHoveredDiffIndex] = useState<number | null>(null);

  // Scroll synchronization refs
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef<boolean>(false);

  const loadSnapshots = useCallback(async () => {
    if (!activePage) return;
    try {
      const vList = await getPageVersionsFromDB(activePage.id);
      const sorted = vList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setVersions(sorted);
      if (sorted.length > 0) {
        setSelectedVersionId(sorted[0].id);
        setSelectedSnapshot(sorted[0]);
      } else {
        setSelectedVersionId(null);
        setSelectedSnapshot(null);
      }
    } catch (e) {
      console.error('Error loading snapshots:', e);
    }

    if (activePage.content) {
      const plain = activePage.content.replace(/<[^>]*>/g, (match) => {
        if (match === '<br>' || match === '<br/>' || match === '</p>') return '\n';
        return '';
      }).replace(/&nbsp;/g, ' ');
      setLiveText(plain);
      setDebouncedLiveText(plain);
    }
  }, [activePage]);

  // Load versions on open
  useEffect(() => {
    if (isOpen && activePage) {
      loadSnapshots();
    }
  }, [isOpen, activePage, loadSnapshots]);

  // Handle snapshot selection change
  useEffect(() => {
    if (selectedVersionId) {
      const found = versions.find(v => v.id === selectedVersionId);
      if (found) {
        const plainSnap = found.content.replace(/<[^>]*>/g, (match) => {
          if (match === '<br>' || match === '<br/>' || match === '</p>') return '\n';
          return '';
        }).replace(/&nbsp;/g, ' ');
        setSelectedSnapshot({ ...found, content: plainSnap });
      }
    }
  }, [selectedVersionId, versions]);

  // Debounce live text for Diff engine (100ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLiveText(liveText);
    }, 100);
    return () => clearTimeout(timer);
  }, [liveText]);

  // Synchronized scrolling handlers
  const handleScrollLeft = () => {
    if (!syncScroll || isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (leftColRef.current && rightColRef.current) {
      rightColRef.current.scrollTop = leftColRef.current.scrollTop;
    }
    setTimeout(() => { isSyncingScroll.current = false; }, 50);
  };

  const handleScrollRight = () => {
    if (!syncScroll || isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (leftColRef.current && rightColRef.current) {
      leftColRef.current.scrollTop = rightColRef.current.scrollTop;
    }
    setTimeout(() => { isSyncingScroll.current = false; }, 50);
  };

  // Compute Diff using 'diff' package
  const snapshotContent = selectedSnapshot ? selectedSnapshot.content : '';
  const diffParts = Diff.diffWords(snapshotContent, debouncedLiveText, { ignoreWhitespace: false });

  // Global actions
  const handleAcceptAll = () => {
    const htmlFormatted = debouncedLiveText
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
      .join('');
    onUpdateContent(htmlFormatted);
    onClose();
  };

  const handleRevertToSnapshot = () => {
    if (selectedSnapshot) {
      onUpdateContent(selectedSnapshot.content);
      onClose();
    }
  };

  const handleRestoreChunk = (chunkText: string) => {
    setLiveText(prev => prev.replace(chunkText, ''));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col backdrop-blur-md animate-fade-in"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        fontFamily: `'${uiFont}', sans-serif`,
        color: theme.text 
      }}
    >
      {/* Studio Header */}
      <div 
        className="flex items-center justify-between px-8 py-4 border-b shadow-md"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: theme.accentLight, color: theme.accent }}>
            <GitCompare size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2.5">
              <span>{t(lang, 'splitRevisionStudio') || 'Split Revision Studio'}</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold shadow-xs" style={{ backgroundColor: theme.accentLight, color: theme.accent }}>
                Live Diff & Revisions
              </span>
            </h2>
            <p className="text-xs opacity-75 mt-0.5">
              {activePage?.title || 'Untitled'} • Compare live writing against saved snapshot milestones
            </p>
          </div>
        </div>

        {/* Snapshot Selector & Global Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border" style={{ borderColor: theme.border }}>
            <span className="text-xs font-semibold opacity-75 flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-400" /> Snapshot:
            </span>
            <select
              value={selectedVersionId || ''}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="text-xs font-medium px-2 py-1 rounded-lg bg-transparent outline-none cursor-pointer transition-colors"
              style={{ color: theme.text }}
            >
              {versions.length === 0 ? (
                <option value="">No snapshots found</option>
              ) : (
                versions.map(v => (
                  <option key={v.id} value={v.id} style={{ backgroundColor: theme.surface, color: theme.text }}>
                    {v.label ? `${v.label} (${format(new Date(v.timestamp), 'MMM d, HH:mm')})` : format(new Date(v.timestamp), 'PPpp')}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="h-6 w-[1px]" style={{ backgroundColor: theme.border }} />

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRevertToSnapshot}
              disabled={!selectedSnapshot}
              className="px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 shadow-xs"
              style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }}
              title="Revert entire draft to selected snapshot"
            >
              <RotateCcw size={14} />
              <span>{t(lang, 'revertToSnapshot') || 'Revert to Snapshot'}</span>
            </button>

            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md hover:opacity-95 active:scale-95"
              style={{ backgroundColor: theme.accent }}
              title="Accept all changes and apply as main draft"
            >
              <CheckCircle2 size={14} />
              <span>{t(lang, 'acceptAllChanges') || 'Accept All Changes'}</span>
            </button>
          </div>

          <div className="h-6 w-[1px]" style={{ backgroundColor: theme.border }} />

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl transition-all hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: theme.text }}
            title="Close Studio"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Polished Legend & Sync Scroll Bar */}
      <div 
        className="flex items-center justify-between px-8 py-2.5 border-b text-xs shadow-xs"
        style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.textMuted }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-rose-500 animate-pulse shadow-sm" />
            <span className="line-through text-rose-500 dark:text-rose-400 font-semibold">Deleted / Modified Text (Baseline)</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-emerald-500 animate-pulse shadow-sm" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Added / New Text (Live Editor)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSyncScroll(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-xs"
            style={{ 
              borderColor: syncScroll ? theme.accent : theme.border,
              backgroundColor: syncScroll ? theme.accentLight : 'transparent',
              color: syncScroll ? theme.accent : theme.text 
            }}
          >
            {syncScroll ? <Lock size={13} /> : <Unlock size={13} />}
            <span>{t(lang, 'syncScroll') || 'Sync Scroll'}</span>
          </button>
        </div>
      </div>

      {/* Split Columns Container */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6" style={{ backgroundColor: theme.background }}>
        
        {/* Left Column: Snapshot Baseline Panel */}
        <div 
          className="flex-1 flex flex-col rounded-2xl border shadow-lg overflow-hidden"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <div className="flex items-center justify-between px-6 py-3.5 border-b" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.text }}>
              <Clock size={15} style={{ color: theme.accent }} />
              <span>{t(lang, 'snapshotBaseline') || 'Snapshot Baseline'}</span>
              {selectedSnapshot && (
                <span className="text-[11px] font-normal normal-case opacity-70">
                  ({format(new Date(selectedSnapshot.timestamp), 'PPpp')})
                </span>
              )}
            </h3>
            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-semibold">
              Baseline View
            </span>
          </div>           <div 
            ref={leftColRef}
            onScroll={handleScrollLeft}
            className="flex-1 overflow-y-auto p-6 whitespace-pre-wrap leading-relaxed text-base select-text"
            style={{ fontFamily: `'${docFont}', Georgia, serif`, color: theme.text }}
          >
            {!selectedSnapshot ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50 p-8">
                <p className="text-sm">{t(lang, 'noSnapshotsForDiff') || 'No snapshots available for this page yet. Create a snapshot first!'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {diffParts.map((part, idx) => {
                  if (part.removed) {
                    return (
                      <span
                        key={idx}
                        onMouseEnter={() => setHoveredDiffIndex(idx)}
                        onMouseLeave={() => setHoveredDiffIndex(null)}
                        className="relative group inline-block line-through text-rose-600 dark:text-rose-300 bg-rose-500/15 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-md mx-0.5 transition-all shadow-xs"
                      >
                        {part.value}
                        {hoveredDiffIndex === idx && (
                          <span className="absolute -top-8 left-0 z-20 hidden group-hover:flex items-center gap-1.5 bg-black/90 text-white text-[11px] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap">
                            <button onClick={() => handleRestoreChunk(part.value)} className="hover:underline text-rose-300 font-medium flex items-center gap-1">
                              <CornerDownLeft size={12} /> [Restore to Draft]
                            </button>
                          </span>
                        )}
                      </span>
                    );
                  } else if (part.added) {
                    return (
                      <span
                        key={idx}
                        className="inline-block text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md font-medium mx-0.5 shadow-xs"
                      >
                        {part.value}
                      </span>
                    );
                  } else {
                    return <span key={idx}>{part.value}</span>;
                  }
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Active Editor (Clean Textarea) */}
        <div 
          className="flex-1 flex flex-col rounded-2xl border shadow-lg overflow-hidden relative"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <div className="flex items-center justify-between px-6 py-3.5 border-b" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: theme.text }}>
              <Sparkles size={15} style={{ color: theme.accent }} />
              <span>{t(lang, 'liveActiveEditor') || 'Live Active Editor'}</span>
            </h3>
            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              Editable & Live
            </span>
          </div>

          <div className="flex-1 relative flex flex-col overflow-hidden">
            <div 
              ref={rightColRef}
              onScroll={handleScrollRight}
              className="flex-1 overflow-y-auto p-6 relative flex flex-col"
            >
              {/* Foreground clean textarea for 100% native typing and cursor handling */}
              <textarea
                value={liveText}
                onChange={(e) => setLiveText(e.target.value)}
                placeholder="Start typing or editing your document here..."
                className="w-full h-full bg-transparent resize-none outline-none leading-relaxed text-base relative z-10 selection:bg-emerald-500/30 flex-1"
                style={{ 
                  fontFamily: `'${docFont}', Georgia, serif`, 
                  color: theme.text,
                  caretColor: theme.accent
                }}
                autoFocus
              />
            </div>

            {/* Bottom Status bar */}
            <div className="px-6 py-3 border-t flex items-center justify-between text-xs opacity-75" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
              <span className="font-medium">Live character count: {liveText.length}</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Pilcrow size={13} className="text-emerald-500" /> Auto-diffing active (100ms)
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
