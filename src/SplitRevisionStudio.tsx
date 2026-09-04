import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, RotateCcw, CheckCircle2, 
  Clock, Sparkles, Lock, Unlock, Pilcrow, CornerDownLeft,
  Code, FileText, GitCompare, ChevronDown, Layers, FileCode
} from 'lucide-react';
import * as Diff from 'diff';
import { getPageVersionsFromDB } from './db';
import type { ThemeColors, VersionSnapshot, Lang, Page, Project } from './types';
import { t } from './i18n';
import { format } from 'date-fns';
import { CustomSelect } from './CustomSelect';
import { convertHtmlToMarkdown, parseMarkdownToHtml } from './clipboardEngine';

interface SplitRevisionStudioProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: Page | null;
  activeProject?: Project | null;
  theme: ThemeColors;
  lang: Lang;
  uiFont: string;
  docFont: string;
  onUpdateContent: (newContent: string) => void;
}

type DiffMode = 'visual' | 'markdown';
type CompareSource = 'snapshot' | 'draft-vs-draft' | 'draft-vs-main';

export default function SplitRevisionStudio({
  isOpen,
  onClose,
  activePage,
  activeProject,
  theme,
  lang,
  docFont,
  onUpdateContent,
}: SplitRevisionStudioProps) {
  const [diffMode, setDiffMode] = useState<DiffMode>('visual');
  const [compareSource, setCompareSource] = useState<CompareSource>('snapshot');
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null); // Right file or snapshot
  const [selectedLeftTargetId, setSelectedLeftTargetId] = useState<string | null>(null); // Left file for file-vs-file
  const [baselineData, setBaselineData] = useState<{ id: string; title: string; content: string; rawHtml?: string; timestamp?: string } | null>(null);
  
  const [liveText, setLiveText] = useState<string>(''); // Right text
  const [leftText, setLeftText] = useState<string>(''); // Left text for file vs file
  const [debouncedLiveText, setDebouncedLiveText] = useState<string>('');
  const [debouncedLeftText, setDebouncedLeftText] = useState<string>('');
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [diffParts, setDiffParts] = useState<import("diff").Change[]>([]);

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

  const truncateTitle = (title: string, maxWords = 2) => {
    if (!title) return 'Draft';
    const words = title.trim().split(/\s+/);
    if (words.length <= maxWords) return title;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const getLeftTargetOptions = () => {
    if (compareSource === 'draft-vs-draft') {
      const drafts = activeProject?.drafts || [];
      if (drafts.length === 0) return [{ value: '', label: lang === 'vi' ? 'Không có bản nháp' : 'No drafts' }];
      return drafts.map(d => ({ value: d.id, label: truncateTitle(d.title || 'Untitled Draft', 5) }));
    } else if (compareSource === 'draft-vs-main') {
      const mainPages = activeProject?.pages || [];
      if (mainPages.length === 0) return [{ value: '', label: lang === 'vi' ? 'Không có file chính' : 'No main files' }];
      return mainPages.map(p => ({ value: p.id, label: truncateTitle(p.title || 'Untitled Page', 5) }));
    }
    return [];
  };

  const getRightTargetOptions = () => {
    if (compareSource === 'snapshot') {
      if (versions.length === 0) return [{ value: '', label: t(lang, 'noSnapshotsFound') || 'No snapshots found' }];
      return versions.map(v => ({
        value: v.id,
        label: v.label ? `${truncateTitle(v.label, 3)} (${format(new Date(v.timestamp), 'MMM d, HH:mm')})` : format(new Date(v.timestamp), 'PPpp')
      }));
    } else if (compareSource === 'draft-vs-draft') {
      const drafts = (activeProject?.drafts || []).filter(d => d.id !== selectedLeftTargetId);
      if (drafts.length === 0) return [{ value: '', label: lang === 'vi' ? 'Không có bản nháp khác' : 'No other drafts' }];
      return drafts.map(d => ({ value: d.id, label: truncateTitle(d.title || 'Untitled Draft', 5) }));
    } else if (compareSource === 'draft-vs-main') {
      const drafts = activeProject?.drafts || [];
      if (drafts.length === 0) return [{ value: '', label: lang === 'vi' ? 'Không có bản nháp' : 'No drafts' }];
      return drafts.map(d => ({ value: d.id, label: truncateTitle(d.title || 'Untitled Draft', 5) }));
    }
    return [];
  };

  // Load content when modal opens or compareSource changes
  useEffect(() => {
    if (!isOpen || !activePage) return;

    if (compareSource === 'snapshot') {
      if (activePage.content) {
        const current = getCleanContent(activePage.content, diffMode);
        setLiveText(current);
        setDebouncedLiveText(current);
        initialLiveTextRef.current = current;
      }
      getPageVersionsFromDB(activePage.id).then(vList => {
        const sorted = vList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setVersions(sorted);
        if (sorted.length > 0) {
          const targetId = (selectedTargetId && sorted.some(v => v.id === selectedTargetId)) ? selectedTargetId : sorted[0].id;
          setSelectedTargetId(targetId);
          const found = sorted.find(v => v.id === targetId) || sorted[0];
          const plainSnap = getCleanContent(found.content, diffMode);
          setBaselineData({
            id: found.id,
            title: found.label || 'Snapshot',
            content: plainSnap,
            rawHtml: found.content,
            timestamp: found.timestamp
          });
        } else {
          setSelectedTargetId(null);
          setBaselineData(null);
        }
      }).catch(e => console.error('Error loading snapshots:', e));
    } else if (compareSource === 'draft-vs-draft') {
      const drafts = activeProject?.drafts || [];
      if (drafts.length === 0) {
        setLeftText('');
        setLiveText('');
        setSelectedLeftTargetId(null);
        setSelectedTargetId(null);
        return;
      }
      const leftId = selectedLeftTargetId && drafts.some(d => d.id === selectedLeftTargetId)
        ? selectedLeftTargetId
        : drafts[0].id;
      if (leftId !== selectedLeftTargetId) setSelectedLeftTargetId(leftId);

      const foundLeft = drafts.find(d => d.id === leftId);
      if (foundLeft) {
        const leftPlain = getCleanContent(foundLeft.content || '', diffMode);
        setLeftText(leftPlain);
        setDebouncedLeftText(leftPlain);
      }

      const remainingDrafts = drafts.filter(d => d.id !== leftId);
      if (remainingDrafts.length === 0) {
        setSelectedTargetId(null);
        setLiveText('');
        setDebouncedLiveText('');
      } else {
        const rightId = selectedTargetId && remainingDrafts.some(d => d.id === selectedTargetId)
          ? selectedTargetId
          : remainingDrafts[0].id;
        if (rightId !== selectedTargetId) setSelectedTargetId(rightId);

        const foundRight = drafts.find(d => d.id === rightId);
        if (foundRight) {
          const rightPlain = getCleanContent(foundRight.content || '', diffMode);
          setLiveText(rightPlain);
          setDebouncedLiveText(rightPlain);
          initialLiveTextRef.current = rightPlain;
        }
      }
    } else if (compareSource === 'draft-vs-main') {
      const mainPages = activeProject?.pages || [];
      const defaultMainId = activePage.originalPageId && mainPages.some(p => p.id === activePage.originalPageId)
        ? activePage.originalPageId
        : mainPages[0]?.id;
      const leftId = selectedLeftTargetId && mainPages.some(p => p.id === selectedLeftTargetId)
        ? selectedLeftTargetId
        : defaultMainId;
      if (leftId !== selectedLeftTargetId) setSelectedLeftTargetId(leftId);

      const foundMain = mainPages.find(p => p.id === leftId);
      if (foundMain) {
        const leftPlain = getCleanContent(foundMain.content || '', diffMode);
        setLeftText(leftPlain);
        setDebouncedLeftText(leftPlain);
      }

      const drafts = activeProject?.drafts || [];
      const rightId = selectedTargetId && drafts.some(d => d.id === selectedTargetId)
        ? selectedTargetId
        : activePage.id;
      if (rightId !== selectedTargetId) setSelectedTargetId(rightId);

      const foundDraft = drafts.find(d => d.id === rightId) || activePage;
      const rightPlain = getCleanContent(foundDraft.content || '', diffMode);
      setLiveText(rightPlain);
      setDebouncedLiveText(rightPlain);
      initialLiveTextRef.current = rightPlain;
    }
  }, [isOpen, activePage, compareSource, selectedLeftTargetId, selectedTargetId, activeProject, diffMode, getCleanContent]);

  // Handle snapshot selection change
  useEffect(() => {
    if (compareSource === 'snapshot' && selectedTargetId) {
      const found = versions.find(v => v.id === selectedTargetId);
      if (found) {
        const plainSnap = getCleanContent(found.content, diffMode);
        setBaselineData({ id: found.id, title: found.label || 'Snapshot', content: plainSnap, rawHtml: found.content, timestamp: found.timestamp });
      }
    }
  }, [selectedTargetId, compareSource, versions, diffMode, getCleanContent]);

  // Handle left file change for file-vs-file
  useEffect(() => {
    if (compareSource !== 'snapshot' && selectedLeftTargetId) {
      if (compareSource === 'draft-vs-draft') {
        const found = (activeProject?.drafts || []).find(d => d.id === selectedLeftTargetId);
        if (found) {
          const plain = getCleanContent(found.content || '', diffMode);
          setLeftText(plain);
          setDebouncedLeftText(plain);
        }
      } else if (compareSource === 'draft-vs-main') {
        const found = (activeProject?.pages || []).find(p => p.id === selectedLeftTargetId);
        if (found) {
          const plain = getCleanContent(found.content || '', diffMode);
          setLeftText(plain);
          setDebouncedLeftText(plain);
        }
      }
    }
  }, [selectedLeftTargetId, compareSource, activeProject, diffMode, getCleanContent]);

  // Handle right file change for file-vs-file
  useEffect(() => {
    if (compareSource !== 'snapshot' && selectedTargetId) {
      if (compareSource === 'draft-vs-draft') {
        const found = (activeProject?.drafts || []).find(d => d.id === selectedTargetId);
        if (found) {
          const plain = getCleanContent(found.content || '', diffMode);
          setLiveText(plain);
          setDebouncedLiveText(plain);
        }
      } else if (compareSource === 'draft-vs-main') {
        const found = (activeProject?.drafts || []).find(d => d.id === selectedTargetId);
        if (found) {
          const plain = getCleanContent(found.content || '', diffMode);
          setLiveText(plain);
          setDebouncedLiveText(plain);
        }
      }
    }
  }, [selectedTargetId, compareSource, activeProject, diffMode, getCleanContent]);

  // Debounce text states
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLiveText(liveText);
    }, 200);
    return () => clearTimeout(timer);
  }, [liveText]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLeftText(leftText);
    }, 200);
    return () => clearTimeout(timer);
  }, [leftText]);

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

  // Compute Diff using 'diff' package asynchronously
  const compareBaseContent = compareSource === 'snapshot' ? (baselineData?.content || '') : debouncedLeftText;
  useEffect(() => {
    const timer = setTimeout(() => {
      const parts = Diff.diffWordsWithSpace(compareBaseContent, debouncedLiveText);
      setDiffParts(parts);
    }, 0);
    return () => clearTimeout(timer);
  }, [compareBaseContent, debouncedLiveText]);

  // Global actions
  const handleAcceptAll = () => {
    let finalHtml = '';
    if (diffMode === 'markdown') {
      finalHtml = parseMarkdownToHtml(liveText);
    } else {
      finalHtml = liveText
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
        .join('');
    }
    onUpdateContent(finalHtml);
    onClose();
  };

  const handleRevertToSnapshot = () => {
    if (baselineData && baselineData.rawHtml) {
      onUpdateContent(baselineData.rawHtml);
      onClose();
    } else if (baselineData) {
      onUpdateContent(baselineData.content);
      onClose();
    }
  };

  const handleRestoreChunk = (chunkText: string) => {
    setLiveText(prev => prev + '\n' + chunkText);
  };

  // Markdown syntax token decorator
  const renderMarkdownSyntaxTokens = (text: string) => {
    if (diffMode !== 'markdown') return text;
    const parts = text.split(/(#{1,6}\s|\*{2}|_{2}|\*{1}|_{1}|`{1,3}|>\s|^-\s|^\*\s|^\d+\.\s|\|)/gm);
    return parts.map((part, pIdx) => {
      if (!part) return null;
      if (part.match(/^#{1,6}\s/)) {
        return <span key={pIdx} className="text-amber-600 dark:text-amber-400 font-bold">{part}</span>;
      }
      if (part.match(/^\*{2}|_{2}|`{1,3}|\*{1}|_{1}/)) {
        return <span key={pIdx} className="text-indigo-600 dark:text-indigo-400 font-bold">{part}</span>;
      }
      if (part.match(/^>\s|^-\s|^\*\s|^\d+\.\s/)) {
        return <span key={pIdx} className="text-emerald-600 dark:text-emerald-400 font-semibold">{part}</span>;
      }
      return <span key={pIdx}>{part}</span>;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col backdrop-blur-md bg-black/40 animate-in fade-in duration-200">
      {/* Top Toolbar */}
      <div 
        className="flex items-center justify-between px-6 py-3 border-b shadow-md"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
            <GitCompare size={18} style={{ color: theme.accent }} />
          </div>
          <h2 className="text-sm font-bold tracking-tight" style={{ color: theme.text }}>
            {t(lang, 'splitRevisionStudio') || 'Split Revision Studio'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Diff Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border h-8" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
            <button
              type="button"
              onClick={() => setDiffMode('visual')}
              className="flex items-center gap-1.5 px-2.5 h-[26px] rounded-[6px] text-[11px] font-medium transition-all"
              style={{
                backgroundColor: diffMode === 'visual' ? theme.surface : 'transparent',
                color: diffMode === 'visual' ? theme.text : theme.textMuted,
                boxShadow: diffMode === 'visual' ? (theme.isDark ? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.04)') : 'none',
              }}
              title="Visual Diff"
            >
              <FileText size={12} />
              <span>{lang === 'vi' ? 'Bản in' : 'Visual'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDiffMode('markdown')}
              className="flex items-center gap-1.5 px-2.5 h-[26px] rounded-[6px] text-[11px] font-medium transition-all"
              style={{
                backgroundColor: diffMode === 'markdown' ? theme.surface : 'transparent',
                color: diffMode === 'markdown' ? theme.text : theme.textMuted,
                boxShadow: diffMode === 'markdown' ? (theme.isDark ? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.04)') : 'none',
              }}
              title="Markdown Diff"
            >
              <Code size={12} />
              <span>{lang === 'vi' ? 'Cú pháp' : 'Markdown'}</span>
            </button>
          </div>

          {/* Compare Mode Selector */}
          <CustomSelect
            value={compareSource}
            onChange={(val) => {
              setCompareSource(val as CompareSource);
              setSelectedTargetId(null);
              setSelectedLeftTargetId(null);
            }}
            theme={theme}
            disableSearch={true}
            options={[
              { value: 'snapshot', label: 'Snapshot' },
              { value: 'draft-vs-draft', label: 'Draft vs Draft' },
              { value: 'draft-vs-main', label: 'Draft vs Main' },
            ]}
            renderButtonContent={(opt) => (
              <div className="relative flex items-center justify-center w-full px-4">
                <span className="truncate text-center">{opt?.label || compareSource}</span>
                <ChevronDown size={12} className="opacity-50 flex-shrink-0 absolute right-2" />
              </div>
            )}
            buttonClassName="text-[11px] font-medium px-2.5 h-8 rounded-lg border outline-none cursor-pointer flex items-center justify-center transition-colors w-[155px] flex-shrink-0 relative"
            buttonStyle={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }}
          />

          {/* Left Target Selector (if file-vs-file) */}
          {compareSource !== 'snapshot' && (
            <CustomSelect
              value={selectedLeftTargetId || ''}
              onChange={(val) => setSelectedLeftTargetId(val)}
              theme={theme}
              disableSearch={true}
              options={getLeftTargetOptions()}
              renderButtonContent={(opt) => (
                <div className="relative flex items-center justify-center w-full px-4">
                  <span className="truncate text-center">{opt?.label || 'Select'}</span>
                  <ChevronDown size={12} className="opacity-50 flex-shrink-0 absolute right-2" />
                </div>
              )}
              buttonClassName="text-[11px] font-medium px-2.5 h-8 rounded-lg border outline-none cursor-pointer flex items-center justify-center transition-colors w-[155px] flex-shrink-0 relative"
              buttonStyle={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }}
            />
          )}

          {/* Right Target / Snapshot Selector */}
          <CustomSelect
            value={selectedTargetId || ''}
            onChange={(val) => setSelectedTargetId(val)}
            theme={theme}
            disableSearch={true}
            options={getRightTargetOptions()}
            renderButtonContent={(opt) => (
              <div className="relative flex items-center justify-center w-full px-4">
                <span className="truncate text-center">{opt?.label || 'Select'}</span>
                <ChevronDown size={12} className="opacity-50 flex-shrink-0 absolute right-2" />
              </div>
            )}
            buttonClassName="text-[11px] font-medium px-2.5 h-8 rounded-lg border outline-none cursor-pointer flex items-center justify-center transition-colors w-[155px] flex-shrink-0 relative"
            buttonStyle={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }}
          />

          <div className="h-4 w-[1px] mx-0.5" style={{ backgroundColor: theme.border }} />

          {compareSource === 'snapshot' && (
            <button
              onClick={handleRevertToSnapshot}
              disabled={!baselineData}
              className="px-2.5 h-8 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
              style={{ borderColor: theme.border, color: theme.text, backgroundColor: 'transparent' }}
              title="Revert entire draft to selected snapshot"
            >
              <RotateCcw size={12} />
              <span>{t(lang, 'revertToSnapshot') || 'Revert'}</span>
            </button>
          )}

          <button
            onClick={handleAcceptAll}
            className="px-3 h-8 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors hover:opacity-90 active:scale-95 shadow-xs"
            style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.border}` }}
            title="Accept all changes and apply"
          >
            <CheckCircle2 size={12} />
            <span>{t(lang, 'acceptAllChanges') || 'Save'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5 ml-1"
            style={{ color: theme.textMuted }}
          >
            <X size={15} />
          </button>
        </div>
      </div>
      
      {/* Status Bar */}
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
        
        {/* Left Column: Snapshot Baseline OR Editable Left File */}
        <div 
          className="flex-1 flex flex-col rounded-2xl border shadow-lg overflow-hidden"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <div className="flex items-center justify-between px-5 py-2 border-b" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: theme.textMuted }}>
              <Clock size={13} />
              <span>
                {compareSource === 'snapshot' 
                  ? (t(lang, 'snapshotBaseline') || 'Snapshot Baseline') 
                  : compareSource === 'draft-vs-draft' 
                    ? truncateTitle(activeProject?.drafts?.find(d => d.id === selectedLeftTargetId)?.title || 'Draft', 2) 
                    : truncateTitle(activeProject?.pages?.find(p => p.id === selectedLeftTargetId)?.title || 'Main File', 2)}
              </span>
            </h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest" style={{ color: theme.textMuted, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              {compareSource === 'snapshot' ? 'Baseline' : (lang === 'vi' ? 'Sửa trực tiếp' : 'Editable')}
            </span>
          </div>
          
          <div 
            ref={leftColRef}
            onScroll={handleScrollLeft}
            className="flex-1 overflow-y-auto p-6 relative flex flex-col"
            style={{
              fontFamily: diffMode === 'markdown' ? 'JetBrains Mono, monospace' : `'${docFont}', Georgia, serif`,
              color: theme.text,
              fontSize: diffMode === 'markdown' ? '14px' : '16px',
            }}
          >
            {compareSource === 'snapshot' ? (
              !baselineData ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50 p-8">
                  <p className="text-sm">{t(lang, 'noSnapshotsForDiff') || 'No snapshots available for this page yet.'}</p>
                </div>
              ) : (
                <div className="space-y-2 whitespace-pre-wrap leading-relaxed select-text">
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
                      return null;
                    } else {
                      return <span key={idx}>{renderMarkdownSyntaxTokens(part.value)}</span>;
                    }
                  })}
                </div>
              )
            ) : (
              <textarea
                value={leftText}
                onChange={(e) => setLeftText(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập hoặc sửa nội dung file bên trái...' : 'Type or edit left file content here...'}
                className="w-full h-full bg-transparent resize-none outline-none leading-relaxed relative z-10 selection:bg-emerald-500/30 flex-1"
                style={{ 
                  fontFamily: diffMode === 'markdown' ? 'JetBrains Mono, monospace' : `'${docFont}', Georgia, serif`, 
                  color: theme.text,
                  caretColor: theme.accent,
                  fontSize: diffMode === 'markdown' ? '14px' : '16px',
                }}
              />
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
              <span>
                {compareSource === 'snapshot' 
                  ? (t(lang, 'liveActiveEditor') || 'Live Active Editor') 
                  : compareSource === 'draft-vs-draft' 
                    ? truncateTitle(activeProject?.drafts?.find(d => d.id === selectedTargetId)?.title || 'Draft', 2) 
                    : truncateTitle(activeProject?.drafts?.find(d => d.id === selectedTargetId)?.title || 'Draft', 2)}
              </span>
            </h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest" style={{ color: theme.textMuted, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              {lang === 'vi' ? 'Sửa trực tiếp' : 'Editable'}
            </span>
          </div>

          <div className="flex-1 relative flex flex-col overflow-hidden">
            <div 
              ref={rightColRef}
              onScroll={handleScrollRight}
              className="flex-1 overflow-y-auto p-6 relative flex flex-col"
            >
              {compareSource === 'draft-vs-draft' && (activeProject?.drafts || []).filter(d => d.id !== selectedLeftTargetId).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50 p-8">
                  <p className="text-sm">{lang === 'vi' ? 'Không có bản nháp nào khác để so sánh' : 'No other drafts available for comparison'}</p>
                </div>
              ) : (
                <textarea
                  value={liveText}
                  onChange={(e) => setLiveText(e.target.value)}
                  placeholder={diffMode === 'markdown' ? (lang === 'vi' ? 'Nhập mã Markdown tại đây...' : 'Type Markdown syntax here...') : (t(lang, 'startTypingPlaceholder') || 'Start typing or editing your document here...')}
                  className="w-full h-full bg-transparent resize-none outline-none leading-relaxed relative z-10 selection:bg-emerald-500/30 flex-1"
                  style={{ 
                    fontFamily: diffMode === 'markdown' ? 'JetBrains Mono, monospace' : `'${docFont}', Georgia, serif`, 
                    color: theme.text,
                    caretColor: theme.accent,
                    fontSize: diffMode === 'markdown' ? '14px' : '16px',
                  }}
                  autoFocus
                />
              )}
            </div>

            {/* Bottom Status bar */}
            <div className="px-5 py-2 border-t flex items-center justify-between text-[10px] opacity-70" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
              <span className="font-medium" style={{ color: theme.text }}>{t(lang, 'liveCharacterCount') || 'Character count:'} {liveText.length}</span>
              <span className="flex items-center gap-1 font-mono" style={{ color: theme.text }}>
                <Pilcrow size={11} /> {t(lang, 'autoDiffingActive') || 'Auto-diffing active'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
