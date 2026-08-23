import React, { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Rows, Columns, Trash2, Plus,
  AlignLeft, AlignCenter, Maximize2,
  GripVertical, Check, AlertTriangle, Sparkles,
  Sliders, Move, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Combine, Split, Type, List, Palette, FileText
} from 'lucide-react';
import type { ThemeColors } from './types';
import {
  getActiveTableInfo,
  setTableAttribute,
  distributeColumnsEvenly,
  clearTableContents,
  setTableCellColor,
  setTableRowColor,
  setTableColumnColor,
  moveRow,
  moveColumn,
  convertTableToList
} from './tableUtils';

type Props = {
  editor: Editor | null;
  theme: ThemeColors;
};

// Preset minimalist palette
const CELL_COLOR_PALETTE = [
  { name: 'Mặc định', color: '' },
  { name: 'Xanh dương nhạt', color: 'rgba(59, 130, 246, 0.14)' },
  { name: 'Xanh ngọc', color: 'rgba(16, 185, 129, 0.14)' },
  { name: 'Hổ phách ấm', color: 'rgba(245, 158, 11, 0.16)' },
  { name: 'Hoa hồng dịu', color: 'rgba(239, 68, 68, 0.14)' },
  { name: 'Lavender nhẹ', color: 'rgba(139, 92, 246, 0.16)' },
  { name: 'Xám trung tính', color: 'rgba(100, 116, 139, 0.14)' },
];

export default function TableContextualToolbar({ editor, theme }: Props) {
  const [tableRect, setTableRect] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  } | null>(null);

  const [tableInfo, setTableInfo] = useState<{
    alignment: 'left' | 'center' | 'full';
    styleType: 'minimal' | 'grid' | 'striped';
    cellPadding: 'compact' | 'normal' | 'relaxed';
    rowCount: number;
    colCount: number;
    currentRow: number;
    currentCol: number;
    caption: string;
    showCaption: boolean;
    sourceNote: string;
    showSourceNote: boolean;
    canMerge: boolean;
    canSplit: boolean;
  } | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeSubPanel, setActiveSubPanel] = useState<'color' | 'advanced' | 'caption' | 'reorder' | null>(null);
  const [colorScope, setColorScope] = useState<'cell' | 'row' | 'col'>('cell');

  // Manual Drag & Move offset state for floating menu
  const [manualOffset, setManualOffset] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number }>({ clientX: 0, clientY: 0, initialX: 0, initialY: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      setTableRect(null);
      setTableInfo(null);
      return;
    }

    const updatePosition = () => {
      if (!editor.isActive('table')) {
        setTableRect(null);
        setTableInfo(null);
        setConfirmDelete(false);
        setActiveSubPanel(null);
        return;
      }

      const info = getActiveTableInfo(editor);
      if (info) {
        setTableInfo({
          alignment: info.alignment,
          styleType: info.styleType,
          cellPadding: info.cellPadding,
          rowCount: info.rowCount,
          colCount: info.colCount,
          currentRow: info.currentRow,
          currentCol: info.currentCol,
          caption: info.caption,
          showCaption: info.showCaption,
          sourceNote: info.sourceNote,
          showSourceNote: info.showSourceNote,
          canMerge: info.canMerge,
          canSplit: info.canSplit,
        });
      }

      try {
        const { selection } = editor.state;
        const domNode = editor.view.domAtPos(selection.$anchor.pos).node;
        const el = domNode instanceof HTMLElement ? domNode : domNode.parentElement;
        const tableEl = el?.closest('table');

        if (tableEl) {
          const rect = tableEl.getBoundingClientRect();
          setTableRect({
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            width: rect.width,
            height: rect.height,
          });
        } else {
          setTableRect(null);
        }
      } catch {
        setTableRect(null);
      }
    };

    updatePosition();

    editor.on('selectionUpdate', updatePosition);
    editor.on('transaction', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('transaction', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [editor]);

  // Touch & Mouse Drag handlers for Floating Toolbar
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const initialPos = manualOffset || {
      x: Math.max(16, Math.min(window.innerWidth - 480, (tableRect?.left || 100) + (tableRect?.width || 200) / 2 - 240)),
      y: Math.max(64, (tableRect?.top || 100) - 56)
    };

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialX: initialPos.x,
      initialY: initialPos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;

    const newX = Math.max(8, Math.min(window.innerWidth - 320, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(50, Math.min(window.innerHeight - 80, dragStartRef.current.initialY + deltaY));

    setManualOffset({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  if (!editor || editor.isDestroyed || !editor.isActive('table') || !tableRect) {
    return null;
  }

  // Determine if table is sufficiently visible in viewport
  const isVisibleInView = tableRect.bottom > 40 && tableRect.top < window.innerHeight - 40;
  if (!isVisibleInView) return null;

  const currentAlign = tableInfo?.alignment || 'full';
  const currentStyle = tableInfo?.styleType || 'grid';
  const currentPad = tableInfo?.cellPadding || 'normal';

  const handleAlign = (align: 'left' | 'center' | 'full') => {
    setTableAttribute(editor, 'alignment', align);
    setTableInfo(prev => prev ? { ...prev, alignment: align } : null);
  };

  const handleStyle = (styleType: 'minimal' | 'grid' | 'striped') => {
    setTableAttribute(editor, 'styleType', styleType);
    setTableInfo(prev => prev ? { ...prev, styleType } : null);
  };

  const handlePadding = (pad: 'compact' | 'normal' | 'relaxed') => {
    setTableAttribute(editor, 'cellPadding', pad);
    setTableInfo(prev => prev ? { ...prev, cellPadding: pad } : null);
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

  const handleDeleteTable = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    editor.chain().focus().deleteTable().run();
    setConfirmDelete(false);
    setManualOffset(null);
  };

  const handleMergeOrSplit = () => {
    if (tableInfo?.canMerge) {
      editor.chain().focus().mergeCells().run();
    } else if (tableInfo?.canSplit) {
      editor.chain().focus().splitCell().run();
    }
  };

  // Base calculated position if not manually dragged
  const defaultBarLeft = Math.max(16, Math.min(window.innerWidth - 500, tableRect.left + tableRect.width / 2 - 250));
  const defaultBarTop = tableRect.top > 65 ? tableRect.top - 54 : tableRect.bottom + 12;

  const finalBarX = manualOffset ? manualOffset.x : defaultBarLeft;
  const finalBarY = manualOffset ? manualOffset.y : defaultBarTop;

  return (
    <>
      {/* 1. In-situ Draggable Floating Action Bar directly above/below table */}
      <div
        ref={toolbarRef}
        className="fixed z-50 flex flex-col rounded-2xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none pointer-events-auto transition-shadow"
        style={{
          top: `${finalBarY}px`,
          left: `${finalBarX}px`,
          backgroundColor: theme.surface ? `${theme.surface}f8` : (theme.isDark ? 'rgba(24, 24, 27, 0.96)' : 'rgba(255, 255, 255, 0.97)'),
          borderColor: theme.border || (theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
          color: theme.text || '#ffffff',
          boxShadow: theme.isDark ? '0 16px 36px rgba(0,0,0,0.55)' : '0 12px 32px rgba(0,0,0,0.14)',
          maxWidth: 'calc(100vw - 24px)',
        }}
      >
        {/* Main Floating Row */}
        <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto kgv-scroll max-w-full">
          {/* Drag Handle to reposition toolbar */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="flex items-center justify-center p-1 rounded-lg cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity touch-none shrink-0"
            title="Kéo thả để di chuyển menu nổi tự do"
          >
            <GripVertical size={14} style={{ color: theme.accent || '#3b82f6' }} />
          </div>

          {/* Quick Coordinate indicator / Switch to Inspector */}
          <div
            onClick={() => {
              window.dispatchEvent(new CustomEvent('kgv-switch-left-tab', { detail: { tab: 'table' } }));
            }}
            className="px-2 py-1 rounded-lg text-[11px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-all hover:scale-105 shrink-0"
            style={{
              backgroundColor: theme.accentLight || 'rgba(59,130,246,0.1)',
              color: theme.accent || '#3b82f6',
            }}
            title="Nhấp để mở bảng điều khiển chi tiết bên trái"
          >
            <span>{tableInfo?.rowCount}×{tableInfo?.colCount}</span>
            <span className="text-[9px] opacity-70">[{tableInfo?.currentRow},{tableInfo?.currentCol}]</span>
          </div>

          <div className="w-px h-4 bg-gray-400/20 shrink-0 mx-0.5" />

          {/* Merge / Split Quick Button */}
          <button
            type="button"
            onClick={handleMergeOrSplit}
            disabled={!tableInfo?.canMerge && !tableInfo?.canSplit}
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              tableInfo?.canMerge || tableInfo?.canSplit
                ? 'opacity-100 hover:scale-105 active:scale-95'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={{
              backgroundColor: tableInfo?.canMerge ? (theme.accentLight || 'rgba(59,130,246,0.15)') : undefined,
              color: (tableInfo?.canMerge || tableInfo?.canSplit) ? (theme.accent || '#3b82f6') : theme.textMuted,
            }}
            title={tableInfo?.canMerge ? 'Gộp các ô đang chọn (Merge Cells)' : (tableInfo?.canSplit ? 'Tách ô đã gộp (Split Cell)' : 'Gộp / Tách ô')}
          >
            {tableInfo?.canSplit ? <Split size={12} /> : <Combine size={12} />}
            <span className="text-[11px]">{tableInfo?.canSplit ? 'Tách ô' : 'Gộp ô'}</span>
          </button>

          <div className="w-px h-4 bg-gray-400/20 shrink-0 mx-0.5" />

          {/* Quick Add Row / Column Buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer opacity-85 hover:opacity-100 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: theme.text,
              }}
              title="Thêm 1 hàng phía dưới (+ Hàng)"
            >
              <Rows size={12} style={{ color: theme.accent }} />
              <span className="text-[11px]">+ Hàng</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer opacity-85 hover:opacity-100 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: theme.text,
              }}
              title="Thêm 1 cột bên phải (+ Cột)"
            >
              <Columns size={12} style={{ color: theme.accent }} />
              <span className="text-[11px]">+ Cột</span>
            </button>
          </div>

          <div className="w-px h-4 bg-gray-400/20 shrink-0 mx-0.5" />

          {/* Alignment Selector */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleAlign('left')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${currentAlign === 'left' ? 'font-semibold shadow-2xs' : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{
                backgroundColor: currentAlign === 'left' ? (theme.accentLight || 'rgba(59,130,246,0.18)') : 'transparent',
                color: currentAlign === 'left' ? (theme.accent || '#3b82f6') : theme.text,
              }}
              title="Căn trái (Left)"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('center')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${currentAlign === 'center' ? 'font-semibold shadow-2xs' : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{
                backgroundColor: currentAlign === 'center' ? (theme.accentLight || 'rgba(59,130,246,0.18)') : 'transparent',
                color: currentAlign === 'center' ? (theme.accent || '#3b82f6') : theme.text,
              }}
              title="Căn giữa (Center)"
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('full')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${currentAlign === 'full' ? 'font-semibold shadow-2xs' : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{
                backgroundColor: currentAlign === 'full' ? (theme.accentLight || 'rgba(59,130,246,0.18)') : 'transparent',
                color: currentAlign === 'full' ? (theme.accent || '#3b82f6') : theme.text,
              }}
              title="Toàn chiều rộng (Full Width)"
            >
              <Maximize2 size={13} />
            </button>
          </div>

          <div className="w-px h-4 bg-gray-400/20 shrink-0 mx-0.5" />

          {/* Sub-panel Toggles: Color, Caption, Reorder, Advanced */}
          <div className="flex items-center gap-0.5 shrink-0 relative">
            {/* Color Palette Toggle */}
            <button
              type="button"
              onClick={() => setActiveSubPanel(prev => prev === 'color' ? null : 'color')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${activeSubPanel === 'color' ? 'font-semibold' : 'opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{
                backgroundColor: activeSubPanel === 'color' ? (theme.accentLight || 'rgba(59,130,246,0.18)') : 'transparent',
                color: activeSubPanel === 'color' ? (theme.accent || '#3b82f6') : theme.text,
              }}
              title="Tô màu nền ô / hàng / cột"
            >
              <Palette size={13} />
            </button>

            {/* Caption & Source Note Toggle */}
            <button
              type="button"
              onClick={() => setActiveSubPanel(prev => prev === 'caption' ? null : 'caption')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${activeSubPanel === 'caption' ? 'font-semibold' : 'opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{
                backgroundColor: activeSubPanel === 'caption' ? (theme.accentLight || 'rgba(59,130,246,0.18)') : 'transparent',
                color: activeSubPanel === 'caption' ? (theme.accent || '#3b82f6') : theme.text,
              }}
              title="Thêm Tiêu đề & Nguồn bảng"
            >
              <FileText size={13} />
            </button>

            {/* Reorder Rows/Cols Toggle */}
            <button
              type="button"
              onClick={() => setActiveSubPanel(prev => prev === 'reorder' ? null : 'reorder')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${activeSubPanel === 'reorder' ? 'font-semibold' : 'opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{
                backgroundColor: activeSubPanel === 'reorder' ? (theme.accentLight || 'rgba(59,130,246,0.18)') : 'transparent',
                color: activeSubPanel === 'reorder' ? (theme.accent || '#3b82f6') : theme.text,
              }}
              title="Di chuyển & Đổi thứ tự Hàng / Cột"
            >
              <ArrowUp size={13} />
            </button>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setActiveSubPanel(prev => prev === 'advanced' ? null : 'advanced')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${activeSubPanel === 'advanced' ? 'font-semibold' : 'opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{
                backgroundColor: activeSubPanel === 'advanced' ? (theme.accentLight || 'rgba(59,130,246,0.18)') : 'transparent',
                color: activeSubPanel === 'advanced' ? (theme.accent || '#3b82f6') : theme.text,
              }}
              title="Tùy chỉnh sâu (Kiểu viền, Padding, Chuyển thành danh sách)"
            >
              <Sliders size={13} />
            </button>
          </div>

          {/* Reset position button if dragged */}
          {manualOffset && (
            <button
              type="button"
              onClick={() => setManualOffset(null)}
              className="p-1.5 rounded-lg text-[10px] opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer shrink-0"
              title="Ghim lại vị trí mặc định trên đầu bảng"
            >
              <Move size={12} />
            </button>
          )}

          {/* Delete Table with confirmation */}
          <div className="pl-0.5 shrink-0">
            {confirmDelete ? (
              <div className="flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/30">
                <span className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                  <AlertTriangle size={11} /> Xóa?
                </span>
                <button
                  type="button"
                  onClick={handleDeleteTable}
                  className="p-1 rounded hover:bg-red-500/20 text-red-500 cursor-pointer font-bold"
                  title="Xác nhận xóa"
                >
                  <Check size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-xs opacity-70 cursor-pointer"
                  title="Hủy"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDeleteTable}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-500 hover:text-red-600 transition-all cursor-pointer"
                title="Xóa toàn bộ bảng"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* SUB-PANEL 1: Accent Color Highlight */}
        {activeSubPanel === 'color' && (
          <div
            className="p-2.5 border-t flex flex-col gap-2 animate-in slide-in-from-top-1 text-xs"
            style={{ borderColor: theme.border || 'rgba(156, 163, 175, 0.2)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] opacity-75 font-medium">Phạm vi tô màu:</span>
              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setColorScope('cell')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-all ${colorScope === 'cell' ? 'bg-white dark:bg-zinc-800 shadow-2xs font-semibold' : 'opacity-70'}`}
                  style={{ color: colorScope === 'cell' ? theme.accent : undefined }}
                >
                  Ô hiện tại
                </button>
                <button
                  type="button"
                  onClick={() => setColorScope('row')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-all ${colorScope === 'row' ? 'bg-white dark:bg-zinc-800 shadow-2xs font-semibold' : 'opacity-70'}`}
                  style={{ color: colorScope === 'row' ? theme.accent : undefined }}
                >
                  Toàn hàng
                </button>
                <button
                  type="button"
                  onClick={() => setColorScope('col')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-all ${colorScope === 'col' ? 'bg-white dark:bg-zinc-800 shadow-2xs font-semibold' : 'opacity-70'}`}
                  style={{ color: colorScope === 'col' ? theme.accent : undefined }}
                >
                  Toàn cột
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto kgv-scroll pt-1">
              {CELL_COLOR_PALETTE.map((pal) => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => handleApplyColor(pal.color)}
                  className="w-5 h-5 rounded-full border flex items-center justify-center hover:scale-125 active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: pal.color || (theme.isDark ? '#27272a' : '#f4f4f5'),
                    borderColor: theme.border || '#cbd5e1',
                  }}
                  title={pal.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* SUB-PANEL 2: Caption & Source Note */}
        {activeSubPanel === 'caption' && (
          <div
            className="p-3 border-t flex flex-col gap-2 text-xs max-w-sm animate-in slide-in-from-top-1"
            style={{ borderColor: theme.border || 'rgba(156, 163, 175, 0.2)' }}
          >
            {/* Caption (Title) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium opacity-80 flex items-center gap-1">
                  <Type size={11} /> Tiêu đề Bảng (Caption):
                </label>
                <input
                  type="checkbox"
                  checked={tableInfo?.showCaption}
                  onChange={(e) => {
                    setTableAttribute(editor, 'showCaption', e.target.checked);
                    setTableInfo(prev => prev ? { ...prev, showCaption: e.target.checked } : null);
                  }}
                  className="rounded cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={tableInfo?.caption || ''}
                onChange={(e) => {
                  setTableAttribute(editor, 'caption', e.target.value);
                  setTableInfo(prev => prev ? { ...prev, caption: e.target.value } : null);
                }}
                placeholder="vd: Bảng 1: Doanh số Q4 (2024)..."
                className="px-2.5 py-1 text-xs rounded-lg border bg-black/5 dark:bg-white/5 focus:outline-none"
                style={{ borderColor: theme.border }}
              />
            </div>

            {/* Source Note */}
            <div className="flex flex-col gap-1 pt-1 border-t" style={{ borderColor: theme.border }}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium opacity-80 flex items-center gap-1">
                  <FileText size={11} /> Nguồn / Ghi chú (Source Note):
                </label>
                <input
                  type="checkbox"
                  checked={tableInfo?.showSourceNote}
                  onChange={(e) => {
                    setTableAttribute(editor, 'showSourceNote', e.target.checked);
                    setTableInfo(prev => prev ? { ...prev, showSourceNote: e.target.checked } : null);
                  }}
                  className="rounded cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={tableInfo?.sourceNote || ''}
                onChange={(e) => {
                  setTableAttribute(editor, 'sourceNote', e.target.value);
                  setTableInfo(prev => prev ? { ...prev, sourceNote: e.target.value } : null);
                }}
                placeholder="vd: Nguồn: Báo cáo tài chính nội bộ..."
                className="px-2.5 py-1 text-xs rounded-lg border bg-black/5 dark:bg-white/5 focus:outline-none"
                style={{ borderColor: theme.border }}
              />
            </div>
          </div>
        )}

        {/* SUB-PANEL 3: Row & Column Reordering */}
        {activeSubPanel === 'reorder' && (
          <div
            className="p-2.5 border-t flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-1"
            style={{ borderColor: theme.border || 'rgba(156, 163, 175, 0.2)' }}
          >
            {/* Row Reorder */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] opacity-75">Hàng {tableInfo?.currentRow}:</span>
              <button
                type="button"
                onClick={() => {
                  if (tableInfo && tableInfo.currentRow > 1) {
                    moveRow(editor, tableInfo.currentRow, tableInfo.currentRow - 1);
                  }
                }}
                disabled={!tableInfo || tableInfo.currentRow <= 1}
                className="p-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Đưa hàng lên trên"
              >
                <ArrowUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tableInfo && tableInfo.currentRow < tableInfo.rowCount) {
                    moveRow(editor, tableInfo.currentRow, tableInfo.currentRow + 1);
                  }
                }}
                disabled={!tableInfo || tableInfo.currentRow >= tableInfo.rowCount}
                className="p-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Đưa hàng xuống dưới"
              >
                <ArrowDown size={12} />
              </button>
            </div>

            <div className="w-px h-4 bg-gray-400/20" />

            {/* Column Reorder */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] opacity-75">Cột {tableInfo?.currentCol}:</span>
              <button
                type="button"
                onClick={() => {
                  if (tableInfo && tableInfo.currentCol > 1) {
                    moveColumn(editor, tableInfo.currentCol, tableInfo.currentCol - 1);
                  }
                }}
                disabled={!tableInfo || tableInfo.currentCol <= 1}
                className="p-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Đưa cột sang trái"
              >
                <ArrowLeft size={12} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tableInfo && tableInfo.currentCol < tableInfo.colCount) {
                    moveColumn(editor, tableInfo.currentCol, tableInfo.currentCol + 1);
                  }
                }}
                disabled={!tableInfo || tableInfo.currentCol >= tableInfo.colCount}
                className="p-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Đưa cột sang phải"
              >
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* SUB-PANEL 4: Advanced Formatting */}
        {activeSubPanel === 'advanced' && (
          <div
            className="p-3 border-t flex flex-col gap-2.5 text-[11px] animate-in slide-in-from-top-1"
            style={{ borderColor: theme.border || 'rgba(156, 163, 175, 0.2)' }}
          >
            {/* Style & Padding */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="opacity-70 text-[10px]">Kiểu viền:</span>
                {(['minimal', 'grid', 'striped'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStyle(st)}
                    className={`px-1.5 py-0.5 rounded text-[10px] border cursor-pointer ${
                      currentStyle === st ? 'bg-blue-500/20 text-blue-500 border-blue-500 font-semibold' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ borderColor: currentStyle === st ? undefined : theme.border }}
                  >
                    {st === 'minimal' ? 'Tối giản' : st === 'grid' ? 'Lưới' : 'Sọc'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span className="opacity-70 text-[10px]">Đệm:</span>
                {(['compact', 'normal', 'relaxed'] as const).map((pad) => (
                  <button
                    key={pad}
                    type="button"
                    onClick={() => handlePadding(pad)}
                    className={`px-1.5 py-0.5 rounded text-[10px] border cursor-pointer ${
                      currentPad === pad ? 'bg-blue-500/20 text-blue-500 border-blue-500 font-semibold' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ borderColor: currentPad === pad ? undefined : theme.border }}
                  >
                    {pad === 'compact' ? 'Gọn' : pad === 'normal' ? 'Vừa' : 'Rộng'}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra Actions: Distribute cols, Convert to list, Clear text */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: theme.border }}>
              <button
                type="button"
                onClick={() => distributeColumnsEvenly(editor)}
                className="px-2 py-1 rounded-lg border flex items-center gap-1 hover:bg-blue-500/10 text-blue-500 cursor-pointer font-medium"
                style={{ borderColor: theme.border }}
                title="Chia đều độ rộng tất cả các cột"
              >
                <Sparkles size={11} />
                <span>Chia đều cột</span>
              </button>

              <button
                type="button"
                onClick={() => convertTableToList(editor)}
                className="px-2 py-1 rounded-lg border flex items-center gap-1 hover:bg-purple-500/10 text-purple-500 cursor-pointer font-medium"
                style={{ borderColor: theme.border }}
                title="Chuyển đổi toàn bộ bảng thành danh sách gạch đầu dòng"
              >
                <List size={11} />
                <span>Thành Danh sách</span>
              </button>

              <button
                type="button"
                onClick={() => clearTableContents(editor)}
                className="px-2 py-1 rounded-lg border hover:bg-amber-500/10 text-amber-500 cursor-pointer"
                style={{ borderColor: theme.border }}
                title="Xóa trắng chữ trong các ô và giữ nguyên khung"
              >
                Xóa sạch chữ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Quick Handle on the Right Edge: Add Column */}
      <div
        className="fixed z-40 flex items-center select-none pointer-events-auto"
        style={{
          top: `${Math.min(window.innerHeight - 40, Math.max(50, tableRect.top + tableRect.height / 2 - 12))}px`,
          left: `${Math.min(window.innerWidth - 32, tableRect.right + 4)}px`,
        }}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className="w-6 h-6 rounded-full flex items-center justify-center shadow-md border opacity-75 hover:opacity-100 hover:scale-115 active:scale-95 transition-all cursor-pointer touch-manipulation"
          style={{
            backgroundColor: theme.surface || '#ffffff',
            borderColor: theme.border || '#cbd5e1',
            color: theme.accent || '#3b82f6',
          }}
          title="Thêm cột mới bên phải (+ Cột)"
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* 3. Quick Handle on the Bottom Edge: Add Row */}
      <div
        className="fixed z-40 flex items-center justify-center select-none pointer-events-auto"
        style={{
          top: `${Math.min(window.innerHeight - 32, tableRect.bottom + 4)}px`,
          left: `${Math.min(window.innerWidth - 60, Math.max(40, tableRect.left + tableRect.width / 2 - 12))}px`,
        }}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="w-6 h-6 rounded-full flex items-center justify-center shadow-md border opacity-75 hover:opacity-100 hover:scale-115 active:scale-95 transition-all cursor-pointer touch-manipulation"
          style={{
            backgroundColor: theme.surface || '#ffffff',
            borderColor: theme.border || '#cbd5e1',
            color: theme.accent || '#3b82f6',
          }}
          title="Thêm hàng mới phía dưới (+ Hàng)"
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}
