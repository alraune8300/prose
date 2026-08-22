import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Eraser, Plus, Minus,
  Link2, Bookmark, BookOpen, Quote,
  Split
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

  const ToolBtn = ({ onClick, icon, label, active }: {
    onClick: () => void; icon: React.ReactNode; label: string; active?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg transition-all hover:opacity-80 active:scale-95 cursor-pointer shrink-0`}
      style={{ backgroundColor: active ? theme.accentLight : "transparent", color: active ? theme.accent : theme.textMuted }}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );

  const Divider = () => <div className="w-px h-5 mx-1 shrink-0" style={{ backgroundColor: theme.border }} />;



  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center flex-nowrap w-max gap-0.5 px-3 py-1.5 select-none rounded-full shadow-2xl border backdrop-blur-md max-w-[calc(100vw-2rem)]"
      style={{ 
        backgroundColor: theme.isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
        borderColor: theme.border,
        color: theme.text,
        fontFamily: `'${uiFont}', sans-serif` 
      }}
    >
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onUndo}
        disabled={!canUndo}
        title={t.undo || 'Undo (Ctrl+Z)'}
        style={{ padding: '6px', background: 'none', border: 'none', cursor: canUndo ? 'pointer' : 'default', opacity: canUndo ? 1 : 0.4, color: theme.text, fontFamily: uiFont }}
        className="hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
      </button>
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onRedo}
        disabled={!canRedo}
        title={t.redo || 'Redo (Ctrl+Y)'}
        style={{ padding: '6px', background: 'none', border: 'none', cursor: canRedo ? 'pointer' : 'default', opacity: canRedo ? 1 : 0.4, color: theme.text, fontFamily: uiFont }}
        className="hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
      </button>
      <Divider />

      {(() => {
        const rawFont = editor ? editor.getAttributes('textStyle').fontFamily || selectedFont : selectedFont; const currentFont = rawFont ? rawFont.replace(/['"]/g, '') : rawFont;
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
            buttonClassName="text-xs py-1 px-2 rounded outline-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 max-w-[120px] shrink-0 bg-transparent border-none transition-colors"
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

      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold size={15} />} label={t.bold} active={editor.isActive('bold')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic size={15} />} label={t.italic} active={editor.isActive('italic')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<UnderlineIcon size={15} />} label={t.underline} active={editor.isActive('underline')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} icon={<Strikethrough size={15} />} label={t.strike} active={editor.isActive('strike')} />
      
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

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List size={15} />} label={t.bulletList} active={editor.isActive('bulletList')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<ListOrdered size={15} />} label={t.numberList} active={editor.isActive('orderedList')} />
      
      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={<AlignLeft size={15} />} label={t.alignLeft} active={editor.isActive({ textAlign: 'left' })} />
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={<AlignCenter size={15} />} label={t.alignCenter} active={editor.isActive({ textAlign: 'center' })} />
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={<AlignRight size={15} />} label={t.alignRight} active={editor.isActive({ textAlign: 'right' })} />

      <Divider />

      <ToolBtn 
        onClick={() => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
          } else {
            const previousUrl = editor.getAttributes('link').href;
            const url = window.prompt(lang === 'vi' ? 'Nhập đường dẫn URL (Hyperlink):' : 'Enter hyperlink URL:', previousUrl || 'https://');
            if (url) {
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }
          }
        }} 
        icon={<Link2 size={15} />} 
        label={lang === 'vi' ? 'Chèn liên kết (Ctrl+K)' : 'Insert link (Ctrl+K)'} 
        active={editor.isActive('link')} 
      />
      <ToolBtn 
        onClick={() => {
          const fnNum = prompt(lang === 'vi' ? 'Nhập số hoặc nhãn chú thích (ví dụ 1, 2, note):' : 'Enter footnote number/label (e.g. 1, 2, note):', '1');
          if (fnNum) {
            window.dispatchEvent(new CustomEvent('kgv-insert-footnote', { detail: { id: fnNum } }));
          }
        }} 
        icon={<Bookmark size={15} />} 
        label={lang === 'vi' ? 'Chèn chú thích neo lề [^n]' : 'Insert margin footnote [^n]'} 
      />
      <ToolBtn 
        onClick={() => {
          window.dispatchEvent(new CustomEvent('kgv-open-citations'));
        }} 
        icon={<BookOpen size={15} />} 
        label={lang === 'vi' ? 'Thư viện trích dẫn & Thư mục (Citations)' : 'Citations & Bibliography Desk'} 
      />
      <ToolBtn 
        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
        icon={<Quote size={15} />} 
        label={lang === 'vi' ? 'Đoạn trích dẫn' : 'Blockquote'} 
        active={editor.isActive('blockquote')} 
      />

      <Divider />

      {onToggleSplitView && (
        <ToolBtn
          onClick={onToggleSplitView}
          icon={<Split size={15} />}
          label={t('splitReferenceTab') || 'Reference & Compare'}
          active={isSplitView}
        />
      )}

      <ToolBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} icon={<Eraser size={15} />} label={t.clearFormat} />
      
      {zoomPercent !== undefined && onZoomIn && onZoomOut && (
        <>
          <Divider />
          <div className="flex items-center gap-1 text-xs px-2 py-1 shrink-0 bg-transparent border-none">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onZoomOut}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Thu nhỏ (-10%)"
              aria-label="Zoom Out"
            >
              <Minus size={12} style={{ color: theme.text }} />
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
              <span className="text-[11px] font-semibold opacity-70 -ml-0.5" style={{ color: theme.text }}>%</span>
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onZoomIn}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Phóng to (+10%)"
              aria-label="Zoom In"
            >
              <Plus size={12} style={{ color: theme.text }} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default React.memo(Toolbar);
