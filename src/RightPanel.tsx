/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { PRESETS, THEME_CATEGORIES } from './theme'
import { FormatState, CustomFont, PageFormat, Panel } from './types'
import GoogleFontsPanel from './GoogleFontsPanel'
import SpellcheckPanel from './SpellcheckPanel'
import SearchPanel from './SearchPanel'
import VersionHistoryPanel from './VersionHistoryPanel'
import TableCreatePanel from './TableCreatePanel'
import { Lang, t as i18nT, LANG_LABELS, LANG_FLAGS } from './i18n'
import { CustomSelect } from './CustomSelect'
import { Download, Upload, FileText, Printer, Copy, Check, FileCode, FileSpreadsheet, FileDown } from 'lucide-react';
import { PanelRightClose } from 'lucide-react'

interface TiptapEditorType {
  chain: () => {
    focus: () => {
      toggleSuperscript: () => { run: () => void };
      toggleSubscript: () => { run: () => void };
      setTextAlign: (align: string) => { run: () => void };
      setParagraph: () => { run: () => void };
      toggleHeading: (args: { level: number }) => { run: () => void };
      toggleBlockquote: () => { run: () => void };
      toggleCodeBlock: () => { run: () => void };
      setFontFamily: (family: string) => { run: () => void };
      setFontSize: (size: number | string) => { run: () => void };
      setLineHeight: (lineHeight: number | string) => { run: () => void };
    };
  };
  isActive: (name: string | Record<string, unknown>, attrs?: Record<string, unknown>) => boolean;
}

const SERIF_FONTS = ['Lora', 'Playfair Display', 'Merriweather', 'EB Garamond', 'Libre Baskerville', 'Crimson Pro', 'Fraunces', 'DM Serif Display', 'Georgia', 'Times New Roman']
const SANS_FONTS = ['Source Sans 3', 'Libre Franklin', 'DM Sans', 'Work Sans', 'Outfit', 'Helvetica', 'Verdana']
const MONO_FONTS = ['JetBrains Mono', 'Space Mono', 'Courier Prime', 'Courier New']

function SectionLabel({ label, uiFont, c }: { label: string, uiFont: string, c: Record<string, unknown> }) {
  return (
    <div style={{
      fontFamily: uiFont, fontSize: '0.64rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: c.textMuted as string, marginBottom: 8, marginTop: 6,
      lineHeight: 1.3,
    }}>
      {label}
    </div>
  )
}

function Accordion({ title, uiFont, c, children, defaultOpen = false }: { title: string, uiFont: string, c: Record<string, unknown>, children: React.ReactNode, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: `1px solid ${c.borderFaint as string}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: uiFont, fontSize: '0.76rem', fontWeight: 600, color: c.text as string,
          transition: 'color 0.12s', textAlign: 'left'
        }}
      >
        <span style={{ flex: 1, paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{title}</span>
        <span style={{ fontSize: '0.65rem', color: c.textMuted as string, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▾</span>
      </button>
      {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
    </div>
  )
}

function NumInputItem({
  val = 0, min = 0, max = 100, step = 1, unit = '', onChange, decimals = 0, monoFont, uiFont, c,
}: {
  val?: number, min?: number, max?: number, step?: number, unit?: string,
  onChange: (v: number) => void, decimals?: number, monoFont: string, uiFont: string, c: Record<string, unknown>,
}) {
  const safeVal = typeof val === 'number' && !isNaN(val) ? val : min
  const fmt = useCallback((n: number) => {
    const num = typeof n === 'number' && !isNaN(n) ? n : 0
    return decimals > 0 ? num.toFixed(decimals) : String(num)
  }, [decimals])

  const [localVal, setLocalVal] = useState(fmt(safeVal))

  useEffect(() => {
    setLocalVal(fmt(safeVal))
  }, [safeVal, fmt])

  const commit = () => {
    const v = parseFloat(localVal)
    if (!isNaN(v)) {
      const clamped = Math.max(min, Math.min(max, v))
      onChange(clamped)
      setLocalVal(fmt(clamped))
    } else {
      setLocalVal(fmt(safeVal))
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, Math.round((safeVal - step) / step) * step))}
        style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${c.borderFaint as string}`, background: 'none', color: c.textMuted as string, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, padding: 0 }}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={localVal}
        onChange={e => {
          setLocalVal(e.target.value)
          const v = parseFloat(e.target.value)
          if (!isNaN(v) && v >= min && v <= max) {
            onChange(v)
          }
        }}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit() }}
        style={{ flex: 1, padding: '3px 4px', textAlign: 'center', fontFamily: monoFont, fontSize: '0.72rem', color: c.text as string, background: 'transparent', border: `1px solid ${c.borderFaint as string}`, borderRadius: 4, outline: 'none', minWidth: 0 }}
      />
      <span style={{ fontFamily: uiFont, fontSize: '0.64rem', color: c.textMuted as string, flexShrink: 0 }}>{unit}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, Math.round((safeVal + step) / step) * step))}
        style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${c.borderFaint as string}`, background: 'none', color: c.textMuted as string, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, padding: 0 }}
      >
        +
      </button>
    </div>
  )
}

function RightPanel(props: Record<string, unknown>) {
  const cProp = props.c as Record<string, unknown> | undefined
  const themeProp = props.theme as Record<string, unknown> | undefined

  const c = {
    bg: (cProp?.bg || themeProp?.bg || '#ffffff') as string,
    heroGrad: (cProp?.heroGrad || themeProp?.heroGrad || '#ffffff') as string,
    cardGrad: (cProp?.cardGrad || themeProp?.cardGrad || '#ffffff') as string,
    text: (cProp?.text || themeProp?.text || '#111827') as string,
    textMuted: (cProp?.textMuted || themeProp?.textMuted || themeProp?.muted || '#4b5563') as string,
    textFaint: (cProp?.textMuted || themeProp?.textMuted || themeProp?.faint || '#9ca3af') as string,
    accent: (cProp?.accent || themeProp?.accent || '#2563eb') as string,
    accentLight: (cProp?.accentLight || themeProp?.accentLight || themeProp?.accentSoft || '#dbeafe') as string,
    accentMid: (cProp?.accentMid || themeProp?.accentMid || '#60a5fa') as string,
    border: (cProp?.border || themeProp?.border || '#e5e7eb') as string,
    borderFaint: (cProp?.borderFaint || themeProp?.borderFaint || '#f3f4f6') as string,
    surface: (cProp?.surface || themeProp?.surface || '#ffffff') as string,
    header: (cProp?.header || themeProp?.header || '#ffffff') as string,
    panel: (cProp?.panel || themeProp?.panel || '#ffffff') as string,
    status: (cProp?.status || themeProp?.status || '#ffffff') as string,
    isDark: Boolean(cProp?.isDark ?? themeProp?.isDark ?? false),
  }

  const [internalPanel, setInternalPanel] = useState<string>('settings')
  const panel = (props.panel as string) || internalPanel
  const onClose = (props.onClose || (() => {})) as () => void
  const onSectionChange = (props.onSectionChange || ((s: string) => setInternalPanel(s))) as (s: string) => void

  const uiFont = (props.uiFont || 'Inter') as string
  const monoFont = (props.monoFont || 'JetBrains Mono') as string

  const lang: Lang = (props.lang || 'vi') as Lang
  const onLangChange = (props.onLangChange || props.onSelectLang || (() => {})) as (l: Lang) => void

  const t = (l: Lang, key: string) => {
    if (props.t && typeof props.t === 'object' && (props.t as Record<string, string>)[key]) {
      return (props.t as Record<string, string>)[key]
    }
    if (typeof props.t === 'function') {
      return (props.t as (lang: Lang, k: string) => string)(l, key)
    }
    return i18nT(l, key as Parameters<typeof i18nT>[1]) || key
  }

  const [internalFormatState, setInternalFormatState] = useState<FormatState>({
    fontFam: (props.docFont as string) || (props.bodyFont as string) || 'Merriweather',
    headingFontFam: (props.headingFont as string) || 'Playfair Display',
    monoFontFam: (props.monoFont as string) || 'JetBrains Mono',
    fontSize: (props.fontSize as number) || 18,
    lineH: 1.7,
    align: 'left',
    maxW: 700,
    paraSpacing: 1,
    letterSpacing: 0,
    wordSpacing: 0,
    firstLineIndent: false,
  })

  const formatState: FormatState = (props.formatState as FormatState) || internalFormatState
  const onFormatChange = (updates: Partial<FormatState>) => {
    if (props.onFormatChange) (props.onFormatChange as (u: Partial<FormatState>) => void)(updates)
    setInternalFormatState(prev => ({ ...prev, ...updates }))
    if (updates.fontFam && props.onSelectDocFont) (props.onSelectDocFont as (f: string) => void)(updates.fontFam)
    if (updates.headingFontFam && props.onSelectHeadingFont) (props.onSelectHeadingFont as (f: string) => void)(updates.headingFontFam)
    if (updates.monoFontFam && props.onSelectMonoFont) (props.onSelectMonoFont as (f: string) => void)(updates.monoFontFam)
  }

  const textareaRef = (props.textareaRef as React.RefObject<HTMLTextAreaElement | null>) || { current: null }
  const docsProp = props.docs as Array<Record<string, unknown>> | undefined
  const activeDoc = (docsProp && docsProp.length > 0) ? docsProp[0] : null
  const content: string = (props.content as string) ?? (activeDoc?.content as string || '')
  const onContentChange = (props.onContentChange || (() => {})) as (content: string) => void
  const title: string = (props.title as string) || (activeDoc?.title as string) || 'Untitled'
  const availableFontNames: string[] = (props.availableFontNames as string[]) || ['Merriweather', 'Lora', 'Playfair Display', 'EB Garamond', 'Libre Baskerville', 'Source Sans 3', 'Inter', 'DM Sans', 'JetBrains Mono']

  const [timerMode, setTimerMode] = useState<'pomodoro' | 'deepwork' | 'stopwatch' | 'custom'>('pomodoro');
  const [timerSet, setTimerSet] = useState(25);
  const [timerLeft, setTimerLeft] = useState(25 * 60);
  const [timerOn, setTimerOn] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [flowToast, setFlowToast] = useState<string | null>(null);
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<string>('all');

  // Daily focus stats persistence in localStorage
  const todayStr = new Date().toISOString().slice(0, 10);
  const [dailyStats, setDailyStats] = useState<{ date: string; totalMinutes: number; sessionsCount: number }>(() => {
    try {
      const saved = localStorage.getItem('kgv_focus_stats_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr) return parsed;
      }
    } catch (e) { console.error(e); }
    return { date: todayStr, totalMinutes: 0, sessionsCount: 0 };
  });

  const lastTypingTimeRef = useRef<number>(0);
  const typingCountRef = useRef<number>(0);

  // Keyboard listener for Flow Shield
  useEffect(() => {
    const handleKeyDown = () => {
      lastTypingTimeRef.current = Date.now();
      typingCountRef.current += 1;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Timer interval ticker
  useEffect(() => {
    if (!timerOn) return;
    const interval = setInterval(() => {
      if (timerMode === 'stopwatch') {
        setTimerLeft(prev => prev + 1);
      } else {
        setTimerLeft(prev => {
          if (prev > 1) return prev - 1;
          // Reached 00:00
          const timeSinceLastTyping = Date.now() - lastTypingTimeRef.current;
          const isTypingInFlow = lastTypingTimeRef.current > 0 && timeSinceLastTyping < 25000 && typingCountRef.current > 2;

          if (isTypingInFlow) {
            // Flow Shield triggered! Extend +1:45 (105 seconds)
            setFlowToast("🛡️ Flow Shield activated: Extended +1:45 (Flow)");
            setTimeout(() => setFlowToast(null), 5000);
            return 105;
          } else {
            // Normal completion
            setTimerDone(true);
            setTimerOn(false);
            const sessionMins = timerMode === 'deepwork' ? 50 : timerMode === 'pomodoro' ? 25 : timerSet;
            setDailyStats(curr => {
              const updated = {
                date: todayStr,
                totalMinutes: curr.totalMinutes + sessionMins,
                sessionsCount: curr.sessionsCount + 1,
              };
              try {
                localStorage.setItem('kgv_focus_stats_v2', JSON.stringify(updated));
              } catch (e) { console.error(e); }
              return updated;
            });
            return 0;
          }
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerOn, timerMode, timerSet, todayStr]);

  const handleSelectPreset = (mode: 'pomodoro' | 'deepwork' | 'stopwatch') => {
    setTimerMode(mode);
    setTimerDone(false);
    setTimerOn(false);
    if (mode === 'pomodoro') {
      setTimerSet(25);
      setTimerLeft(25 * 60);
    } else if (mode === 'deepwork') {
      setTimerSet(50);
      setTimerLeft(50 * 60);
    } else if (mode === 'stopwatch') {
      setTimerSet(0);
      setTimerLeft(0);
    }
  };

  const onTimerSetChange = (v: number) => {
    setTimerMode('custom');
    setTimerSet(v);
    setTimerLeft(v * 60);
    setTimerDone(false);
  };

  const onTimerToggle = () => setTimerOn(v => !v);
  const onTimerReset = () => {
    setTimerLeft(timerMode === 'stopwatch' ? 0 : timerSet * 60);
    setTimerOn(false);
    setTimerDone(false);
  };

  const [hue, setHue] = useState(210)
  const onHueChange = (props.onHueChange as ((h: number) => void)) || ((h: number) => setHue(h))

  const activePresetName = (props.activePresetName || props.themeMode || 'light') as string
  const onPresetSelect = (props.onPresetSelect as ((name: string | null) => void)) || ((name: string | null) => {
    if (props.onSelectTheme && name) (props.onSelectTheme as (t: string) => void)(name.toLowerCase())
  })

  
  const bodyFont = (props.bodyFont || props.docFont || formatState.fontFam || 'Merriweather') as string
  const headingFont = (props.headingFont || formatState.headingFontFam || 'Playfair Display') as string
  const uiFont2 = (props.uiFont2 || props.uiFont || 'Inter') as string

  const customFontsProp = props.customFont as { family?: string; name?: string; id?: string } | undefined
  const customFonts: CustomFont[] = (props.customFonts as CustomFont[]) || (customFontsProp ? [{ id: customFontsProp.id || 'cf-1', name: customFontsProp.name || customFontsProp.family || 'CustomFont', family: customFontsProp.family || customFontsProp.name || 'CustomFont', fileName: customFontsProp.name || customFontsProp.family || 'CustomFont' }] : [])

  const onFontAssign = (props.onFontAssign as ((role: 'body' | 'heading' | 'ui' | 'mono', fontName: string) => void)) || ((role: 'body' | 'heading' | 'ui' | 'mono', fontName: string) => {
    if (role === 'body') {
      if (props.onSelectDocFont) (props.onSelectDocFont as (f: string) => void)(fontName)
      if (props.onFormatChange) (props.onFormatChange as (u: Partial<FormatState>) => void)({ fontFam: fontName })
    }
    if (role === 'heading') {
      if (props.onSelectHeadingFont) (props.onSelectHeadingFont as (f: string) => void)(fontName)
      if (props.onFormatChange) (props.onFormatChange as (u: Partial<FormatState>) => void)({ headingFontFam: fontName })
    }
    if (role === 'mono') {
      if (props.onSelectMonoFont) (props.onSelectMonoFont as (f: string) => void)(fontName)
      if (props.onFormatChange) (props.onFormatChange as (u: Partial<FormatState>) => void)({ monoFontFam: fontName })
    }
    if (role === 'ui') {
      if (props.onSelectUiFont) (props.onSelectUiFont as (f: string) => void)(fontName)
    }
  })

  const onFontUpload = (props.onFontUpload || props.onUploadFont || (() => {})) as (file: File) => void
  const onFontDelete = (props.onFontDelete || props.onRemoveCustomFont || (() => {})) as (id: string) => void

  const pageFormat = (props.pageFormat as PageFormat) || { paperSize: 'A4', orientation: 'portrait', mode: 'pages' }
  const onPageFormatChange = (props.onPageFormatChange as ((pf: PageFormat) => void)) || (() => {})
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  
  const [showGoogleFonts, setShowGoogleFonts] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && props.onImportFile) {
      (props.onImportFile as (f: File) => void)(file)
    }
    if (e.target) e.target.value = ''
  }

  const timerProgress = timerSet > 0 ? (timerSet * 60 - timerLeft) / (timerSet * 60) : 0
  const R = 52
  const CIRC = 2 * Math.PI * R

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const handlePrintPDF = () => {
    if (props.onPrint) {
      (props.onPrint as () => void)();
      return;
    }
    const existing = document.getElementById('prose-print-style')
    if (existing) existing.remove()
    const style = document.createElement('style')
    style.id = 'prose-print-style'
    style.textContent = `@media print { body > *:not(#prose-print-content) { display: none !important; } #prose-print-content { display: block !important; } }`
    document.head.appendChild(style)
    const printDiv = document.createElement('div')
    printDiv.id = 'prose-print-content'
    printDiv.style.cssText = 'display:none; font-family: serif; font-size: 12pt; line-height: 1.6; padding: 2cm; max-width: 21cm; margin: 0 auto;'
    printDiv.innerHTML = `<h1>${title}</h1>` + content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')
    document.body.appendChild(printDiv)
    window.print()
    setTimeout(() => {
      const s = document.getElementById('prose-print-style')
      const d = document.getElementById('prose-print-content')
      if (s) s.remove()
      if (d) d.remove()
    }, 1000)
  }

  const handleDownload = (ext: 'txt' | 'md' | 'html') => {
    let body = content
    if (ext === 'html') {
      body = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${content.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}</body></html>`
    }
    const blob = new Blob([body], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${title}.${ext}`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadDocx = () => {
    const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title}</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>{t(lang, 'printDoc')}</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
<![endif]-->
<style>
  body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.6; margin: 2cm; }
  h1 { font-size: 18pt; } h2 { font-size: 15pt; } h3 { font-size: 13pt; }
  p { margin-bottom: 12pt; }
  blockquote { margin-left: 2em; font-style: italic; }
</style>
</head>
<body>
<h1>${title}</h1>
${content.split('\n\n').map(para => {
  const p = para.trim()
  if (p.startsWith('# ')) return `<h1>${p.slice(2)}</h1>`
  if (p.startsWith('## ')) return `<h2>${p.slice(3)}</h2>`
  if (p.startsWith('### ')) return `<h3>${p.slice(4)}</h3>`
  if (p.startsWith('> ')) return `<blockquote><p>${p.slice(2)}</p></blockquote>`
  const html = p
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\n/g, '<br>')
  return `<p>${html}</p>`
}).join('\n')}
</body>
</html>`
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${title}.doc`; a.click()
    URL.revokeObjectURL(url)
  }

  const applyLinePrefix = (prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = content.lastIndexOf('\n', ta.selectionStart - 1) + 1
    const end = content.indexOf('\n', ta.selectionStart)
    const lineEnd = end === -1 ? content.length : end
    const line = content.slice(start, lineEnd)
    const stripped = line.replace(/^(#{1,4} |> |```\n?|- |\d+\. )/, '')
    const newLine = prefix + stripped
    const newContent = content.slice(0, start) + newLine + content.slice(lineEnd)
    onContentChange(newContent)
    requestAnimationFrame(() => {
      ta.focus()
      const newCaret = start + newLine.length
      ta.setSelectionRange(newCaret, newCaret)
    })
  }

  const label = (text: string) => (
    <label style={{
      fontFamily: uiFont, fontSize: '0.7rem', color: c.textMuted,
      fontWeight: 600, letterSpacing: '0.02em',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, lineHeight: 1.3,
    }}>
      <span>{text}</span>
    </label>
  )

  const numInput = (
    val: number, min: number, max: number, step: number, unit: string,
    onChange: (v: number) => void,
    decimals = 0
  ) => (
    <NumInputItem
      val={val} min={min} max={max} step={step} unit={unit}
      onChange={onChange} decimals={decimals} monoFont={monoFont} uiFont={uiFont} c={c}
    />
  )

  const isOpen = panel !== 'none'

  const TABS: { key: Exclude<Panel, 'none' | 'preview' | 'importexport'>; icon: string; label: string }[] = [
    { key: 'format', icon: '¶', label: t(lang, 'format') || 'Format' },
    { key: 'table', icon: '⊞', label: t(lang, 'insertTable') || 'Table' },
    { key: 'export', icon: '↓', label: t(lang, 'export') || 'Export' },
    { key: 'fonts', icon: 'Aa', label: t(lang, 'fonts') || 'Fonts' },
    { key: 'timer', icon: '◷', label: t(lang, 'timer') || 'Timer' },
    { key: 'history', icon: '⟲', label: t(lang, 'versionHistory') || 'History' },
    { key: 'search', icon: '⌕', label: t(lang, 'findAndReplace') || 'Search' },
    { key: 'spellcheck', icon: '✓', label: t(lang, 'spellCheck') || 'Spell Check' },
    { key: 'settings', icon: '⚙', label: t(lang, 'settings') || 'Settings' },
  ]

  return (
    <div style={{
      width: isOpen ? 300 : 0,
      height: '100%',
      maxHeight: '100%',
      flexShrink: 0,
      display: 'flex',
      overflow: 'hidden',
      transition: 'width 0.22s ease',
      borderLeft: isOpen ? `1px solid ${c.borderFaint}` : 'none',
    }}>
      {isOpen && (
        <div style={{ width: 300, height: '100%', maxHeight: '100%', display: 'flex', flexShrink: 0, flexDirection: 'row', background: c.panel, overflow: 'hidden' }}>
          {/* Vertical tab strip */}
          <div style={{
            width: 40, flexShrink: 0, height: '100%',
            background: c.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)',
            borderRight: `1px solid ${c.borderFaint}`,
            display: 'flex', flexDirection: 'column',
            paddingTop: 8, overflowY: 'auto',
          }}>
            {TABS.map(tab => {
              const active = panel === tab.key
              return (
                <button
                  key={tab.key}
                  title={tab.label}
                  onClick={() => onSectionChange(tab.key)}
                  style={{
                    width: 40, height: 40,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none',
                    background: active ? (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'none',
                    color: active ? c.text : c.textMuted,
                    cursor: 'pointer', fontSize: '0.8rem',
                    borderLeft: `2px solid ${active ? c.text : 'transparent'}`,
                    transition: 'all 0.12s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = c.text }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = c.textMuted }}
                >
                  {tab.icon}
                </button>
              )
            })}
            <div style={{ flex: 1 }} />
          </div>

          {/* Content area */}
          <div style={{ flex: 1, height: '100%', maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden', padding: '14px 16px', minWidth: 0, minHeight: 0 }}>
            {/* Header bar with title and explicit collapse button */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingBottom: 10, marginBottom: 12, borderBottom: `1px solid ${c.borderFaint}`,
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: uiFont, fontSize: '0.8rem', fontWeight: 700, color: c.text, letterSpacing: '0.02em', flex: 1, paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {panel === 'format' ? (t(lang, 'format') || 'Format') :
                 panel === 'table' ? (t(lang, 'insertTable') || 'Insert Table') :
                 panel === 'export' ? (t(lang, 'export') || 'Export') :
                 panel === 'fonts' ? (t(lang, 'fonts') || 'Fonts') :
                 panel === 'timer' ? (t(lang, 'timer') || 'Timer') :
                 panel === 'history' ? (t(lang, 'versionHistory') || 'History') :
                 panel === 'review' ? ('Review Center') :
                 panel === 'search' ? (t(lang, 'findAndReplace') || 'Find and replace') :
                 panel === 'spellcheck' ? (t(lang, 'spellCheck') || 'Spellcheck') :
                 (t(lang, 'settings') || 'Settings')}
              </span>
              <button
                type="button"
                onClick={onClose}
                title={t(lang, 'collapse') || 'Collapse'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', color: c.textMuted,
                  cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = c.textMuted; e.currentTarget.style.background = 'transparent' }}
              >
                <PanelRightClose size={16} />
              </button>
            </div>

        {/* TABLE CREATION PANEL */}
        {panel === 'table' && (
          <TableCreatePanel
            editor={props.editor as any}
            theme={c as any}
            lang={lang}
            uiFont={uiFont}
          />
        )}

        {/* FORMAT PANEL */}
        {panel === 'format' && (
          <div>
            <Accordion title={t(lang, 'typography') || 'Typography'} uiFont={uiFont} c={c} defaultOpen>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  {label(t(lang, 'fontSize') || 'Font size')}
                  {numInput(formatState.fontSize, 8, 96, 1, 'px', v => {
                    const editor = (props.editor as TiptapEditorType | null);
                    if (editor) editor.chain().focus().setFontSize(v).run();
                    onFormatChange({ fontSize: v });
                  })}
                </div>
                <div>
                  {label(t(lang, 'lineHeight') || 'Line height')}
                  {numInput(formatState.lineH, 1.0, 4.0, 0.05, '×', v => {
                    const editor = (props.editor as TiptapEditorType | null);
                    if (editor) editor.chain().focus().setLineHeight(v).run();
                    onFormatChange({ lineH: v });
                  }, 2)}
                </div>
                <div>
                  {label(t(lang, 'letterSpacing') || 'Letter spacing')}
                  {numInput(formatState.letterSpacing, -3, 8, 0.5, 'px', v => {
                    const editor = (props.editor as TiptapEditorType | null);
                    if (editor) (editor.chain().focus() as unknown as Record<string, (arg: number) => { run: () => boolean }>).setLetterSpacing?.(v)?.run?.();
                    onFormatChange({ letterSpacing: v });
                  }, 1)}
                </div>
                <div>
                  {label(t(lang, 'wordSpacing') || 'Word spacing')}
                  {numInput(formatState.wordSpacing, -4, 16, 0.5, 'px', v => {
                    const editor = (props.editor as TiptapEditorType | null);
                    if (editor) (editor.chain().focus() as unknown as Record<string, (arg: number) => { run: () => boolean }>).setWordSpacing?.(v)?.run?.();
                    onFormatChange({ wordSpacing: v });
                  }, 1)}
                </div>
              </div>
            </Accordion>

            <Accordion title={t(lang, 'advancedTypography') || 'Advanced Typography'} uiFont={uiFont} c={c}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  {label(t(lang, 'textTransform') || 'Text transform')}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {([
                      { val: 'none', label: 'Aa' },
                      { val: 'uppercase', label: 'AA' },
                      { val: 'lowercase', label: 'aa' },
                      { val: 'capitalize', label: 'Aa.' },
                    ] as const).map(({ val, label: lbl }) => (
                      <button key={val}
                        onClick={() => {
                          const editor = (props.editor as TiptapEditorType | null);
                          if (editor) (editor.chain().focus() as unknown as Record<string, (arg: string) => { run: () => boolean }>).setTextTransform?.(val)?.run?.();
                          onFormatChange({ textTransform: val } as Partial<FormatState>);
                        }}
                        style={{ padding: '4px 9px', borderRadius: 5, cursor: 'pointer', fontFamily: uiFont, fontSize: '0.7rem', border: `1px solid ${(formatState as unknown as Record<string,string>)['textTransform'] === val ? c.accent : c.border}`, background: (formatState as unknown as Record<string,string>)['textTransform'] === val ? c.accentLight : 'transparent', color: (formatState as unknown as Record<string,string>)['textTransform'] === val ? c.accent : c.textMuted, transition: 'all 0.12s' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  {label(t(lang, 'superscriptSubscript') || 'Superscript / Subscript')}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => {
                        const editor = (props.editor as TiptapEditorType | null);
                        if (editor) editor.chain().focus().toggleSuperscript().run();
                        else { const ta = textareaRef.current; if (ta) { const s = ta.selectionStart, e = ta.selectionEnd; const sel = content.slice(s, e); onContentChange(content.slice(0, s) + `<sup>${sel || 'sup'}</sup>` + content.slice(e)) } }
                      }}
                      style={{ flex: 1, padding: '6px 4px', borderRadius: 6, border: `1px solid ${(props.editor as TiptapEditorType | null)?.isActive?.('superscript') ? c.accent : c.border}`, background: (props.editor as TiptapEditorType | null)?.isActive?.('superscript') ? c.accentLight : 'transparent', fontFamily: uiFont, fontSize: '0.7rem', color: (props.editor as TiptapEditorType | null)?.isActive?.('superscript') ? c.accent : c.textMuted, cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textAlign: 'center' }}>
                      X<sup style={{ fontSize: '0.6em' }}>2</sup> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(lang, 'superscript') || 'Sup'}</span>
                    </button>
                    <button onClick={() => {
                        const editor = (props.editor as TiptapEditorType | null);
                        if (editor) editor.chain().focus().toggleSubscript().run();
                        else { const ta = textareaRef.current; if (ta) { const s = ta.selectionStart, e = ta.selectionEnd; const sel = content.slice(s, e); onContentChange(content.slice(0, s) + `<sub>${sel || 'sub'}</sub>` + content.slice(e)) } }
                      }}
                      style={{ flex: 1, padding: '6px 4px', borderRadius: 6, border: `1px solid ${(props.editor as TiptapEditorType | null)?.isActive?.('subscript') ? c.accent : c.border}`, background: (props.editor as TiptapEditorType | null)?.isActive?.('subscript') ? c.accentLight : 'transparent', fontFamily: uiFont, fontSize: '0.7rem', color: (props.editor as TiptapEditorType | null)?.isActive?.('subscript') ? c.accent : c.textMuted, cursor: 'pointer', transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textAlign: 'center' }}>
                      X<sub style={{ fontSize: '0.6em' }}>2</sub> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(lang, 'subscript') || 'Sub'}</span>
                    </button>
                  </div>
                </div>
                <div>
                  {label(t(lang, 'openTypeFeatures') || 'OpenType features')}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {[
                      { label: t(lang, 'ligatures') || 'Ligatures', feat: 'liga' },
                      { label: t(lang, 'smallCaps') || 'Small caps', feat: 'smcp' },
                      { label: t(lang, 'oldFigures') || 'Old figures', feat: 'onum' },
                      { label: t(lang, 'fractions') || 'Fractions', feat: 'frac' },
                    ].map(({ label: lbl, feat }) => {
                      const active = ((formatState as unknown as Record<string, string>)['fontFeatures'] ?? '').includes(feat)
                      return (
                        <button key={feat}
                          onClick={() => {
                            const current = ((formatState as unknown as Record<string, string>)['fontFeatures'] ?? '').split(',').filter(Boolean)
                            const next = active ? current.filter(f => f !== feat) : [...current, feat]
                            const featStr = next.join(',')
                            const editor = (props.editor as TiptapEditorType | null);
                            if (editor) (editor.chain().focus() as unknown as Record<string, (arg: string) => { run: () => boolean }>).setFontFeatures?.(featStr)?.run?.();
                            onFormatChange({ fontFeatures: featStr } as Partial<FormatState>)
                          }}
                          style={{ padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontFamily: uiFont, fontSize: '0.68rem', border: `1px solid ${active ? c.border : 'transparent'}`, background: active ? (c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent', color: active ? c.text : c.textMuted, transition: 'all 0.12s' }}>
                          {lbl}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Accordion>

            <Accordion title={t(lang, 'paragraph') || 'Paragraph'} uiFont={uiFont} c={c}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  {label(t(lang, 'alignment') || 'Alignment')}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['left', 'center', 'right', 'justify'] as const).map(a => {
                      const editor = (props.editor as TiptapEditorType | null);
                      const active = editor ? editor.isActive({ textAlign: a }) : formatState.align === a;
                      return (
                        <button key={a} onClick={() => {
                          if (editor) editor.chain().focus().setTextAlign(a).run();
                          
                        }}
                          style={{ flex: 1, padding: '5px 0', borderRadius: 5, border: `1px solid ${active ? c.border : 'transparent'}`, background: active ? (c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent', color: active ? c.text : c.textMuted, fontFamily: uiFont, fontSize: '0.68rem', cursor: 'pointer', transition: 'all 0.12s' }}>
                          {a === 'left' ? '≡L' : a === 'center' ? '≡C' : a === 'right' ? '≡R' : '≡J'}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  {label(t(lang, 'paraSpacing') || 'Para spacing')}
                  {numInput(formatState.paraSpacing, 0, 4, 0.1, 'em', v => onFormatChange({ paraSpacing: v }), 1)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ fontFamily: uiFont, fontSize: '0.78rem', color: c.text, flex: 1, paddingRight: 12, textAlign: 'left', lineHeight: 1.35 }}>{t(lang, 'firstLineIndent')}</span>
                  <button onClick={() => onFormatChange({ firstLineIndent: !formatState.firstLineIndent })}
                    style={{ width: 44, height: 24, borderRadius: 12, background: formatState.firstLineIndent ? c.accent : 'transparent', border: `1px solid ${formatState.firstLineIndent ? c.accent : c.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: formatState.firstLineIndent ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: formatState.firstLineIndent ? c.surface : c.border, transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formatState.firstLineIndent && <Check size={12} color={c.accent} strokeWidth={3} />}
                    </div>
                  </button>
                </div>
              </div>
            </Accordion>

            
            <Accordion title={t(lang, 'smartFormatting')} uiFont={uiFont} c={c}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${c.borderFaint}` }}>
                  <span style={{ fontFamily: uiFont, fontSize: '0.78rem', color: c.text, flex: 1, paddingRight: 12, textAlign: 'left', lineHeight: 1.35 }}>{t(lang, 'smartQuotes')}</span>
                  <button onClick={() => onFormatChange({ smartQuotes: !formatState.smartQuotes })}
                    style={{ width: 44, height: 24, borderRadius: 12, background: formatState.smartQuotes ? c.accent : 'transparent', border: `1px solid ${formatState.smartQuotes ? c.accent : c.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: formatState.smartQuotes ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: formatState.smartQuotes ? c.surface : c.border, transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formatState.smartQuotes && <Check size={12} color={c.accent} strokeWidth={3} />}
                    </div>
                  </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${c.borderFaint}` }}>
                  <span style={{ fontFamily: uiFont, fontSize: '0.78rem', color: c.text, flex: 1, paddingRight: 12, textAlign: 'left', lineHeight: 1.35 }}>{t(lang, 'smartEllipses') || 'Smart Ellipses (... to …)'}</span>
                  <button onClick={() => onFormatChange({ smartEllipses: !formatState.smartEllipses })}
                    style={{ width: 44, height: 24, borderRadius: 12, background: formatState.smartEllipses ? c.accent : 'transparent', border: `1px solid ${formatState.smartEllipses ? c.accent : c.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: formatState.smartEllipses ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: formatState.smartEllipses ? c.surface : c.border, transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formatState.smartEllipses && <Check size={12} color={c.accent} strokeWidth={3} />}
                    </div>
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${c.borderFaint}` }}>
                  <span style={{ fontFamily: uiFont, fontSize: '0.78rem', color: c.text, flex: 1, paddingRight: 12, textAlign: 'left', lineHeight: 1.35 }}>{t(lang, 'markdownShortcuts') || 'Markdown Shortcuts'}</span>
                  <button onClick={() => onFormatChange({ markdownShortcuts: !formatState.markdownShortcuts })}
                    style={{ width: 44, height: 24, borderRadius: 12, background: formatState.markdownShortcuts ? c.accent : 'transparent', border: `1px solid ${formatState.markdownShortcuts ? c.accent : c.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: formatState.markdownShortcuts ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: formatState.markdownShortcuts ? c.surface : c.border, transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formatState.markdownShortcuts && <Check size={12} color={c.accent} strokeWidth={3} />}
                    </div>
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${c.borderFaint}` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, paddingRight: 12 }}>
                    <span style={{ fontFamily: uiFont, fontSize: '0.78rem', color: c.text, lineHeight: 1.35 }}>{t(lang, 'doubleSpacePeriod') || 'Double-Space Inserts Period'}</span>
                    <span style={{ fontFamily: uiFont, fontSize: '0.65rem', color: c.textMuted, lineHeight: 1.3 }}>{t(lang, 'doubleSpacePeriodDesc') || 'Double tap the space bar after text to insert a period. When disabled, Prose follows your device settings.'}</span>
                  </div>
                  <button onClick={() => onFormatChange({ doubleSpacePeriod: !formatState.doubleSpacePeriod })}
                    style={{ width: 44, height: 24, borderRadius: 12, background: formatState.doubleSpacePeriod ? c.accent : 'transparent', border: `1px solid ${formatState.doubleSpacePeriod ? c.accent : c.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: formatState.doubleSpacePeriod ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: formatState.doubleSpacePeriod ? c.surface : c.border, transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formatState.doubleSpacePeriod && <Check size={12} color={c.accent} strokeWidth={3} />}
                    </div>
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${c.borderFaint}` }}>
                  <span style={{ fontFamily: uiFont, fontSize: '0.78rem', color: c.text, flex: 1, paddingRight: 12, textAlign: 'left', lineHeight: 1.35 }}>{t(lang, 'toggleHeadings') || 'Toggle Headings (Collapsible)'}</span>
                  <button onClick={() => onFormatChange({ toggleHeadings: !formatState.toggleHeadings })}
                    style={{ width: 44, height: 24, borderRadius: 12, background: formatState.toggleHeadings ? c.accent : 'transparent', border: `1px solid ${formatState.toggleHeadings ? c.accent : c.border}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: formatState.toggleHeadings ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: formatState.toggleHeadings ? c.surface : c.border, transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formatState.toggleHeadings && <Check size={12} color={c.accent} strokeWidth={3} />}
                    </div>
                  </button>
                </div>

                <Accordion title={t(lang, 'dashes') || 'Dashes'} uiFont={uiFont} c={c}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="radio" name="dashesMode" value="disabled" checked={formatState.dashesMode === 'disabled'} onChange={() => onFormatChange({ dashesMode: 'disabled' })} style={{ accentColor: c.accent, marginTop: 2 }} />
                      <span style={{ fontFamily: uiFont, fontSize: '0.78rem', color: c.text, lineHeight: 1.35 }}>{t(lang, 'disabled') || 'Disabled'}</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="radio" name="dashesMode" value="em" checked={formatState.dashesMode === 'em'} onChange={() => onFormatChange({ dashesMode: 'em' })} style={{ accentColor: c.accent, marginTop: 2 }} />
                      <span style={{ fontFamily: uiFont, fontSize: '0.78rem', color: c.text, lineHeight: 1.35 }}>{t(lang, 'emDashOption') || '[ - - ] for Em Dash (—)'}</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="radio" name="dashesMode" value="en-em" checked={formatState.dashesMode === 'en-em'} onChange={() => onFormatChange({ dashesMode: 'en-em' })} style={{ accentColor: c.accent, marginTop: 2 }} />
                      <span style={{ fontFamily: uiFont, fontSize: '0.78rem', color: c.text, lineHeight: 1.35 }}>{t(lang, 'enEmDashOption') || '[ - - ] for En Dash (–), [ - - - ] for Em Dash (—)'}</span>
                    </label>
                  </div>
                </Accordion>
              </div>
            </Accordion>

            <Accordion title={t(lang, 'column') || 'Column'} uiFont={uiFont} c={c}>
              <div>
                {label(t(lang, 'maxWidth') || 'Max width')}
                {numInput(formatState.maxW, 300, 1200, 10, 'px', v => onFormatChange({ maxW: v }))}
              </div>
            </Accordion>

            <Accordion title={t(lang, 'quickStyles')} uiFont={uiFont} c={c}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[
                  { label: 'Normal', action: (ed: TiptapEditorType) => ed?.chain().focus().setParagraph().run(), active: (ed: TiptapEditorType) => ed?.isActive('paragraph') },
                  { label: 'H1', action: (ed: TiptapEditorType) => ed?.chain().focus().toggleHeading({ level: 1 }).run(), active: (ed: TiptapEditorType) => ed?.isActive('heading', { level: 1 }) },
                  { label: 'H2', action: (ed: TiptapEditorType) => ed?.chain().focus().toggleHeading({ level: 2 }).run(), active: (ed: TiptapEditorType) => ed?.isActive('heading', { level: 2 }) },
                  { label: 'H3', action: (ed: TiptapEditorType) => ed?.chain().focus().toggleHeading({ level: 3 }).run(), active: (ed: TiptapEditorType) => ed?.isActive('heading', { level: 3 }) },
                  { label: 'Quote', action: (ed: TiptapEditorType) => ed?.chain().focus().toggleBlockquote().run(), active: (ed: TiptapEditorType) => ed?.isActive('blockquote') },
                  { label: 'Code', action: (ed: TiptapEditorType) => ed?.chain().focus().toggleCodeBlock().run(), active: (ed: TiptapEditorType) => ed?.isActive('codeBlock') },
                ].map(s => {
                  const editor = (props.editor as TiptapEditorType | null);
                  const active = editor ? s.active(editor) : false;
                  return (
                    <button key={s.label} onClick={() => {
                      if (editor) {
                        s.action(editor);
                      } else {
                        applyLinePrefix(s.label === 'H1' ? '# ' : s.label === 'H2' ? '## ' : s.label === 'H3' ? '### ' : s.label === 'Quote' ? '> ' : s.label === 'Code' ? '```\n' : '');
                      }
                    }}
                      style={{
                        padding: '4px 10px', borderRadius: 5,
                        border: `1px solid ${active ? c.border : 'transparent'}`,
                        background: active ? (c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
                        color: active ? c.text : c.textMuted,
                        fontFamily: uiFont, fontSize: '0.72rem',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </Accordion>

            <Accordion title={t(lang, 'pageFormat')} uiFont={uiFont} c={c}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: uiFont, fontSize: '0.64rem', fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{t(lang, 'paperSize')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(['A4', 'Letter', 'Legal', 'A5', 'Tabloid', 'pageless'] as const).map(size => (
                      <button key={size} onClick={() => onPageFormatChange({ ...pageFormat, paperSize: size, mode: size === 'pageless' ? 'pageless' : 'pages' })}
                        style={{
                          padding: '4px 8px', borderRadius: 5, cursor: 'pointer',
                          border: `1px solid ${pageFormat.paperSize === size ? c.accent : c.border}`,
                          background: pageFormat.paperSize === size ? c.accentLight : 'transparent',
                          color: pageFormat.paperSize === size ? c.accent : c.textMuted,
                          fontFamily: uiFont, fontSize: '0.68rem', transition: 'all 0.12s',
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                {pageFormat.paperSize !== 'pageless' && (
                  <div>
                    <div style={{ fontFamily: uiFont, fontSize: '0.64rem', fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{t(lang, 'orientation')}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['portrait', 'landscape'] as const).map(o => (
                        <button key={o} onClick={() => onPageFormatChange({ ...pageFormat, orientation: o })}
                          style={{
                            flex: 1, padding: '6px 4px', borderRadius: 6, cursor: 'pointer',
                            border: `1.5px solid ${pageFormat.orientation === o ? c.accent : c.border}`,
                            background: pageFormat.orientation === o ? c.accentLight : 'transparent',
                            color: pageFormat.orientation === o ? c.accent : c.textMuted,
                            fontFamily: uiFont, fontSize: '0.72rem', transition: 'all 0.12s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'nowrap'
                          }}
                        >
                          {o === 'portrait' ? t(lang, 'portrait') : t(lang, 'landscape')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Accordion>

            {/* PAGE NUMBERING & PAGINATION CONTROLS */}
            <Accordion title={t(lang, 'pageNumbering') || 'Page Numbering'} uiFont={uiFont} c={c} defaultOpen={Boolean(formatState.pageNumbering?.enabled)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Master Switch */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${c.borderFaint}` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, paddingRight: 12 }}>
                    <span style={{ fontFamily: uiFont, fontSize: '0.78rem', fontWeight: 600, color: c.text, lineHeight: 1.35 }}>
                      {t(lang, 'showPageNumbers') || 'Show page numbers'}
                    </span>
                    <span style={{ fontFamily: uiFont, fontSize: '0.65rem', color: c.textMuted, lineHeight: 1.3 }}>
                      {t(lang, 'showPageNumbersDesc') || 'Display dynamic page counter on print & preview'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const current = formatState.pageNumbering || {
                        enabled: false,
                        position: 'bottom-center',
                        style: 'arabic',
                        skipTitlePage: true,
                      };
                      onFormatChange({
                        pageNumbering: {
                          ...current,
                          enabled: !current.enabled,
                        }
                      });
                    }}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: formatState.pageNumbering?.enabled ? c.accent : 'transparent',
                      border: `1px solid ${formatState.pageNumbering?.enabled ? c.accent : c.border}`,
                      cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2,
                      left: formatState.pageNumbering?.enabled ? 22 : 2,
                      width: 18, height: 18, borderRadius: '50%',
                      background: formatState.pageNumbering?.enabled ? c.surface : c.border,
                      transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {formatState.pageNumbering?.enabled && <Check size={12} color={c.accent} strokeWidth={3} />}
                    </div>
                  </button>
                </div>

                {formatState.pageNumbering?.enabled && (
                  <>
                    {/* Position Selector */}
                    <div>
                      <div style={{ fontFamily: uiFont, fontSize: '0.64rem', fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        {t(lang, 'position') || 'Position'}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                        {([
                          { id: 'bottom-center', label: t(lang, 'bottomCenter') || 'Bottom Center' },
                          { id: 'bottom-right', label: t(lang, 'bottomRight') || 'Bottom Right' },
                          { id: 'top-right', label: t(lang, 'topRight') || 'Top Right' },
                        ] as const).map(pos => {
                          const active = (formatState.pageNumbering?.position || 'bottom-center') === pos.id;
                          return (
                            <button
                              key={pos.id}
                              onClick={() => {
                                const current = formatState.pageNumbering || {
                                  enabled: true,
                                  position: 'bottom-center',
                                  style: 'arabic',
                                  skipTitlePage: true,
                                };
                                onFormatChange({
                                  pageNumbering: { ...current, position: pos.id }
                                });
                              }}
                              title={pos.label}
                              style={{
                                padding: '6px 4px', borderRadius: 6, cursor: 'pointer',
                                border: `1px solid ${active ? c.border : 'transparent'}`,
                                background: active ? (c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
                                color: active ? c.text : c.textMuted,
                                fontFamily: uiFont, fontSize: '0.68rem', fontWeight: active ? 600 : 500,
                                transition: 'all 0.12s', textAlign: 'center', whiteSpace: 'nowrap',
                                overflow: 'hidden', textOverflow: 'ellipsis'
                              }}
                            >
                              {pos.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Format Style Selector */}
                    <div>
                      <div style={{ fontFamily: uiFont, fontSize: '0.64rem', fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        {t(lang, 'numberFormat') || 'Number Format'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {([
                          { id: 'arabic', sample: '1, 2, 3...', title: t(lang, 'standardArabic') || 'Standard Arabic' },
                          { id: 'page-of-total', sample: '1 / 12', title: t(lang, 'pageOfTotal') || 'Page X of Y' },
                          { id: 'roman', sample: 'i, ii, iii...', title: t(lang, 'romanNumerals') || 'Roman Numerals' },
                        ] as const).map(fmt => {
                          const active = (formatState.pageNumbering?.style || 'arabic') === fmt.id;
                          return (
                            <button
                              key={fmt.id}
                              onClick={() => {
                                const current = formatState.pageNumbering || {
                                  enabled: true,
                                  position: 'bottom-center',
                                  style: 'arabic',
                                  skipTitlePage: true,
                                };
                                onFormatChange({
                                  pageNumbering: { ...current, style: fmt.id }
                                });
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                                border: `1px solid ${active ? c.border : 'transparent'}`,
                                background: active ? (c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
                                color: active ? c.accent : c.text,
                                fontFamily: uiFont, fontSize: '0.74rem',
                                transition: 'all 0.12s', textAlign: 'left'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: active ? 600 : 500 }}>{fmt.title}</span>
                                <span style={{ fontSize: '0.65rem', color: active ? c.text : c.textMuted, fontFamily: 'monospace' }}>{fmt.sample}</span>
                              </div>
                              {active && <Check size={14} color={c.accent} strokeWidth={2.5} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Skip title page option */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: `1px solid ${c.borderFaint}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, paddingRight: 12 }}>
                        <span style={{ fontFamily: uiFont, fontSize: '0.76rem', color: c.text, lineHeight: 1.35 }}>
                          {t(lang, 'skipTitlePage') || 'Skip title / first page'}
                        </span>
                        <span style={{ fontFamily: uiFont, fontSize: '0.64rem', color: c.textMuted, lineHeight: 1.3 }}>
                          {t(lang, 'skipTitlePageDesc') || 'Start visible numbering from page 2'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const current = formatState.pageNumbering || {
                            enabled: true,
                            position: 'bottom-center',
                            style: 'arabic',
                            skipTitlePage: true,
                          };
                          onFormatChange({
                            pageNumbering: {
                              ...current,
                              skipTitlePage: !current.skipTitlePage,
                            }
                          });
                        }}
                        style={{
                          width: 38, height: 22, borderRadius: 11,
                          background: (formatState.pageNumbering?.skipTitlePage !== false) ? c.accent : 'transparent',
                          border: `1px solid ${(formatState.pageNumbering?.skipTitlePage !== false) ? c.accent : c.border}`,
                          cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 2,
                          left: (formatState.pageNumbering?.skipTitlePage !== false) ? 18 : 2,
                          width: 16, height: 16, borderRadius: '50%',
                          background: (formatState.pageNumbering?.skipTitlePage !== false) ? c.surface : c.border,
                          transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {(formatState.pageNumbering?.skipTitlePage !== false) && <Check size={10} color={c.accent} strokeWidth={3} />}
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Accordion>

            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => onSectionChange('spellcheck')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', padding: '12px 16px', background: 'transparent', border: `1px solid ${c.borderFaint}`,
                  borderRadius: 8, cursor: 'pointer', fontFamily: uiFont, fontSize: '0.9rem', color: c.text
                }}
              >
                {t(lang, 'spellCheck')}
                <span style={{ color: c.textMuted }}>&rarr;</span>
              </button>
            </div>

          </div>
        )}

        {/* EXPORT PANEL */}
        {panel === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="file"
              ref={importFileInputRef}
              onChange={handleImportFileChange}
              accept=".docx,.pdf,.html,.htm,.md,.txt,.json"
              style={{ display: 'none' }}
            />

            <div style={{
              background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${c.borderFaint}`,
              borderRadius: 8, padding: '12px 14px',
            }}>
              <div style={{ fontFamily: `'${bodyFont}', serif`, fontSize: '0.9rem', fontWeight: 600, color: c.text, marginBottom: 8, lineHeight: 1.3 }}>
                {title}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: uiFont, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: c.textMuted, marginBottom: 6 }}>
                {t(lang, 'universalImport') || 'Universal Import'}
              </div>
              <button
                onClick={() => importFileInputRef.current?.click()}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  background: c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: `1.5px dashed ${c.accentMid}`,
                  color: c.text, fontFamily: uiFont, fontSize: '0.82rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}
              >
                <Upload size={16} style={{ color: c.accent }} />
                <span>{t(lang, 'importFile')}</span>
              </button>
            </div>

            <div>
              <div style={{ fontFamily: uiFont, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: c.textMuted, marginBottom: 6, marginTop: 4 }}>
                {t(lang, 'universalExport') || 'Universal Export'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={handleCopy}
                  style={{
                    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    background: copied ? 'hsl(145, 52%, 94%)' : c.accentLight,
                    border: `1.5px solid ${copied ? 'hsl(145, 52%, 70%)' : c.accentMid}`,
                    color: copied ? 'hsl(145, 52%, 34%)' : c.accent,
                    fontFamily: uiFont, fontSize: '0.8rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copied ? t(lang, 'copied') : (t(lang, 'copyToClipboard') || 'Copy to Clipboard')}</span>
                </button>

                <button onClick={() => {
                  if (props.onExportOdt) (props.onExportOdt as () => void)();
                  else handleDownloadDocx();
                }}
                  style={{
                    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    background: 'transparent', border: `1.5px solid ${c.border}`,
                    color: c.text, fontFamily: uiFont, fontSize: '0.8rem', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                >
                  <FileSpreadsheet size={15} style={{ color: c.accent }} />
                  <span>{t(lang, 'exportOdt')}</span>
                </button>

                <button onClick={() => {
                  if (props.onExportHtml) (props.onExportHtml as () => void)();
                  else handleDownload('html');
                }}
                  style={{
                    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    background: 'transparent', border: `1.5px solid ${c.border}`,
                    color: c.text, fontFamily: uiFont, fontSize: '0.8rem', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                >
                  <FileCode size={15} style={{ color: c.accent }} />
                  <span>{t(lang, 'exportHtml')}</span>
                </button>

                <button onClick={() => {
                  if (props.onExportMd) (props.onExportMd as () => void)();
                  else handleDownload('md');
                }}
                  style={{
                    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    background: 'transparent', border: `1.5px solid ${c.border}`,
                    color: c.text, fontFamily: uiFont, fontSize: '0.8rem', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                >
                  <FileText size={15} style={{ color: c.accent }} />
                  <span>{t(lang, 'exportMd')}</span>
                </button>

                <button onClick={() => {
                  if (props.onExportJsonBackup) (props.onExportJsonBackup as () => void)();
                   
                }}
                  style={{
                    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    background: 'transparent', border: `1.5px solid ${c.border}`,
                    color: c.text, fontFamily: uiFont, fontSize: '0.8rem', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                >
                  <Download size={15} style={{ color: c.accent }} />
                  <span>{t(lang, 'backupJson')}</span>
                </button>

                <button onClick={handlePrintPDF}
                  style={{
                    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    background: 'transparent', border: `1.5px solid ${c.border}`,
                    color: c.text, fontFamily: uiFont, fontSize: '0.8rem', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                >
                  <Printer size={15} style={{ color: c.accent }} />
                  <span>{t(lang, 'printDoc')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW PANEL */}
        {panel === 'preview' && (
          <div style={{ fontFamily: `'${bodyFont}', serif`, fontSize: formatState.fontSize - 2, lineHeight: formatState.lineH, color: c.text }}>
            <h2 style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: c.text }}>{title}</h2>
            {content.split(/\n\n+/).filter(p => p.trim()).map((para, i) => {
              const t = para.trim()
              if (t.startsWith('# ')) return <h1 key={i} style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.7rem', color: c.text }}>{t.slice(2)}</h1>
              if (t.startsWith('## ')) return <h2 key={i} style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: c.text }}>{t.slice(3)}</h2>
              if (t.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: `2px solid ${c.accentMid}`, paddingLeft: '0.8em', color: c.textMuted, fontStyle: 'italic', margin: '0.5em 0' }}>{t.slice(2)}</blockquote>
              const html = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/~~(.+?)~~/g, '<s>$1</s>')
              return <p key={i} style={{ marginBottom: '0.8em' }} dangerouslySetInnerHTML={{ __html: html }} />
            })}
          </div>
        )}

        {/* TIMER PANEL */}
        {panel === 'timer' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4, width: '100%' }}>
            {/* Flow Shield Toast */}
            {flowToast && (
              <div style={{
                background: c.accentLight, border: `1px solid ${c.accent}`, color: c.accent,
                padding: '6px 10px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 600,
                marginBottom: 12, textAlign: 'center', width: '100%', animation: 'fadeIn 0.3s ease'
              }}>
                {flowToast}
              </div>
            )}

            {/* Presets & Mode Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4, marginBottom: 16, background: c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', padding: 4, borderRadius: 8, width: '100%' }}>
              <button
                onClick={() => handleSelectPreset('pomodoro')}
                style={{
                  padding: '6px 2px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: timerMode === 'pomodoro' ? c.surface : 'transparent',
                  color: timerMode === 'pomodoro' ? c.accent : c.textMuted,
                  fontFamily: uiFont, fontSize: '0.68rem', fontWeight: timerMode === 'pomodoro' ? 700 : 500,
                  boxShadow: timerMode === 'pomodoro' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s', textAlign: 'center', lineHeight: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {t(lang, 'pomodoro25m') || 'Pomodoro (25m)'}
              </button>
              <button
                onClick={() => handleSelectPreset('deepwork')}
                style={{
                  padding: '6px 2px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: timerMode === 'deepwork' ? c.surface : 'transparent',
                  color: timerMode === 'deepwork' ? c.accent : c.textMuted,
                  fontFamily: uiFont, fontSize: '0.68rem', fontWeight: timerMode === 'deepwork' ? 700 : 500,
                  boxShadow: timerMode === 'deepwork' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s', textAlign: 'center', lineHeight: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {t(lang, 'deepWork50m') || 'Deep Work (50m)'}
              </button>
              <button
                onClick={() => handleSelectPreset('stopwatch')}
                style={{
                  padding: '6px 2px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: timerMode === 'stopwatch' ? c.surface : 'transparent',
                  color: timerMode === 'stopwatch' ? c.accent : c.textMuted,
                  fontFamily: uiFont, fontSize: '0.68rem', fontWeight: timerMode === 'stopwatch' ? 700 : 500,
                  boxShadow: timerMode === 'stopwatch' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s', textAlign: 'center', lineHeight: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {t(lang, 'stopwatch') || 'Stopwatch'}
              </button>
            </div>

            {/* Ring / Clock Display */}
            <div style={{ position: 'relative', width: 134, height: 134, marginBottom: 16 }}>
              <svg width={134} height={134} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={67} cy={67} r={R} fill="none" stroke={c.borderFaint} strokeWidth={6} />
                <circle
                  cx={67} cy={67} r={R} fill="none"
                  stroke={timerDone ? '#4caf72' : c.accent}
                  strokeWidth={6} strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={timerMode === 'stopwatch' ? 0 : CIRC * (1 - (timerDone ? 1 : timerProgress))}
                  style={{ transition: 'stroke-dashoffset 0.9s ease, stroke 0.4s' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {timerDone ? (
                  <span style={{ fontFamily: uiFont, fontSize: '0.9rem', color: '#4caf72', fontWeight: 600 }}>{t(lang, 'done')}</span>
                ) : (
                  <span style={{ fontFamily: monoFont, fontSize: '1.38rem', fontWeight: 500, color: c.text, letterSpacing: '0.02em' }}>
                    {String(Math.floor(timerLeft / 60)).padStart(2, '0')}:{String(timerLeft % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            {timerDone ? (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <p style={{ fontFamily: uiFont, fontSize: '0.85rem', color: c.textMuted, marginBottom: 12 }}>
                  {t(lang, 'focusCompleted') || '✨ Focus session completed! Stats updated.'}
                </p>
                <button onClick={onTimerReset}
                  style={{
                    padding: '6px 20px', borderRadius: 6,
                    background: c.accent, color: c.isDark ? c.bg : 'white', border: 'none',
                    fontFamily: uiFont, fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t(lang, 'resetTimer') || 'Reset Timer'}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                  <button onClick={onTimerToggle}
                    style={{
                      padding: '8px 24px', borderRadius: 20,
                      background: c.accent, color: c.isDark ? c.bg : 'white', border: 'none',
                      fontFamily: uiFont, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.84')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {timerOn ? (t(lang, 'pause') || 'Pause') : (t(lang, 'startFocus') || 'Start Focus')}
                  </button>
                  <button onClick={onTimerReset}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'transparent', border: `1.5px solid ${c.border}`,
                      color: c.textMuted, fontSize: '0.95rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                    title="Reset timer"
                  >
                    ↺
                  </button>
                </div>

                {timerMode !== 'stopwatch' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontFamily: uiFont, fontSize: '0.76rem', color: c.textMuted }}>{t(lang, 'duration')}</span>
                    <input
                      type="number" min={1} max={180} value={timerSet}
                      onChange={e => onTimerSetChange(Math.max(1, Math.min(180, Number(e.target.value))))}
                      style={{
                        width: 52, padding: '4px 7px', borderRadius: 6,
                        border: `1px solid ${c.border}`,
                        fontFamily: monoFont, fontSize: '0.82rem', color: c.text,
                        background: c.surface, textAlign: 'center', outline: 'none',
                      }}
                    />
                    <span style={{ fontFamily: uiFont, fontSize: '0.76rem', color: c.textMuted }}>{t(lang, 'min')}</span>
                  </div>
                )}

                {timerOn && (
                  <p style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.textMuted, textAlign: 'center', marginBottom: 10 }}>
                    {t(lang, 'flowShieldActive') || '🛡️ Flow Shield active'}
                  </p>
                )}
              </>
            )}

            {/* Daily Focus Dashboard */}
            <div style={{
              width: '100%', marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${c.borderFaint}`,
              display: 'flex', flexDirection: 'column', gap: 6
            }}>
              <span style={{ fontFamily: uiFont, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: c.textMuted, letterSpacing: '0.08em' }}>
                {t(lang, 'dailyFocusDashboard') || 'Daily Focus Dashboard'}
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, background: c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.borderFaint}` }}>
                  <div style={{ fontFamily: uiFont, fontSize: '0.65rem', color: c.textMuted }}>{t(lang, 'totalTime') || 'Total Time'}</div>
                  <div style={{ fontFamily: monoFont, fontSize: '0.95rem', fontWeight: 700, color: c.text, marginTop: 2 }}>
                    {Math.floor(dailyStats.totalMinutes / 60)}h {dailyStats.totalMinutes % 60}m
                  </div>
                </div>
                <div style={{ flex: 1, background: c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.borderFaint}` }}>
                  <div style={{ fontFamily: uiFont, fontSize: '0.65rem', color: c.textMuted }}>{t(lang, 'sessions') || 'Sessions'}</div>
                  <div style={{ fontFamily: monoFont, fontSize: '0.95rem', fontWeight: 700, color: c.textMuted, marginTop: 2 }}>
                    {dailyStats.sessionsCount} {t(lang, 'completed') || 'completed'}
                  </div>
                </div>
              </div>
            </div>

            {/* Minimize to Slim Bar button */}
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                marginTop: 10, background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: uiFont, fontSize: '0.7rem', color: c.textMuted, textDecoration: 'underline',
              }}
            >
              {t(lang, 'minimizeToBottomBar') || 'Minimize to Bottom Bar'}
            </button>
          </div>
        )}

        {/* Minimized Slim Bar Widget */}
        {isMinimized && (
          <>
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 3, background: c.borderFaint, zIndex: 9999 }}>
              <div style={{
                height: '100%', background: c.accent, width: `${timerMode === 'stopwatch' ? 100 : (timerProgress * 100)}%`,
                transition: 'width 0.5s linear'
              }} />
            </div>
            <div style={{
              position: 'fixed', bottom: 12, right: 12, zIndex: 9999,
              background: c.surface, border: `1px solid ${c.border}`, borderRadius: 20,
              padding: '6px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', gap: 10, fontFamily: uiFont, fontSize: '0.78rem',
              color: c.text
            }}>
              <span style={{ fontWeight: 600, color: c.accent }}>⏱️</span>
              <span style={{ fontFamily: monoFont, fontWeight: 600 }}>
                {String(Math.floor(timerLeft / 60)).padStart(2, '0')}:{String(timerLeft % 60).padStart(2, '0')}
              </span>
              <button
                onClick={onTimerToggle}
                style={{ background: c.accent, color: '#fff', border: 'none', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
              >
                {timerOn ? (t(lang, 'pause') || 'Pause') : (t(lang, 'play') || 'Play')}
              </button>
              <button
                onClick={() => setIsMinimized(false)}
                style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', fontSize: '0.8rem' }}
                title={t(lang, 'restoreTimer') || 'Restore timer panel'}
              >
                ✕
              </button>
            </div>
          </>
        )}

        {/* IMPORT/EXPORT PANEL */}
        {panel === 'importexport' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Preview */}
            <div style={{
              background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${c.borderFaint}`, borderRadius: 8, padding: '10px 12px',
            }}>
              <div style={{ fontFamily: `'${bodyFont}', serif`, fontSize: '0.82rem', fontWeight: 600, color: c.text, marginBottom: 4 }}>{title}</div>
              <div style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.textMuted, lineHeight: 1.5 }}>
                {content.slice(0, 150)}{content.length > 150 ? '...' : ''}
              </div>
            </div>
            {/* Import */}
            <div>
              <SectionLabel label={t(lang, 'universalImport') || 'Import'} uiFont={uiFont} c={c} />
              <div
                onClick={() => {
                  const inp = document.createElement('input')
                  inp.type = 'file'; inp.accept = '.txt,.md,.html'
                  inp.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0]
                    if (!f) return
                    const r = new FileReader()
                    r.onload = (ev) => {
                      onContentChange(ev.target?.result as string ?? '')
                    }
                    r.readAsText(f)
                  }
                  inp.click()
                }}
                style={{
                  border: `2px dashed ${c.border}`, borderRadius: 8, padding: '14px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = c.accentMid }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = c.border }}
              >
                <div style={{ fontFamily: uiFont, fontSize: '0.74rem', color: c.textMuted, lineHeight: 1.5 }}>
                  {t(lang, 'dropFontHere').replace('font file', 'file (.txt, .md, .html)')}<br />
                  <span style={{ fontSize: '0.66rem', color: c.textMuted }}>{t(lang, 'orClickToBrowse')}</span>
                </div>
              </div>
            </div>
            {/* Export */}
            <div>
              <SectionLabel label={t(lang, 'export')} uiFont={uiFont} c={c} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={handleCopy}
                  style={{
                    padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                    background: copied ? 'hsl(145, 52%, 94%)' : c.accentLight,
                    border: `1.5px solid ${copied ? 'hsl(145, 52%, 70%)' : c.accentMid}`,
                    color: copied ? 'hsl(145, 52%, 34%)' : c.accent,
                    fontFamily: uiFont, fontSize: '0.78rem', fontWeight: 600,
                    transition: 'all 0.22s',
                  }}
                >
                  {copied ? `✓ ${t(lang, 'copied')}` : `⊕ ${t(lang, 'copyToClipboard')}`}
                </button>
                {(['txt', 'md', 'html'] as const).map(ext => (
                  <button key={ext} onClick={() => handleDownload(ext)}
                    style={{
                      padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                      background: 'transparent', border: `1.5px solid ${c.border}`,
                      color: c.text, fontFamily: uiFont, fontSize: '0.78rem',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                  >
                    ↓ .{ext}
                  </button>
                ))}
                <button onClick={handlePrintPDF}
                  style={{
                    padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                    background: 'transparent', border: `1.5px solid ${c.border}`,
                    color: c.text, fontFamily: uiFont, fontSize: '0.78rem',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = c.accentMid)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
                >
                  ⎙ PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FONTS PANEL */}
        {panel === 'fonts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <SectionLabel label={t(lang, 'fontRoles') || 'Font roles'} uiFont={uiFont} c={c} />
              {([
                { role: 'body' as const, label: t(lang, 'body') || 'Body', value: bodyFont },
                { role: 'heading' as const, label: t(lang, 'heading') || 'Heading', value: headingFont },
                { role: 'ui' as const, label: t(lang, 'ui') || 'UI', value: uiFont2 },
              ]).map(({ role, label: lbl, value }) => (
                <div key={role} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: uiFont, fontSize: '0.68rem', color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</span>
                    <span style={{ fontFamily: `'${value}', serif`, fontSize: '0.78rem', color: c.textMuted }}>
                      {value}
                    </span>
                  </div>
                  <CustomSelect
                    value={value}
                    onChange={(v) => onFontAssign(role, v)}
                    theme={c}
                    options={availableFontNames.concat(customFonts.map(f => f.name || f.family)).map(n => ({ value: n, label: n }))}
                    buttonStyle={{
                      width: '100%', padding: '5px 8px', borderRadius: 6,
                      border: `1px solid ${c.border}`,
                      background: c.surface, fontFamily: `'${value}', serif`,
                      fontSize: '0.8rem', color: c.text, cursor: 'pointer', outline: 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                    renderButtonContent={(opt) => (
                      <>
                        <span>{opt?.label || value}</span>
                        <svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' style={{ fill: c.textMuted }}>
                          <path d='M0 0l5 6 5-6z'/>
                        </svg>
                      </>
                    )}
                  />
                </div>
              ))}
            </div>

            <div style={{display: 'none'}}>
              <SectionLabel label="Available fonts" uiFont={uiFont} c={c} />
              {[
                { group: 'Serif', fonts: SERIF_FONTS },
                { group: 'Sans', fonts: SANS_FONTS },
                { group: 'Mono', fonts: MONO_FONTS },
              ].map(({ group, fonts }) => (
                <div key={group} style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: uiFont, fontSize: '0.64rem', color: c.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {group}
                  </div>
                  {fonts.map(name => (
                    <div
                      key={name}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '3px 6px', borderRadius: 5, transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = c.accentLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <button
                        type="button"
                        onClick={() => onFontAssign('body', name)}
                        style={{
                          flex: 1, textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer',
                          fontFamily: `'${name}', serif`, fontSize: '0.84rem', color: c.text,
                        }}
                      >
                        {name}
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          window.dispatchEvent(new CustomEvent('kgv-apply-font-selection', { detail: name }))
                        }}
                        title="Apply font to selected text"
                        style={{
                          padding: '2px 6px', borderRadius: 4,
                          border: `1px solid ${c.border}`, background: 'transparent',
                          color: c.accent, fontFamily: uiFont, fontSize: '0.62rem', fontWeight: 600,
                          cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        ✦ Select
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div>
              <SectionLabel label={t(lang, 'googleFontsEngine')} uiFont={uiFont} c={c} />
              <div style={{ marginBottom: 16 }}>
                <button
                  onClick={() => setShowGoogleFonts(v => !v)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: `1px solid ${showGoogleFonts ? c.accent : c.border}`,
                    background: showGoogleFonts ? (c.isDark ? 'rgba(37,99,235,0.1)' : '#eff6ff') : c.surface,
                    color: showGoogleFonts ? c.accent : c.text, fontFamily: uiFont, fontSize: '0.85rem', fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if (!showGoogleFonts) e.currentTarget.style.borderColor = c.accent }}
                  onMouseLeave={e => { if (!showGoogleFonts) e.currentTarget.style.borderColor = c.border }}
                >
                  <span style={{display:'flex', alignItems:'center', gap: 8}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
                    {t(lang, 'browseGoogleFonts')}
                  </span>
                  <span>{showGoogleFonts ? '▲' : '▼'}</span>
                </button>
                {showGoogleFonts && (
                  <div style={{ marginTop: 8, border: `1px solid ${c.border}`, borderRadius: 8, overflow: 'hidden', padding: 8, background: c.surface }}>
                    <GoogleFontsPanel apiKey={props.apiKey as string} onSaveApiKey={props.onSaveApiKey as any}
                      c={c}
                      lang={lang}
                      uiFont={uiFont}
                      bodyFont={bodyFont}
                      headingFont={headingFont}
                      uiFontRole={uiFont2}
                      onApplyToSelection={(name) => {
                        window.dispatchEvent(new CustomEvent('kgv-apply-font-selection', { detail: name }))
                      }}
                      onApplyToDoc={(name) => {
                        onFontAssign('body', name)
                      }}
                      onApplyToUi={(name) => {
                        onFontAssign('ui', name)
                      }}
                      onAssignRole={onFontAssign}
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <SectionLabel label={t(lang, 'customFonts')} uiFont={uiFont} c={c} />
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault(); setDragOver(false)
                  const file = e.dataTransfer.files[0]
                  if (file) onFontUpload(file)
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? c.accent : c.border}`,
                  borderRadius: 8, padding: '16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: dragOver ? c.accentLight : 'transparent',
                  marginBottom: 10,
                }}
              >
                <div style={{ fontFamily: uiFont, fontSize: '0.74rem', color: c.textMuted, lineHeight: 1.5 }}>
                  {t(lang, 'dropFontHere')}<br />
                  <span style={{ fontSize: '0.66rem', color: c.textMuted }}>{t(lang, 'clickToBrowse')}</span>
                </div>
              </div>
              <input
                ref={fileInputRef} type="file" accept=".ttf,.otf,.woff,.woff2"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) onFontUpload(f);
                  e.target.value = '';
                }}
              />
              {customFonts.map(font => {
                const fontName = font.name || font.family || 'CustomFont';
                const fontId = font.id || font.family || font.name || fontName;
                return (
                  <div key={fontId} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 8px', borderRadius: 6,
                    background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    marginBottom: 4,
                  }}>
                    <span style={{ fontFamily: `'${fontName}', sans-serif`, fontSize: '0.8rem', color: c.text }}>
                      {fontName}
                    </span>
                    <button
                      type="button"
                      onClick={() => onFontDelete(fontId)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: c.textMuted, fontSize: '0.8rem', transition: 'color 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#e05050')}
                      onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* HISTORY PANEL */}
        {panel === 'history' && (
          <VersionHistoryPanel
            activePage={props.activePage as any}
            theme={props.theme as any || c as any}
            lang={lang}
            uiFont={uiFont}
            onRestore={(props.onRestore as any) || (() => {})}
          />
        )}
        
        {/* SEARCH PANEL */}
        {panel === 'search' && (
          <SearchPanel
            c={c as any}
            uiFont={uiFont}
            lang={lang}
          />
        )}
        
        {/* SPELLCHECK PANEL */}
        {panel === 'spellcheck' && (
          <SpellcheckPanel
            c={c as any}
            uiFont={uiFont}
            headingFont={bodyFont}
            lang={lang}
          />
        )}
        
        {/* SETTINGS PANEL */}
        {panel === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
            <div>
              <SectionLabel label={t(lang, 'language') || 'Language'} uiFont={uiFont} c={c} />
              <CustomSelect
                value={lang}
                onChange={val => onLangChange(val as Lang)}
                options={Object.entries(LANG_LABELS).map(([k, v]) => ({ value: k, label: `${LANG_FLAGS[k as Lang] || ''} ${v}` }))}
                theme={c as any}
                disableSearch={true}
                fontFamily={uiFont}
                buttonStyle={{ fontFamily: uiFont }}
              />
            </div>
            <div>
              <SectionLabel label={t(lang, 'themePresets')} uiFont={uiFont} c={c} />
              
              {/* Category Filter Vertical List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                <button
                  onClick={() => setThemeCategoryFilter('all')}
                  style={{
                    padding: '6px 10px', borderRadius: 6, fontSize: '0.72rem', textAlign: 'left',
                    background: themeCategoryFilter === 'all' ? c.accentLight : (c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    color: themeCategoryFilter === 'all' ? c.accent : c.text,
                    border: `1px solid ${themeCategoryFilter === 'all' ? c.accent : c.borderFaint}`,
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontFamily: uiFont, fontWeight: themeCategoryFilter === 'all' ? 600 : 400,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>All Categories</span>
                  <span style={{ fontSize: '0.62rem', opacity: 0.8, fontFamily: monoFont }}>{PRESETS.length}</span>
                </button>
                {THEME_CATEGORIES.map(cat => {
                  const count = PRESETS.filter(p => cat.presetNames.includes(p.name)).length;
                  const isActive = themeCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setThemeCategoryFilter(cat.id)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: '0.72rem', textAlign: 'left',
                        background: isActive ? c.accentLight : (c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                        color: isActive ? c.accent : c.text,
                        border: `1px solid ${isActive ? c.accent : c.borderFaint}`,
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontFamily: uiFont, fontWeight: isActive ? 600 : 400,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{cat.label}</span>
                      <span style={{ fontSize: '0.62rem', opacity: 0.8, fontFamily: monoFont, flexShrink: 0 }}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Render Categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                {THEME_CATEGORIES.filter(cat => themeCategoryFilter === 'all' || themeCategoryFilter === cat.id).map(cat => {
                  const catPresets = PRESETS.filter(p => cat.presetNames.includes(p.name));
                  if (catPresets.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: c.textMuted, marginBottom: 5, paddingBottom: 2, borderBottom: `1px solid ${c.borderFaint}` }}>
                        {cat.label}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {catPresets.map(preset => (
                          <button
                            key={preset.name}
                            onClick={() => onPresetSelect(activePresetName === preset.name ? null : preset.name)}
                            style={{
                              padding: '8px 12px', borderRadius: 8, textAlign: 'left',
                              border: `1.5px solid ${activePresetName === preset.name ? c.accent : c.borderFaint}`,
                              background: activePresetName === preset.name ? c.accentLight : (c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                              cursor: 'pointer', transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                              width: '100%'
                            }}
                          >
                            <span style={{ fontFamily: uiFont, fontSize: '0.75rem', fontWeight: 600, color: activePresetName === preset.name ? c.accent : c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{preset.name}</span>
                            <div style={{
                              width: 90, height: 28, borderRadius: 6,
                              background: preset.bg,
                              border: `1px solid ${preset.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                              position: 'relative', overflow: 'hidden', flexShrink: 0
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {[
                                  { bg: preset.text, border: preset.bg },
                                  { bg: preset.accent, border: preset.bg },
                                  { bg: preset.accentMid, border: preset.bg },
                                  { bg: preset.surface, border: preset.border }
                                ].map((item, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      width: 14, height: 14, borderRadius: '50%',
                                      background: item.bg,
                                      border: `1.5px solid ${item.border}`,
                                      marginLeft: idx === 0 ? 0 : -5,
                                      boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                                    }}
                                  />
                                ))}
                                <div style={{
                                  width: 14, height: 14, borderRadius: '50%',
                                  background: preset.surface,
                                  color: preset.text,
                                  border: `1.5px solid ${preset.accent}`,
                                  marginLeft: -5,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.45rem', fontWeight: 700, fontFamily: uiFont,
                                  boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                                }}>
                                  A
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '12px 0', borderTop: `1px solid ${c.borderFaint}`, textAlign: 'center' }}>
              <span style={{ fontFamily: uiFont, fontSize: '0.66rem', color: c.textMuted }}>{t(lang, 'appName')}</span>
            </div>
          </div>
        )}
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(RightPanel);
