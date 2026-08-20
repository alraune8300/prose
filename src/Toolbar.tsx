import React, { useState, useEffect } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Indent, Outdent,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Eraser, Plus, Minus, ZoomIn,
  Maximize2, Minimize2, BookOpen,
  Divide, Cloud, Target, Image as ImageIcon
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import type { ThemeColors } from './types';
import type { Dict } from './i18n';
import { compressImage } from './imageUtils';
import { CustomSelect } from './CustomSelect';
import GoogleFontsPanel from './GoogleFontsPanel';
import { injectGoogleFont } from './googleFontsApi';

type Props = {
  editor: Editor;
  theme: ThemeColors;
  uiFont: string;
  t: Dict;
  selectedFont: string;
  selectedSize: number;
  availableFonts: { family: string; label: string }[];
    onFontChange: (family: string) => void;
  onSizeChange: (size: number) => void;
  onSizeInput: (size: number) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  isPreviewMode?: boolean;
  onTogglePreviewMode?: () => void;
  typewriterMode?: boolean;
  onToggleTypewriterMode?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoomPercent?: number;
  zoomInput?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onZoomInputChange?: (val: string) => void;
  onZoomInputBlur?: () => void;
  onOpenGithubCloudSave?: () => void;
};

function Toolbar({
  editor, theme, uiFont, t,
  selectedFont, selectedSize, availableFonts,
  onFontChange, onSizeChange, onSizeInput,
  isFocusMode, onToggleFocusMode,
  isPreviewMode, onTogglePreviewMode,
  typewriterMode, onToggleTypewriterMode,
  onUndo, onRedo, canUndo, canRedo,
  zoomPercent, zoomInput,
  onZoomIn, onZoomOut, onZoomReset,
  onZoomInputChange, onZoomInputBlur,
  onOpenGithubCloudSave,
}: Props) {
  const [sizeInput, setSizeInput] = useState<string>(String(selectedSize));
  const [, forceUpdate] = useState({});
  const [showGoogleFonts, setShowGoogleFonts] = useState(false);

  useEffect(() => {
    if (editor) {
      let rafId: number;
      const handleUpdate = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const sz = editor.getAttributes("textStyle")?.fontSize?.replace("px", "") || selectedSize;
          setSizeInput(String(sz));
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
    } else {
      setSizeInput(String(selectedSize));
    }
  }, [editor, selectedSize]);

  const commitSizeInput = () => {
    const v = parseInt(sizeInput, 10);
    if (!isNaN(v)) {
      const clamped = Math.max(8, Math.min(96, v));
      onSizeInput(clamped);
      setSizeInput(String(clamped));
    } else {
      setSizeInput(String(selectedSize));
    }
  };

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

  const handleInsertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (!file) return;
      if (file.size > 25 * 1024 * 1024) {
        alert(t.imageTooLarge || 'Image size exceeds 25MB limit.');
        return;
      }
      try {
        const compressedBase64 = await compressImage(file);
        editor.chain().focus().setImage({ src: compressedBase64 }).run();
      } catch (err) {
        console.error('Failed to compress image:', err);
      }
    };
    input.click();
  };


  return (
    <div
      className="sticky top-0 z-10 flex items-center flex-nowrap md:flex-wrap overflow-x-auto md:overflow-x-visible scrollbar-none gap-1 px-4 md:pl-6 py-2 select-none"
      style={{ background: 'transparent', fontFamily: `'${uiFont}', sans-serif` }}
    >
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onUndo}
        disabled={!canUndo}
        title={t.undo || 'Undo (Ctrl+Z)'}
        style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: canUndo ? 'pointer' : 'default', opacity: canUndo ? 1 : 0.4, color: theme.text, fontFamily: uiFont, fontSize: '0.85rem' }}
      >
        ⟲
      </button>
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onRedo}
        disabled={!canRedo}
        title={t.redo || 'Redo (Ctrl+Y)'}
        style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: canRedo ? 'pointer' : 'default', opacity: canRedo ? 1 : 0.4, color: theme.text, fontFamily: uiFont, fontSize: '0.85rem' }}
      >
        ⟳
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
            buttonClassName="text-xs py-1.5 px-2 rounded-md outline-none cursor-pointer mr-1 max-w-[140px] shrink-0"
            buttonStyle={{ backgroundColor: theme.isDark ? theme.surface : theme.accentSoft, color: theme.text, border: `1px solid ${theme.border}` }}
            dropdownClassName="w-56 mt-2"
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

      <div className="flex items-center gap-0.5 mr-1 shrink-0">
        <ToolBtn onClick={() => onSizeChange(-1)} icon={<Minus size={13} />} label="-" />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={sizeInput}
          onChange={(e) => {
            const val = e.target.value;
            setSizeInput(val);
            const num = parseInt(val, 10);
            if (!isNaN(num) && num >= 8 && num <= 96 && val.length >= 2) {
              onSizeInput(num);
            }
          }}
          onBlur={commitSizeInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitSizeInput();
            }
          }}
          className="w-10 text-xs font-medium text-center py-0.5 rounded outline-none focus:ring-1"
          style={{ backgroundColor: theme.accentSoft, color: theme.text, border: `1px solid ${theme.border}` }}
          title={t.fontSize}
        />
        <ToolBtn onClick={() => onSizeChange(1)} icon={<Plus size={13} />} label="+" />
      </div>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold size={15} />} label={t.bold} active={editor.isActive('bold')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic size={15} />} label={t.italic} active={editor.isActive('italic')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<UnderlineIcon size={15} />} label={t.underline} active={editor.isActive('underline')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} icon={<Strikethrough size={15} />} label={t.strike} active={editor.isActive('strike')} />
      {showGoogleFonts && (
        <div className="absolute top-12 left-4 z-50 p-4 rounded-xl shadow-xl border w-[340px] max-h-[80vh] overflow-y-auto" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
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
            hideRoles={true}
          />
        </div>
      )}

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1 size={15} />} label={t.h1} active={editor.isActive('heading', { level: 1 })} />
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 size={15} />} label={t.h2} active={editor.isActive('heading', { level: 2 })} />
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={<Heading3 size={15} />} label={t.h3} active={editor.isActive('heading', { level: 3 })} />

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List size={15} />} label={t.bulletList} active={editor.isActive('bulletList')} />
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<ListOrdered size={15} />} label={t.numberList} active={editor.isActive('orderedList')} />
      <ToolBtn onClick={() => {
        const cmds = editor.commands as Record<string, (...args: unknown[]) => boolean>;
        if (!cmds.sinkListItem('listItem')) {
          cmds.indent?.();
        }
      }} icon={<Indent size={15} />} label={t.indent} />
      <ToolBtn onClick={() => {
        const cmds = editor.commands as Record<string, (...args: unknown[]) => boolean>;
        if (!cmds.liftListItem('listItem')) {
          cmds.outdent?.();
        }
      }} icon={<Outdent size={15} />} label={t.outdent} />

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={<AlignLeft size={15} />} label={t.alignLeft} active={editor.isActive({ textAlign: 'left' })} />
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={<AlignCenter size={15} />} label={t.alignCenter} active={editor.isActive({ textAlign: 'center' })} />
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={<AlignRight size={15} />} label={t.alignRight} active={editor.isActive({ textAlign: 'right' })} />
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} icon={<AlignJustify size={15} />} label={t.alignJustify} active={editor.isActive({ textAlign: 'justify' })} />

      <Divider />

            <ToolBtn onClick={handleInsertImage} icon={<ImageIcon size={15} />} label={t.insertImage || "Insert Image"} />
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} icon={<Eraser size={15} />} label={t.clearFormat} />
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Divide size={15} />} label="Horizontal Rule" />

      {zoomPercent !== undefined && onZoomIn && onZoomOut && (
        <>
          <Divider />
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-md shrink-0" style={{ backgroundColor: theme.isDark ? theme.surface : theme.accentSoft, border: `1px solid ${theme.border}` }}>
            <ZoomIn size={14} className="opacity-70 ml-0.5 shrink-0" style={{ color: theme.text }} />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onZoomOut}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
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
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Phóng to (+10%)"
              aria-label="Zoom In"
            >
              <Plus size={12} style={{ color: theme.text }} />
            </button>
            {zoomPercent !== 100 && onZoomReset && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onZoomReset}
                className="ml-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 hover:opacity-80 transition-all cursor-pointer shrink-0"
                style={{ color: theme.text }}
                title="Đặt lại 100%"
              >
                100%
              </button>
            )}
          </div>
        </>
      )}

      <Divider />

            
      <div className="ml-auto flex items-center gap-0.5">
        {onToggleTypewriterMode && (
          <ToolBtn
            onClick={onToggleTypewriterMode}
            icon={<Target size={16} />}
            label={t.typewriterMode || 'Typewriter Scroll'}
            active={typewriterMode}
          />
        )}
        {onToggleFocusMode && (
          <ToolBtn
            onClick={onToggleFocusMode}
            icon={isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            label={isFocusMode ? (t.exitFocus || 'Exit Focus') : (t.focus || 'Focus')}
            active={isFocusMode}
          />
        )}
        {onTogglePreviewMode && (
          <ToolBtn
            onClick={onTogglePreviewMode}
            icon={<BookOpen size={16} />}
            label={t.preview || 'Preview'}
            active={isPreviewMode}
          />
        )}
        {onOpenGithubCloudSave && (
          <ToolBtn
            onClick={onOpenGithubCloudSave}
            icon={<Cloud size={16} className="text-indigo-400" />}
            label={t.cloudSave || 'Cloud Save'}
          />
        )}
      </div>
    </div>
  );
}

export default React.memo(Toolbar);
