import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { GripVertical, Plus, Copy, Trash2, Heading1, Heading2, Heading3, CheckSquare, Quote, ChevronRight, List, ListOrdered } from 'lucide-react';
import { ThemeColors } from './types';

interface Props {
  editor: Editor | null;
  theme?: ThemeColors;
}

export function NotionDragHandle({ editor, theme }: Props) {
  const [pos, setPos] = useState({ top: -999, left: -999, show: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const activeNodeRef = useRef<HTMLElement | null>(null);

  const updatePosFromActiveNode = useCallback(() => {
    if (!activeNodeRef.current) return;
    const rect = activeNodeRef.current.getBoundingClientRect();
    
    // If the element is completely outside viewport, hide or close
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      if (!menuOpen) {
        setPos(p => ({ ...p, show: false }));
      }
      return;
    }

    setPos({
      top: rect.top + 2,
      left: Math.max(4, rect.left - 48),
      show: true
    });
  }, [menuOpen]);

  useEffect(() => {
    if (!editor) return;

    const onMouseMove = (e: MouseEvent) => {
      if (menuOpen) return;
      
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      const blockEl = el?.closest('.ProseMirror > *, .ProseMirror li, .database-row');

      if (blockEl && blockEl instanceof HTMLElement) {
        activeNodeRef.current = blockEl;
        const rect = blockEl.getBoundingClientRect();
        
        setPos({
          top: rect.top + 2,
          left: Math.max(4, rect.left - 48),
          show: true
        });
        return;
      }

      if (!handleRef.current?.contains(e.target as Node)) {
        setPos((p) => ({ ...p, show: false }));
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (menuOpen) return;
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
      
      if (handleRef.current?.contains(el)) return;
      
      const blockEl = el?.closest('.ProseMirror > *, .ProseMirror li, .database-row');

      if (blockEl && blockEl instanceof HTMLElement) {
        activeNodeRef.current = blockEl;
        const rect = blockEl.getBoundingClientRect();
        
        setPos({
          top: rect.top + 2,
          left: Math.max(4, rect.left - 48),
          show: true
        });
        return;
      }
      
      setPos((p) => ({ ...p, show: false }));
    };

    const onScroll = () => {
      if (menuOpen && activeNodeRef.current) {
        updatePosFromActiveNode();
      } else if (!menuOpen) {
        setPos(p => ({ ...p, show: false }));
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, [editor, menuOpen, updatePosFromActiveNode]);

  const handleDuplicate = () => {
    if (!editor || !activeNodeRef.current) return;
    try {
      const posAt = editor.view.posAtDOM(activeNodeRef.current, 0);
      const node = editor.state.doc.nodeAt(posAt);
      if (node) {
        editor.chain().focus().insertContentAt(posAt + node.nodeSize, node.toJSON()).run();
      }
    } catch (e) {
      console.warn('Duplicate block failed', e);
    }
    setMenuOpen(false);
    setPos(p => ({ ...p, show: false }));
  };

  const handleDelete = () => {
    if (!editor || !activeNodeRef.current) return;
    try {
      const posAt = editor.view.posAtDOM(activeNodeRef.current, 0);
      const node = editor.state.doc.nodeAt(posAt);
      if (node) {
        editor.chain().focus().deleteRange({ from: posAt, to: posAt + node.nodeSize }).run();
      }
    } catch (e) {
      console.warn('Delete block failed', e);
    }
    setMenuOpen(false);
    setPos(p => ({ ...p, show: false }));
  };

  const turnInto = (type: string, options?: Record<string, unknown>) => {
    if (!editor || !activeNodeRef.current) return;
    try {
      const posAt = editor.view.posAtDOM(activeNodeRef.current, 0);
      editor.commands.setNodeSelection(posAt);
      
      switch (type) {
        case 'heading':
          editor.chain().focus().toggleHeading(options as { level: 1 | 2 | 3 | 4 | 5 | 6 }).run();
          break;
        case 'taskList':
          editor.chain().focus().toggleTaskList().run();
          break;
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'blockquote':
          editor.chain().focus().toggleBlockquote().run();
          break;
        case 'toggleList':
          editor.chain().focus().setToggleList().run();
          break;
        case 'paragraph':
          editor.chain().focus().setParagraph().run();
          break;
      }
    } catch (e) {
      console.warn('Turn into failed', e);
    }
    
    setMenuOpen(false);
    setPos(p => ({ ...p, show: false }));
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (menuOpen && handleRef.current && !handleRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setPos(p => ({ ...p, show: false }));
      }
    };
    if (menuOpen) {
      window.addEventListener('mousedown', handleGlobalClick);
    }
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [menuOpen]);

  if (!pos.show && !menuOpen) return null;

  return (
    <div
      ref={handleRef}
      className="fixed flex items-center justify-end gap-0.5 select-none w-11 h-7 rounded-lg border shadow-sm transition-opacity"
      style={{
        top: pos.top,
        left: pos.left,
        zIndex: 60,
        backgroundColor: theme?.bgSurface || 'var(--bg-surface)',
        borderColor: theme?.borderSubtle || 'var(--border-subtle)',
      }}
      onMouseEnter={() => !menuOpen && setPos((p) => ({ ...p, show: true }))}
    >
      <button
        onClick={() => {
          if (editor && activeNodeRef.current) {
            try {
              const posAt = editor.view.posAtDOM(activeNodeRef.current, 0);
              const node = editor.state.doc.nodeAt(posAt);
              if (node) {
                editor.chain().focus().insertContentAt(posAt + node.nodeSize, { type: 'paragraph' }).run();
              }
            } catch (e) {
              console.warn('Insert below failed', e);
            }
          }
        }}
        className={`p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-all cursor-pointer ${
          menuOpen ? 'opacity-0 pointer-events-none' : 'opacity-70 hover:opacity-100'
        }`}
        style={{ color: theme?.textMuted || 'var(--text-muted)' }}
        title="Add block below"
      >
        <Plus size={13} strokeWidth={2} />
      </button>
      
      <div className="relative">
        <button
          className={`p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-all cursor-grab active:cursor-grabbing ${
            menuOpen ? 'opacity-100 bg-black/10 dark:bg-white/10' : 'opacity-70 hover:opacity-100'
          }`}
          style={{ color: theme?.textMuted || 'var(--text-muted)' }}
          draggable={!menuOpen}
          onDragStart={(e) => {
            if (activeNodeRef.current) {
              e.dataTransfer.setDragImage(activeNodeRef.current, 0, 0);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          title="Click for block options, drag to move"
        >
          <GripVertical size={13} strokeWidth={2} />
        </button>

        {menuOpen && (
          <div 
            className="absolute top-full left-0 mt-1.5 w-56 rounded-2xl shadow-2xl border p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
            style={{
              backgroundColor: theme?.bgSurface || 'var(--bg-surface)',
              borderColor: theme?.borderSubtle || 'var(--border-subtle)',
              color: theme?.textPrimary || 'var(--text-primary)',
              zIndex: 70
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: theme?.textMuted || 'var(--text-muted)' }}>
              Actions
            </div>
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition-colors text-left w-full cursor-pointer"
            >
              <Copy size={13} /> Duplicate
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 text-xs font-medium transition-colors text-left w-full cursor-pointer"
            >
              <Trash2 size={13} /> Delete
            </button>
            
            <div className="h-px w-full my-1" style={{ backgroundColor: theme?.borderSubtle || 'var(--border-subtle)' }} />
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: theme?.textMuted || 'var(--text-muted)' }}>
              Turn into
            </div>
            
            <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5 pr-0.5">
              <button
                onClick={() => turnInto('paragraph')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors text-left w-full cursor-pointer"
              >
                Text
              </button>
              <button
                onClick={() => turnInto('heading', { level: 1 })}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors text-left w-full cursor-pointer"
              >
                <Heading1 size={13} /> Heading 1
              </button>
              <button
                onClick={() => turnInto('heading', { level: 2 })}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors text-left w-full cursor-pointer"
              >
                <Heading2 size={13} /> Heading 2
              </button>
              <button
                onClick={() => turnInto('heading', { level: 3 })}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors text-left w-full cursor-pointer"
              >
                <Heading3 size={13} /> Heading 3
              </button>
              <button
                onClick={() => turnInto('taskList')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors text-left w-full cursor-pointer"
              >
                <CheckSquare size={13} /> To-do list
              </button>
              <button
                onClick={() => turnInto('bulletList')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors text-left w-full cursor-pointer"
              >
                <List size={13} /> Bulleted list
              </button>
              <button
                onClick={() => turnInto('orderedList')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors text-left w-full cursor-pointer"
              >
                <ListOrdered size={13} /> Numbered list
              </button>
              <button
                onClick={() => turnInto('blockquote')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors text-left w-full cursor-pointer"
              >
                <Quote size={13} /> Quote
              </button>
              <button
                onClick={() => turnInto('toggleList')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors text-left w-full cursor-pointer"
              >
                <ChevronRight size={13} /> Toggle List
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
