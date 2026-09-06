import React, { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { Plus, Minus, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { Accordion } from './components/Accordion';
import type { ThemeColors } from './types';
import { getActiveTableInfo, adjustRowCount, adjustColumnCount } from './tableUtils';
import { t, Lang } from './i18n';


const CornerButton = ({ children, onClick, disabled, uiFont }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, theme?: any, uiFont?: string }) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`relative flex items-center justify-center w-full py-2.5 group transition-opacity ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-70'}`}
      style={{ background: 'transparent', border: 'none', color: 'inherit' }}
    >
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-30 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-30 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-100 transition-opacity" />
      <span style={{ fontFamily: uiFont || 'inherit', fontSize: '0.85rem', letterSpacing: '0.05em' }}>{children}</span>
    </button>
  );
};

const NumberControl = ({ label, value, onInc, onDec, disabled, theme, uiFont }: { label: string, value: number, onInc: () => void, onDec: () => void, disabled?: boolean, theme: any, uiFont?: string }) => {
  return (
    <div className={`flex flex-col gap-2 w-full mb-3 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
      <span style={{ fontFamily: uiFont || 'inherit', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'inherit' }}>{label}</span>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderTop: '1px solid currentColor', borderBottom: '1px solid currentColor', background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
        <button onClick={onInc} className="p-1 cursor-pointer hover:opacity-70" style={{ background: 'transparent', border: 'none', color: 'inherit' }}>
          <Plus size={16} strokeWidth={2.5} />
        </button>
        <span style={{ fontFamily: uiFont || 'inherit', fontSize: '0.9rem' }}>{value}</span>
        <button onClick={onDec} className="p-1 cursor-pointer hover:opacity-70" style={{ background: 'transparent', border: 'none', color: 'inherit' }}>
          <Minus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

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
  const safeT = (k: keyof Strings, fallback: string) => {
    const val = t(l, k);
    if (!val || val === k) return fallback;
    return val;
  };

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

  const [createRows, setCreateRows] = useState(3);
  const [createCols, setCreateCols] = useState(4);

  return (
    <div className="flex flex-col h-full w-full select-none overflow-y-auto" onMouseDown={(e) => e.preventDefault()} style={{ backgroundColor: theme.panel }}>
      <div className="p-4 space-y-4">
        
        <Accordion title={safeT('createTable', 'Create Table')} uiFont={uiFont} c={theme as Record<string, unknown>}>
          <div className="flex flex-col py-2 pb-4" style={{ color: theme.text }}>
            <div className="flex justify-center mb-6 px-12">
              <CornerButton uiFont={uiFont} onClick={() => editor?.chain().focus().insertTable({ rows: createRows, cols: createCols, withHeaderRow: true }).run()}>
                {safeT('insertTable', 'Insert Table')}
              </CornerButton>
            </div>
            <NumberControl uiFont={uiFont} 
              label={safeT('row', 'Row')} 
              value={createRows} 
              onInc={() => setCreateRows(r => Math.min(20, r + 1))} 
              onDec={() => setCreateRows(r => Math.max(1, r - 1))} theme={theme}
            />
            <NumberControl uiFont={uiFont} 
              label={safeT('col', 'Column')} 
              value={createCols} 
              onInc={() => setCreateCols(c => Math.min(15, c + 1))} 
              onDec={() => setCreateCols(c => Math.max(1, c - 1))} theme={theme}
            />
          </div>
        </Accordion>

        <Accordion title={safeT('tableProperties', 'Table Properties')} uiFont={uiFont} c={theme as Record<string, unknown>}>
          <div className="flex flex-col py-2 pb-4" style={{ color: theme.text }}>
            <NumberControl uiFont={uiFont} 
              label={safeT('row', 'Row')} 
              value={tableInfo?.rowCount || 3} 
              disabled={!tableInfo}
              onInc={() => tableInfo && adjustRowCount(editor!, 1)} 
              onDec={() => tableInfo && adjustRowCount(editor!, -1)} theme={theme}
            />
            <NumberControl uiFont={uiFont} 
              label={safeT('col', 'Column')} 
              value={tableInfo?.colCount || 4} 
              disabled={!tableInfo}
              onInc={() => tableInfo && adjustColumnCount(editor!, 1)} 
              onDec={() => tableInfo && adjustColumnCount(editor!, -1)} theme={theme}
            />
            <NumberControl uiFont={uiFont} 
              label={safeT('addRow', 'Add Row')} 
              value={1} 
              disabled={!tableInfo}
              onInc={() => tableInfo && editor?.chain().focus().addRowAfter().run()} 
              onDec={() => tableInfo && editor?.chain().focus().addRowBefore().run()} theme={theme}
            />
            <NumberControl uiFont={uiFont} 
              label={safeT('addCol', 'Add Column')} 
              value={1} 
              disabled={!tableInfo}
              onInc={() => tableInfo && editor?.chain().focus().addColumnAfter().run()} 
              onDec={() => tableInfo && editor?.chain().focus().addColumnBefore().run()} theme={theme}
            />
            
            <div className="flex flex-col gap-5 mt-6 px-16">
              <CornerButton uiFont={uiFont} disabled={!tableInfo} onClick={() => editor?.chain().focus().deleteTable().run()}>
                {safeT('deleteTable', 'Delete Table')}
              </CornerButton>
              <CornerButton uiFont={uiFont} disabled={!tableInfo} onClick={() => editor?.chain().focus().deleteRow().run()}>
                {safeT('deleteRow', 'Delete Row')}
              </CornerButton>
              <CornerButton uiFont={uiFont} disabled={!tableInfo} onClick={() => editor?.chain().focus().deleteColumn().run()}>
                {safeT('deleteColumn', 'Delete Column')}
              </CornerButton>
            </div>
          </div>
        </Accordion>

        <Accordion title={safeT('alignment', 'Alignment')} uiFont={uiFont} c={theme as Record<string, unknown>}>
          <div className="flex justify-between px-6 py-4 pb-8" style={{ color: theme.text }}>
            {[
              { align: 'left', icon: AlignLeft },
              { align: 'center', icon: AlignCenter },
              { align: 'right', icon: AlignRight },
              { align: 'justify', icon: AlignJustify }
            ].map(({ align, icon: Icon }) => {
              const isActive = editor?.isActive({ textAlign: align });
              return (
                <button
                  key={align}
                  disabled={!tableInfo}
                  onClick={() => editor?.chain().focus().setTextAlign(align).run()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: tableInfo ? 'pointer' : 'not-allowed',
                    opacity: isActive ? 1 : (tableInfo ? 0.5 : 0.2),
                  }}
                  className="hover:opacity-100 transition-opacity"
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                </button>
              );
            })}
          </div>
        </Accordion>
      </div>
    </div>
  );
}
