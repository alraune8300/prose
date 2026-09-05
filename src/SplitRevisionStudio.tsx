import React, { useEffect, useState, useRef, useMemo } from 'react';
import { GitCompare, Clock, Sparkles, CheckCircle2, RotateCcw, X, Lock, Unlock } from 'lucide-react';
import { getPageVersionsFromDB } from './db';
import type { ThemeColors, VersionSnapshot, Lang, Page, Project, FormatState } from './types';
import type { Dict } from './i18n';
import { format } from 'date-fns';
import { CustomSelect } from './CustomSelect';
import Editor from './Editor';
import Toolbar from './Toolbar';
import type { CustomFont } from './types';
import type { Editor as TiptapEditorType } from '@tiptap/react';

interface SplitRevisionStudioProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: Page | null;
  activeProject: Project | null;
  theme: ThemeColors;
  lang: Lang;
  uiFont: string;
  docFont: string;
  headingFont: string;
  monoFont: string;
  fontSize: number;
  formatState: FormatState;
  t: Dict;
  onUpdateContent: (targetId: string, content: string) => void;
  availableFonts?: CustomFont[];
  handleFormatChange?: (changes: Partial<FormatState>) => void;
}

type FileType = 'snapshot' | 'page' | 'draft' | 'scratchpad';

export const SplitRevisionStudio: React.FC<SplitRevisionStudioProps> = ({
  isOpen,
  onClose,
  activePage,
  activeProject,
  theme,
  lang,
  uiFont,
  docFont,
  headingFont,
  monoFont,
  fontSize,
  formatState,
  t,
  onUpdateContent,
  availableFonts,
  handleFormatChange,
}) => {
  const [leftType, setLeftType] = useState<FileType>('snapshot');
  const [leftId, setLeftId] = useState<string>('');
  
  const [rightType, setRightType] = useState<FileType>('page');
  const [rightId, setRightId] = useState<string>('');
  
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [leftHtml, setLeftHtml] = useState('');
  const [liveHtml, setLiveHtml] = useState('');
  
  const [syncScroll, setSyncScroll] = useState(false);
  const [activeEditor, setActiveEditor] = useState<TiptapEditorType | null>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const isSyncingLeftRef = useRef(false);
  const isSyncingRightRef = useRef(false);

  useEffect(() => {
    if (isOpen && activePage?.id && activeProject?.id) {
      getPageVersionsFromDB(activeProject.id, activePage.id).then(v => {
        const vList = v || [];
        setVersions(vList);
        if (vList && vList.length > 0 && !leftId && leftType === 'snapshot') {
          setLeftId(vList[0].id);
          setLeftHtml(getHtmlContent('snapshot', vList[0].id, vList));
        }
      });
      if (!rightId) {
        setRightType('page');
        setRightId(activePage.id);
      }
    }
  }, [isOpen, activePage?.id, activeProject?.id]);

  const truncateTitle = (t: string, len: number) => {
    const words = t.split(' ');
    if (words.length <= len) return t;
    return words.slice(0, len).join(' ') + '...';
  };

  const getHtmlContent = (type: FileType, id: string, vList?: VersionSnapshot[]) => {
    if (!id) return '';
    if (type === 'snapshot') {
      const v = (vList || versions).find(v => v.id === id);
      return v?.content || '';
    } else if (type === 'page') {
      const p = activeProject?.pages?.find(p => p.id === id);
      return p?.content || '';
    } else if (type === 'draft') {
      const d = activeProject?.drafts?.find(d => d.id === id);
      return d?.content || '';
    } else if (type === 'scratchpad') {
      const s = activeProject?.scratchpad?.find(s => s.id === id);
      return s?.content || '';
    }
    return '';
  };

  useEffect(() => {
    if (isOpen) {
      setLeftHtml(getHtmlContent(leftType, leftId));
    }
  }, [isOpen, leftType, leftId, versions, activeProject]);

  useEffect(() => {
    if (isOpen) {
      setLiveHtml(getHtmlContent(rightType, rightId));
    }
  }, [isOpen, rightType, rightId, activeProject]);

  const handleScrollLeft = () => {
    if (!syncScroll || !leftColRef.current || !rightColRef.current) return;
    if (isSyncingRightRef.current) {
      isSyncingRightRef.current = false;
      return;
    }
    const leftEl = leftColRef.current.querySelector('.kgv-scroll');
    const rightEl = rightColRef.current.querySelector('.kgv-scroll');
    if (!leftEl || !rightEl) return;
    
    isSyncingLeftRef.current = true;
    const scrollPercentage = leftEl.scrollTop / (leftEl.scrollHeight - leftEl.clientHeight);
    rightEl.scrollTop = scrollPercentage * (rightEl.scrollHeight - rightEl.clientHeight);
  };

  const handleScrollRight = () => {
    if (!syncScroll || !leftColRef.current || !rightColRef.current) return;
    if (isSyncingLeftRef.current) {
      isSyncingLeftRef.current = false;
      return;
    }
    const leftEl = leftColRef.current.querySelector('.kgv-scroll');
    const rightEl = rightColRef.current.querySelector('.kgv-scroll');
    if (!leftEl || !rightEl) return;

    isSyncingRightRef.current = true;
    const scrollPercentage = rightEl.scrollTop / (rightEl.scrollHeight - rightEl.clientHeight);
    leftEl.scrollTop = scrollPercentage * (leftEl.scrollHeight - leftEl.clientHeight);
  };

  useEffect(() => {
    if (syncScroll) {
      const leftEl = leftColRef.current?.querySelector('.kgv-scroll');
      const rightEl = rightColRef.current?.querySelector('.kgv-scroll');
      if (leftEl) leftEl.addEventListener('scroll', handleScrollLeft);
      if (rightEl) rightEl.addEventListener('scroll', handleScrollRight);
      
      return () => {
        if (leftEl) leftEl.removeEventListener('scroll', handleScrollLeft);
        if (rightEl) rightEl.removeEventListener('scroll', handleScrollRight);
      };
    }
  }, [syncScroll, leftHtml, liveHtml]);

  const handleAcceptAll = () => {
    if (rightType !== 'snapshot' && rightId) {
      onUpdateContent(rightId, liveHtml);
    }
    if (leftType !== 'snapshot' && leftId) {
      onUpdateContent(leftId, leftHtml);
    }
    onClose();
  };

  const getGroups = (isLeft: boolean) => {
    const groups: { label: string; options: { value: string; label: string; }[] }[] = [];
    const pushOpt = (group: string, value: string, label: string) => {
      let g = groups.find(x => x.label === group);
      if (!g) {
        g = { label: group, options: [] };
        groups.push(g);
      }
      g.options.push({ value, label });
    };

    if (isLeft && versions.length > 0) {
      versions.forEach(v => {
        pushOpt('Snapshots', `snapshot:${v.id}`, v.label ? `${truncateTitle(v.label, 3)} (${format(new Date(v.timestamp), 'MMM d, HH:mm')})` : format(new Date(v.timestamp), 'PPpp'));
      });
    }

    activeProject?.pages?.forEach(p => {
      pushOpt(lang === 'vi' ? 'Trang chính' : 'Main Pages', `page:${p.id}`, truncateTitle(p.title || 'Untitled', 4));
    });
    activeProject?.drafts?.forEach(p => {
      pushOpt(lang === 'vi' ? 'Bản nháp' : 'Drafts', `draft:${p.id}`, truncateTitle(p.title || 'Draft', 4));
    });
    activeProject?.scratchpad?.forEach(p => {
      pushOpt('Scratchpads', `scratchpad:${p.id}`, truncateTitle(p.title || 'Scratchpad', 4));
    });

    return groups;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col backdrop-blur-md bg-black/40 animate-in fade-in duration-200" style={{ fontFamily: `'${uiFont}', sans-serif` }}>
      
      {/* Floating Action Buttons */}
      <div className="absolute top-4 right-6 flex items-center gap-2 z-50">
        <button
          onClick={() => setSyncScroll(prev => !prev)}
          className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm transition-colors hover:scale-105 active:scale-95"
          style={{ 
            color: syncScroll ? theme.accent : theme.textMuted,
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`
          }}
          title="Sync scroll between left and right views"
        >
          {syncScroll ? <Lock size={15} /> : <Unlock size={15} />}
        </button>
        <button
          onClick={handleAcceptAll}
          className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm transition-colors hover:scale-105 active:scale-95"
          style={{ 
            color: theme.accent,
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`
          }}
          title="Save changes and close"
        >
          <CheckCircle2 size={16} />
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm transition-colors hover:scale-105 active:scale-95"
          style={{ 
            color: theme.textMuted,
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`
          }}
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Split Columns Container */}
      <div className="w-full flex justify-center bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-2 z-20">
            {activeEditor && availableFonts && handleFormatChange && (
              <Toolbar
                editor={activeEditor}
                theme={theme}
                uiFont={uiFont}
                t={t}
                lang={lang}
                selectedFont={formatState?.fontFam || docFont}
                selectedSize={formatState?.fontSize || fontSize}
                availableFonts={availableFonts}
                onFontChange={(fam) => {
                  activeEditor.chain().focus().setFontFamily(fam).run();
                }}
                onSizeChange={(size) => {
                  handleFormatChange({ fontSize: size });
                }}
                onFormattingChange={(changes) => {
                  handleFormatChange(changes);
                }}
              />
            )}
          </div>
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col border-r shadow-lg relative z-10" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
          <div className="absolute top-4 left-6 z-20">
            <CustomSelect
              value={`${leftType}:${leftId || ''}`}
              onChange={(val) => {
                const [t, id] = val.split(':');
                if (t && id) {
                  setLeftType(t as FileType);
                  setLeftId(id);
                  setLeftHtml(getHtmlContent(t as FileType, id));
                }
              }}
              groups={getGroups(true)}
              theme={theme}
              buttonClassName="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm text-[13px] font-medium transition-colors hover:opacity-80 backdrop-blur-md"
              buttonStyle={{ backgroundColor: theme.surface ? `${theme.surface}e0` : 'rgba(255,255,255,0.9)', borderColor: theme.border, borderWidth: '1px', color: theme.text }}
              dropdownClassName="w-64"
              renderButtonContent={(opt) => (
                <>
                  <Clock size={14} style={{ color: theme.textMuted }} />
                  <span className="truncate max-w-[200px]">{opt ? opt.label : 'Select Content'}</span>
                </>
              )}
            />
          </div>
          
          <div 
            ref={leftColRef}
            className="flex-1 relative flex flex-col overflow-hidden kgv-revision-editor-container pt-12"
            onFocusCapture={(e) => { const editorEl = e.currentTarget.querySelector('.ProseMirror'); if (editorEl && (editorEl as any).editor) setActiveEditor((editorEl as any).editor); }}
            onClickCapture={(e) => { const editorEl = e.currentTarget.querySelector('.ProseMirror'); if (editorEl && (editorEl as any).editor) setActiveEditor((editorEl as any).editor); }}
          >
             <Editor 
                key={`${leftType}-${leftId}`}
                content={leftHtml}
                onContentChange={(html) => setLeftHtml(html)}
                onEditorReady={(editor) => { if (!activeEditor) setActiveEditor(editor as TiptapEditorType); }}
                theme={theme}
                lang={lang}
                docFont={docFont}
                headingFont={headingFont}
                monoFont={monoFont}
                fontSize={fontSize}
                formatState={formatState}
                t={t as any}
                isPreviewMode={false}
                isFocusMode={false}
                isSplitMode={true}
                typewriterMode={false}
             />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 flex flex-col relative" style={{ backgroundColor: theme.background }}>
          <div className="absolute top-4 left-6 z-20">
            <CustomSelect
              value={`${rightType}:${rightId || ''}`}
              onChange={(val) => {
                const [t, id] = val.split(':');
                if (t && id) {
                  setRightType(t as FileType);
                  setRightId(id);
                  setLiveHtml(getHtmlContent(t as FileType, id));
                }
              }}
              groups={getGroups(false)}
              theme={theme}
              buttonClassName="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm text-[13px] font-medium transition-colors hover:opacity-80 backdrop-blur-md"
              buttonStyle={{ backgroundColor: theme.surface ? `${theme.surface}e0` : 'rgba(255,255,255,0.9)', borderColor: theme.border, borderWidth: '1px', color: theme.text }}
              dropdownClassName="w-64"
              renderButtonContent={(opt) => (
                <>
                  <Sparkles size={14} style={{ color: theme.accent }} />
                  <span className="truncate max-w-[200px]">{opt ? opt.label : 'Select Content'}</span>
                </>
              )}
            />
          </div>
          
          <div 
            ref={rightColRef}
            className="flex-1 relative flex flex-col overflow-hidden kgv-revision-editor-container pt-12"
            onFocusCapture={(e) => { const editorEl = e.currentTarget.querySelector('.ProseMirror'); if (editorEl && (editorEl as any).editor) setActiveEditor((editorEl as any).editor); }}
            onClickCapture={(e) => { const editorEl = e.currentTarget.querySelector('.ProseMirror'); if (editorEl && (editorEl as any).editor) setActiveEditor((editorEl as any).editor); }}
          >
             <Editor 
                key={`${rightType}-${rightId}`}
                content={liveHtml}
                onContentChange={(html) => setLiveHtml(html)}
                theme={theme}
                lang={lang}
                docFont={docFont}
                headingFont={headingFont}
                monoFont={monoFont}
                fontSize={fontSize}
                formatState={formatState}
                t={t as any}
                isPreviewMode={false}
                isFocusMode={false}
                isSplitMode={true}
                typewriterMode={false}
             />
          </div>
        </div>
      </div>
    </div>
  );
};
export default SplitRevisionStudio;
