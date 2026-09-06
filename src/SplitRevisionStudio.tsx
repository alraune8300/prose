import React, { useEffect, useState, useRef, useMemo } from 'react';
import { GitCompare, Clock, Sparkles, CheckCircle2, RotateCcw, X, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';
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


const FileAccordion = ({ 
  value, 
  onChange, 
  groups, 
  theme, 
  uiFont, 
  docFont 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  groups: { label: string; options: { value: string; label: string; }[] }[], 
  theme: any, 
  uiFont: string, 
  docFont: string 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative z-50">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        style={{ fontFamily: docFont, color: theme.text, fontSize: '1.4rem' }}
      >
        <span>File</span>
        {isOpen ? <ChevronUp size={20} strokeWidth={1.5} /> : <ChevronDown size={20} strokeWidth={1.5} />}
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-3 flex flex-col gap-6 min-w-[220px] max-h-[70vh] overflow-y-auto p-4 rounded-xl border shadow-xl z-50 transition-all duration-150"
          style={{
            backgroundColor: theme.isDark 
              ? 'rgba(20, 26, 20, 0.82)' 
              : 'rgba(255, 255, 255, 0.86)',
            borderColor: theme.borderFaint || (theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: theme.isDark 
              ? '0 16px 40px -4px rgba(0, 0, 0, 0.65)' 
              : '0 12px 32px -4px rgba(0, 0, 0, 0.12)',
          }}
        >
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="flex flex-col gap-2">
              <div 
                className="text-[11px] uppercase tracking-wider font-semibold opacity-70 ml-2"
                style={{ fontFamily: uiFont, color: theme.text }}
              >
                {group.label}
              </div>
              <div className="flex flex-col gap-1 ml-4">
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className="text-left px-2 py-1 text-[13px] hover:opacity-100 transition-opacity whitespace-nowrap truncate"
                    style={{
                      fontFamily: docFont,
                      color: theme.text,
                      opacity: value === opt.value ? 1 : 0.7,
                      fontWeight: value === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
    <div className="fixed inset-0 z-50 flex flex-col animate-in fade-in duration-200" style={{ fontFamily: `'${uiFont}', sans-serif`, backgroundColor: theme.bg }}>
      
      {/* Floating Action Buttons */}
      <div className="absolute top-6 right-8 flex items-center gap-4 z-50">
        <button
          onClick={() => setSyncScroll(prev => !prev)}
          className="flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ 
            color: theme.text,
            opacity: syncScroll ? 1 : 0.4
          }}
          title="Sync scroll between left and right views"
        >
          {syncScroll ? <Lock size={24} strokeWidth={1.5} /> : <Unlock size={24} strokeWidth={1.5} />}
        </button>
        <button
          onClick={handleAcceptAll}
          className="flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ 
            color: theme.text,
          }}
          title="Save changes and close"
        >
          <CheckCircle2 size={24} strokeWidth={1.5} />
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ 
            color: theme.text,
            opacity: 0.4
          }}
          title="Close without saving"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>
      
      {/* Split Columns Container */}
      <div className="w-full flex justify-center p-2 z-20 absolute top-0 pointer-events-none">
        <div className="pointer-events-auto">
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
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col border-r relative z-10" style={{ borderColor: theme.border, backgroundColor: theme.background || 'transparent' }}>
          <div className="absolute top-6 left-8 z-20">
            <FileAccordion
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
              uiFont={uiFont}
              docFont={docFont}
            />
          </div>
          
          <div 
            ref={leftColRef}
            className="flex-1 relative flex flex-col overflow-hidden kgv-revision-editor-container pt-24"
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
        <div className="flex-1 flex flex-col relative" style={{ backgroundColor: theme.background || 'transparent' }}>
          <div className="absolute top-6 left-8 z-20">
            <FileAccordion
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
              uiFont={uiFont}
              docFont={docFont}
            />
          </div>
          
          <div 
            ref={rightColRef}
            className="flex-1 relative flex flex-col overflow-hidden kgv-revision-editor-container pt-24"
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
