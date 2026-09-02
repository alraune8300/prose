/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from 'react';
import { Highlighter, X, Table, Hash, ChevronDown, Check } from 'lucide-react';
import type { ThemeColors } from './types';
import type { Editor } from '@tiptap/react';
import type { HighlightData } from './AnnotationHighlightExtension';
import { highlightPluginKey } from './AnnotationHighlightExtension';
import type { Lang } from './i18n';

type Props = {
  theme: ThemeColors;
  editor: Editor | null;
  lang: Lang;
  uiFont: string;
};

const translations: Record<string, Record<string, string>> = {
  en: { title: 'Highlights & Annotations', allColors: 'All Colors', amber: 'Amber', emerald: 'Emerald', rose: 'Rose', blue: 'Blue', violet: 'Violet', zinc: 'Zinc', allStates: 'All States', withMemo: 'With Memo', noMemo: 'No Memo', synthesize: 'Synthesize Matrix', empty: 'No highlights found.', placeholder: 'Memo, annotation...', tools: 'Quick Tools' },
  vi: { title: 'Highlights & Chú thích', allColors: 'Tất cả màu', amber: 'Vàng (Amber)', emerald: 'Xanh (Emerald)', rose: 'Đỏ (Rose)', blue: 'Xanh dương (Blue)', violet: 'Tím (Violet)', zinc: 'Xám (Zinc)', allStates: 'Tất cả trạng thái', withMemo: 'Có ghi chú', noMemo: 'Chưa có ghi chú', synthesize: 'Xuất Bảng Nghiên cứu', empty: 'Chưa có highlight nào.', placeholder: 'Ghi chú, phản biện...', tools: 'Công cụ nhanh' },
  fr: { title: 'Surlignages et Annotations', allColors: 'Toutes les couleurs', amber: 'Ambre', emerald: 'Émeraude', rose: 'Rose', blue: 'Bleu', violet: 'Violet', zinc: 'Zinc', allStates: 'Tous les états', withMemo: 'Avec Mémo', noMemo: 'Sans Mémo', synthesize: 'Synthétiser la Matrice', empty: 'Aucun surlignage trouvé.', placeholder: 'Mémo, annotation...', tools: 'Outils rapides' },
  de: { title: 'Hervorhebungen & Anmerkungen', allColors: 'Alle Farben', amber: 'Bernstein', emerald: 'Smaragd', rose: 'Rose', blue: 'Blau', violet: 'Violett', zinc: 'Zink', allStates: 'Alle Zustände', withMemo: 'Mit Notiz', noMemo: 'Ohne Notiz', synthesize: 'Matrix synthetisieren', empty: 'Keine Hervorhebungen gefunden.', placeholder: 'Notiz, Anmerkung...', tools: 'Schnellwerkzeuge' },
  it: { title: 'Evidenziazioni e Annotazioni', allColors: 'Tutti i Colori', amber: 'Ambra', emerald: 'Smeraldo', rose: 'Rosa', blue: 'Blu', violet: 'Viola', zinc: 'Zinco', allStates: 'Tutti gli Stati', withMemo: 'Con Memo', noMemo: 'Senza Memo', synthesize: 'Sintetizza Matrice', empty: 'Nessuna evidenziazione trovata.', placeholder: 'Memo, annotazione...', tools: 'Strumenti Rapidi' },
  es: { title: 'Resaltados y Anotaciones', allColors: 'Todos los colores', amber: 'Ámbar', emerald: 'Esmeralda', rose: 'Rosa', blue: 'Azul', violet: 'Violeta', zinc: 'Zinc', allStates: 'Todos los estados', withMemo: 'Con Memo', noMemo: 'Sin Memo', synthesize: 'Sintetizar Matriz', empty: 'No se encontraron resaltados.', placeholder: 'Memo, anotación...', tools: 'Herramientas Rápidas' },
  ko: { title: '하이라이트 및 주석', allColors: '모든 색상', amber: '호박색', emerald: '에메랄드', rose: '장미색', blue: '파란색', violet: '보라색', zinc: '아연', allStates: '모든 상태', withMemo: '메모 있음', noMemo: '메모 없음', synthesize: '매트릭스 합성', empty: '하이라이트를 찾을 수 없습니다.', placeholder: '메모, 주석...', tools: '빠른 도구' },
  zh: { title: '高亮与注释', allColors: '所有颜色', amber: '琥珀色', emerald: '祖母绿', rose: '玫瑰红', blue: '蓝色', violet: '紫色', zinc: '锌灰', allStates: '所有状态', withMemo: '有备注', noMemo: '无备注', synthesize: '合成矩阵', empty: '未找到高亮。', placeholder: '备注、注释...', tools: '快捷工具' },
  ja: { title: 'ハイライトと注釈', allColors: 'すべての色', amber: 'アンバー', emerald: 'エメラルド', rose: 'ローズ', blue: 'ブルー', violet: 'バイオレット', zinc: '亜鉛', allStates: 'すべての状態', withMemo: 'メモあり', noMemo: 'メモなし', synthesize: 'マトリックスを合成', empty: 'ハイライトが見つかりません。', placeholder: 'メモ、注釈...', tools: 'クイックツール' }
};

const HIGHLIGHT_COLORS = [
  { id: 'amber', bg: 'bg-amber-500/20' },
  { id: 'emerald', bg: 'bg-emerald-500/20' },
  { id: 'rose', bg: 'bg-rose-500/20' },
  { id: 'blue', bg: 'bg-blue-500/20' },
  { id: 'violet', bg: 'bg-violet-500/20' },
  { id: 'zinc', bg: 'bg-gray-500/20' },
];

const TEXT_COLORS = [
  { id: 'default', color: 'inherit' },
  { id: 'emerald', color: '#10b981' },
  { id: 'slate', color: '#64748b' },
  { id: 'amber', color: '#f59e0b' },
  { id: 'rose', color: '#f43f5e' },
  { id: 'violet', color: '#8b5cf6' },
];

function CustomSelect({ value, options, onChange, theme }: { value: string, options: { value: string, label: string }[], onChange: (val: string) => void, theme: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value) || options[0];

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg border outline-none cursor-pointer transition-colors"
        style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown size={14} className="opacity-60" />
      </button>
      {open && (
        <div 
          className="absolute z-50 w-full mt-1 rounded-xl border shadow-lg overflow-hidden backdrop-blur-xl"
          style={{ 
            backgroundColor: theme.isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
            borderColor: theme.border 
          }}
        >
          {options.map((opt: any) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors"
              style={{ 
                color: theme.text,
                backgroundColor: value === opt.value 
                  ? (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                  : 'transparent'
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={14} className="opacity-70" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HighlightsPanel({ theme, editor, lang, uiFont }: Props) {
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [filterColor, setFilterColor] = useState<string>('all');
  const [filterMemo, setFilterMemo] = useState<'all' | 'with-memo' | 'no-memo'>('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  const t = (key: string) => translations[lang]?.[key] || translations['en'][key];

    useEffect(() => {
    if (editor) {
      const pluginState = highlightPluginKey.getState(editor.state);
      if (pluginState && pluginState.highlights) {
        setHighlights(pluginState.highlights);
      }
    }
  }, [editor]);

  useEffect(() => {
    const handleHighlightsUpdated = (e: CustomEvent<HighlightData[]>) => {
      setHighlights(e.detail);
    };
    window.addEventListener('kgv-highlights-updated', handleHighlightsUpdated as any);

    const handleJump = (e: any) => {
      const id = e.detail;
      setActiveId(id);
      setTimeout(() => {
        const el = document.getElementById('hl-card-' + id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    };
    window.addEventListener('kgv-jump-to-highlight-panel', handleJump);

    return () => {
      window.removeEventListener('kgv-highlights-updated', handleHighlightsUpdated as any);
      window.removeEventListener('kgv-jump-to-highlight-panel', handleJump);
    };
  }, []);

  // Jump to highlight
  const scrollToHighlight = (hl: HighlightData) => {
    if (!editor) return;
    
    editor.commands.setTextSelection(hl.from);
    
    // Find the DOM node corresponding to this highlight and scroll to it
    const scrollContainer = document.querySelector('.kgv-scroll');
    
    
    // Using Prosemirror view to get DOM node position
    const coords = editor.view.coordsAtPos(hl.from);
    if (scrollContainer && coords) {
       const containerRect = scrollContainer.getBoundingClientRect();
       const scrollPos = scrollContainer.scrollTop + (coords.top - containerRect.top) - 100; // 100px offset
       scrollContainer.scrollTo({ top: Math.max(0, scrollPos), behavior: 'smooth' });
    }
  };

  const updateMemo = (id: string, memo: string) => {
    if (!editor) return;
    editor.commands.updateHighlightMemo(id, memo);
  };

  const removeHighlight = (id: string) => {
    if (!editor) return;
    editor.commands.removeHighlightById(id);
  };

  const generateMatrix = () => {
    if (!editor || highlights.length === 0) return;
    
    const rows = highlights.map(hl => [
      `<p><strong>[${hl.index}]</strong> ${hl.color}</p>`,
      `<p>${hl.text}</p>`,
      `<p>${hl.memo}</p>`
    ]);

    const header = [
      '<p><strong>ID / Color</strong></p>',
      '<p><strong>Snippet</strong></p>',
      '<p><strong>Notes / Memo</strong></p>'
    ];

    let tableHTML = '<table><tr>';
    header.forEach(h => { tableHTML += `<th>${h}</th>`; });
    tableHTML += '</tr>';

    rows.forEach(r => {
      tableHTML += '<tr>';
      r.forEach(c => { tableHTML += `<td>${c}</td>`; });
      tableHTML += '</tr>';
    });
    tableHTML += '</table><p></p>';

    editor.chain().focus('end').insertContent(tableHTML).run();
  };

  const filteredHighlights = highlights.filter(hl => {
    if (filterColor !== 'all' && hl.color !== filterColor) return false;
    if (filterMemo === 'with-memo' && !hl.memo.trim()) return false;
    if (filterMemo === 'no-memo' && hl.memo.trim()) return false;
    return true;
  });

  const colorOptions = [
    { value: 'all', label: t('allColors') },
    { value: 'amber', label: t('amber') },
    { value: 'emerald', label: t('emerald') },
    { value: 'rose', label: t('rose') },
    { value: 'blue', label: t('blue') },
    { value: 'violet', label: t('violet') },
    { value: 'zinc', label: t('zinc') }
  ];

  const memoOptions = [
    { value: 'all', label: t('allStates') },
    { value: 'with-memo', label: t('withMemo') },
    { value: 'no-memo', label: t('noMemo') }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: uiFont }}>
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b" style={{ borderColor: theme.borderFaint || theme.border, backgroundColor: theme.surface }}>
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: theme.text }}>
          <div className="flex items-center gap-2">
            <Highlighter size={16} />
            {t('title') || 'Highlights & Annotations'}
          </div>
        </h3>
        
                {/* Quick Tools */}
        <div className="mb-4 flex flex-col gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-50" style={{ color: theme.text }}>
              Highlight Color
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => editor?.chain().focus().setHighlight({ color: c.id }).run()}
                  className={`w-6 h-6 rounded-full ${c.bg} border border-black/10 dark:border-white/10 hover:scale-110 transition-transform shadow-sm`}
                  title={t(c.id) || c.id}
                />
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-50" style={{ color: theme.text }}>
              Text Color
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {TEXT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (c.id === 'default') {
                      editor?.chain().focus().unsetColor().run();
                    } else {
                      editor?.chain().focus().setColor(c.color).run();
                    }
                  }}
                  className="w-6 h-6 rounded-full border border-black/10 dark:border-white/10 hover:scale-110 transition-transform flex items-center justify-center text-[10px] font-bold shadow-sm"
                  style={{ 
                    backgroundColor: c.color === 'inherit' ? (theme.isDark ? '#e5e7eb' : '#374151') : c.color,
                    color: c.color === 'inherit' ? (theme.isDark ? '#000' : '#fff') : 'transparent'
                  }}
                  title={c.id}
                >
                  {c.id === 'default' ? 'T' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 mb-3 z-10">
          <CustomSelect 
            value={filterColor} 
            onChange={setFilterColor} 
            options={colorOptions} 
            theme={theme} 
          />
          <CustomSelect 
            value={filterMemo} 
            onChange={setFilterMemo} 
            options={memoOptions} 
            theme={theme} 
          />
        </div>

        <button 
          onClick={generateMatrix}
          className="w-full mb-2 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.border}` }}
        >
          <Table size={14} />
          {t('synthesize')}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredHighlights.length === 0 ? (
          <div className="text-center text-xs opacity-50 py-8 italic" style={{ color: theme.text }}>
            {t('empty')}
          </div>
        ) : (
          filteredHighlights.map(hl => (
            <div 
              key={hl.id}
              id={'hl-card-' + hl.id}
              className={`rounded-xl border p-3 flex flex-col gap-2 transition-colors duration-200 shadow-sm ${activeId === hl.id ? 'ring-2 ring-white/60' : ''}`}
              style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderColor: theme.border }}
            >
              <div className="flex items-start justify-between gap-2">
                <div 
                  className="flex items-center gap-1.5 text-xs font-mono px-1.5 py-0.5 rounded cursor-pointer select-none transition-opacity hover:opacity-80"
                  style={{ 
                    backgroundColor: hl.color === 'zinc' ? 'rgba(156, 163, 175, 0.2)' : `var(--color-${hl.color}-500, rgba(200, 200, 200, 0.2))` 
                  }}
                  onClick={() => scrollToHighlight(hl)}
                >
                  <Hash size={10} />
                  <span>{hl.index}</span>
                </div>
                
                <button 
                  onClick={() => removeHighlight(hl.id)}
                  className="opacity-40 hover:opacity-100 p-1 rounded-md transition-all hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X size={12} />
                </button>
              </div>

              <div 
                className="text-xs leading-relaxed line-clamp-4 opacity-90 cursor-pointer italic"
                style={{ color: theme.text }}
                onClick={() => scrollToHighlight(hl)}
              >
                "{hl.text}"
              </div>

              <div className="mt-1 relative">
                <textarea
                  value={hl.memo}
                  onChange={(e) => updateMemo(hl.id, e.target.value)}
                  placeholder={t('placeholder')}
                  className="w-full text-xs rounded-lg p-2.5 border outline-none resize-y min-h-[60px] transition-colors focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                  style={{ 
                    backgroundColor: theme.surface, 
                    color: theme.text, 
                    borderColor: theme.borderFaint || theme.border 
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
