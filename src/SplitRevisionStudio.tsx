import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, GitCompare, RotateCcw, CheckCircle2, 
  Clock, Sparkles, Lock, Unlock, Pilcrow, CornerDownLeft,
  Code, FileText, Hash, Quote as QuoteIcon
} from 'lucide-react';
import * as Diff from 'diff';
import { getPageVersionsFromDB } from './db';
import type { ThemeColors, VersionSnapshot, Lang, Page } from './types';
import { t } from './i18n';
import { format } from 'date-fns';
import { CustomSelect } from './CustomSelect';
import { convertHtmlToMarkdown, parseMarkdownToHtml } from './clipboardEngine';

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

type DiffMode = 'visual' | 'markdown';

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
  const [diffMode, setDiffMode] = useState<DiffMode>('visual');
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<(VersionSnapshot & { rawHtml?: string }) | null>(null);
  const [liveText, setLiveText] = useState<string>('');
  const [debouncedLiveText, setDebouncedLiveText] = useState<string>('');
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [diffParts, setDiffParts] = useState<import("diff").Change[]>([]);
  const [isDiffing, setIsDiffing] = useState(false);

  // Scroll synchronization refs
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef<boolean>(false);
  const initialLiveTextRef = useRef<string>("");

  const getCleanContent = useCallback((html: string, mode: DiffMode) => {
    if (!html) return '';
    if (mode === 'markdown') {
      return convertHtmlToMarkdown(html);
    }
    return html.replace(/<[^>]*>/g, (match) => {
      if (match === '<br>' || match === '<br/>' || match === '</p>') return '\n';
      return '';
    }).replace(/&nbsp;/g, ' ');
  }, []);

  const loadSnapshots = useCallback(async () => {
    if (!activePage) return;
    try {
      const vList = await getPageVersionsFromDB(activePage.id);
      const sorted = vList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setVersions(sorted);
      if (sorted.length > 0) {
        setSelectedVersionId(sorted[0].id);
        const plainSnap = getCleanContent(sorted[0].content, diffMode);
        setSelectedSnapshot({ ...sorted[0], content: plainSnap, rawHtml: sorted[0].content });
      } else {
        setSelectedVersionId(null);
        setSelectedSnapshot(null);
      }
    } catch (e) {
      console.error('Error loading snapshots:', e);
    }

    if (activePage.content) {
      const current = getCleanContent(activePage.content, diffMode);
      setLiveText(current);
      setDebouncedLiveText(current);
      initialLiveTextRef.current = current;
    }
  }, [activePage, diffMode, getCleanContent]);

  // Load versions on open or mode change
  useEffect(() => {
    if (isOpen && activePage) {
      loadSnapshots();
    }
  }, [isOpen, activePage, diffMode, loadSnapshots]);

  // Handle snapshot selection change
  useEffect(() => {
    if (selectedVersionId) {
      const found = versions.find(v => v.id === selectedVersionId);
      if (found) {
        const plainSnap = getCleanContent(found.content, diffMode);
        setSelectedSnapshot({ ...found, content: plainSnap, rawHtml: found.content });
      }
    }
  }, [selectedVersionId, versions, diffMode, getCleanContent]);

  // Debounce live text for Diff engine (100ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLiveText(liveText);
    }, 300);
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

  // Compute Diff using 'diff' package asynchronously to prevent UI freeze
  const snapshotContent = selectedSnapshot ? selectedSnapshot.content : '';
  useEffect(() => {
    setIsDiffing(true);
    const timer = setTimeout(() => {
      const parts = Diff.diffWordsWithSpace(snapshotContent, debouncedLiveText);
      setDiffParts(parts);
      setIsDiffing(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [snapshotContent, debouncedLiveText]);

  // Global actions
  const handleAcceptAll = () => {
    // If no changes were made to the live text, just close to preserve rich HTML formatting
    if (debouncedLiveText === initialLiveTextRef.current) {
      onClose();
      return;
    }

    let finalHtml = '';
    if (diffMode === 'markdown') {
      finalHtml = parseMarkdownToHtml(debouncedLiveText);
    } else {
      finalHtml = debouncedLiveText
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
        .join('');
    }
    onUpdateContent(finalHtml);
    onClose();
  };

  const handleRevertToSnapshot = () => {
    if (selectedSnapshot && selectedSnapshot.rawHtml) {
      onUpdateContent(selectedSnapshot.rawHtml);
      onClose();
    } else if (selectedSnapshot) {
      onUpdateContent(selectedSnapshot.content);
      onClose();
    }
  };

  const handleRestoreChunk = (chunkText: string) => {
    setLiveText(prev => prev + '\n' + chunkText);
  };

  // Markdown syntax token decorator
  const renderMarkdownSyntaxTokens = (text: string) => {
    if (diffMode !== 'markdown') return text;

    // Tokenize markdown syntax pieces
    const parts = text.split(/(#{1,6}\s|\*{2}|_{2}|\*{1}|_{1}|`{1,3}|>\s|^-\s|^\*\s|^\d+\.\s|\|)/gm);
    return parts.map((part, pIdx) => {
      if (/^#{1,6}\s$/.test(part)) {
        const level = part.trim().length;
        return (
          <span
            key={pIdx}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-mono text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 mx-0.5"
            title={`Heading H${level} syntax symbol`}
          >
            <Hash size={10} /> H{level}
          </span>
        );
      }
      if (part === '**' || part === '__') {
        return (
          <span
            key={pIdx}
            className="font-mono text-xs font-extrabold text-sky-600 dark:text-sky-400 bg-sky-500/15 px-1 py-0.2 rounded"
            title="Bold syntax marker"
          >
            {part}
          </span>
        );
      }
      if (part === '*' || part === '_') {
        return (
          <span
            key={pIdx}
            className="font-mono text-xs italic font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/15 px-1 py-0.2 rounded"
            title="Italic syntax marker"
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('`')) {
        return (
          <span
            key={pIdx}
            className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1 py-0.2 rounded"
            title="Code token"
          >
            {part}
          </span>
        );
      }
      if (part === '> ') {
        return (
          <span
            key={pIdx}
            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded font-mono text-xs font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 mx-0.5"
            title="Blockquote symbol"
          >
            <QuoteIcon size={10} /> &gt;
          </span>
        );
      }
      if (part === '|' || part.includes('|')) {
        return (
          <span
            key={pIdx}
            className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-1 py-0.2 rounded"
            title="Table grid separator"
          >
            |
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col backdrop-blur-md transition-all duration-300 ease-in-out"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        fontFamily: `'${uiFont}', sans-serif`,
        color: theme.text,
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        visibility: isOpen ? 'visible' : 'hidden'
      }}
    >
      {/* Studio Header */}
      <div 
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center opacity-70" style={{ color: theme.text }}>
            <GitCompare size={20} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
              <span className="truncate" style={{ color: theme.text }}>{t(lang, 'splitRevisionStudio') || 'Split Revision Studio'}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest font-bold" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: theme.textMuted }}>
                {t(lang, 'liveDiffAndRevisions') || 'Live Diff & Revisions'}
              </span>
            </h2>
            <p className="text-[11px] opacity-60 mt-0.5" style={{ color: theme.text }}>
              {activePage?.title || 'Untitled'} • {diffMode === 'markdown' ? (lang === 'vi' ? 'Bộ so sánh ký hiệu Markdown trực tiếp' : 'Live Markdown token diff & syntax inspector') : (t(lang, 'compareLiveWriting') || 'Compare live writing against saved snapshot milestones')}
            </p>
          </div>
        </div>

        {/* Mode Switcher, Snapshot Selector & Global Actions */}
        <div className="flex items-center gap-4">
          {/* Visual vs Markdown Diff Switcher */}
          <div className="flex items-center p-0.5 rounded-md border gap-0.5" style={{ borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
            <button
              type="button"
              onClick={() => setDiffMode('visual')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-all"
              style={{
                backgroundColor: diffMode === 'visual' ? theme.surface : 'transparent',
                color: diffMode === 'visual' ? theme.text : theme.textMuted,
                boxShadow: diffMode === 'visual' ? (theme.isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)') : 'none',
              }}
              title="Visual Diff"
            >
              <FileText size={12} />
              <span>{lang === 'vi' ? 'Bản in' : 'Visual Diff'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDiffMode('markdown')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-all"
              style={{
                backgroundColor: diffMode === 'markdown' ? theme.surface : 'transparent',
                color: diffMode === 'markdown' ? theme.text : theme.textMuted,
                boxShadow: diffMode === 'markdown' ? (theme.isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)') : 'none',
              }}
              title="Markdown Diff"
            >
              <Code size={12} />
              <span>{lang === 'vi' ? 'Cú pháp' : 'Markdown Diff'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium flex items-center gap-1 shrink-0" style={{ color: theme.textMuted }}>
              <Clock size={12} /> {t(lang, 'snapshotLabel') || 'Snapshot:'}
            </span>
            <CustomSelect
              value={selectedVersionId || ''}
              onChange={(val) => setSelectedVersionId(val)}
              theme={theme}
              options={
                versions.length === 0
                  ? [{ value: '', label: t(lang, 'noSnapshotsFound') || 'No snapshots found' }]
                  : versions.map(v => ({
                      value: v.id,
                      label: v.label ? `${v.label} (${format(new Date(v.timestamp), 'MMM d, HH:mm')})` : format(new Date(v.timestamp), 'PPpp')
                    }))
              }
              buttonClassName="text-[11px] font-medium px-2 py-1 rounded-md border outline-none cursor-pointer flex items-center justify-between gap-1.5 transition-colors min-w-[140px]"
              buttonStyle={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }}
            />
          </div>

          <div className="h-4 w-[1px]" style={{ backgroundColor: theme.border }} />

          <div className="flex items-center gap-2">
            <button
              onClick={handleRevertToSnapshot}
              disabled={!selectedSnapshot}
              className="px-3 py-1.5 rounded-md text-[11px] font-medium border flex items-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
              style={{ borderColor: theme.border, color: theme.text, backgroundColor: 'transparent' }}
              title="Revert entire draft to selected snapshot"
            >
              <RotateCcw size={12} />
              <span>{t(lang, 'revertToSnapshot') || 'Revert to Snapshot'}</span>
            </button>

            <button
              onClick={handleAcceptAll}
              className="px-3 py-1.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors hover:opacity-90 active:scale-95 shadow-sm"
              style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.border}` }}
              title="Accept all changes and apply as main draft"
            >
              <CheckCircle2 size={12} />
              <span>{t(lang, 'acceptAllChanges') || 'Accept All Changes'}</span>
            </button>
          </div>

          <div className="h-4 w-[1px]" style={{ backgroundColor: theme.border }} />

          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: theme.textMuted }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      
      <div className="flex items-center justify-between px-6 py-1.5 border-b text-[11px]" style={{ backgroundColor: theme.background, borderColor: theme.border }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" style={{ color: theme.textMuted }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
            <span>{diffParts.filter(p => p.added).length} {lang === 'vi' ? 'cụm từ thêm mới' : 'additions'}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: theme.textMuted }}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/70" />
            <span>{diffParts.filter(p => p.removed).length} {lang === 'vi' ? 'cụm từ bị xóa' : 'deletions'}</span>
          </div>
          {diffMode === 'markdown' && (
            <div className="flex items-center gap-1.5 ml-2 opacity-70" style={{ color: theme.textMuted }}>
              <Hash size={11} />
              <span>{lang === 'vi' ? 'Hiển thị ký hiệu cú pháp Markdown' : 'Markdown syntax symbols'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSyncScroll(prev => !prev)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-medium transition-colors"
            style={{ 
              borderColor: syncScroll ? theme.border : 'transparent',
              backgroundColor: syncScroll ? (theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent',
              color: syncScroll ? theme.text : theme.textMuted 
            }}
          >
            {syncScroll ? <Lock size={11} /> : <Unlock size={11} />}
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
          <div className="flex items-center justify-between px-5 py-2 border-b" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: theme.textMuted }}>
              <Clock size={13} />
              <span>{t(lang, 'snapshotBaseline') || 'Snapshot Baseline'}</span>
              {selectedSnapshot && (
                <span className="text-[10px] font-medium normal-case opacity-60">
                  ({format(new Date(selectedSnapshot.timestamp), 'PPpp')})
                </span>
              )}
            </h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest" style={{ color: theme.textMuted, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              {diffMode === 'markdown' ? 'Markdown' : (t(lang, 'baselineView') || 'Baseline')}
            </span>
          </div>
          
          <div 
            ref={leftColRef}
            onScroll={handleScrollLeft}
            className="flex-1 overflow-y-auto p-6 whitespace-pre-wrap leading-relaxed text-base select-text"
            style={{
              fontFamily: diffMode === 'markdown' ? 'JetBrains Mono, monospace' : `'${docFont}', Georgia, serif`,
              color: theme.text,
              fontSize: diffMode === 'markdown' ? '14px' : '16px',
            }}
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
                        
                        
                        className="relative group inline-block line-through text-rose-600 dark:text-rose-300 bg-rose-500/15 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-md mx-0.5 transition-all shadow-xs"
                      >
                        {renderMarkdownSyntaxTokens(part.value)}
                        
                          <span className="absolute -top-8 left-0 z-20 hidden group-hover:flex items-center gap-1.5 bg-black/90 text-white text-[11px] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap">
                            <button onClick={() => handleRestoreChunk(part.value)} className="hover:underline text-rose-300 font-medium flex items-center gap-1">
                              <CornerDownLeft size={12} /> [{lang === 'vi' ? 'Khôi phục vào bản soạn' : 'Restore to Draft'}]
                            </button>
                          </span>
                      </span>
                    );
                  } else if (part.added) {
                    return (
                      <span
                        key={idx}
                        className="inline-block text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md font-medium mx-0.5 shadow-xs"
                      >
                        {renderMarkdownSyntaxTokens(part.value)}
                      </span>
                    );
                  } else {
                    return <span key={idx}>{renderMarkdownSyntaxTokens(part.value)}</span>;
                  }
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Active Editor */}
        <div 
          className="flex-1 flex flex-col rounded-2xl border shadow-lg overflow-hidden relative"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <div className="flex items-center justify-between px-5 py-2 border-b" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: theme.textMuted }}>
              <Sparkles size={13} />
              <span>{diffMode === 'markdown' ? (lang === 'vi' ? 'Trình sửa Markdown trực tiếp' : 'Live Markdown Editor') : (t(lang, 'liveActiveEditor') || 'Live Active Editor')}</span>
            </h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest" style={{ color: theme.textMuted, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              {diffMode === 'markdown' ? 'Buffer' : (t(lang, 'editableAndLive') || 'Live')}
            </span>
          </div>

          <div className="flex-1 relative flex flex-col overflow-hidden">
            <div 
              ref={rightColRef}
              onScroll={handleScrollRight}
              className="flex-1 overflow-y-auto p-6 relative flex flex-col"
            >
              {/* Foreground clean textarea for native typing and cursor handling */}
              <textarea
                value={liveText}
                onChange={(e) => setLiveText(e.target.value)}
                placeholder={diffMode === 'markdown' ? (lang === 'vi' ? 'Nhập mã Markdown tại đây (# Tiêu đề, **In đậm**, > Trích dẫn)...' : 'Type Markdown syntax here (# Heading, **Bold**, > Quote)...') : (t(lang, 'startTypingPlaceholder') || 'Start typing or editing your document here...')}
                className="w-full h-full bg-transparent resize-none outline-none leading-relaxed relative z-10 selection:bg-emerald-500/30 flex-1"
                style={{ 
                  fontFamily: diffMode === 'markdown' ? 'JetBrains Mono, monospace' : `'${docFont}', Georgia, serif`, 
                  color: theme.text,
                  caretColor: theme.accent,
                  fontSize: diffMode === 'markdown' ? '14px' : '16px',
                }}
                autoFocus
              />
            </div>

            {/* Bottom Status bar */}
            <div className="px-5 py-2 border-t flex items-center justify-between text-[10px] opacity-70" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
              <span className="font-medium" style={{ color: theme.text }}>{t(lang, 'liveCharacterCount') || 'Live character count:'} {liveText.length}</span>
              <span className="flex items-center gap-1 font-mono" style={{ color: theme.text }}>
                <Pilcrow size={11} /> {t(lang, 'autoDiffingActive') || 'Auto-diffing active (100ms)'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

