/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { PRESETS, THEME_CATEGORIES } from './theme'
import { FormatState, CustomFont, PageFormat, Panel } from './types'
import GoogleFontsPanel from './GoogleFontsPanel'
import SearchPanel from './SearchPanel'
import VersionHistoryPanel from './VersionHistoryPanel'
import TableInspectorPanel from './TableInspectorPanel'
import { DocumentOutlinePanel } from './DocumentOutlinePanel'
import { ArchivePanel } from './ArchivePanel'
import { TrashPanel } from './TrashPanel'
import { Lang, t as i18nT, LANG_LABELS, LANG_FLAGS } from './i18n'
import { Accordion } from './components/Accordion'
import { CustomSelect } from './CustomSelect'
import {
  Download, Upload, FileText, Printer, Copy, Check, FileCode, FileSpreadsheet,
  PanelRightClose, Sliders, Table as TableIcon, Type, Clock, History, Search, Settings,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, ChevronDown, RotateCcw, X, Plus, Minus,
  Sparkles, Palette, List, Archive, Trash2
} from 'lucide-react'

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


function ToggleSwitch({
  checked, onChange, label, description, uiFont, c
}: {
  checked: boolean, onChange: () => void, label: string, description?: string, uiFont: string, c: Record<string, unknown>
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 0', gap: 12
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: uiFont, fontSize: '0.75rem', fontWeight: 500, color: c.text as string, lineHeight: 1.35 }}>
          {label}
        </span>
        {description && (
          <span style={{ fontFamily: uiFont, fontSize: '0.64rem', color: c.textMuted as string, lineHeight: 1.3, marginTop: 2 }}>
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onChange}
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: checked ? (c.accent as string) : (c.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
          border: 'none', cursor: 'pointer', position: 'relative',
          transition: 'background 0.2s ease', flexShrink: 0
        }}
      >
        <div style={{
          position: 'absolute', top: 2,
          left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {checked && <Check size={10} color={c.accent as string} strokeWidth={3} />}
        </div>
      </button>
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
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
      border: `1px solid ${c.borderFaint as string}`,
      borderRadius: 6, padding: '2px 4px'
    }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, Math.round((safeVal - step) / step) * step))}
        style={{
          width: 22, height: 22, borderRadius: 4, border: 'none',
          background: 'transparent', color: c.textMuted as string,
          fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.12s'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <Minus size={12} />
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
        style={{
          flex: 1, padding: '2px 0', textAlign: 'center',
          fontFamily: monoFont, fontSize: '0.75rem', fontWeight: 600,
          color: c.text as string, background: 'transparent',
          border: 'none', outline: 'none', minWidth: 36
        }}
      />
      {unit && (
        <span style={{ fontFamily: uiFont, fontSize: '0.65rem', color: c.textMuted as string, paddingRight: 4, flexShrink: 0 }}>
          {unit}
        </span>
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(max, Math.round((safeVal + step) / step) * step))}
        style={{
          width: 22, height: 22, borderRadius: 4, border: 'none',
          background: 'transparent', color: c.textMuted as string,
          fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.12s'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <Plus size={12} />
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
  const [themeSearchQuery, setThemeSearchQuery] = useState<string>('');

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
            setFlowToast("🛡️ Flow Shield: +1:45");
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
  const R = 48
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
    <div style={{
      fontFamily: uiFont, fontSize: '0.72rem', color: c.textMuted,
      fontWeight: 500, display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 5, lineHeight: 1.3,
    }}>
      <span>{text}</span>
    </div>
  )

  const numInput = (
    val: number, min: number, max: number, step: number, unit: string,
    onChange: (v: number) => void,
    decimals = 0
  ) => (
    <NumInputItem
      val={val} min={min} max={max} step={step} unit={unit}
      onChange={onChange} decimals={decimals} monoFont={monoFont} uiFont={uiFont} c={c} />
  )

  const isOpen = panel !== 'none'

  const TABS: { key: Exclude<Panel, 'none' | 'preview' | 'importexport'>; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string }[] = [
    { key: 'outline', icon: List, label: t(lang, 'outline') || 'Outline' },
    { key: 'format', icon: Sliders, label: t(lang, 'format') || 'Format' },
    { key: 'table', icon: TableIcon, label: t(lang, 'insertTable') || 'Table' },
    { key: 'export', icon: Download, label: t(lang, 'export') || 'Export & Snapshots' },
    { key: 'fonts', icon: Type, label: t(lang, 'fonts') || 'Fonts' },
    { key: 'archive', icon: Archive, label: t(lang, 'archive') || 'Archive' },
    { key: 'trash', icon: Trash2, label: t(lang, 'bin') || 'Trash' },
    { key: 'timer', icon: Clock, label: t(lang, 'timer') || 'Timer' },
    { key: 'search', icon: Search, label: t(lang, 'findAndReplace') || 'Search' },
    { key: 'settings', icon: Settings, label: t(lang, 'settings') || 'Settings' },
  ]

  return (
    <div style={{
      width: isOpen ? 320 : 0,
      height: '100%',
      maxHeight: '100%',
      flexShrink: 0,
      display: 'flex',
      overflow: 'hidden',
      transition: 'width 0.2s ease',
      borderLeft: isOpen ? `1px solid ${c.borderFaint}` : 'none',
    }}>
      {isOpen && (
        <div style={{ width: 320, height: '100%', maxHeight: '100%', display: 'flex', flexShrink: 0, flexDirection: 'row', background: c.panel, overflow: 'hidden' }}>
          {/* Vertical Tab Strip */}
          <div style={{
            width: 44, flexShrink: 0, height: '100%',
            background: c.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
            borderRight: `1px solid ${c.borderFaint}`,
            display: 'flex', flexDirection: 'column',
            paddingTop: 10, overflowY: 'auto', gap: 4, alignItems: 'center'
          }}>
            {TABS.map(tab => {
              const active = panel === tab.key
              const TabIconComponent = tab.icon
              return (
                <button
                  key={tab.key}
                  title={tab.label}
                  onClick={() => {
                    if (active) onClose();
                    else onSectionChange(tab.key);
                  }}
                  style={{
                    width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', borderRadius: 8,
                    background: active ? (c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
                    color: active ? c.text : c.textMuted,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = c.textMuted; e.currentTarget.style.background = 'transparent' } }}
                >
                  <TabIconComponent size={16} />
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, height: '100%', maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden', padding: '16px 16px', minWidth: 0, minHeight: 0 }}>
            {/* Header bar with title and explicit collapse button */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingBottom: 10, marginBottom: 16, borderBottom: `1px solid ${c.borderFaint}`,
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: uiFont, fontSize: '0.88rem', fontWeight: 700, color: c.text, letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1, paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {panel === 'outline' ? (t(lang, 'outline') || 'Outline') :
                 panel === 'format' ? (t(lang, 'format') || 'Format') :
                 panel === 'table' ? (t(lang, 'insertTable') || 'Insert Table') :
                 panel === 'export' ? 'Import / Export & Snapshots' :
                 panel === 'fonts' ? (t(lang, 'fonts') || 'Fonts') :
                 panel === 'archive' ? (t(lang, 'archive') || 'Archive') :
                 panel === 'trash' ? (t(lang, 'bin') || 'Trash') :
                 panel === 'timer' ? (t(lang, 'timer') || 'Timer') :
                 panel === 'review' ? ('Review Center') :
                 panel === 'search' ? (t(lang, 'findAndReplace') || 'Find and replace') :
                 (t(lang, 'settings') || 'Settings')}
              </span>
              <button
                type="button"
                onClick={onClose}
                title={t(lang, 'collapse') || 'Collapse'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', color: c.textMuted,
                  cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = c.textMuted; e.currentTarget.style.background = 'transparent' }}
              >
                <PanelRightClose size={15} />
              </button>
            </div>

            {/* OUTLINE PANEL */}
            {panel === 'outline' && (
              <div className="flex flex-col h-full overflow-y-auto w-full">
                <DocumentOutlinePanel
                  theme={c as any}
                  uiFont={uiFont}
                  lang={lang}
                />
              </div>
            )}

            {/* ARCHIVE PANEL */}
            {panel === 'archive' && (
              <div className="flex flex-col h-full overflow-y-auto w-full">
                <ArchivePanel
                  archive={(props.archive as any) || []}
                  c={c as any}
                  theme={props.theme as any}
                  uiFont={uiFont}
                  lang={lang}
                  onUnarchivePage={(props.onUnarchivePage as any) || (() => {})}
                  onDeletePage={(props.onDeletePage as any) || (() => {})}
                  onSelectPage={props.onSelectPage as any}
                />
              </div>
            )}

            {/* TRASH PANEL */}
            {panel === 'trash' && (
              <div className="flex flex-col h-full overflow-y-auto w-full">
                <TrashPanel
                  bin={(props.bin as any) || []}
                  c={c as any}
                  theme={props.theme as any}
                  uiFont={uiFont}
                  lang={lang}
                  onRestorePage={(props.onRestorePage as any) || (() => {})}
                  onPermanentDeletePage={(props.onPermanentDeletePage as any || props.onPermanentDelete as any) || (() => {})}
                  onEmptyBin={(props.onEmptyBin as any) || (() => {})}
                />
              </div>
            )}

            {/* TABLE INSPECTOR PANEL */}
            {panel === 'table' && (
              <TableInspectorPanel
                editor={props.editor as any}
                theme={c as any}
                lang={lang}
                uiFont={uiFont}
              />
            )}

            {/* FORMAT PANEL */}
            {panel === 'format' && (
              <div>
                <Accordion title={t(lang, 'typography') || 'Typography'} uiFont={uiFont} c={c}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

                <Accordion title={t(lang, 'paragraph') || 'Paragraph'} uiFont={uiFont} c={c}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      {label(t(lang, 'alignment') || 'Alignment')}
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3,
                        background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
                        padding: 3, borderRadius: 7, border: `1px solid ${c.borderFaint}`
                      }}>
                        {[
                          { id: 'left', icon: AlignLeft },
                          { id: 'center', icon: AlignCenter },
                          { id: 'right', icon: AlignRight },
                          { id: 'justify', icon: AlignJustify },
                        ].map(({ id: a, icon: IconComp }) => {
                          const editor = (props.editor as TiptapEditorType | null);
                          const active = editor ? editor.isActive({ textAlign: a }) : formatState.align === a;
                          return (
                            <button
                              key={a}
                              type="button"
                              onClick={() => {
                                if (editor) editor.chain().focus().setTextAlign(a).run();
                                onFormatChange({ align: a as any });
                              }}
                              style={{
                                padding: '6px 0', borderRadius: 5, border: 'none',
                                background: active ? (c.isDark ? 'rgba(255,255,255,0.12)' : '#ffffff') : 'transparent',
                                color: active ? c.accent : c.textMuted,
                                boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                                cursor: 'pointer', transition: 'all 0.12s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <IconComp size={14} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      {label(t(lang, 'paraSpacing') || 'Para spacing')}
                      {numInput(formatState.paraSpacing, 0, 4, 0.1, 'em', v => onFormatChange({ paraSpacing: v }), 1)}
                    </div>
                    <ToggleSwitch
                      checked={Boolean(formatState.firstLineIndent)}
                      onChange={() => onFormatChange({ firstLineIndent: !formatState.firstLineIndent })}
                      label={t(lang, 'firstLineIndent') || 'First line indent'}
                      uiFont={uiFont}
                      c={c} />
                  </div>
                </Accordion>

                <Accordion title={t(lang, 'quickStyles')} uiFont={uiFont} c={c}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
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
                            padding: '6px 4px', borderRadius: 6,
                            border: `1px solid ${active ? c.accent : c.borderFaint}`,
                            background: active ? c.accentLight : 'transparent',
                            color: active ? c.accent : c.text,
                            fontFamily: uiFont, fontSize: '0.72rem', fontWeight: active ? 600 : 500,
                            cursor: 'pointer', transition: 'all 0.12s', textAlign: 'center'
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </Accordion>

                <Accordion title={t(lang, 'advancedTypography') || 'Advanced Typography'} uiFont={uiFont} c={c}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      {label(t(lang, 'textTransform') || 'Text transform')}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
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
                            style={{
                              padding: '5px 0', borderRadius: 5, cursor: 'pointer', fontFamily: uiFont, fontSize: '0.7rem',
                              border: `1px solid ${(formatState as unknown as Record<string,string>)['textTransform'] === val ? c.accent : c.borderFaint}`,
                              background: (formatState as unknown as Record<string,string>)['textTransform'] === val ? c.accentLight : 'transparent',
                              color: (formatState as unknown as Record<string,string>)['textTransform'] === val ? c.accent : c.textMuted,
                              transition: 'all 0.12s', textAlign: 'center'
                            }}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      {label(t(lang, 'superscriptSubscript') || 'Script')}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => {
                            const editor = (props.editor as TiptapEditorType | null);
                            if (editor) editor.chain().focus().toggleSuperscript().run();
                            else { const ta = textareaRef.current; if (ta) { const s = ta.selectionStart, e = ta.selectionEnd; const sel = content.slice(s, e); onContentChange(content.slice(0, s) + `<sup>${sel || 'sup'}</sup>` + content.slice(e)) } }
                          }}
                          style={{
                            flex: 1, padding: '5px 4px', borderRadius: 6,
                            border: `1px solid ${(props.editor as TiptapEditorType | null)?.isActive?.('superscript') ? c.accent : c.borderFaint}`,
                            background: (props.editor as TiptapEditorType | null)?.isActive?.('superscript') ? c.accentLight : 'transparent',
                            fontFamily: uiFont, fontSize: '0.72rem',
                            color: (props.editor as TiptapEditorType | null)?.isActive?.('superscript') ? c.accent : c.textMuted,
                            cursor: 'pointer', transition: 'all 0.12s', textAlign: 'center'
                          }}>
                          X<sup style={{ fontSize: '0.65em' }}>2</sup> Superscript
                        </button>
                        <button onClick={() => {
                            const editor = (props.editor as TiptapEditorType | null);
                            if (editor) editor.chain().focus().toggleSubscript().run();
                            else { const ta = textareaRef.current; if (ta) { const s = ta.selectionStart, e = ta.selectionEnd; const sel = content.slice(s, e); onContentChange(content.slice(0, s) + `<sub>${sel || 'sub'}</sub>` + content.slice(e)) } }
                          }}
                          style={{
                            flex: 1, padding: '5px 4px', borderRadius: 6,
                            border: `1px solid ${(props.editor as TiptapEditorType | null)?.isActive?.('subscript') ? c.accent : c.borderFaint}`,
                            background: (props.editor as TiptapEditorType | null)?.isActive?.('subscript') ? c.accentLight : 'transparent',
                            fontFamily: uiFont, fontSize: '0.72rem',
                            color: (props.editor as TiptapEditorType | null)?.isActive?.('subscript') ? c.accent : c.textMuted,
                            cursor: 'pointer', transition: 'all 0.12s', textAlign: 'center'
                          }}>
                          X<sub style={{ fontSize: '0.65em' }}>2</sub> Subscript
                        </button>
                      </div>
                    </div>
                    <div>
                      {label(t(lang, 'openTypeFeatures') || 'OpenType')}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
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
                              style={{
                                padding: '4px 6px', borderRadius: 5, cursor: 'pointer', fontFamily: uiFont, fontSize: '0.68rem',
                                border: `1px solid ${active ? c.accent : c.borderFaint}`,
                                background: active ? c.accentLight : 'transparent',
                                color: active ? c.accent : c.textMuted, transition: 'all 0.12s', textAlign: 'center'
                              }}>
                              {lbl}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </Accordion>

                <Accordion title={t(lang, 'pageFormat') || 'Page Format'} uiFont={uiFont} c={c}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      {label(t(lang, 'paperSize') || 'Paper size')}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                        {(['A4', 'Letter', 'Legal', 'A5', 'Tabloid', 'pageless'] as const).map(size => (
                          <button key={size} onClick={() => onPageFormatChange({ ...pageFormat, paperSize: size, mode: size === 'pageless' ? 'pageless' : 'pages' })}
                            style={{
                              padding: '5px 4px', borderRadius: 6, cursor: 'pointer',
                              border: `1px solid ${pageFormat.paperSize === size ? c.accent : c.borderFaint}`,
                              background: pageFormat.paperSize === size ? c.accentLight : 'transparent',
                              color: pageFormat.paperSize === size ? c.accent : c.text,
                              fontFamily: uiFont, fontSize: '0.7rem', fontWeight: pageFormat.paperSize === size ? 600 : 400,
                              transition: 'all 0.12s', textAlign: 'center'
                            }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    {pageFormat.paperSize !== 'pageless' && (
                      <div>
                        {label(t(lang, 'orientation') || 'Orientation')}
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(['portrait', 'landscape'] as const).map(o => (
                            <button key={o} onClick={() => onPageFormatChange({ ...pageFormat, orientation: o })}
                              style={{
                                flex: 1, padding: '5px 4px', borderRadius: 6, cursor: 'pointer',
                                border: `1px solid ${pageFormat.orientation === o ? c.accent : c.borderFaint}`,
                                background: pageFormat.orientation === o ? c.accentLight : 'transparent',
                                color: pageFormat.orientation === o ? c.accent : c.textMuted,
                                fontFamily: uiFont, fontSize: '0.72rem', fontWeight: pageFormat.orientation === o ? 600 : 400,
                                transition: 'all 0.12s', textAlign: 'center'
                              }}
                            >
                              {o === 'portrait' ? t(lang, 'portrait') : t(lang, 'landscape')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      {label(t(lang, 'maxWidth') || 'Max width')}
                      {numInput(formatState.maxW, 300, 1200, 10, 'px', v => onFormatChange({ maxW: v }))}
                    </div>
                  </div>
                </Accordion>

                <Accordion title={t(lang, 'pageNumbering') || 'Page Numbering'} uiFont={uiFont} c={c}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <ToggleSwitch
                      checked={Boolean(formatState.pageNumbering?.enabled)}
                      onChange={() => {
                        const current = formatState.pageNumbering || {
                          enabled: false,
                          position: 'bottom-center',
                          style: 'arabic',
                          skipTitlePage: true,
                        };
                        onFormatChange({
                          pageNumbering: { ...current, enabled: !current.enabled }
                        });
                      }}
                      label={t(lang, 'showPageNumbers') || 'Show page numbers'}
                      description={t(lang, 'showPageNumbersDesc') || 'Display dynamic page counter on print & preview'}
                      uiFont={uiFont}
                      c={c} />

                    {formatState.pageNumbering?.enabled && (
                      <>
                        <div>
                          {label(t(lang, 'position') || 'Position')}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                            {([
                              { id: 'bottom-center', label: 'B-Center' },
                              { id: 'bottom-right', label: 'B-Right' },
                              { id: 'top-right', label: 'T-Right' },
                            ] as const).map(pos => {
                              const active = (formatState.pageNumbering?.position || 'bottom-center') === pos.id;
                              return (
                                <button
                                  key={pos.id}
                                  onClick={() => {
                                    const current = formatState.pageNumbering || { enabled: true, position: 'bottom-center', style: 'arabic', skipTitlePage: true };
                                    onFormatChange({ pageNumbering: { ...current, position: pos.id } });
                                  }}
                                  style={{
                                    padding: '5px 2px', borderRadius: 5, cursor: 'pointer',
                                    border: `1px solid ${active ? c.accent : c.borderFaint}`,
                                    background: active ? c.accentLight : 'transparent',
                                    color: active ? c.accent : c.textMuted,
                                    fontFamily: uiFont, fontSize: '0.68rem', fontWeight: active ? 600 : 400,
                                    transition: 'all 0.12s', textAlign: 'center'
                                  }}
                                >
                                  {pos.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <ToggleSwitch
                          checked={formatState.pageNumbering?.skipTitlePage !== false}
                          onChange={() => {
                            const current = formatState.pageNumbering || { enabled: true, position: 'bottom-center', style: 'arabic', skipTitlePage: true };
                            onFormatChange({ pageNumbering: { ...current, skipTitlePage: !current.skipTitlePage } });
                          }}
                          label={t(lang, 'skipTitlePage') || 'Skip title page'}
                          uiFont={uiFont}
                          c={c} />
                      </>
                    )}
                  </div>
                </Accordion>

                <Accordion title={t(lang, 'smartFormatting') || 'Smart Formatting'} uiFont={uiFont} c={c}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <ToggleSwitch
                      checked={Boolean(formatState.smartQuotes)}
                      onChange={() => onFormatChange({ smartQuotes: !formatState.smartQuotes })}
                      label={t(lang, 'smartQuotes') || 'Smart Quotes (“ ”)'}
                      uiFont={uiFont}
                      c={c} />
                    <ToggleSwitch
                      checked={Boolean(formatState.smartEllipses)}
                      onChange={() => onFormatChange({ smartEllipses: !formatState.smartEllipses })}
                      label={t(lang, 'smartEllipses') || 'Smart Ellipses (…)'}
                      uiFont={uiFont}
                      c={c} />
                    <ToggleSwitch
                      checked={Boolean(formatState.markdownShortcuts)}
                      onChange={() => onFormatChange({ markdownShortcuts: !formatState.markdownShortcuts })}
                      label={t(lang, 'markdownShortcuts') || 'Markdown Shortcuts'}
                      uiFont={uiFont}
                      c={c} />
                    <ToggleSwitch
                      checked={Boolean(formatState.doubleSpacePeriod)}
                      onChange={() => onFormatChange({ doubleSpacePeriod: !formatState.doubleSpacePeriod })}
                      label={t(lang, 'doubleSpacePeriod') || 'Double-Space Period'}
                      uiFont={uiFont}
                      c={c} />
                  </div>
                </Accordion>
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
                  background: c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${c.borderFaint}`,
                  borderRadius: 8, padding: '10px 12px',
                }}>
                  <div style={{ fontFamily: `'${bodyFont}', serif`, fontSize: '0.85rem', fontWeight: 600, color: c.text, lineHeight: 1.3 }}>
                    {title}
                  </div>
                </div>

                <Accordion title={t(lang, 'universalImport') || 'Import'} uiFont={uiFont} c={c}>
                  <button
                    onClick={() => importFileInputRef.current?.click()}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 7, cursor: 'pointer',
                      background: 'transparent',
                      border: `1px dashed ${c.accentMid}`,
                      color: c.text, fontFamily: uiFont, fontSize: '0.78rem', fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = c.accentLight }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <Upload size={14} style={{ color: c.accent }} />
                    <span>{t(lang, 'importFile') || 'Import File'}</span>
                  </button>
                </Accordion>

                <Accordion title={t(lang, 'universalExport') || 'Export'} uiFont={uiFont} c={c}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={handleCopy}
                      style={{
                        padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                        background: copied ? 'hsl(145, 52%, 94%)' : c.accentLight,
                        border: `1px solid ${copied ? 'hsl(145, 52%, 70%)' : c.accent}`,
                        color: copied ? 'hsl(145, 52%, 34%)' : c.accent,
                        fontFamily: uiFont, fontSize: '0.78rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? t(lang, 'copied') : (t(lang, 'copyToClipboard') || 'Copy to Clipboard')}</span>
                    </button>

                    {[
                      { icon: FileSpreadsheet, label: t(lang, 'exportOdt') || 'ODT / DOC', action: () => props.onExportOdt ? (props.onExportOdt as () => void)() : handleDownloadDocx() },
                      { icon: FileCode, label: t(lang, 'exportHtml') || 'HTML', action: () => props.onExportHtml ? (props.onExportHtml as () => void)() : handleDownload('html') },
                      { icon: FileText, label: t(lang, 'exportMd') || 'Markdown', action: () => props.onExportMd ? (props.onExportMd as () => void)() : handleDownload('md') },
                      { icon: Download, label: t(lang, 'backupJson') || 'JSON Backup', action: () => props.onExportJsonBackup ? (props.onExportJsonBackup as () => void)() : undefined },
                      { icon: Printer, label: t(lang, 'printDoc') || 'Print / PDF', action: handlePrintPDF },
                    ].map(({ icon: IconComp, label: btnLabel, action }) => (
                      <button
                        key={btnLabel}
                        onClick={action}
                        style={{
                          padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                          background: 'transparent', border: `1px solid ${c.borderFaint}`,
                          color: c.text, fontFamily: uiFont, fontSize: '0.78rem', fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderFaint; e.currentTarget.style.background = 'transparent' }}
                      >
                        <IconComp size={14} style={{ color: c.textMuted }} />
                        <span>{btnLabel}</span>
                      </button>
                    ))}
                    </div>
                  </Accordion>

                <Accordion title={t(lang, 'snapshots') || 'Snapshots'} uiFont={uiFont} c={c}>
                  <div style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
                    <VersionHistoryPanel
                      activePage={props.activePage as any}
                      theme={props.theme as any || c as any}
                      lang={lang}
                      uiFont={uiFont}
                      onRestore={props.onRestoreVersion as any}
                    />
                  </div>
                </Accordion>
              </div>
            )}

            {/* TIMER PANEL */}
            {panel === 'timer' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2, width: '100%' }}>
                {flowToast && (
                  <div style={{
                    background: c.accentLight, border: `1px solid ${c.accent}`, color: c.accent,
                    padding: '5px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                    marginBottom: 10, textAlign: 'center', width: '100%'
                  }}>
                    {flowToast}
                  </div>
                )}

                {/* Mode Selector */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3,
                  marginBottom: 14, background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  padding: 3, borderRadius: 8, width: '100%'
                }}>
                  {[
                    { id: 'pomodoro', label: '25m' },
                    { id: 'deepwork', label: '50m' },
                    { id: 'stopwatch', label: 'Stopwatch' },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => handleSelectPreset(mode.id as any)}
                      style={{
                        padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: timerMode === mode.id ? (c.isDark ? 'rgba(255,255,255,0.12)' : '#ffffff') : 'transparent',
                        color: timerMode === mode.id ? c.accent : c.textMuted,
                        fontFamily: uiFont, fontSize: '0.7rem', fontWeight: timerMode === mode.id ? 700 : 500,
                        boxShadow: timerMode === mode.id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s', textAlign: 'center'
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Ring / Clock Display */}
                <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 12 }}>
                  <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={60} cy={60} r={R} fill="none" stroke={c.borderFaint} strokeWidth={5} />
                    <circle
                      cx={60} cy={60} r={R} fill="none"
                      stroke={timerDone ? '#4caf72' : c.accent}
                      strokeWidth={5} strokeLinecap="round"
                      strokeDasharray={CIRC}
                      strokeDashoffset={timerMode === 'stopwatch' ? 0 : CIRC * (1 - (timerDone ? 1 : timerProgress))}
                      style={{ transition: 'stroke-dashoffset 0.9s ease, stroke 0.4s' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {timerDone ? (
                      <span style={{ fontFamily: uiFont, fontSize: '0.85rem', color: '#4caf72', fontWeight: 600 }}>{t(lang, 'done')}</span>
                    ) : (
                      <span style={{ fontFamily: monoFont, fontSize: '1.3rem', fontWeight: 600, color: c.text, letterSpacing: '0.02em' }}>
                        {String(Math.floor(timerLeft / 60)).padStart(2, '0')}:{String(timerLeft % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timer Controls */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <button onClick={onTimerToggle}
                    style={{
                      padding: '7px 20px', borderRadius: 16,
                      background: c.accent, color: c.isDark ? c.bg : '#ffffff', border: 'none',
                      fontFamily: uiFont, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {timerOn ? (t(lang, 'pause') || 'Pause') : (t(lang, 'startFocus') || 'Start')}
                  </button>
                  <button onClick={onTimerReset}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'transparent', border: `1px solid ${c.borderFaint}`,
                      color: c.textMuted, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.color = c.accent }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderFaint; e.currentTarget.style.color = c.textMuted }}
                    title="Reset"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>

                {timerMode !== 'stopwatch' && !timerDone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.textMuted }}>{t(lang, 'duration')}</span>
                    <input
                      type="number" min={1} max={180} value={timerSet}
                      onChange={e => onTimerSetChange(Math.max(1, Math.min(180, Number(e.target.value))))}
                      style={{
                        width: 44, padding: '3px 4px', borderRadius: 5,
                        border: `1px solid ${c.borderFaint}`,
                        fontFamily: monoFont, fontSize: '0.75rem', color: c.text,
                        background: 'transparent', textAlign: 'center', outline: 'none',
                      }}
                    />
                    <span style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.textMuted }}>min</span>
                  </div>
                )}

                {/* Daily Focus Summary */}
                <div style={{
                  width: '100%', marginTop: 8, paddingTop: 10, borderTop: `1px solid ${c.borderFaint}`,
                  display: 'flex', flexDirection: 'column', gap: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: uiFont, fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', color: c.textMuted, letterSpacing: '0.06em' }}>
                      {t(lang, 'dailyFocusDashboard') || 'Today'}
                    </span>
                    <span style={{ fontFamily: monoFont, fontSize: '0.72rem', color: c.accent, fontWeight: 600 }}>
                      {Math.floor(dailyStats.totalMinutes / 60)}h {dailyStats.totalMinutes % 60}m
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMinimized(true)}
                  style={{
                    marginTop: 10, background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: uiFont, fontSize: '0.68rem', color: c.textMuted,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = c.accent }}
                  onMouseLeave={e => { e.currentTarget.style.color = c.textMuted }}
                >
                  {t(lang, 'minimizeToBottomBar') || 'Minimize widget'}
                </button>
              </div>
            )}

            {/* Minimized Timer Widget */}
            {isMinimized && (
              <>
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 2, background: c.borderFaint, zIndex: 9999 }}>
                  <div style={{
                    height: '100%', background: c.accent, width: `${timerMode === 'stopwatch' ? 100 : (timerProgress * 100)}%`,
                    transition: 'width 0.5s linear'
                  }} />
                </div>
                <div style={{
                  position: 'fixed', bottom: 12, right: 12, zIndex: 9999,
                  background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16,
                  padding: '5px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  display: 'flex', alignItems: 'center', gap: 8, fontFamily: uiFont, fontSize: '0.75rem',
                  color: c.text
                }}>
                  <span style={{ fontFamily: monoFont, fontWeight: 600 }}>
                    {String(Math.floor(timerLeft / 60)).padStart(2, '0')}:{String(timerLeft % 60).padStart(2, '0')}
                  </span>
                  <button
                    onClick={onTimerToggle}
                    style={{ background: c.accent, color: '#fff', border: 'none', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {timerOn ? 'Pause' : 'Play'}
                  </button>
                  <button
                    onClick={() => setIsMinimized(false)}
                    style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    ✕
                  </button>
                </div>
              </>
            )}

            {/* FONTS PANEL */}
            {panel === 'fonts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Accordion title={t(lang, 'fontRoles') || 'Font roles'} uiFont={uiFont} c={c}>
                  {([
                    { role: 'body' as const, label: t(lang, 'body') || 'Body', value: bodyFont },
                    { role: 'heading' as const, label: t(lang, 'heading') || 'Heading', value: headingFont },
                    { role: 'ui' as const, label: t(lang, 'ui') || 'UI', value: uiFont2 },
                  ]).map(({ role, label: lbl, value }) => (
                    <div key={role} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: uiFont, fontSize: '0.66rem', color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</span>
                        <span style={{ fontFamily: `'${value}', serif`, fontSize: '0.72rem', color: c.textMuted }}>
                          {value}
                        </span>
                      </div>
                      <CustomSelect
                        value={value}
                        onChange={(v) => onFontAssign(role, v)}
                        theme={c}
                        fontFamily={uiFont}
                        options={availableFontNames.concat(customFonts.map(f => f.name || f.family)).map(n => ({ value: n, label: n }))}
                        buttonStyle={{
                          width: '100%', padding: '5px 8px', borderRadius: 6,
                          border: `1px solid ${c.borderFaint}`,
                          background: 'transparent', fontFamily: uiFont,
                          fontSize: '0.78rem', color: c.text, cursor: 'pointer', outline: 'none',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      />
                    </div>
                  ))}
                </Accordion>

                <Accordion title={t(lang, 'googleFontsEngine') || 'Google Fonts'} uiFont={uiFont} c={c}>
                  <div style={{ marginTop: 4 }}>
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
                      onApplyToDoc={(name) => onFontAssign('body', name)}
                      onApplyToUi={(name) => onFontAssign('ui', name)}
                      onAssignRole={onFontAssign}
                      />
                  </div>
                </Accordion>

                <Accordion title={t(lang, 'customFonts') || 'Custom Fonts'} uiFont={uiFont} c={c}>
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
                      border: `1px dashed ${dragOver ? c.accent : c.borderFaint}`,
                      borderRadius: 7, padding: '12px', textAlign: 'center',
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: dragOver ? c.accentLight : 'transparent',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontFamily: uiFont, fontSize: '0.72rem', color: c.textMuted, lineHeight: 1.4 }}>
                      {t(lang, 'dropFontHere')}<br />
                      <span style={{ fontSize: '0.64rem', color: c.textMuted }}>{t(lang, 'clickToBrowse')}</span>
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
                        padding: '5px 8px', borderRadius: 5,
                        background: c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        marginBottom: 4,
                      }}>
                        <span style={{ fontFamily: `'${fontName}', sans-serif`, fontSize: '0.75rem', color: c.text }}>
                          {fontName}
                        </span>
                        <button
                          type="button"
                          onClick={() => onFontDelete(fontId)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: c.textMuted, fontSize: '0.8rem',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </Accordion>
              </div>
            )}

            {/* SEARCH PANEL */}
            {panel === 'search' && (
              <SearchPanel
                c={c as any}
                uiFont={uiFont}
                lang={lang}
              />
            )}
            
            {/* SETTINGS PANEL */}
            {panel === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <Accordion title={t(lang, 'language') || 'Language'} uiFont={uiFont} c={c}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(LANG_LABELS).map(([k, v]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => onLangChange(k as Lang)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: `1px solid ${lang === k ? c.accent : c.borderFaint}`,
                          background: lang === k ? c.accentLight : 'transparent',
                          color: lang === k ? c.accent : c.text,
                          fontFamily: uiFont,
                          fontSize: '0.75rem',
                          fontWeight: lang === k ? 600 : 400,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span>{LANG_FLAGS[k as Lang] || ''}</span>
                        <span>{v}</span>
                      </button>
                    ))}
                  </div>
                </Accordion>

                
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(RightPanel);
