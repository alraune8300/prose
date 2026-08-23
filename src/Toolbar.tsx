import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Eraser, Plus, Minus,
  Link2, Bookmark, BookOpen, Quote,
  Split, X, GripVertical, Move, Copy, FileText, Code, Check
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import type { ThemeColors } from './types';
import type { Dict } from './i18n';
import { CustomSelect } from './CustomSelect';
import GoogleFontsPanel from './GoogleFontsPanel';
import { injectGoogleFont } from './googleFontsApi';

type Props = {
  editor: Editor;
  theme: ThemeColors;
  uiFont: string;
  t: Dict;
  lang: 'vi' | 'en';
  selectedFont: string;
  selectedSize: number;
  availableFonts: { family: string; label: string }[];
  onFontChange: (family: string) => void;
  onFontAssign?: (role: 'body' | 'heading' | 'mono' | 'ui', fontName: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoomPercent?: number;
  zoomInput?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomInputChange?: (val: string) => void;
  onZoomInputBlur?: () => void;
  isSplitView?: boolean;
  onToggleSplitView?: () => void;
};

function Toolbar({
  editor, theme, uiFont, t, lang,
  selectedFont, selectedSize, availableFonts,
  onFontChange, onFontAssign,
  onUndo, onRedo, canUndo, canRedo,
  zoomPercent, zoomInput,
  onZoomIn, onZoomOut,
  onZoomInputChange, onZoomInputBlur,
  isSplitView, onToggleSplitView,
}: Props) {
  const [, forceUpdate] = useState({});
  const [showGoogleFonts, setShowGoogleFonts] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('https://');
  const [isFootnoteModalOpen, setIsFootnoteModalOpen] = useState(false);
  const [footnoteInputValue, setFootnoteInputValue] = useState('1');
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Draggable Float Menu State
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number }>({ clientX: 0, clientY: 0, initialX: 0, initialY: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editor) {
      let rafId: number;
      const handleUpdate = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          forceUpdate({});
        });
      };
      editor.on("transaction", handleUpdate);
      editor.on("selectionUpdate", handleUpdate);
      return () => {
        cancelAnimationFrame(rafId);
        editor.off("transaction", handleUpdate);
        editor.off("selectionUpdate", handleUpdate);
      };
    }
  }, [editor, selectedSize]);

  // Touch and Mouse pointer drag logic
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const rect = toolbarRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : window.innerWidth / 2 - 200;
    const currentY = rect ? rect.top : window.innerHeight - 70;

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;

    const newX = Math.max(8, Math.min(window.innerWidth - 100, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(50, Math.min(window.innerHeight - 50, dragStartRef.current.initialY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const ToolBtn = ({ onClick, icon, label, active }: {
    onClick: () => void; icon: React.ReactNode; label: string; active?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`min-h-[32px] min-w-[32px] flex items-center justify-center p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 touch-manipulation`}
      style={{
        backgroundColor: active ? (theme.accentLight || 'rgba(59,130,246,0.18)') : "transparent",
        color: active ? (theme.accent || '#3b82f6') : (theme.textMuted || theme.text)
      }}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );

  const Divider = () => <div className="w-px h-4 mx-0.5 shrink-0" style={{ backgroundColor: theme.border || 'rgba(156,163,175,0.25)' }} />;

  return (
    <div
      ref={toolbarRef}
      className={`fixed z-40 flex items-center flex-nowrap w-max gap-0.5 px-2.5 py-1.5 select-none rounded-full shadow-2xl border backdrop-blur-md max-w-[calc(100vw-1.5rem)] transition-shadow ${
        position ? '' : 'bottom-6 left-1/2 -translate-x-1/2'
      }`}
      style={{ 
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
        backgroundColor: theme.surface ? `${theme.surface}f0` : (theme.isDark ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.92)'),
        borderColor: theme.border || (theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'),
        color: theme.text,
        fontFamily: `'${uiFont}', sans-serif`,
        boxShadow: theme.isDark ? '0 16px 36px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.12)',
      }}
    >
      {/* Draggable Grip */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex items-center justify-center p-1 rounded-full cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity touch-none shrink-0"
        title="Kéo thanh công cụ đến bất kỳ đâu trên màn hình"
      >
        <GripVertical size={14} style={{ color: theme.accent || '#3b82f6' }} />
      </div>

      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onUndo}
        disabled={!canUndo}
        title={t.undo || 'Undo (Ctrl+Z)'}
        style={{ padding: '6px', background: 'none', border: 'none', cursor: canUndo ? 'pointer' : 'default', opacity: canUndo ? 1 : 0.35, color: theme.text, fontFamily: uiFont }}
        className="hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
      </button>
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onRedo}
        disabled={!canRedo}
        title={t.redo || 'Redo (Ctrl+Y)'}
        style={{ padding: '6px', background: 'none', border: 'none', cursor: canRedo ? 'pointer' : 'default', opacity: canRedo ? 1 : 0.35, color: theme.text, fontFamily: uiFont }}
        className="hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
      </button>
      <Divider />

      {(() => {
        const rawFont = editor ? editor.getAttributes('textStyle').fontFamily || selectedFont : selectedFont;
        const currentFont = rawFont ? rawFont.replace(/['"]/g, '') : rawFont;
        const serifFamilies = ['Merriweather', 'Lora', 'Playfair Display', 'EB Garamond', 'Libre Baskerville', 'Times New Roman', 'Georgia'];
        const monoFamilies = ['JetBrains Mono', 'Courier New'];
        const serifFonts = availableFonts.filter(f => serifFamilies.includes(f.family));
        const monoFonts = availableFonts.filter(f => monoFamilies.includes(f.family));
        const sansFonts = availableFonts.filter(f => !serifFamilies.includes(f.family) && !monoFamilies.includes(f.family));

        const groups = [];
        if (serifFonts.length > 0) groups.push({ label: 'SERIF', options: serifFonts.map(f => ({ value: f.family, label: f.label, fontFamily: `'${f.family}', serif` })) });
        if (sansFonts.length > 0) groups.push({ label: 'SANS-SERIF', options: sansFonts.map(f => ({ value: f.family, label: f.label, fontFamily: `'${f.family}', sans-serif` })) });
        if (monoFonts.length > 0) groups.push({ label: 'MONOSPACE', options: monoFonts.map(f => ({ value: f.family, label: f.label, fontFamily: `'${f.family}', monospace` })) });

        return (
          <CustomSelect
            value={currentFont}
            onChange={onFontChange}
            groups={groups}
            theme={theme}
            buttonClassName="text-xs py-1 px-2 rounded-lg outline-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 max-w-[110px] shrink-0 bg-transparent border-none transition-colors truncate"
            buttonStyle={{ color: theme.text }}
            dropdownClassName="w-56 bottom-full mb-2 !mt-0"
            footerNode={
              <button
                onClick={() => setShowGoogleFonts(true)}
                className="w-full text-left px-4 py-2 text-xs font-semibold hover:opacity-80 transition-opacity"
                style={{ color: theme.accent }}
              >
                {t.browseGoogleFonts || 'Browse Google Fonts...'}
              </button>
            }
          />
        );
      })()}

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold size={14} />} label={t.bold} active={editor.isActive('bold')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic size={14} />} label={t.italic} active={editor.isActive('italic')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<UnderlineIcon size={14} />} label={t.underline} active={editor.isActive('underline')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} icon={<Strikethrough size={14} />} label={t.strike} active={editor.isActive('strike')} />
      
      {showGoogleFonts && createPortal(
        <GoogleFontsPanel
          onSelect={name => {
            injectGoogleFont(name);
            onFontChange(name);
            window.dispatchEvent(new CustomEvent('kgv-apply-font-selection', { detail: name }));
            setShowGoogleFonts(false);
          }}
          onApplyToSelection={name => {
            injectGoogleFont(name);
            onFontChange(name);
            window.dispatchEvent(new CustomEvent('kgv-apply-font-selection', { detail: name }));
            setShowGoogleFonts(false);
          }}
          onClose={() => setShowGoogleFonts(false)}
          theme={theme}
          uiFont={uiFont}
          lang={lang}
          editor={editor}
          onAssignRole={(role, name) => onFontAssign?.(role as 'body' | 'heading' | 'mono' | 'ui', name)}
        />,
        document.body
      )}

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List size={14} />} label={t.bulletList} active={editor.isActive('bulletList')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<ListOrdered size={14} />} label={t.numberList} active={editor.isActive('orderedList')} />
      
      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={<AlignLeft size={14} />} label={t.alignLeft} active={editor.isActive({ textAlign: 'left' })} />
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={<AlignCenter size={14} />} label={t.alignCenter} active={editor.isActive({ textAlign: 'center' })} />
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={<AlignRight size={14} />} label={t.alignRight} active={editor.isActive({ textAlign: 'right' })} />

      <Divider />

      <ToolBtn 
        onClick={() => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
          } else {
            const previousUrl = editor.getAttributes('link').href;
            setLinkInputValue(previousUrl || 'https://');
            setIsLinkModalOpen(true);
          }
        }} 
        icon={<Link2 size={14} />} 
        label={lang === 'vi' ? 'Chèn liên kết (Ctrl+K)' : 'Insert link (Ctrl+K)'} 
        active={editor.isActive('link')} 
      />
      <ToolBtn 
        onClick={() => {
          setFootnoteInputValue('1');
          setIsFootnoteModalOpen(true);
        }} 
        icon={<Bookmark size={14} />} 
        label={lang === 'vi' ? 'Chèn chú thích neo lề [^n]' : 'Insert margin footnote [^n]'} 
      />
      <ToolBtn 
        onClick={() => {
          window.dispatchEvent(new CustomEvent('kgv-open-citations'));
        }} 
        icon={<BookOpen size={14} />} 
        label={lang === 'vi' ? 'Thư viện trích dẫn & Thư mục (Citations)' : 'Citations & Bibliography Desk'} 
      />
      <ToolBtn 
        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
        icon={<Quote size={14} />} 
        label={lang === 'vi' ? 'Đoạn trích dẫn' : 'Blockquote'} 
        active={editor.isActive('blockquote')} 
      />

      <Divider />

      {/* Smart Context Copy Button & Dropdown */}
      <div className="relative">
        <ToolBtn
          onClick={() => setShowCopyMenu(prev => !prev)}
          icon={copiedFormat ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          label={lang === 'vi' ? 'Sao chép thông minh (Rich Text, Markdown, Plain Text)' : 'Smart Context Copy'}
          active={showCopyMenu}
        />
        {showCopyMenu && (
          <div
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 p-1.5 rounded-2xl shadow-2xl border backdrop-blur-md w-56 flex flex-col gap-1 select-none animate-in fade-in zoom-in-95"
            style={{
              backgroundColor: theme.surface ? `${theme.surface}fa` : (theme.isDark ? '#1e1e24' : '#ffffff'),
              borderColor: theme.border,
              boxShadow: theme.isDark ? '0 16px 36px rgba(0,0,0,0.6)' : '0 12px 32px rgba(0,0,0,0.15)',
            }}
          >
            <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider opacity-60 border-b pb-1" style={{ borderColor: theme.border }}>
              {lang === 'vi' ? 'Định dạng sao chép' : 'Copy Format'}
            </div>
            
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('kgv-copy-as', { detail: { format: 'rich' } }));
                setCopiedFormat('rich');
                setTimeout(() => { setCopiedFormat(null); setShowCopyMenu(false); }, 700);
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
              style={{ color: theme.text }}
            >
              <div className="flex items-center gap-2">
                <FileText size={13} style={{ color: theme.accent }} />
                <span>{lang === 'vi' ? 'Chuẩn (Rich Text)' : 'Rich Text (HTML)'}</span>
              </div>
              {copiedFormat === 'rich' && <Check size={12} className="text-emerald-500" />}
            </button>

            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('kgv-copy-as', { detail: { format: 'markdown' } }));
                setCopiedFormat('markdown');
                setTimeout(() => { setCopiedFormat(null); setShowCopyMenu(false); }, 700);
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
              style={{ color: theme.text }}
            >
              <div className="flex items-center gap-2">
                <Code size={13} style={{ color: theme.accent }} />
                <span>{lang === 'vi' ? 'Markdown thô' : 'Raw Markdown'}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 opacity-75 font-mono">
                Ctrl+Shift+C
              </span>
            </button>

            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('kgv-copy-as', { detail: { format: 'plain' } }));
                setCopiedFormat('plain');
                setTimeout(() => { setCopiedFormat(null); setShowCopyMenu(false); }, 700);
              }}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
              style={{ color: theme.text }}
            >
              <div className="flex items-center gap-2">
                <Copy size={13} style={{ color: theme.textMuted || theme.text }} />
                <span>{lang === 'vi' ? 'Văn bản thuần' : 'Plain Text'}</span>
              </div>
              {copiedFormat === 'plain' && <Check size={12} className="text-emerald-500" />}
            </button>
          </div>
        )}
      </div>

      {onToggleSplitView && (
        <ToolBtn
          onClick={onToggleSplitView}
          icon={<Split size={14} />}
          label={t('splitReferenceTab') || 'Reference & Compare'}
          active={isSplitView}
        />
      )}

      <ToolBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} icon={<Eraser size={14} />} label={t.clearFormat} />
      
      {zoomPercent !== undefined && onZoomIn && onZoomOut && (
        <>
          <Divider />
          <div className="flex items-center gap-1 text-xs px-1.5 py-0.5 shrink-0 bg-transparent border-none">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onZoomOut}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Thu nhỏ (-10%)"
              aria-label="Zoom Out"
            >
              <Minus size={11} style={{ color: theme.text }} />
            </button>
            <div className="flex items-center px-0.5">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={zoomInput || String(zoomPercent)}
                onChange={(e) => onZoomInputChange?.(e.target.value)}
                onBlur={onZoomInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onZoomInputBlur?.();
                  }
                }}
                className="w-7 text-center text-xs font-semibold bg-transparent outline-none cursor-text"
                style={{ color: theme.text }}
                title="Tỉ lệ phóng to/thu nhỏ (50% - 250%)"
              />
              <span className="text-[10px] font-semibold opacity-70 -ml-0.5" style={{ color: theme.text }}>%</span>
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onZoomIn}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Phóng to (+10%)"
              aria-label="Zoom In"
            >
              <Plus size={11} style={{ color: theme.text }} />
            </button>
          </div>
        </>
      )}

      {/* Reset Floating Position Button if moved */}
      {position && (
        <>
          <Divider />
          <button
            type="button"
            onClick={() => setPosition(null)}
            className="p-1 rounded-full text-[10px] opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer shrink-0"
            title="Đưa thanh công cụ về vị trí đáy mặc định"
          >
            <Move size={12} />
          </button>
        </>
      )}

      {/* Link Insertion Modal */}
      {isLinkModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden p-6 relative"
            style={{ 
              backgroundColor: theme.surface, 
              borderColor: theme.border, 
              color: theme.text,
              fontFamily: `'${uiFont}', sans-serif`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}>
                  <Link2 size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: theme.text }}>
                    {t.insertHyperlink}
                  </h3>
                  <p className="text-xs opacity-60" style={{ color: theme.text }}>
                    {t.enterWebAddress}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                style={{ color: theme.text }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium mb-1.5 opacity-80" style={{ color: theme.text }}>
                  {t.targetUrl}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={linkInputValue}
                    onChange={(e) => setLinkInputValue(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none font-mono"
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                      borderColor: theme.border,
                      color: theme.text
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (linkInputValue.trim()) {
                          editor.chain().focus().setLink({ href: linkInputValue.trim() }).run();
                          setIsLinkModalOpen(false);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                style={{ color: theme.text }}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (linkInputValue.trim()) {
                    editor.chain().focus().setLink({ href: linkInputValue.trim() }).run();
                    setIsLinkModalOpen(false);
                  }
                }}
                className="px-4 py-2 text-xs font-medium rounded-xl shadow-md transition-all hover:opacity-90 cursor-pointer"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.isDark ? theme.bg : '#ffffff'
                }}
              >
                {t.apply}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Footnote Insertion Modal */}
      {isFootnoteModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden p-6 relative"
            style={{ 
              backgroundColor: theme.surface, 
              borderColor: theme.border, 
              color: theme.text,
              fontFamily: `'${uiFont}', sans-serif`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}>
                  <Bookmark size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: theme.text }}>
                    {lang === 'vi' ? 'Chèn chú thích chân trang [^n]' : 'Insert Footnote Marker'}
                  </h3>
                  <p className="text-xs opacity-60" style={{ color: theme.text }}>
                    {lang === 'vi' ? 'Nhập số thứ tự hoặc nhãn của chú thích' : 'Enter number or label for footnote'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFootnoteModalOpen(false)}
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                style={{ color: theme.text }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium mb-1.5 opacity-80" style={{ color: theme.text }}>
                  {lang === 'vi' ? 'Ký hiệu / Số chú thích:' : 'Marker / Number:'}
                </label>
                <input
                  type="text"
                  value={footnoteInputValue}
                  onChange={(e) => setFootnoteInputValue(e.target.value)}
                  placeholder="1, 2, a, *"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none font-mono font-bold"
                  style={{
                    backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                    borderColor: theme.border,
                    color: theme.text
                  }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = footnoteInputValue.trim() || '1';
                      window.dispatchEvent(new CustomEvent('kgv-insert-footnote', { detail: { id: val } }));
                      setIsFootnoteModalOpen(false);
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFootnoteModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                style={{ color: theme.text }}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = footnoteInputValue.trim() || '1';
                  window.dispatchEvent(new CustomEvent('kgv-insert-footnote', { detail: { id: val } }));
                  setIsFootnoteModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-medium rounded-xl shadow-md transition-all hover:opacity-90 cursor-pointer"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.isDark ? theme.bg : '#ffffff'
                }}
              >
                {t.apply}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default React.memo(Toolbar);
