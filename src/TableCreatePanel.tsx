import React, { useState, useRef } from 'react';
import {
  Table, Grid, Plus, Minus, Check, Sparkles, LayoutTemplate,
  Rows, Columns, AlignLeft, AlignCenter, Maximize2, Trash2
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import type { ThemeColors } from './types';
import { getDict, type Lang } from './i18n';
import { getActiveTableInfo } from './tableUtils';

interface TablePreset {
  id: string;
  nameKey: string;
  defaultName: string;
  descKey: string;
  defaultDesc: string;
  rows: number;
  cols: number;
  withHeader: boolean;
  styleType: 'grid' | 'minimal' | 'striped';
  alignment: 'full' | 'center' | 'left';
  cellPadding: 'compact' | 'normal' | 'relaxed';
}

const PRESETS: TablePreset[] = [
  {
    id: 'simple-2x2',
    nameKey: 'simple2x2',
    defaultName: '2×2 Quick Matrix',
    descKey: 'simple2x2Desc',
    defaultDesc: 'Basic 2x2 grid for SWOT or comparisons',
    rows: 2,
    cols: 2,
    withHeader: true,
    styleType: 'grid',
    alignment: 'full',
    cellPadding: 'normal',
  },
  {
    id: 'study-vocab',
    nameKey: 'vocabTable',
    defaultName: 'Vocabulary / Terminology (3 Cols)',
    descKey: 'vocabTableDesc',
    defaultDesc: '3 columns: Term, Definition, Example sentence',
    rows: 5,
    cols: 3,
    withHeader: true,
    styleType: 'striped',
    alignment: 'full',
    cellPadding: 'normal',
  },
  {
    id: 'weekly-plan',
    nameKey: 'weeklySchedule',
    defaultName: 'Weekly Schedule (5 Days)',
    descKey: 'weeklyScheduleDesc',
    defaultDesc: 'Mon to Fri timeline & tasks grid',
    rows: 4,
    cols: 5,
    withHeader: true,
    styleType: 'grid',
    alignment: 'full',
    cellPadding: 'compact',
  },
  {
    id: 'data-summary',
    nameKey: 'dataMetrics',
    defaultName: 'Data & Metrics Table',
    descKey: 'dataMetricsDesc',
    defaultDesc: '4 columns for financial or KPI data',
    rows: 4,
    cols: 4,
    withHeader: true,
    styleType: 'minimal',
    alignment: 'full',
    cellPadding: 'compact',
  },
  {
    id: 'literature-matrix',
    nameKey: 'researchMatrix',
    defaultName: 'Literature Review / Research',
    descKey: 'researchMatrixDesc',
    defaultDesc: '5 columns: Author, Year, Methodology, Findings, Notes',
    rows: 4,
    cols: 5,
    withHeader: true,
    styleType: 'striped',
    alignment: 'full',
    cellPadding: 'relaxed',
  }
];

interface Props {
  editor: Editor | null;
  theme: ThemeColors;
  lang: Lang;
  uiFont: string;
  onInsertTable?: (rows: number, cols: number, options?: { withHeader?: boolean; styleType?: string; alignment?: string; cellPadding?: string }) => void;
}

export default function TableCreatePanel({
  editor,
  theme,
  lang = 'vi',
  uiFont,
  onInsertTable,
}: Props) {
  const dict = getDict(lang);
  const [activeTab, setActiveTab] = useState<'grid' | 'custom' | 'templates'>('grid');
  const [hoveredRows, setHoveredRows] = useState(3);
  const [hoveredCols, setHoveredCols] = useState(3);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [withHeader, setWithHeader] = useState(true);
  const [styleType, setStyleType] = useState<'grid' | 'minimal' | 'striped'>('grid');
  const [alignment, setAlignment] = useState<'full' | 'center' | 'left'>('full');
  const [cellPadding, setCellPadding] = useState<'compact' | 'normal' | 'relaxed'>('normal');
  const [insertedSuccess, setInsertedSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const maxGrid = 8;
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const activeTableInfo = getActiveTableInfo(editor);

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!gridContainerRef.current) return;
    const touch = e.touches[0];
    const rect = gridContainerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const col = Math.max(1, Math.min(maxGrid, Math.ceil((x / rect.width) * maxGrid)));
      const row = Math.max(1, Math.min(maxGrid, Math.ceil((y / rect.height) * maxGrid)));
      setHoveredCols(col);
      setHoveredRows(row);
    }
  };

  const handleExecuteInsert = (
    rows: number,
    cols: number,
    customOpts?: {
      withHeader?: boolean;
      styleType?: 'grid' | 'minimal' | 'striped';
      alignment?: 'full' | 'center' | 'left';
      cellPadding?: 'compact' | 'normal' | 'relaxed';
    }
  ) => {
    const finalRows = Math.max(1, Math.min(50, rows));
    const finalCols = Math.max(1, Math.min(20, cols));
    const finalHeader = customOpts?.withHeader !== undefined ? customOpts.withHeader : withHeader;
    const finalStyle = customOpts?.styleType || styleType;
    const finalAlign = customOpts?.alignment || alignment;
    const finalPad = customOpts?.cellPadding || cellPadding;

    if (onInsertTable) {
      onInsertTable(finalRows, finalCols, { withHeader: finalHeader, styleType: finalStyle, alignment: finalAlign, cellPadding: finalPad });
    } else if (editor && !editor.isDestroyed) {
      editor.chain().focus().insertTable({
        rows: finalRows,
        cols: finalCols,
        withHeaderRow: finalHeader,
      }).run();

      setTimeout(() => {
        const tableEl = document.querySelector('.kgv-editor table:last-of-type') as HTMLElement;
        if (tableEl) {
          tableEl.setAttribute('data-align', finalAlign);
          tableEl.setAttribute('data-table-style', finalStyle);
          tableEl.setAttribute('data-padding', finalPad);
        }
      }, 50);
    } else {
      window.dispatchEvent(new CustomEvent('kgv-insert-table-grid', {
        detail: { rows: finalRows, cols: finalCols, withHeader: finalHeader, styleType: finalStyle, alignment: finalAlign, cellPadding: finalPad }
      }));
    }

    setInsertedSuccess(true);
    setTimeout(() => setInsertedSuccess(false), 2000);
  };

  const handleDeleteActiveTable = () => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().deleteTable().run();
    setConfirmDelete(false);
  };

  return (
    <div style={{ fontFamily: uiFont }} className="space-y-4 text-xs">
      {/* Active Table Status Notification */}
      {activeTableInfo && (
        <div
          className="p-3 rounded-2xl border flex flex-col gap-2"
          style={{
            backgroundColor: theme.accentLight || 'rgba(59, 130, 246, 0.1)',
            borderColor: theme.accent || '#3b82f6',
            color: theme.text,
          }}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Table size={14} className="shrink-0" style={{ color: theme.accent }} />
              <div className="truncate">
                <span className="font-semibold block truncate">
                  {dict.selectedCell || (lang === 'vi' ? 'Đang chọn bảng' : 'Focused Table')}: {activeTableInfo.rowCount} × {activeTableInfo.colCount}
                </span>
                <span className="text-[10px] opacity-75">
                  [{dict.rows || 'Row'} {activeTableInfo.currentRow}, {dict.cols || 'Col'} {activeTableInfo.currentCol}]
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('kgv-switch-left-tab', { detail: { tab: 'table' } }));
              }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold shrink-0 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: theme.accent || '#2563eb',
                color: theme.isDark ? theme.bg : '#ffffff',
              }}
            >
              {dict.tableInspector || (lang === 'vi' ? 'Tùy biến' : 'Inspect')}
            </button>
          </div>

          {/* Quick Delete Table Button */}
          <div className="pt-1.5 border-t flex items-center justify-between gap-2" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            {confirmDelete ? (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-[11px] font-medium text-red-500">
                  {dict.confirmDeleteTable || (lang === 'vi' ? 'Xóa hoàn toàn bảng này?' : 'Delete entire table?')}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleDeleteActiveTable}
                    className="px-2 py-0.5 rounded bg-red-500 text-white font-bold text-[10px] hover:bg-red-600 cursor-pointer active:scale-95"
                  >
                    {dict.deleteTable || 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-0.5 rounded border text-[10px] opacity-75 hover:opacity-100 cursor-pointer active:scale-95"
                    style={{ borderColor: theme.border }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full py-1 px-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center gap-1.5 text-[11px] font-medium cursor-pointer transition-all active:scale-95"
              >
                <Trash2 size={12} />
                <span>{dict.deleteTable || (lang === 'vi' ? 'Xóa bảng hoàn toàn' : 'Delete Table')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Creation Mode Switcher */}
      <div
        className="flex items-center p-1 rounded-xl border"
        style={{
          borderColor: theme.borderFaint || theme.border,
          backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('grid')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer touch-manipulation ${
            activeTab === 'grid' ? 'shadow-xs font-semibold' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            backgroundColor: activeTab === 'grid' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
            color: activeTab === 'grid' ? (theme.accent || '#3b82f6') : theme.text,
          }}
        >
          <Grid size={12} />
          <span>{dict.grid || (lang === 'vi' ? 'Ma trận' : 'Grid')}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer touch-manipulation ${
            activeTab === 'custom' ? 'shadow-xs font-semibold' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            backgroundColor: activeTab === 'custom' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
            color: activeTab === 'custom' ? (theme.accent || '#3b82f6') : theme.text,
          }}
        >
          <Rows size={12} />
          <span>{dict.custom || (lang === 'vi' ? 'Tùy chỉnh' : 'Custom')}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer touch-manipulation ${
            activeTab === 'templates' ? 'shadow-xs font-semibold' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            backgroundColor: activeTab === 'templates' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
            color: activeTab === 'templates' ? (theme.accent || '#3b82f6') : theme.text,
          }}
        >
          <LayoutTemplate size={12} />
          <span>{dict.templates || (lang === 'vi' ? 'Mẫu' : 'Templates')}</span>
        </button>
      </div>

      {/* Tab 1: Interactive Matrix Visual Grid */}
      {activeTab === 'grid' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-medium text-xs opacity-75">
              {dict.selectedSize || (lang === 'vi' ? 'Kích thước lựa chọn' : 'Selected size')}:
            </span>
            <span
              className="font-mono font-bold text-xs px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: theme.accentLight || 'rgba(59,130,246,0.12)',
                color: theme.accent || '#3b82f6',
              }}
            >
              {hoveredCols} {dict.cols || (lang === 'vi' ? 'Cột' : 'Cols')} × {hoveredRows} {dict.rows || (lang === 'vi' ? 'Hàng' : 'Rows')}
            </span>
          </div>

          <div
            ref={gridContainerRef}
            onTouchMove={handleTouchMove}
            className="grid grid-cols-8 gap-1.5 p-3 rounded-2xl border transition-all touch-none select-none"
            style={{
              backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: theme.borderFaint || theme.border,
            }}
          >
            {Array.from({ length: maxGrid }).map((_, rIdx) =>
              Array.from({ length: maxGrid }).map((_, cIdx) => {
                const r = rIdx + 1;
                const c = cIdx + 1;
                const isHighlighted = r <= hoveredRows && c <= hoveredCols;

                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseEnter={() => {
                      setHoveredRows(r);
                      setHoveredCols(c);
                    }}
                    onClick={() => handleExecuteInsert(hoveredRows, hoveredCols)}
                    className={`w-full aspect-square rounded-md cursor-pointer transition-all duration-100 ${
                      isHighlighted
                        ? 'scale-105 shadow-xs'
                        : 'hover:opacity-60'
                    }`}
                    style={{
                      backgroundColor: isHighlighted
                        ? (theme.accent || '#2563eb')
                        : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                      borderColor: isHighlighted
                        ? (theme.accent || '#2563eb')
                        : (theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
                      borderWidth: '1px',
                    }}
                    title={`${c} × ${r}`}
                  />
                );
              })
            )}
          </div>

          <div className="text-center text-[11px] opacity-60 font-mono">
            {dict.hoverToResizeClickToInsert || (lang === 'vi' ? 'Rê chuột / vuốt chạm để chọn kích thước & nhấp chèn' : 'Hover / touch drag to resize & click to insert')}
          </div>
        </div>
      )}

      {/* Tab 2: Custom Numeric Dimensions */}
      {activeTab === 'custom' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold opacity-80 flex items-center gap-1">
              <Rows size={12} style={{ color: theme.accent }} />
              <span>{dict.rows || (lang === 'vi' ? 'Số hàng (Rows):' : 'Rows:')}:</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCustomRows(prev => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-xl border flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer shrink-0 transition-all touch-manipulation"
                style={{ borderColor: theme.border }}
              >
                <Minus size={13} />
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={customRows}
                onChange={e => setCustomRows(parseInt(e.target.value, 10) || 1)}
                className="w-full h-8 px-2 rounded-xl border outline-none font-mono text-center text-xs font-semibold"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.5)',
                  borderColor: theme.border,
                  color: theme.text,
                }}
              />
              <button
                type="button"
                onClick={() => setCustomRows(prev => Math.min(50, prev + 1))}
                className="w-8 h-8 rounded-xl border flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer shrink-0 transition-all touch-manipulation"
                style={{ borderColor: theme.border }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold opacity-80 flex items-center gap-1">
              <Columns size={12} style={{ color: theme.accent }} />
              <span>{dict.cols || (lang === 'vi' ? 'Số cột (Columns):' : 'Columns:')}:</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCustomCols(prev => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-xl border flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer shrink-0 transition-all touch-manipulation"
                style={{ borderColor: theme.border }}
              >
                <Minus size={13} />
              </button>
              <input
                type="number"
                min="1"
                max="20"
                value={customCols}
                onChange={e => setCustomCols(parseInt(e.target.value, 10) || 1)}
                className="w-full h-8 px-2 rounded-xl border outline-none font-mono text-center text-xs font-semibold"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.5)',
                  borderColor: theme.border,
                  color: theme.text,
                }}
              />
              <button
                type="button"
                onClick={() => setCustomCols(prev => Math.min(20, prev + 1))}
                className="w-8 h-8 rounded-xl border flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer shrink-0 transition-all touch-manipulation"
                style={{ borderColor: theme.border }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Table Presets & Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-2">
          {PRESETS.map(preset => (
            <div
              key={preset.id}
              onClick={() => handleExecuteInsert(preset.rows, preset.cols, {
                withHeader: preset.withHeader,
                styleType: preset.styleType,
                alignment: preset.alignment,
                cellPadding: preset.cellPadding,
              })}
              className="p-3 rounded-2xl border hover:shadow-xs transition-all cursor-pointer space-y-1.5 group touch-manipulation"
              style={{
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: theme.borderFaint || theme.border,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs transition-colors" style={{ color: theme.text }}>
                  {preset.defaultName}
                </span>
                <span
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                  style={{
                    backgroundColor: theme.accentLight || 'rgba(59,130,246,0.1)',
                    color: theme.accent || '#3b82f6',
                  }}
                >
                  {preset.cols}×{preset.rows}
                </span>
              </div>
              <p className="text-[11px] opacity-65 leading-tight">
                {preset.defaultDesc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Customization Options */}
      <div className="pt-3 border-t space-y-3" style={{ borderColor: theme.borderFaint || theme.border }}>
        {/* Header row toggle switch */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold opacity-85">
            {dict.headerRow || 'Header Row'}
          </span>
          {/* Robust Toggle Switch Button (Nút gạt) */}
          <button
            type="button"
            role="switch"
            aria-checked={withHeader}
            onClick={() => setWithHeader(prev => !prev)}
            className="w-11 h-6 rounded-full relative cursor-pointer touch-manipulation transition-colors duration-200 shrink-0 p-0.5"
            style={{
              backgroundColor: withHeader ? (theme.accent || '#2563eb') : (theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
            }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md transition-transform duration-200 ease-out"
              style={{
                transform: withHeader ? 'translateX(20px)' : 'translateX(0px)',
              }}
            >
              {withHeader && <Check size={11} color={theme.accent || '#2563eb'} strokeWidth={3} />}
            </div>
          </button>
        </div>

        {/* Alignment */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold opacity-85 block">
            {dict.tableAlignment || 'Table Alignment:'}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setAlignment('left')}
              className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation ${
                alignment === 'left' ? 'font-semibold shadow-xs' : 'opacity-65 hover:opacity-100'
              }`}
              style={{
                backgroundColor: alignment === 'left' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                borderColor: alignment === 'left' ? theme.accent : theme.borderFaint,
                color: alignment === 'left' ? theme.accent : theme.text,
              }}
            >
              <AlignLeft size={12} />
              <span>{dict.left || 'Left'}</span>
            </button>
            <button
              type="button"
              onClick={() => setAlignment('center')}
              className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation ${
                alignment === 'center' ? 'font-semibold shadow-xs' : 'opacity-65 hover:opacity-100'
              }`}
              style={{
                backgroundColor: alignment === 'center' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                borderColor: alignment === 'center' ? theme.accent : theme.borderFaint,
                color: alignment === 'center' ? theme.accent : theme.text,
              }}
            >
              <AlignCenter size={12} />
              <span>{dict.center || 'Center'}</span>
            </button>
            <button
              type="button"
              onClick={() => setAlignment('full')}
              className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation ${
                alignment === 'full' ? 'font-semibold shadow-xs' : 'opacity-65 hover:opacity-100'
              }`}
              style={{
                backgroundColor: alignment === 'full' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                borderColor: alignment === 'full' ? theme.accent : theme.borderFaint,
                color: alignment === 'full' ? theme.accent : theme.text,
              }}
            >
              <Maximize2 size={12} />
              <span>{dict.fullWidth || dict.full || 'Full'}</span>
            </button>
          </div>
        </div>

        {/* Style selection */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold opacity-85 block">
            {dict.borderAndStyle || 'Border & Style:'}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setStyleType('grid')}
              className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-medium text-center transition-all cursor-pointer touch-manipulation ${
                styleType === 'grid' ? 'font-semibold shadow-xs' : 'opacity-65 hover:opacity-100'
              }`}
              style={{
                backgroundColor: styleType === 'grid' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                borderColor: styleType === 'grid' ? theme.accent : theme.borderFaint,
                color: styleType === 'grid' ? theme.accent : theme.text,
              }}
            >
              {dict.grid || 'Grid'}
            </button>
            <button
              type="button"
              onClick={() => setStyleType('minimal')}
              className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-medium text-center transition-all cursor-pointer touch-manipulation ${
                styleType === 'minimal' ? 'font-semibold shadow-xs' : 'opacity-65 hover:opacity-100'
              }`}
              style={{
                backgroundColor: styleType === 'minimal' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                borderColor: styleType === 'minimal' ? theme.accent : theme.borderFaint,
                color: styleType === 'minimal' ? theme.accent : theme.text,
              }}
            >
              {dict.minimal || 'Minimal'}
            </button>
            <button
              type="button"
              onClick={() => setStyleType('striped')}
              className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-medium text-center transition-all cursor-pointer touch-manipulation ${
                styleType === 'striped' ? 'font-semibold shadow-xs' : 'opacity-65 hover:opacity-100'
              }`}
              style={{
                backgroundColor: styleType === 'striped' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                borderColor: styleType === 'striped' ? theme.accent : theme.borderFaint,
                color: styleType === 'striped' ? theme.accent : theme.text,
              }}
            >
              {dict.striped || 'Striped'}
            </button>
          </div>
        </div>

        {/* Padding selection */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold opacity-85 block">
            {dict.cellPadding || 'Cell Padding:'}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {(['compact', 'normal', 'relaxed'] as const).map((pad) => (
              <button
                key={pad}
                type="button"
                onClick={() => setCellPadding(pad)}
                className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-medium text-center transition-all cursor-pointer touch-manipulation ${
                  cellPadding === pad ? 'font-semibold shadow-xs' : 'opacity-65 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: cellPadding === pad ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                  borderColor: cellPadding === pad ? theme.accent : theme.borderFaint,
                  color: cellPadding === pad ? theme.accent : theme.text,
                }}
              >
                {pad === 'compact' ? (dict.compact || 'Compact') : pad === 'normal' ? (dict.normal || 'Normal') : (dict.relaxed || 'Relaxed')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={() => {
          if (activeTab === 'grid') {
            handleExecuteInsert(hoveredRows, hoveredCols);
          } else {
            handleExecuteInsert(customRows, customCols);
          }
        }}
        className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-98 transition-all cursor-pointer touch-manipulation"
        style={{
          backgroundColor: theme.accent || '#2563eb',
          color: theme.isDark ? theme.bg : '#ffffff',
        }}
      >
        {insertedSuccess ? (
          <>
            <Check size={14} />
            <span>{dict.done || 'Inserted!'}</span>
          </>
        ) : (
          <>
            <Sparkles size={14} />
            <span>
              + {dict.insertTable || 'Insert Table'} ({activeTab === 'grid' ? hoveredCols : customCols}×{activeTab === 'grid' ? hoveredRows : customRows})
            </span>
          </>
        )}
      </button>
    </div>
  );
}
