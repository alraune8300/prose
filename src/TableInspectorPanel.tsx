import React, { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Table as TableIcon,
  Rows, Columns, Trash2, Plus, Minus,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  AlignLeft, AlignCenter, AlignRight,
  Maximize2, Grid, ListFilter,
  Eraser, Sparkles, Check, AlertTriangle,
  Paintbrush, Combine, Split, Type, FileText, List, ClipboardPaste
} from 'lucide-react';
import type { ThemeColors } from './types';
import { getDict, type Lang } from './i18n';
import {
  getActiveTableInfo,
  setTableAttribute,
  clearTableContents,
  distributeColumnsEvenly,
  adjustRowCount,
  adjustColumnCount,
  setTableCellColor,
  setTableRowColor,
  setTableColumnColor,
  moveRow,
  moveColumn,
  convertTableToList,
  convertListToTable,
  parseClipboardTable,
  insertParsedTable
} from './tableUtils';

type Props = {
  editor: Editor | null;
  theme: ThemeColors;
  lang?: Lang;
  uiFont?: string;
};

const CELL_COLOR_PALETTE = [
  { name: 'Trong suốt / Mặc định', color: '' },
  { name: 'Xanh dương nhạt', color: 'rgba(59, 130, 246, 0.14)' },
  { name: 'Xanh lá ngọc', color: 'rgba(16, 185, 129, 0.14)' },
  { name: 'Vàng hổ phách', color: 'rgba(245, 158, 11, 0.16)' },
  { name: 'Đỏ hoa hồng', color: 'rgba(239, 68, 68, 0.14)' },
  { name: 'Tím lavender', color: 'rgba(139, 92, 246, 0.16)' },
  { name: 'Xám trung tính', color: 'rgba(100, 116, 139, 0.14)' },
];

export default function TableInspectorPanel({ editor, theme, lang = 'vi', uiFont = 'Inter' }: Props) {
  const dict = getDict(lang);
  const [tableInfo, setTableInfo] = useState<{
    rowCount: number;
    colCount: number;
    currentRow: number;
    currentCol: number;
    isHeaderRow: boolean;
    alignment: 'left' | 'center' | 'full';
    styleType: 'minimal' | 'grid' | 'striped';
    cellPadding: 'compact' | 'normal' | 'relaxed';
    caption: string;
    showCaption: boolean;
    sourceNote: string;
    showSourceNote: boolean;
    canMerge: boolean;
    canSplit: boolean;
  } | null>(null);

  const [confirmDeleteTable, setConfirmDeleteTable] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [colorScope, setColorScope] = useState<'cell' | 'row' | 'col'>('cell');
  const [pasteSuccessNotice, setPasteSuccessNotice] = useState(false);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      setTableInfo(null);
      return;
    }

    const updateInfo = () => {
      if (!editor.isActive('table')) {
        setTableInfo(null);
        return;
      }
      const info = getActiveTableInfo(editor);
      if (info) {
        setTableInfo({
          rowCount: info.rowCount,
          colCount: info.colCount,
          currentRow: info.currentRow,
          currentCol: info.currentCol,
          isHeaderRow: info.isHeaderRow,
          alignment: info.alignment,
          styleType: info.styleType,
          cellPadding: info.cellPadding,
          caption: info.caption,
          showCaption: info.showCaption,
          sourceNote: info.sourceNote,
          showSourceNote: info.showSourceNote,
          canMerge: info.canMerge,
          canSplit: info.canSplit,
        });
      }
    };

    updateInfo();

    editor.on('selectionUpdate', updateInfo);
    editor.on('transaction', updateInfo);

    return () => {
      editor.off('selectionUpdate', updateInfo);
      editor.off('transaction', updateInfo);
    };
  }, [editor]);

  const isVi = lang === 'vi';

  if (!editor || editor.isDestroyed || !editor.isActive('table') || !tableInfo) {
    const getT = (vi: string, en: string, fr: string) => {
      if (lang === 'vi') return vi;
      if (lang === 'fr') return fr;
      return en;
    };

    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[340px]" style={{ fontFamily: uiFont }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <TableIcon size={24} className="opacity-40" />
        </div>
        <h4 className="text-sm font-semibold mb-1" style={{ color: theme.text }}>
          {dict.noTableSelected}
        </h4>
        <p className="text-xs max-w-[220px] opacity-60 mb-4" style={{ color: theme.textMuted }}>
          {dict.clickCursorIntoTable}
        </p>
        
        {/* Quick Convert List to Table button if list active */}
        <button onMouseDown={(e) => e.preventDefault()}
          type="button"
          onClick={() => editor && convertListToTable(editor)}
          className="px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all active:scale-95"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <List size={14} />
          <span>{dict.convertListToTable}</span>
        </button>
      </div>
    );
  }

  const handleAlign = (align: 'left' | 'center' | 'full') => {
    setTableAttribute(editor, 'alignment', align);
    setTableInfo(prev => prev ? { ...prev, alignment: align } : null);
  };

  const handleStyle = (styleType: 'minimal' | 'grid' | 'striped') => {
    setTableAttribute(editor, 'styleType', styleType);
    setTableInfo(prev => prev ? { ...prev, styleType } : null);
  };

  const handlePadding = (cellPadding: 'compact' | 'normal' | 'relaxed') => {
    setTableAttribute(editor, 'cellPadding', cellPadding);
    setTableInfo(prev => prev ? { ...prev, cellPadding } : null);
  };

  const handleTextAlign = (align: 'left' | 'center' | 'right') => {
    editor.chain().focus().setTextAlign(align).run();
  };

  const handleApplyColor = (color: string) => {
    if (colorScope === 'row') {
      setTableRowColor(editor, color);
    } else if (colorScope === 'col') {
      setTableColumnColor(editor, color);
    } else {
      setTableCellColor(editor, color);
    }
  };

  const handleSmartPasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        const matrix = parseClipboardTable(clipText);
        if (matrix && matrix.length > 0) {
          const success = insertParsedTable(editor, matrix);
          if (success) {
            setPasteSuccessNotice(true);
            setTimeout(() => setPasteSuccessNotice(false), 2500);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-xs pb-16 kgv-scroll" style={{ fontFamily: uiFont, color: theme.text }}>
      {/* 1. Header Coordinates & Matrix Status Badge */}
      <div
        className="p-3 rounded-2xl border flex flex-col gap-2"
        style={{
          backgroundColor: theme.surface || '#ffffff',
          borderColor: theme.border || '#e5e7eb',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-xs">
            <TableIcon size={14} style={{ color: theme.text }} />
            <span>{dict.tableInspector || (isVi ? 'Tùy biến Bảng (Inspector)' : 'Table Inspector')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border"
              style={{
                backgroundColor: (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              {tableInfo.rowCount} × {tableInfo.colCount}
            </span>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => {
                if (confirmDeleteTable) {
                  editor.chain().focus().deleteTable().run();
                  setConfirmDeleteTable(false);
                } else {
                  setConfirmDeleteTable(true);
                }
              }}
              className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer transition-all active:scale-95"
              title={dict.deleteTable || (isVi ? 'Xóa bảng' : 'Delete Table')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t opacity-80" style={{ borderColor: theme.borderFaint || theme.border }}>
          <span>{isVi ? 'Ô đang chọn:' : 'Selected Cell:'}</span>
          <span className="font-semibold font-mono">
            {isVi ? `Hàng ${tableInfo.currentRow}, Cột ${tableInfo.currentCol}` : `Row ${tableInfo.currentRow}, Col ${tableInfo.currentCol}`}
          </span>
        </div>
      </div>

      {/* 2. Cell Merge & Split Controls */}
      <div className="flex flex-col gap-1.5">
        <span className="font-semibold text-xs flex items-center gap-1.5 opacity-85">
          <Combine size={13} style={{ color: theme.text }} />
          <span>{isVi ? 'Gộp & Tách Ô (Merge / Split)' : 'Merge & Split Cells'}</span>
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => editor.chain().focus().mergeCells().run()}
            disabled={!tableInfo.canMerge}
            className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              tableInfo.canMerge ? 'hover:bg-blue-500/10 cursor-pointer font-medium' : 'opacity-40 cursor-not-allowed'
            }`}
            style={{
              borderColor: tableInfo.canMerge ? theme.text : theme.border,
              color: tableInfo.canMerge ? theme.text : undefined
            }}
          >
            <Combine size={13} />
            <span>{isVi ? 'Gộp các ô (Merge)' : 'Merge Cells'}</span>
          </button>
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => editor.chain().focus().splitCell().run()}
            disabled={!tableInfo.canSplit}
            className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              tableInfo.canSplit ? 'hover:bg-blue-500/10 cursor-pointer font-medium' : 'opacity-40 cursor-not-allowed'
            }`}
            style={{
              borderColor: tableInfo.canSplit ? theme.text : theme.border,
              color: tableInfo.canSplit ? theme.text : undefined
            }}
          >
            <Split size={13} />
            <span>{isVi ? 'Tách ô (Split)' : 'Split Cell'}</span>
          </button>
        </div>
      </div>

      {/* 3. Table Caption & Source Note Section */}
      <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: theme.borderFaint || theme.border }}>
        <span className="font-semibold text-xs flex items-center gap-1.5 opacity-85">
          <FileText size={13} style={{ color: theme.text }} />
          <span>{isVi ? 'Tiêu đề & Nguồn Bảng (Caption & Source)' : 'Caption & Source Note'}</span>
        </span>

        {/* Table Caption */}
        <div className="flex flex-col gap-1 p-2 rounded-xl border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium flex items-center gap-1">
              <Type size={11} /> {isVi ? 'Tiêu đề trên đầu bảng (Caption)' : 'Table Caption'}
            </span>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              role="switch"
              aria-checked={tableInfo.showCaption}
              onClick={() => {
                const nextVal = !tableInfo.showCaption;
                setTableAttribute(editor, 'showCaption', nextVal);
                setTableInfo(prev => prev ? { ...prev, showCaption: nextVal } : null);
              }}
              className="w-10 h-5.5 rounded-full relative cursor-pointer touch-manipulation transition-colors duration-200 shrink-0 p-0.5"
              style={{
                backgroundColor: tableInfo.showCaption ? (theme.accent || '#2563eb') : (theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
              }}
            >
              <div
                className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center shadow-xs transition-transform duration-200 ease-out"
                style={{
                  transform: tableInfo.showCaption ? 'translateX(18px)' : 'translateX(0px)',
                }}
              >
                {tableInfo.showCaption && <Check size={10} color={theme.accent || '#2563eb'} strokeWidth={3} />}
              </div>
            </button>
          </div>
          <input
            type="text"
            value={tableInfo.caption || ''}
            onChange={(e) => {
              setTableAttribute(editor, 'caption', e.target.value);
              setTableInfo(prev => prev ? { ...prev, caption: e.target.value } : null);
            }}
            placeholder={isVi ? 'vd: Bảng 1: So sánh thông số kỹ thuật' : 'e.g. Table 1: Performance metrics'}
            className="px-2.5 py-1 text-xs rounded-lg border bg-black/5 dark:bg-white/5 focus:outline-none"
            style={{ borderColor: theme.border }}
          />
        </div>

        {/* Source Note */}
        <div className="flex flex-col gap-1 p-2 rounded-xl border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium flex items-center gap-1">
              <FileText size={11} /> {isVi ? 'Ghi chú nguồn dưới bảng (Source Note)' : 'Source Note'}
            </span>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              role="switch"
              aria-checked={tableInfo.showSourceNote}
              onClick={() => {
                const nextVal = !tableInfo.showSourceNote;
                setTableAttribute(editor, 'showSourceNote', nextVal);
                setTableInfo(prev => prev ? { ...prev, showSourceNote: nextVal } : null);
              }}
              className="w-10 h-5.5 rounded-full relative cursor-pointer touch-manipulation transition-colors duration-200 shrink-0 p-0.5"
              style={{
                backgroundColor: tableInfo.showSourceNote ? (theme.accent || '#2563eb') : (theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
              }}
            >
              <div
                className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center shadow-xs transition-transform duration-200 ease-out"
                style={{
                  transform: tableInfo.showSourceNote ? 'translateX(18px)' : 'translateX(0px)',
                }}
              >
                {tableInfo.showSourceNote && <Check size={10} color={theme.accent || '#2563eb'} strokeWidth={3} />}
              </div>
            </button>
          </div>
          <input
            type="text"
            value={tableInfo.sourceNote || ''}
            onChange={(e) => {
              setTableAttribute(editor, 'sourceNote', e.target.value);
              setTableInfo(prev => prev ? { ...prev, sourceNote: e.target.value } : null);
            }}
            placeholder={isVi ? 'vd: Nguồn: Tổng cục Thống kê 2024' : 'e.g. Source: Annual Report 2024'}
            className="px-2.5 py-1 text-xs rounded-lg border bg-black/5 dark:bg-white/5 focus:outline-none"
            style={{ borderColor: theme.border }}
          />
        </div>
      </div>

      {/* 4. Cell, Row, and Column Background Color */}
      <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: theme.borderFaint || theme.border }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs flex items-center gap-1.5 opacity-85">
            <Paintbrush size={13} style={{ color: theme.text }} />
            <span>{isVi ? 'Màu nền Nhấn (Accent Highlight)' : 'Accent Highlight'}</span>
          </span>
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg">
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => setColorScope('cell')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-all ${colorScope === 'cell' ? 'bg-white dark:bg-zinc-800 shadow-2xs font-semibold' : 'opacity-70'}`}
              style={{ color: colorScope === 'cell' ? theme.accent : undefined }}
            >
              {isVi ? 'Ô' : 'Cell'}
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => setColorScope('row')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-all ${colorScope === 'row' ? 'bg-white dark:bg-zinc-800 shadow-2xs font-semibold' : 'opacity-70'}`}
              style={{ color: colorScope === 'row' ? theme.accent : undefined }}
            >
              {isVi ? 'Hàng' : 'Row'}
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => setColorScope('col')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-all ${colorScope === 'col' ? 'bg-white dark:bg-zinc-800 shadow-2xs font-semibold' : 'opacity-70'}`}
              style={{ color: colorScope === 'col' ? theme.accent : undefined }}
            >
              {isVi ? 'Cột' : 'Col'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-2 rounded-xl border overflow-x-auto kgv-scroll" style={{ borderColor: theme.border }}>
          {CELL_COLOR_PALETTE.map((pal) => (
            <button onMouseDown={(e) => e.preventDefault()}
              key={pal.name}
              type="button"
              onClick={() => handleApplyColor(pal.color)}
              className="w-6 h-6 rounded-full border flex items-center justify-center hover:scale-120 active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
              style={{
                backgroundColor: pal.color || (theme.isDark ? '#27272a' : '#f4f4f5'),
                borderColor: theme.border || '#cbd5e1',
              }}
              title={pal.name}
            />
          ))}
        </div>
      </div>

      {/* 5. Row & Column Reorder Controls */}
      <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: theme.borderFaint || theme.border }}>
        <span className="font-semibold text-xs opacity-85">{isVi ? 'Đổi thứ tự Hàng & Cột' : 'Reorder Rows & Columns'}</span>
        <div className="grid grid-cols-2 gap-2">
          {/* Move Row Up/Down */}
          <div className="p-2 rounded-xl border flex items-center justify-between" style={{ borderColor: theme.border }}>
            <span className="text-[11px] opacity-80">{isVi ? `Hàng ${tableInfo.currentRow}:` : `Row ${tableInfo.currentRow}:`}</span>
            <div className="flex items-center gap-1">
              <button onMouseDown={(e) => e.preventDefault()}
                type="button"
                onClick={() => moveRow(editor, tableInfo.currentRow, tableInfo.currentRow - 1)}
                disabled={tableInfo.currentRow <= 1}
                className="p-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Lên trên"
              >
                <ArrowUp size={12} />
              </button>
              <button onMouseDown={(e) => e.preventDefault()}
                type="button"
                onClick={() => moveRow(editor, tableInfo.currentRow, tableInfo.currentRow + 1)}
                disabled={tableInfo.currentRow >= tableInfo.rowCount}
                className="p-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Xuống dưới"
              >
                <ArrowDown size={12} />
              </button>
            </div>
          </div>

          {/* Move Col Left/Right */}
          <div className="p-2 rounded-xl border flex items-center justify-between" style={{ borderColor: theme.border }}>
            <span className="text-[11px] opacity-80">{isVi ? `Cột ${tableInfo.currentCol}:` : `Col ${tableInfo.currentCol}:`}</span>
            <div className="flex items-center gap-1">
              <button onMouseDown={(e) => e.preventDefault()}
                type="button"
                onClick={() => moveColumn(editor, tableInfo.currentCol, tableInfo.currentCol - 1)}
                disabled={tableInfo.currentCol <= 1}
                className="p-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Sang trái"
              >
                <ArrowLeft size={12} />
              </button>
              <button onMouseDown={(e) => e.preventDefault()}
                type="button"
                onClick={() => moveColumn(editor, tableInfo.currentCol, tableInfo.currentCol + 1)}
                disabled={tableInfo.currentCol >= tableInfo.colCount}
                className="p-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Sang phải"
              >
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Convert Table <-> Bullet List */}
      <div className="flex flex-col gap-1.5 pt-2 border-t" style={{ borderColor: theme.borderFaint || theme.border }}>
        <span className="font-semibold text-xs opacity-85">{isVi ? 'Chuyển đổi Bảng & Danh sách' : 'Convert Table & List'}</span>
        <button onMouseDown={(e) => e.preventDefault()}
          type="button"
          onClick={() => convertTableToList(editor)}
          className="p-2.5 rounded-xl border flex items-center justify-center gap-1.5 hover:bg-purple-500/10 text-purple-500 font-medium cursor-pointer transition-all active:scale-95"
          style={{ borderColor: theme.border }}
        >
          <List size={13} />
          <span>{isVi ? 'Chuyển Bảng này thành Danh sách' : 'Convert Table to Bullet List'}</span>
        </button>
      </div>

      {/* 7. Row Controls */}
      <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: theme.borderFaint || theme.border }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs flex items-center gap-1.5 opacity-85">
            <Rows size={13} style={{ color: theme.text }} />
            <span>{isVi ? 'Quản lý Hàng (Rows)' : 'Row Controls'}</span>
          </span>
          <div className="flex items-center gap-1">
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => adjustRowCount(editor, Math.max(1, tableInfo.rowCount - 1))}
              disabled={tableInfo.rowCount <= 1}
              className="w-6 h-6 rounded-lg flex items-center justify-center border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer touch-manipulation active:scale-95"
              style={{ borderColor: theme.border }}
              title={isVi ? 'Bớt 1 hàng' : 'Remove row'}
            >
              <Minus size={12} />
            </button>
            <span className="w-6 text-center font-mono font-semibold">{tableInfo.rowCount}</span>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => adjustRowCount(editor, tableInfo.rowCount + 1)}
              className="w-6 h-6 rounded-lg flex items-center justify-center border hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer touch-manipulation active:scale-95"
              style={{ borderColor: theme.border }}
              title={isVi ? 'Thêm 1 hàng' : 'Add row'}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="p-2 rounded-xl border flex items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-all active:scale-95 touch-manipulation"
            style={{ borderColor: theme.border }}
            title={isVi ? 'Thêm 1 hàng phía trên' : 'Add row above'}
          >
            <ArrowUp size={12} style={{ color: theme.text }} />
            <span className="text-[11px] font-medium">{isVi ? '+ Trên' : '+ Above'}</span>
          </button>
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="p-2 rounded-xl border flex items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-all active:scale-95 touch-manipulation"
            style={{ borderColor: theme.border }}
            title={isVi ? 'Thêm 1 hàng phía dưới' : 'Add row below'}
          >
            <ArrowDown size={12} style={{ color: theme.text }} />
            <span className="text-[11px] font-medium">{isVi ? '+ Dưới' : '+ Below'}</span>
          </button>
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 touch-manipulation font-medium"
            title={isVi ? 'Xóa hàng đang chọn' : 'Delete selected row'}
          >
            <Trash2 size={12} />
            <span className="text-[11px]">{isVi ? 'Xóa hàng' : 'Del row'}</span>
          </button>
        </div>

        {/* Toggle Header Row */}
        <div className="flex items-center justify-between p-2.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-all mt-1" style={{ borderColor: theme.border }}>
          <span className="text-[11px] opacity-85 font-medium">{isVi ? 'Hàng tiêu đề (Header Row)' : 'Header Row'}</span>
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            role="switch"
            aria-checked={tableInfo.isHeaderRow}
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            className="w-10 h-5.5 rounded-full relative cursor-pointer touch-manipulation transition-colors duration-200 shrink-0 p-0.5"
            style={{
              backgroundColor: tableInfo.isHeaderRow ? (theme.accent || '#2563eb') : (theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
            }}
          >
            <div
              className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center shadow-xs transition-transform duration-200 ease-out"
              style={{
                transform: tableInfo.isHeaderRow ? 'translateX(18px)' : 'translateX(0px)',
              }}
            >
              {tableInfo.isHeaderRow && <Check size={10} color={theme.accent || '#2563eb'} strokeWidth={3} />}
            </div>
          </button>
        </div>
      </div>

      {/* 8. Column Controls */}
      <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: theme.borderFaint || theme.border }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs flex items-center gap-1.5 opacity-85">
            <Columns size={13} style={{ color: theme.text }} />
            <span>{isVi ? 'Quản lý Cột (Columns)' : 'Column Controls'}</span>
          </span>
          <div className="flex items-center gap-1">
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => adjustColumnCount(editor, Math.max(1, tableInfo.colCount - 1))}
              disabled={tableInfo.colCount <= 1}
              className="w-6 h-6 rounded-lg flex items-center justify-center border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer touch-manipulation active:scale-95"
              style={{ borderColor: theme.border }}
              title={isVi ? 'Bớt 1 cột' : 'Remove column'}
            >
              <Minus size={12} />
            </button>
            <span className="w-6 text-center font-mono font-semibold">{tableInfo.colCount}</span>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => adjustColumnCount(editor, tableInfo.colCount + 1)}
              className="w-6 h-6 rounded-lg flex items-center justify-center border hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer touch-manipulation active:scale-95"
              style={{ borderColor: theme.border }}
              title={isVi ? 'Thêm 1 cột' : 'Add column'}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="p-2 rounded-xl border flex items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-all active:scale-95 touch-manipulation"
            style={{ borderColor: theme.border }}
            title={isVi ? 'Thêm 1 cột bên trái' : 'Add column left'}
          >
            <ArrowLeft size={12} style={{ color: theme.text }} />
            <span className="text-[11px] font-medium">{isVi ? '+ Trái' : '+ Left'}</span>
          </button>
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="p-2 rounded-xl border flex items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-all active:scale-95 touch-manipulation"
            style={{ borderColor: theme.border }}
            title={isVi ? 'Thêm 1 cột bên phải' : 'Add column right'}
          >
            <ArrowRight size={12} style={{ color: theme.text }} />
            <span className="text-[11px] font-medium">{isVi ? '+ Phải' : '+ Right'}</span>
          </button>
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 touch-manipulation font-medium"
            title={isVi ? 'Xóa cột đang chọn' : 'Delete selected column'}
          >
            <Trash2 size={12} />
            <span className="text-[11px]">{isVi ? 'Xóa cột' : 'Del col'}</span>
          </button>
        </div>
      </div>

      {/* 9. Alignment & Padding */}
      <div className="flex flex-col gap-2.5 pt-2 border-t" style={{ borderColor: theme.borderFaint || theme.border }}>
        <span className="font-semibold text-xs opacity-85">{isVi ? 'Căn lề & Khoảng đệm' : 'Alignment & Padding'}</span>

        {/* Text Alignment inside Cell */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] opacity-65">{isVi ? 'Căn lề chữ trong ô đang chọn:' : 'Cell text alignment:'}</span>
          <div className="grid grid-cols-3 gap-1.5">
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => handleTextAlign('left')}
              className="p-1.5 rounded-xl border flex items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer active:scale-95"
              style={{ borderColor: theme.border }}
              title="Căn trái"
            >
              <AlignLeft size={13} />
              <span className="text-[11px]">{isVi ? 'Trái' : 'Left'}</span>
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => handleTextAlign('center')}
              className="p-1.5 rounded-xl border flex items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer active:scale-95"
              style={{ borderColor: theme.border }}
              title="Căn giữa"
            >
              <AlignCenter size={13} />
              <span className="text-[11px]">{isVi ? 'Giữa' : 'Center'}</span>
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => handleTextAlign('right')}
              className="p-1.5 rounded-xl border flex items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer active:scale-95"
              style={{ borderColor: theme.border }}
              title="Căn phải"
            >
              <AlignRight size={13} />
              <span className="text-[11px]">{isVi ? 'Phải' : 'Right'}</span>
            </button>
          </div>
        </div>

        {/* Table Overall Alignment */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] opacity-65">{isVi ? 'Căn lề khối Bảng:' : 'Table Alignment:'}</span>
          <div className="grid grid-cols-3 gap-1.5">
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => handleAlign('left')}
              className={`p-1.5 rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${tableInfo.alignment === 'left' ? 'font-semibold shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{
                backgroundColor: tableInfo.alignment === 'left' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                borderColor: tableInfo.alignment === 'left' ? theme.accent : theme.border,
                color: tableInfo.alignment === 'left' ? theme.accent : theme.text,
              }}
            >
              <AlignLeft size={13} />
              <span className="text-[11px]">{isVi ? 'Trái' : 'Left'}</span>
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => handleAlign('center')}
              className={`p-1.5 rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${tableInfo.alignment === 'center' ? 'font-semibold shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{
                backgroundColor: tableInfo.alignment === 'center' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                borderColor: tableInfo.alignment === 'center' ? theme.accent : theme.border,
                color: tableInfo.alignment === 'center' ? theme.accent : theme.text,
              }}
            >
              <AlignCenter size={13} />
              <span className="text-[11px]">{isVi ? 'Giữa' : 'Center'}</span>
            </button>
            <button onMouseDown={(e) => e.preventDefault()}
              type="button"
              onClick={() => handleAlign('full')}
              className={`p-1.5 rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${tableInfo.alignment === 'full' ? 'font-semibold shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{
                backgroundColor: tableInfo.alignment === 'full' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                borderColor: tableInfo.alignment === 'full' ? theme.accent : theme.border,
                color: tableInfo.alignment === 'full' ? theme.accent : theme.text,
              }}
            >
              <Maximize2 size={13} />
              <span className="text-[11px]">{isVi ? 'Đầy đủ' : 'Full'}</span>
            </button>
          </div>
        </div>

        {/* Distribute Columns Evenly */}
        <button onMouseDown={(e) => e.preventDefault()}
          type="button"
          onClick={() => distributeColumnsEvenly(editor)}
          className="p-2.5 rounded-xl border flex items-center justify-center gap-1.5 hover:bg-blue-500/10 font-medium cursor-pointer transition-all active:scale-95 mt-1"
          style={{
            borderColor: theme.accent || '#3b82f6',
            color: theme.text,
            backgroundColor: theme.accentLight || 'rgba(59,130,246,0.06)'
          }}
        >
          <Sparkles size={14} />
          <span>{isVi ? 'Tự động chia đều các cột' : 'Distribute Columns Evenly'}</span>
        </button>

        {/* Cell Padding Selection */}
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[11px] opacity-65">{isVi ? 'Khoảng đệm ô (Cell Padding):' : 'Cell Padding:'}</span>
          <div className="grid grid-cols-3 gap-1.5">
            {(['compact', 'normal', 'relaxed'] as const).map((pad) => (
              <button onMouseDown={(e) => e.preventDefault()}
                key={pad}
                type="button"
                onClick={() => handlePadding(pad)}
                className={`py-1.5 px-1.5 rounded-xl border text-center text-[11px] capitalize cursor-pointer transition-all active:scale-95 ${tableInfo.cellPadding === pad ? 'font-semibold shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                style={{
                  backgroundColor: tableInfo.cellPadding === pad ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                  borderColor: tableInfo.cellPadding === pad ? theme.accent : theme.border,
                  color: tableInfo.cellPadding === pad ? theme.accent : theme.text,
                }}
              >
                {pad === 'compact' ? (isVi ? 'Gọn' : 'Compact') : pad === 'normal' ? (isVi ? 'Vừa' : 'Normal') : (isVi ? 'Rộng' : 'Relaxed')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 10. Table Style / Borders */}
      <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: theme.borderFaint || theme.border }}>
        <span className="font-semibold text-xs opacity-85">{isVi ? 'Kiểu dáng Viền & Bảng' : 'Table Style & Borders'}</span>
        <div className="grid grid-cols-3 gap-1.5">
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => handleStyle('minimal')}
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${tableInfo.styleType === 'minimal' ? 'font-semibold shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
            style={{
              backgroundColor: tableInfo.styleType === 'minimal' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
              borderColor: tableInfo.styleType === 'minimal' ? theme.accent : theme.border,
              color: tableInfo.styleType === 'minimal' ? theme.accent : theme.text,
            }}
          >
            <Minus size={14} />
            <span className="text-[10px]">Minimalist</span>
          </button>
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => handleStyle('grid')}
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${tableInfo.styleType === 'grid' ? 'font-semibold shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
            style={{
              backgroundColor: tableInfo.styleType === 'grid' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
              borderColor: tableInfo.styleType === 'grid' ? theme.accent : theme.border,
              color: tableInfo.styleType === 'grid' ? theme.accent : theme.text,
            }}
          >
            <Grid size={14} />
            <span className="text-[10px]">Full Grid</span>
          </button>
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => handleStyle('striped')}
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${tableInfo.styleType === 'striped' ? 'font-semibold shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
            style={{
              backgroundColor: tableInfo.styleType === 'striped' ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
              borderColor: tableInfo.styleType === 'striped' ? theme.accent : theme.border,
              color: tableInfo.styleType === 'striped' ? theme.accent : theme.text,
            }}
          >
            <ListFilter size={14} />
            <span className="text-[10px]">Striped</span>
          </button>
        </div>
      </div>

      {/* 11. Smart Paste Quick Action */}
      <div className="flex flex-col gap-1.5 pt-2 border-t" style={{ borderColor: theme.borderFaint || theme.border }}>
        <button onMouseDown={(e) => e.preventDefault()}
          type="button"
          onClick={handleSmartPasteFromClipboard}
          className="p-2.5 rounded-xl border flex items-center justify-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 font-medium cursor-pointer transition-all active:scale-95"
          style={{ borderColor: theme.border }}
        >
          <ClipboardPaste size={13} style={{ color: theme.text }} />
          <span>{isVi ? 'Dán dữ liệu từ Clipboard (Excel/Sheets)' : 'Paste from Clipboard (Excel/Sheets)'}</span>
        </button>
        {pasteSuccessNotice && (
          <span className="text-[10px] text-green-500 font-medium text-center animate-in fade-in">
            {isVi ? '✓ Đã dán ma trận dữ liệu thành công!' : '✓ Pasted data matrix successfully!'}
          </span>
        )}
      </div>

      {/* 12. Danger Zone */}
      <div className="flex flex-col gap-2 pt-2 border-t mt-1" style={{ borderColor: theme.borderFaint || theme.border }}>
        <span className="font-semibold text-xs text-red-500/90">{isVi ? 'Thao tác Dữ liệu & Xóa Bảng' : 'Danger Zone'}</span>

        {/* Clear Table Contents */}
        {confirmClearData ? (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
            <span className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
              <AlertTriangle size={12} /> {isVi ? 'Xóa hết chữ trong ô (giữ khung)?' : 'Clear all cell contents?'}
            </span>
            <div className="flex items-center gap-1.5">
              <button onMouseDown={(e) => e.preventDefault()}
                type="button"
                onClick={() => {
                  clearTableContents(editor);
                  setConfirmClearData(false);
                }}
                className="flex-1 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer active:scale-95"
              >
                <Check size={12} /> {isVi ? 'Xác nhận xóa chữ' : 'Confirm'}
              </button>
              <button onMouseDown={(e) => e.preventDefault()}
                type="button"
                onClick={() => setConfirmClearData(false)}
                className="px-2.5 py-1.5 rounded-lg border text-[11px] opacity-70 hover:opacity-100 cursor-pointer active:scale-95"
                style={{ borderColor: theme.border }}
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => setConfirmClearData(true)}
            className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 flex items-center justify-center gap-1.5 font-medium cursor-pointer transition-all active:scale-95 touch-manipulation"
          >
            <Eraser size={13} />
            <span>{isVi ? 'Xóa sạch dữ liệu (giữ khung bảng)' : 'Clear Table Contents'}</span>
          </button>
        )}

        {/* Delete Entire Table */}
        {confirmDeleteTable ? (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col gap-2">
            <span className="text-[11px] text-red-500 font-medium flex items-center gap-1">
              <AlertTriangle size={12} /> {isVi ? 'Xác nhận xóa hoàn toàn bảng này?' : 'Delete entire table?'}
            </span>
            <div className="flex items-center gap-1.5">
              <button onMouseDown={(e) => e.preventDefault()}
                type="button"
                onClick={() => {
                  editor.chain().focus().deleteTable().run();
                  setConfirmDeleteTable(false);
                }}
                className="flex-1 py-1.5 rounded-lg bg-red-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer active:scale-95"
              >
                <Trash2 size={12} /> {isVi ? 'Xóa bảng' : 'Delete Table'}
              </button>
              <button onMouseDown={(e) => e.preventDefault()}
                type="button"
                onClick={() => setConfirmDeleteTable(false)}
                className="px-2.5 py-1.5 rounded-lg border text-[11px] opacity-70 hover:opacity-100 cursor-pointer active:scale-95"
                style={{ borderColor: theme.border }}
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <button onMouseDown={(e) => e.preventDefault()}
            type="button"
            onClick={() => setConfirmDeleteTable(true)}
            className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center gap-1.5 font-medium cursor-pointer transition-all active:scale-95 touch-manipulation"
          >
            <Trash2 size={13} />
            <span>{isVi ? 'Xóa bảng hoàn toàn' : 'Delete Table'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
