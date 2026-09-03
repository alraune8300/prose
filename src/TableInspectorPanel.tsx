import React, { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Table as TableIcon,
  Trash2, Plus, Minus,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  AlignLeft, AlignCenter, AlignRight,
  Maximize2
} from 'lucide-react';
import { Accordion } from './components/Accordion';
import type { ThemeColors } from './types';
import { getActiveTableInfo, adjustRowCount, adjustColumnCount, setTableAttribute } from './tableUtils';
import { t, Lang } from './i18n';

export default function TableInspectorPanel({
  editor,
  theme,
  lang,
  uiFont
}: {
  editor: Editor | null,
  theme: ThemeColors,
  lang: string,
  uiFont: string
}) {
  const [tableInfo, setTableInfo] = useState<{
    rowCount: number, colCount: number, currentRow: number, currentCol: number,
    alignment: string, isHeaderRow: boolean
  } | null>(null);

  const l = (lang || 'en') as Lang;

  const updateInfo = useCallback(() => {
    if (editor && !editor.isDestroyed) {
      setTableInfo(getActiveTableInfo(editor));
    }
  }, [editor]);

  useEffect(() => {
    updateInfo();
    if (!editor) return;
    editor.on('selectionUpdate', updateInfo);
    editor.on('transaction', updateInfo);
    return () => {
      editor.off('selectionUpdate', updateInfo);
      editor.off('transaction', updateInfo);
    };
  }, [editor, updateInfo]);

  const btnStyle = {
    padding: '8px 10px',
    borderRadius: '6px',
    border: `1px solid ${theme.border}`,
    background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    color: theme.text,
    fontSize: '0.74rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    transition: 'all 0.15s ease'
  };

  if (!tableInfo) {
    return (
      <div className="flex flex-col h-full w-full select-none" style={{ fontFamily: uiFont, backgroundColor: theme.bg, padding: 16 }} onMouseDown={(e) => e.preventDefault()}>
        <button
          onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none',
            background: theme.accent, color: '#fff', fontFamily: uiFont, fontSize: '0.8rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
          }}
        >
          <TableIcon size={16} />
          {t(l, 'insertTable') || 'Insert Table'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full select-none overflow-y-auto" onMouseDown={(e) => e.preventDefault()} style={{ fontFamily: uiFont, backgroundColor: theme.bg }}>
      <div className="p-4 space-y-6">
        
        {/* Table Properties */}
        <Accordion title={t(l, 'tableProperties') || "Table Properties"} uiFont={uiFont} c={theme as Record<string, unknown>}>
          <div className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>{t(l, 'rows') || "Rows"}</span>
                <div className="flex items-center" style={{ border: `1px solid ${theme.borderFaint}`, borderRadius: 6, overflow: 'hidden' }}>
                  <button style={{ flex: 1, padding: 6, background: theme.surface, color: theme.text }} onClick={() => adjustRowCount(editor!, -1)}><Minus size={14} className="mx-auto" /></button>
                  <span className="w-8 text-center text-xs font-mono">{tableInfo.rowCount}</span>
                  <button style={{ flex: 1, padding: 6, background: theme.surface, color: theme.text }} onClick={() => adjustRowCount(editor!, 1)}><Plus size={14} className="mx-auto" /></button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>{t(l, 'columns') || "Columns"}</span>
                <div className="flex items-center" style={{ border: `1px solid ${theme.borderFaint}`, borderRadius: 6, overflow: 'hidden' }}>
                  <button style={{ flex: 1, padding: 6, background: theme.surface, color: theme.text }} onClick={() => adjustColumnCount(editor!, -1)}><Minus size={14} className="mx-auto" /></button>
                  <span className="w-8 text-center text-xs font-mono">{tableInfo.colCount}</span>
                  <button style={{ flex: 1, padding: 6, background: theme.surface, color: theme.text }} onClick={() => adjustColumnCount(editor!, 1)}><Plus size={14} className="mx-auto" /></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button style={btnStyle} onClick={() => editor?.chain().focus().addRowBefore().run()} title={t(l, 'addRowAbove')}>
                <ArrowUp size={14} /> {t(l, 'addRow') || 'Add Row'}
              </button>
              <button style={btnStyle} onClick={() => editor?.chain().focus().addRowAfter().run()} title={t(l, 'addRowBelow')}>
                <ArrowDown size={14} /> {t(l, 'addRow') || 'Add Row'}
              </button>
              <button style={btnStyle} onClick={() => editor?.chain().focus().addColumnBefore().run()} title={t(l, 'addColumnBefore')}>
                <ArrowLeft size={14} /> {t(l, 'addCol') || 'Add Col'}
              </button>
              <button style={btnStyle} onClick={() => editor?.chain().focus().addColumnAfter().run()} title={t(l, 'addColumnAfter')}>
                <ArrowRight size={14} /> {t(l, 'addCol') || 'Add Col'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button style={{...btnStyle, color: '#ef4444', borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}} onClick={() => editor?.chain().focus().deleteRow().run()}>
                <Trash2 size={14} /> {t(l, 'row') || 'Row'}
              </button>
              <button style={{...btnStyle, color: '#ef4444', borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}} onClick={() => editor?.chain().focus().deleteColumn().run()}>
                <Trash2 size={14} /> {t(l, 'col') || 'Col'}
              </button>
            </div>

            <button style={{...btnStyle, width: '100%', color: '#ef4444', borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}} onClick={() => editor?.chain().focus().deleteTable().run()}>
              <Trash2 size={14} /> {t(l, 'deleteTable') || 'Delete Table'}
            </button>

          </div>
        </Accordion>

        {/* Alignment */}
        <Accordion title={t(l, 'alignment') || "Alignment"} uiFont={uiFont} c={theme as Record<string, unknown>}>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>{t(l, 'alignment') || "Alignment"}</span>
              <div className="flex gap-2">
                {[
                  { align: 'left', icon: AlignLeft },
                  { align: 'center', icon: AlignCenter },
                  { align: 'right', icon: AlignRight }
                ].map(({ align, icon: Icon }) => {
                  const isActive = editor?.isActive({ textAlign: align });
                  return (
                    <button
                      key={align}
                      onClick={() => editor?.chain().focus().setTextAlign(align).run()}
                      style={{
                        ...btnStyle, flex: 1,
                        background: isActive ? theme.accent : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                        color: isActive ? '#fff' : theme.text,
                        borderColor: isActive ? theme.accent : theme.border
                      }}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>{t(l, 'tableLayout') || "Table Layout"}</span>
              <div className="flex gap-2">
                {[
                  { type: 'left', icon: AlignLeft },
                  { type: 'center', icon: AlignCenter },
                  { type: 'full', icon: Maximize2 }
                ].map(({ type, icon: Icon }) => {
                  const isActive = tableInfo.alignment === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setTableAttribute(editor!, 'data-align', type)}
                      style={{
                        ...btnStyle, flex: 1,
                        background: isActive ? theme.accent : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                        color: isActive ? '#fff' : theme.text,
                        borderColor: isActive ? theme.accent : theme.border
                      }}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Accordion>
      </div>
    </div>
  );
}
