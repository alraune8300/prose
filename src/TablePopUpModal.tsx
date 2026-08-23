import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Table, Rows, Columns, Trash2, Plus, Minus, X,
  Sliders, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Combine, Split, Palette, RotateCcw
} from 'lucide-react';
import type { ThemeColors } from './types';
import { getDict, type Lang } from './i18n';
import {
  getActiveTableInfo,
  setTableAttribute,
  distributeColumnsEvenly,
  setTableCellColor
} from './tableUtils';

type Props = {
  editor: Editor | null;
  theme: ThemeColors;
  lang: Lang;
  isOpen: boolean;
  onClose: () => void;
};

const CELL_COLOR_PALETTE = [
  { name: 'Default', color: '' },
  { name: 'Blue', color: 'rgba(59, 130, 246, 0.14)' },
  { name: 'Emerald', color: 'rgba(16, 185, 129, 0.14)' },
  { name: 'Amber', color: 'rgba(245, 158, 11, 0.16)' },
  { name: 'Rose', color: 'rgba(239, 68, 68, 0.14)' },
  { name: 'Purple', color: 'rgba(139, 92, 246, 0.16)' },
  { name: 'Slate', color: 'rgba(100, 116, 139, 0.14)' },
];

export default function TablePopUpModal({ editor, theme, lang, isOpen, onClose }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [colWidth, setColWidth] = useState<number>(120);
  const [rowHeight, setRowHeight] = useState<number>(36);

  if (!isOpen || !editor || editor.isDestroyed || !editor.isActive('table')) {
    return null;
  }

  const dict = getDict(lang);
  const isVi = lang === 'vi';
  const tableInfo = getActiveTableInfo(editor);

  if (!tableInfo) return null;

  const applyColWidth = (newWidth: number) => {
    const safeWidth = Math.max(40, Math.min(800, newWidth));
    setColWidth(safeWidth);
    try {
      const { state, view } = editor;
      const { selection } = state;
      let cellPos: number | null = null;
      let cellNode: { attrs?: Record<string, unknown> } | null = null;
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          cellPos = pos;
          cellNode = node as unknown as { attrs?: Record<string, unknown> };
          return false;
        }
        return true;
      });
      if (cellPos !== null && cellNode) {
        const tr = state.tr.setNodeMarkup(cellPos, undefined, {
          ...cellNode.attrs,
          colwidth: [safeWidth],
          style: `width: ${safeWidth}px; min-width: ${safeWidth}px;`,
        });
        view.dispatch(tr);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const applyRowHeight = (newHeight: number) => {
    const safeHeight = Math.max(20, Math.min(400, newHeight));
    setRowHeight(safeHeight);
    try {
      const { state, view } = editor;
      const { selection } = state;
      let rowPos: number | null = null;
      let rowNode: { attrs?: Record<string, unknown> } | null = null;
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.type.name === 'tableRow') {
          rowPos = pos;
          rowNode = node as unknown as { attrs?: Record<string, unknown> };
          return false;
        }
        return true;
      });
      if (rowPos !== null && rowNode) {
        const tr = state.tr.setNodeMarkup(rowPos, undefined, {
          ...rowNode.attrs,
          style: `height: ${safeHeight}px;`,
        });
        view.dispatch(tr);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-all text-xs"
        style={{
          backgroundColor: theme.surface || (theme.isDark ? '#1e1e1e' : '#ffffff'),
          borderColor: theme.border || (theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
          color: theme.text,
        }}
      >
        {/* Header Bar */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: theme.borderFaint || theme.border }}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <div className="p-1.5 rounded-xl" style={{ backgroundColor: theme.accentLight || 'rgba(59,130,246,0.15)', color: theme.accent || '#3b82f6' }}>
              <Table size={16} />
            </div>
            <span>{dict.tableInspector || (isVi ? 'Tùy biến Bảng (Inspector Pop-up)' : 'Table Inspector Pop-up')}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border"
              style={{
                backgroundColor: theme.accentLight || 'rgba(59,130,246,0.1)',
                borderColor: theme.accent ? `${theme.accent}30` : 'rgba(59,130,246,0.2)',
                color: theme.accent || '#3b82f6',
              }}
            >
              {tableInfo.rowCount} × {tableInfo.colCount}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* 1. Dimension & Resizing Controls */}
          <div className="p-3.5 rounded-2xl border space-y-3" style={{ borderColor: theme.borderFaint || theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
            <div className="flex items-center justify-between font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <Sliders size={13} style={{ color: theme.accent }} />
                {isVi ? 'Kích thước Ô / Cột / Hàng' : 'Cell, Column & Row Size'}
              </span>
              <button
                type="button"
                onClick={() => distributeColumnsEvenly(editor)}
                className="px-2 py-1 rounded-lg border text-[10px] font-medium hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer active:scale-95"
                style={{ borderColor: theme.border }}
              >
                {isVi ? 'Chia đều rộng cột' : 'Distribute Cols'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Width Slider & Stepper */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium opacity-85">
                  <span>{isVi ? 'Rộng cột (Width)' : 'Col Width'}</span>
                  <span className="font-mono text-[10px]">{colWidth}px</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyColWidth(colWidth - 10)}
                    className="p-1 rounded border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer active:scale-90"
                    style={{ borderColor: theme.border }}
                  >
                    <Minus size={10} />
                  </button>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={5}
                    value={colWidth}
                    onChange={(e) => applyColWidth(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => applyColWidth(colWidth + 10)}
                    className="p-1 rounded border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer active:scale-90"
                    style={{ borderColor: theme.border }}
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>

              {/* Height Slider & Stepper */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium opacity-85">
                  <span>{isVi ? 'Cao hàng (Height)' : 'Row Height'}</span>
                  <span className="font-mono text-[10px]">{rowHeight}px</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyRowHeight(rowHeight - 5)}
                    className="p-1 rounded border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer active:scale-90"
                    style={{ borderColor: theme.border }}
                  >
                    <Minus size={10} />
                  </button>
                  <input
                    type="range"
                    min={20}
                    max={250}
                    step={2}
                    value={rowHeight}
                    onChange={(e) => applyRowHeight(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => applyRowHeight(rowHeight + 5)}
                    className="p-1 rounded border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer active:scale-90"
                    style={{ borderColor: theme.border }}
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Quick Command Action Buttons */}
          <div className="space-y-2">
            <span className="font-semibold text-xs opacity-75">{isVi ? 'Thao tác Nhanh' : 'Quick Operations'}</span>
            <div className="grid grid-cols-2 gap-2">
              {/* Row Actions */}
              <div className="flex items-center gap-1 p-1.5 rounded-xl border" style={{ borderColor: theme.border }}>
                <Rows size={12} className="shrink-0 opacity-60" />
                <span className="text-[10px] font-medium shrink-0 mr-auto">{dict.rows || 'Rows'}</span>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-[10px] flex items-center gap-0.5"
                  title={isVi ? 'Thêm hàng trên' : 'Insert Row Above'}
                >
                  <ArrowUp size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-[10px] flex items-center gap-0.5"
                  title={isVi ? 'Thêm hàng dưới' : 'Insert Row Below'}
                >
                  <ArrowDown size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="p-1 rounded hover:bg-red-500/10 text-red-500 cursor-pointer text-[10px]"
                  title={dict.deleteRow || 'Delete Row'}
                >
                  <Trash2 size={10} />
                </button>
              </div>

              {/* Col Actions */}
              <div className="flex items-center gap-1 p-1.5 rounded-xl border" style={{ borderColor: theme.border }}>
                <Columns size={12} className="shrink-0 opacity-60" />
                <span className="text-[10px] font-medium shrink-0 mr-auto">{dict.cols || 'Cols'}</span>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-[10px]"
                  title={isVi ? 'Thêm cột trái' : 'Insert Col Left'}
                >
                  <ArrowLeft size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-[10px]"
                  title={isVi ? 'Thêm cột phải' : 'Insert Col Right'}
                >
                  <ArrowRight size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="p-1 rounded hover:bg-red-500/10 text-red-500 cursor-pointer text-[10px]"
                  title={dict.deleteCol || 'Delete Col'}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>

            {/* Merge & Split */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().mergeCells().run()}
                disabled={!tableInfo.canMerge}
                className="flex-1 py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium disabled:opacity-40 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
                style={{ borderColor: theme.border }}
              >
                <Combine size={12} />
                <span>{dict.mergeCells || 'Merge Cells'}</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().splitCell().run()}
                disabled={!tableInfo.canSplit}
                className="flex-1 py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium disabled:opacity-40 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
                style={{ borderColor: theme.border }}
              >
                <Split size={12} />
                <span>{dict.splitCell || 'Split Cell'}</span>
              </button>
            </div>
          </div>

          {/* 3. Table Presets & Alignment */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Presets */}
            <div className="space-y-1.5">
              <span className="font-semibold text-[11px] opacity-75">{dict.tablePresets || 'Style Preset'}</span>
              <div className="flex items-center p-1 rounded-xl border gap-1" style={{ borderColor: theme.border }}>
                {(['grid', 'striped', 'minimal'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setTableAttribute(editor, 'styleType', style)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-medium capitalize transition-all cursor-pointer ${
                      tableInfo.styleType === style ? 'shadow-xs font-bold' : 'opacity-65 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: tableInfo.styleType === style ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                      color: tableInfo.styleType === style ? (theme.accent || '#2563eb') : theme.text,
                    }}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Alignment */}
            <div className="space-y-1.5">
              <span className="font-semibold text-[11px] opacity-75">{dict.tableAlignment || 'Alignment'}</span>
              <div className="flex items-center p-1 rounded-xl border gap-1" style={{ borderColor: theme.border }}>
                {(['left', 'center', 'full'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => setTableAttribute(editor, 'alignment', align)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-medium capitalize transition-all cursor-pointer ${
                      tableInfo.alignment === align ? 'shadow-xs font-bold' : 'opacity-65 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: tableInfo.alignment === align ? (theme.accentLight || 'rgba(59,130,246,0.15)') : 'transparent',
                      color: tableInfo.alignment === align ? (theme.accent || '#2563eb') : theme.text,
                    }}
                  >
                    {align === 'full' ? (isVi ? 'Rộng' : 'Full') : align}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Cell Background Color Palette */}
          <div className="space-y-1.5 pt-2">
            <span className="font-semibold text-[11px] opacity-75 flex items-center gap-1">
              <Palette size={12} />
              {isVi ? 'Màu nền ô (Cell Color)' : 'Cell Background'}
            </span>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {CELL_COLOR_PALETTE.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setTableCellColor(editor, p.color)}
                  className="w-6 h-6 rounded-full border shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
                  style={{
                    backgroundColor: p.color || (theme.isDark ? '#333333' : '#e5e7eb'),
                    borderColor: theme.border,
                  }}
                  title={p.name}
                >
                  {!p.color && <RotateCcw size={10} className="opacity-60" />}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Danger Zone */}
          <div className="pt-3 border-t" style={{ borderColor: theme.borderFaint || theme.border }}>
            {confirmDelete ? (
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30">
                <span className="text-[11px] font-semibold text-red-500">
                  {dict.confirmDeleteTable || (isVi ? 'Xóa hoàn toàn bảng này?' : 'Delete entire table?')}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteTable().run();
                      onClose();
                    }}
                    className="px-3 py-1 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 cursor-pointer active:scale-95 shadow-xs"
                  >
                    {dict.deleteTable || 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 rounded-xl border text-xs opacity-80 hover:opacity-100 cursor-pointer"
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
                className="w-full py-2 px-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-all active:scale-95"
              >
                <Trash2 size={14} />
                <span>{dict.deleteTable || (isVi ? 'Xóa bảng hoàn toàn' : 'Delete Table')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
