import React, { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Rows, Columns, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Table as TableIcon, LayoutList
} from 'lucide-react';
import type { ThemeColors } from './types';

type Props = {
  editor: Editor | null;
  theme: ThemeColors;
};

export default function TableContextualToolbar({ editor, theme }: Props) {
  const [tableRect, setTableRect] = useState<{ top: number; right: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      setTableRect(null);
      return;
    }

    const updatePosition = () => {
      if (!editor.isActive('table')) {
        setTableRect(null);
        return;
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
            right: rect.right,
            left: rect.left,
            width: rect.width,
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

  if (!editor || editor.isDestroyed || !editor.isActive('table')) {
    return null;
  }

  // Check if active table is visible in viewport
  const isTableVisible = tableRect && tableRect.top > 40 && tableRect.top < window.innerHeight - 80;

  return (
    <>
      {/* On-Table Top-Right Quick Delete & Control Badge */}
      {isTableVisible && (
        <div
          className="fixed z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-lg shadow-lg border backdrop-blur-md animate-in fade-in duration-100 select-none pointer-events-auto"
          style={{
            top: `${Math.max(50, tableRect.top - 36)}px`,
            left: `${Math.min(window.innerWidth - 180, Math.max(16, tableRect.right - 180))}px`,
            backgroundColor: theme.isDark ? 'rgba(24, 24, 27, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: theme.border || '#3f3f46',
            color: theme.text || '#ffffff',
          }}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold opacity-70 border-r pr-2" style={{ borderColor: theme.border }}>
            <TableIcon size={12} />
            <span>Bảng</span>
          </div>

          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="px-2 py-0.5 rounded bg-red-500/15 hover:bg-red-500/30 text-red-500 hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            title="Xóa toàn bộ bảng"
          >
            <Trash2 size={12} />
            <span>Xóa Bảng</span>
          </button>
        </div>
      )}

      {/* Main Table Contextual Floating Toolbar */}
      <div
        className="fixed z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-2xl border backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150 select-none pointer-events-auto"
        style={
          isTableVisible
            ? {
                top: `${Math.max(60, tableRect.top - 44)}px`,
                left: `${Math.max(16, tableRect.left + tableRect.width / 2)}px`,
                transform: 'translateX(-50%)',
                backgroundColor: theme.surface ? `${theme.surface}f5` : 'rgba(24, 24, 27, 0.95)',
                borderColor: theme.border || '#3f3f46',
                color: theme.text || '#ffffff',
              }
            : {
                bottom: '48px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: theme.surface ? `${theme.surface}f5` : 'rgba(24, 24, 27, 0.95)',
                borderColor: theme.border || '#3f3f46',
                color: theme.text || '#ffffff',
              }
        }
      >
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 border"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            color: theme.text,
          }}
        >
          <TableIcon size={12} />
          <span>Bảng</span>
        </div>

        <div className="w-px h-4 bg-white/10 shrink-0 mx-0.5" />

        {/* Row Operations */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer opacity-80 hover:opacity-100"
            title="Thêm hàng phía trên"
          >
            <Rows size={13} />
            <ArrowUp size={10} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer opacity-80 hover:opacity-100"
            title="Thêm hàng phía dưới"
          >
            <Rows size={13} />
            <ArrowDown size={10} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all cursor-pointer opacity-80 hover:opacity-100"
            title="Xóa hàng hiện tại"
          >
            <Rows size={13} className="opacity-70" />
            <Trash2 size={11} />
          </button>
        </div>

        <div className="w-px h-4 bg-white/10 shrink-0 mx-0.5" />

        {/* Column Operations */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer opacity-80 hover:opacity-100"
            title="Thêm cột bên trái"
          >
            <Columns size={13} />
            <ArrowLeft size={10} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer opacity-80 hover:opacity-100"
            title="Thêm cột bên phải"
          >
            <Columns size={13} />
            <ArrowRight size={10} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all cursor-pointer opacity-80 hover:opacity-100"
            title="Xóa cột hiện tại"
          >
            <Columns size={13} className="opacity-70" />
            <Trash2 size={11} />
          </button>
        </div>

        <div className="w-px h-4 bg-white/10 shrink-0 mx-0.5" />

        {/* Toggle Header Row */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          className="p-1.5 rounded-lg hover:bg-white/10 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer opacity-80 hover:opacity-100"
          title="Bật/Tắt tiêu đề hàng (Header Row)"
        >
          <LayoutList size={13} />
          <span className="text-[11px]">Header</span>
        </button>

        <div className="w-px h-4 bg-white/10 shrink-0 mx-0.5" />

        {/* Delete Table Button */}
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          title="Xóa toàn bộ bảng"
        >
          <Trash2 size={12} />
          <span>Xóa Bảng</span>
        </button>
      </div>
    </>
  );
}
