import React, { useState, useRef } from 'react';
import {
  Table, Grid, Plus, Minus, Check, Sparkles, LayoutTemplate,
  Rows, Columns, AlignLeft, AlignCenter, Maximize2
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import type { ThemeColors } from './types';
import type { Lang } from './i18n';
import { getActiveTableInfo } from './tableUtils';

interface TablePreset {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
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
    name: '2×2 Quick Matrix',
    nameVi: 'Ma trận nhanh 2×2 (So sánh)',
    description: 'Basic 2x2 grid for SWOT or comparisons',
    descriptionVi: 'Lưới 2x2 cơ bản để phân loại, SWOT hoặc đối chiếu',
    rows: 2,
    cols: 2,
    withHeader: true,
    styleType: 'grid',
    alignment: 'full',
    cellPadding: 'normal',
  },
  {
    id: 'study-vocab',
    name: 'Vocabulary / Terminology',
    nameVi: 'Từ vựng & Thuật ngữ (3 Cột)',
    description: '3 columns: Term, Definition, Example sentence',
    descriptionVi: '3 cột: Thuật ngữ, Định nghĩa, Ví dụ & Ghi chú',
    rows: 5,
    cols: 3,
    withHeader: true,
    styleType: 'striped',
    alignment: 'full',
    cellPadding: 'normal',
  },
  {
    id: 'weekly-plan',
    name: 'Weekly Schedule (5 Days)',
    nameVi: 'Lịch biểu kế hoạch tuần (5 ngày)',
    description: 'Mon to Fri timeline & tasks grid',
    descriptionVi: 'Kế hoạch 5 cột từ Thứ 2 đến Thứ 6 tinh gọn',
    rows: 4,
    cols: 5,
    withHeader: true,
    styleType: 'grid',
    alignment: 'full',
    cellPadding: 'compact',
  },
  {
    id: 'data-summary',
    name: 'Data & Metrics Table',
    nameVi: 'Bảng Báo cáo & Số liệu (4 Cột)',
    description: '4 columns for financial or KPI data',
    descriptionVi: '4 cột cho thống kê tài chính, KPI hoặc số liệu phân tích',
    rows: 4,
    cols: 4,
    withHeader: true,
    styleType: 'minimal',
    alignment: 'full',
    cellPadding: 'compact',
  },
  {
    id: 'literature-matrix',
    name: 'Literature Review / Research',
    nameVi: 'Tổng quan Nghiên cứu & Trích dẫn',
    description: '5 columns: Author, Year, Methodology, Findings, Notes',
    descriptionVi: '5 cột: Tác giả, Năm, Phương pháp, Kết quả, Bình luận',
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
  lang,
  uiFont,
  onInsertTable,
}: Props) {
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

  const maxGrid = 8;
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const activeTableInfo = getActiveTableInfo(editor);

  // Touch gesture & drag-over calculation for touch screens
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

      // Apply initial styling attributes
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

  return (
    <div style={{ fontFamily: uiFont }} className="space-y-4 text-xs">
      {/* Active Table Status Notification if cursor is already inside a table */}
      {activeTableInfo && (
        <div
          className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
          style={{
            backgroundColor: theme.accentLight || 'rgba(59, 130, 246, 0.1)',
            borderColor: theme.accent || '#3b82f6',
            color: theme.text,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Table size={14} className="shrink-0" style={{ color: theme.accent }} />
            <div className="truncate">
              <span className="font-semibold block truncate">
                {lang === 'vi' ? 'Đang chọn bảng' : 'Focused Table'}: {activeTableInfo.rowCount}×{activeTableInfo.colCount}
              </span>
              <span className="text-[10px] opacity-75">
                {lang === 'vi' ? `Ô [Hàng ${activeTableInfo.currentRow}, Cột ${activeTableInfo.currentCol}]` : `Cell [Row ${activeTableInfo.currentRow}, Col ${activeTableInfo.currentCol}]`}
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
            {lang === 'vi' ? 'Tùy biến' : 'Inspect'}
          </button>
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
          <span>{lang === 'vi' ? 'Ma trận' : 'Grid'}</span>
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
          <span>{lang === 'vi' ? 'Tùy chỉnh' : 'Custom'}</span>
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
          <span>{lang === 'vi' ? 'Mẫu' : 'Templates'}</span>
        </button>
      </div>

      {/* Tab 1: Interactive Matrix Visual Grid with Touch Swipe support */}
      {activeTab === 'grid' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-medium text-xs opacity-75">
              {lang === 'vi' ? 'Kích thước lựa chọn:' : 'Selected size:'}
            </span>
            <span
              className="font-mono font-bold text-xs px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: theme.accentLight || 'rgba(59,130,246,0.12)',
                color: theme.accent || '#3b82f6',
              }}
            >
              {hoveredCols} {lang === 'vi' ? 'Cột' : 'Cols'} × {hoveredRows} {lang === 'vi' ? 'Hàng' : 'Rows'}
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
            {lang === 'vi' ? 'Rê chuột / vuốt chạm để chọn kích thước & nhấp chèn' : 'Hover / touch drag to resize & click to insert'}
          </div>
        </div>
      )}

      {/* Tab 2: Custom Numeric Dimensions */}
      {activeTab === 'custom' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold opacity-80 flex items-center gap-1">
              <Rows size={12} style={{ color: theme.accent }} />
              <span>{lang === 'vi' ? 'Số hàng (Rows):' : 'Number of rows:'}</span>
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
              <span>{lang === 'vi' ? 'Số cột (Columns):' : 'Number of columns:'}</span>
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
                  {lang === 'vi' ? preset.nameVi : preset.name}
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
                {lang === 'vi' ? preset.descriptionVi : preset.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Deep Customization: Table Style, Alignment & Cell Padding */}
      <div className="pt-3 border-t space-y-3" style={{ borderColor: theme.borderFaint || theme.border }}>
        {/* Header row toggle */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold opacity-85">
            {lang === 'vi' ? 'Hàng tiêu đề (Header Row)' : lang === 'fr' ? 'Ligne d\'en-tête' : lang === 'de' ? 'Kopfzeile' : lang === 'it' ? 'Riga d\'intestazione' : lang === 'es' ? 'Fila de encabezado' : lang === 'ko' ? '헤더 행 (Header Row)' : lang === 'zh' ? '表头行 (Header Row)' : lang === 'ja' ? 'ヘッダー行 (Header Row)' : 'Header Row'}
          </span>
          <button
            type="button"
            onClick={() => setWithHeader(prev => !prev)}
            className="w-10 h-5.5 rounded-full relative cursor-pointer touch-manipulation transition-colors shrink-0"
            style={{
              backgroundColor: withHeader ? (theme.accent || '#2563eb') : (theme.border || '#9ca3af'),
              border: `1px solid ${withHeader ? (theme.accent || '#2563eb') : (theme.border || '#9ca3af')}`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: withHeader ? '20px' : '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              }}
            >
              {withHeader && <Check size={10} color={theme.accent || '#2563eb'} strokeWidth={3} />}
            </div>
          </button>
        </div>

        {/* Alignment */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold opacity-85 block">
            {lang === 'vi' ? 'Căn lề chiều rộng bảng:' : 'Table Alignment:'}
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
              <span>{lang === 'vi' ? 'Trái' : 'Left'}</span>
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
              <span>{lang === 'vi' ? 'Giữa' : 'Center'}</span>
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
              <span>{lang === 'vi' ? 'Toàn bộ' : 'Full'}</span>
            </button>
          </div>
        </div>

        {/* Style selection */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold opacity-85 block">
            {lang === 'vi' ? 'Kiểu khung viền:' : 'Border & Style:'}
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
              {lang === 'vi' ? 'Lưới ô' : 'Grid'}
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
              {lang === 'vi' ? 'Tối giản' : 'Minimal'}
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
              {lang === 'vi' ? 'Sọc hàng' : 'Striped'}
            </button>
          </div>
        </div>

        {/* Padding selection */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold opacity-85 block">
            {lang === 'vi' ? 'Khoảng đệm ô (Cell Padding):' : 'Cell Padding:'}
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
                {pad === 'compact' ? (lang === 'vi' ? 'Gọn' : 'Compact') : pad === 'normal' ? (lang === 'vi' ? 'Vừa' : 'Normal') : (lang === 'vi' ? 'Rộng' : 'Relaxed')}
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
            <span>{lang === 'vi' ? 'Đã chèn bảng thành công!' : 'Table inserted!'}</span>
          </>
        ) : (
          <>
            <Sparkles size={14} />
            <span>
              {lang === 'vi'
                ? `+ Chèn Bảng (${activeTab === 'grid' ? hoveredCols : customCols} Cột × ${activeTab === 'grid' ? hoveredRows : customRows} Hàng)`
                : `+ Insert Table (${activeTab === 'grid' ? hoveredCols : customCols}×${activeTab === 'grid' ? hoveredRows : customRows})`}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
