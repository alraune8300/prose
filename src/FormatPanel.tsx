import React from 'react';
import { Plus, Minus, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { Accordion } from './components/Accordion';
import { t, Lang } from './i18n';
import type { ThemeColors, FormatState, PageFormat } from './types';

interface FormatPanelProps {
  editor: any;
  formatState: FormatState;
  onFormatChange: (u: Partial<FormatState>) => void;
  pageFormat: PageFormat;
  onPageFormatChange: (pf: PageFormat) => void;
  c: ThemeColors;
  uiFont: string;
  lang: string;
  content: string;
  onContentChange: (c: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  applyLinePrefix: (prefix: string) => void;
}


function FormatNumberControl({ label, value, onChange, min, max, step, decimals = 0, theme, uiFont }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number, decimals?: number, theme: ThemeColors, uiFont?: string }) {
  const onInc = () => onChange(Math.min(max, Math.round((value + step) / step) * step));
  const onDec = () => onChange(Math.max(min, Math.round((value - step) / step) * step));
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginBottom: 16 }}>
      <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.65rem', letterSpacing: '0.05em', color: theme.text, textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '6px 0',
        borderTop: `1px solid ${theme.borderFaint}`,
        borderBottom: `1px solid ${theme.borderFaint}`,
      }}>
        <button type="button" onClick={onInc} style={{ background: 'transparent', border: 'none', color: theme.text, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 8px' }}><Plus size={14} strokeWidth={2.5} /></button>
        <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.75rem', fontStyle: 'italic', color: theme.text }}>
          {decimals > 0 ? Number(value.toFixed(decimals)) : value}
        </span>
        <button type="button" onClick={onDec} style={{ background: 'transparent', border: 'none', color: theme.text, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 8px' }}><Minus size={14} strokeWidth={2.5} /></button>
      </div>
    </div>
  );
}

function SmartToggle({ label, checked, onChange, theme, uiFont }: { label: string, checked: boolean, onChange: () => void, theme: ThemeColors, uiFont?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', cursor: 'pointer' }} onClick={onChange}>
      <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.75rem', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 8, fontFamily: (uiFont || 'inherit'), fontSize: '0.6rem', letterSpacing: '0.05em' }}>
        <span style={{ color: checked ? theme.text : theme.textMuted, opacity: checked ? 1 : 0.4 }}>ON</span>
        <span style={{ color: !checked ? theme.text : theme.textMuted, opacity: !checked ? 1 : 0.4 }}>OFF</span>
      </div>
    </div>
  );
}

export function FormatPanel({ editor, formatState, onFormatChange, pageFormat, onPageFormatChange, c, uiFont, lang, content, onContentChange, textareaRef, applyLinePrefix }: FormatPanelProps) {
  
  const textBtnStyle = (active: boolean) => ({
    background: 'transparent',
    border: 'none',
    color: active ? c.text : c.textMuted,
    opacity: active ? 1 : 0.6,
    cursor: 'pointer',
    fontFamily: (uiFont || 'inherit'),
    fontSize: '0.75rem',
    textAlign: 'center' as const,
    padding: '4px 0',
    transition: 'opacity 0.2s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 8px 16px 8px' }}>
      <Accordion title={t(lang as Lang, 'typography') || 'Typography'} uiFont={uiFont} c={c}>
        <FormatNumberControl label={t(lang as Lang, 'fontSize') || 'Font Size'} value={formatState.fontSize} min={8} max={96} step={1} onChange={v => { if (editor) editor.chain().focus().setFontSize(v).run(); onFormatChange({ fontSize: v }); }} theme={c} uiFont={uiFont} />
        <FormatNumberControl label={t(lang as Lang, 'lineHeight') || 'Line Height'} value={formatState.lineH} min={1.0} max={4.0} step={0.05} decimals={2} onChange={v => { if (editor) editor.chain().focus().setLineHeight(v).run(); onFormatChange({ lineH: v }); }} theme={c} uiFont={uiFont} />
        <FormatNumberControl label={t(lang as Lang, 'letterSpacing') || 'Letter Spacing'} value={formatState.letterSpacing} min={-3} max={8} step={0.5} decimals={1} onChange={v => { if (editor) editor.chain().focus().setLetterSpacing?.(v).run(); onFormatChange({ letterSpacing: v }); }} theme={c} uiFont={uiFont} />
        <FormatNumberControl label={t(lang as Lang, 'wordSpacing') || 'Word Spacing'} value={formatState.wordSpacing} min={-4} max={16} step={0.5} decimals={1} onChange={v => { if (editor) editor.chain().focus().setWordSpacing?.(v).run(); onFormatChange({ wordSpacing: v }); }} theme={c} uiFont={uiFont} />
      </Accordion>

      <Accordion title={t(lang as Lang, 'paragraph') || 'Paragraph'} uiFont={uiFont} c={c}>
        <FormatNumberControl label={t(lang as Lang, 'paraSpacing') || 'Paragraph Spacing'} value={formatState.paraSpacing} min={0} max={4} step={0.1} decimals={1} onChange={v => onFormatChange({ paraSpacing: v })} theme={c} uiFont={uiFont} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.65rem', letterSpacing: '0.05em', color: c.text, textTransform: 'uppercase' }}>{t(lang as Lang, 'alignment') || 'Alignment'}</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
            {[
              { id: 'left', icon: AlignLeft },
              { id: 'center', icon: AlignCenter },
              { id: 'right', icon: AlignRight },
              { id: 'justify', icon: AlignJustify },
            ].map(({ id: a, icon: IconComp }) => {
              const active = editor ? editor.isActive({ textAlign: a }) : formatState.align === a;
              return (
                <button
                  key={a} type="button"
                  onClick={() => {
                    if (editor) editor.chain().focus().setTextAlign(a).run();
                    onFormatChange({ align: a as any });
                  }}
                  style={{
                    background: 'transparent', border: 'none',
                    color: active ? c.text : c.textMuted,
                    opacity: active ? 1 : 0.4,
                    cursor: 'pointer', transition: 'opacity 0.2s',
                    padding: 4
                  }}
                >
                  <IconComp size={16} strokeWidth={active ? 2.5 : 2} />
                </button>
              );
            })}
          </div>
        </div>
      </Accordion>

      <Accordion title={t(lang as Lang, 'quickStyles') || 'Quick Styles'} uiFont={uiFont} c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0 12px 0' }}>
          {[
            { label: 'NORMAL', action: (ed: any) => ed?.chain().focus().setParagraph().run(), active: (ed: any) => ed?.isActive('paragraph') },
            { label: 'H1', action: (ed: any) => ed?.chain().focus().toggleHeading({ level: 1 }).run(), active: (ed: any) => ed?.isActive('heading', { level: 1 }) },
            { label: 'H2', action: (ed: any) => ed?.chain().focus().toggleHeading({ level: 2 }).run(), active: (ed: any) => ed?.isActive('heading', { level: 2 }) },
            { label: 'H3', action: (ed: any) => ed?.chain().focus().toggleHeading({ level: 3 }).run(), active: (ed: any) => ed?.isActive('heading', { level: 3 }) },
            { label: 'QUOTE', action: (ed: any) => ed?.chain().focus().toggleBlockquote().run(), active: (ed: any) => ed?.isActive('blockquote') },
            { label: 'CODE', action: (ed: any) => ed?.chain().focus().toggleCodeBlock().run(), active: (ed: any) => ed?.isActive('codeBlock') },
          ].map(s => {
            const active = editor ? s.active(editor) : false;
            return (
              <button key={s.label} onClick={() => {
                if (editor) s.action(editor);
                else applyLinePrefix(s.label === 'H1' ? '# ' : s.label === 'H2' ? '## ' : s.label === 'H3' ? '### ' : s.label === 'QUOTE' ? '> ' : s.label === 'CODE' ? '```\n' : '');
              }}
                style={textBtnStyle(active)}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </Accordion>

      <Accordion title={t(lang as Lang, 'advanced') || 'Advanced'} uiFont={uiFont} c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.65rem', letterSpacing: '0.05em', color: c.text, textTransform: 'uppercase' }}>{t(lang as Lang, 'textTransform') || 'Text Transform'}</span>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {([{ val: 'uppercase', label: 'AA' }, { val: 'capitalize', label: 'Aa' }, { val: 'lowercase', label: 'aa' }] as const).map(({ val, label: lbl }) => (
                <button key={val} onClick={() => {
                  if (editor) editor.chain().focus().setTextTransform?.(val).run();
                  onFormatChange({ textTransform: val } as any);
                }} style={textBtnStyle((formatState as any).textTransform === val)}>{lbl}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.65rem', letterSpacing: '0.05em', color: c.text, textTransform: 'uppercase' }}>{t(lang as Lang, 'superscript') || 'Superscript / Subscript'}</span>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <button onClick={() => {
                if (editor) editor.chain().focus().toggleSuperscript().run();
                else { const ta = textareaRef.current; if (ta) { const s = ta.selectionStart, e = ta.selectionEnd; const sel = content.slice(s, e); onContentChange(content.slice(0, s) + `<sup>${sel || 'sup'}</sup>` + content.slice(e)) } }
              }} style={textBtnStyle(editor?.isActive('superscript'))}>X<sup style={{ fontSize: '0.65em' }}>2</sup> Superscript</button>
              
              <button onClick={() => {
                if (editor) editor.chain().focus().toggleSubscript().run();
                else { const ta = textareaRef.current; if (ta) { const s = ta.selectionStart, e = ta.selectionEnd; const sel = content.slice(s, e); onContentChange(content.slice(0, s) + `<sub>${sel || 'sub'}</sub>` + content.slice(e)) } }
              }} style={textBtnStyle(editor?.isActive('subscript'))}>X<sub style={{ fontSize: '0.65em' }}>2</sub> Supscript</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.65rem', letterSpacing: '0.05em', color: c.text, textTransform: 'uppercase' }}>{t(lang as Lang, 'openTypeFeatures') || 'OpenType Features'}</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'center' }}>
              {[
                { label: 'Ligatures', feat: 'liga' },
                { label: 'Small Caps', feat: 'smcp' },
                { label: 'Old Figures', feat: 'onum' },
                { label: 'Fractions', feat: 'frac' },
              ].map(({ label: lbl, feat }) => {
                const active = ((formatState as any).fontFeatures ?? '').includes(feat);
                return (
                  <button key={feat} onClick={() => {
                    const current = ((formatState as any).fontFeatures ?? '').split(',').filter(Boolean);
                    const next = active ? current.filter((f: string) => f !== feat) : [...current, feat];
                    const featStr = next.join(',');
                    if (editor) editor.chain().focus().setFontFeatures?.(featStr).run();
                    onFormatChange({ fontFeatures: featStr } as any);
                  }} style={textBtnStyle(active)}>{lbl}</button>
                );
              })}
            </div>
          </div>

        </div>
      </Accordion>

      <Accordion title={t(lang as Lang, 'page') || 'Page'} uiFont={uiFont} c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.65rem', letterSpacing: '0.05em', color: c.text, textTransform: 'uppercase' }}>{t(lang as Lang, 'paperSize') || 'Paper Size'}</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '4px 0' }}>
              {(['A4', 'A5', 'Tabloid', 'pageless', 'Letter', 'Legal'] as const).map(size => (
                <button key={size} onClick={() => onPageFormatChange({ ...pageFormat, paperSize: size, mode: size === 'pageless' ? 'pageless' : 'pages' })}
                  style={textBtnStyle(pageFormat.paperSize === size)}
                >
                  {size === 'pageless' ? 'Pageless' : size}
                </button>
              ))}
            </div>
          </div>
          
          <FormatNumberControl label={t(lang as Lang, 'maxWidth') || 'Max Width'} value={formatState.maxW} min={300} max={1200} step={10} onChange={v => onFormatChange({ maxW: v })} theme={c} uiFont={uiFont} />
        </div>
      </Accordion>

      <Accordion title={t(lang as Lang, 'smartFormatting') || 'Smart Formatting'} uiFont={uiFont} c={c}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SmartToggle label={t(lang as Lang, 'smartQuotes') || 'Smart Quotes'} checked={Boolean(formatState.smartQuotes)} onChange={() => onFormatChange({ smartQuotes: !formatState.smartQuotes })} theme={c} uiFont={uiFont} />
          <SmartToggle label={t(lang as Lang, 'smartEllipses') || 'Smart Ellipses'} checked={Boolean(formatState.smartEllipses)} onChange={() => onFormatChange({ smartEllipses: !formatState.smartEllipses })} theme={c} uiFont={uiFont} />
          <SmartToggle label="SMART ARROWS" checked={Boolean(formatState.smartArrows ?? true)} onChange={() => onFormatChange({ smartArrows: !(formatState.smartArrows ?? true) })} theme={c} uiFont={uiFont} />
          <SmartToggle label={t(lang as Lang, 'markdownShortcuts') || 'Markdown Shortcuts'} checked={Boolean(formatState.markdownShortcuts ?? true)} onChange={() => onFormatChange({ markdownShortcuts: !(formatState.markdownShortcuts ?? true) })} theme={c} uiFont={uiFont} />
          <SmartToggle label={t(lang as Lang, 'doubleSpacePeriod') || 'Double-Space Period'} checked={Boolean(formatState.doubleSpacePeriod)} onChange={() => onFormatChange({ doubleSpacePeriod: !formatState.doubleSpacePeriod })} theme={c} uiFont={uiFont} />
          <SmartToggle label={t(lang as Lang, 'typewriterMode') || 'Typewriter Mode'} checked={Boolean(formatState.typewriterScroll)} onChange={() => onFormatChange({ typewriterScroll: !formatState.typewriterScroll })} theme={c} uiFont={uiFont} />
        </div>
      </Accordion>

    </div>
  );
}
