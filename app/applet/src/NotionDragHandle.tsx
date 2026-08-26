import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  GripVertical,
  Plus,
  Copy,
  Trash2,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Info,
  Code,
  Quote,
  ChevronRight,
  List,
  ListOrdered,
  Type
} from 'lucide-react';
import { ThemeColors } from './types';
import { getNotionI18n } from './apps/notion-workspace/i18n';
import { Lang } from './i18n';

interface Props {
  editor: Editor | null;
  theme?: ThemeColors;
  lang?: Lang;
  sidebarOpen?: boolean;
}

export function NotionDragHandle({ editor, theme, lang = 'en', sidebarOpen }: Props) {
  const [pos, setPos] = useState({ top: -999, left: -999, show: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<{ top: number; left: number; width: number; show: boolean }>({
    top: -999,
    left: -999,
    width: 0,
    show: false
  });

  const handleRef = useRef<HTMLDivElement>(null);
  const activeNodeRef = useRef<HTMLElement | null>(null);
  const draggedNodeInfoRef = useRef<{ pos: number; size: number; json: any } | null>(null);
  const currentDropTargetRef = useRef<{ el: HTMLElement; insertAfter: boolean } | null>(null);

  const t = getNotionI18n(lang);

  // Update handle position relative to active node
  const updateHandlePosition = () => {
    if (!activeNodeRef.current) return;
    const rect = activeNodeRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setPos((p) => ({ ...p, show: false }));
      return;
    }
    setPos({
      top: rect.top,
      left: Math.max(8, rect.left - 48),
      show: true
    });
  };

  // Listen to mousemove and scroll to position handle next to active block
  useEffect(() => {
    if (!editor) return;

    const onMouseMove = (e: MouseEvent) => {
      if (menuOpen) return;
      if (handleRef.current?.contains(e.target as Node)) {
        setPos((p) => ({ ...p, show: true }));
        return;
      }

      const view = editor.view;
      if (!view) return;

      const posAtMouse = view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!posAtMouse) {
        setPos((p) => ({ ...p, show: false }));
        return;
      }

      const dom = view.nodeDOM(posAtMouse.pos);
      if (dom && dom instanceof HTMLElement) {
        let el: HTMLElement | null = dom;
        while (el && el.parentElement && !el.parentElement.classList.contains('ProseMirror')) {
          el = el.parentElement;
        }

        if (el && el.parentElement?.classList.contains('ProseMirror')) {
          activeNodeRef.current = el;
          const rect = el.getBoundingClientRect();
          setPos({
            top: rect.top,
            left: Math.max(8, rect.left - 48),
            show: true
          });
          return;
        }
      }

      setPos((p) => ({ ...p, show: false }));
    };

    const onScrollOrResize = () => {
      if (activeNodeRef.current) {
        updateHandlePosition();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScrollOrResize, { capture: true });
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [editor, menuOpen]);

  // Recalculate position when sidebar collapses or expands
  useEffect(() => {
    const timer = setTimeout(() => {
      updateHandlePosition();
    }, 200);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  // Global click listener to dismiss menu
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (menuOpen && handleRef.current && !handleRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setPos((p) => ({ ...p, show: false }));
      }
    };
    if (menuOpen) {
      window.addEventListener('mousedown', handleGlobalClick);
    }
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [menuOpen]);

  // Drag and Drop event listeners on document
  useEffect(() => {
    if (!editor) return;

    const clearDropStyles = () => {
      const pm = document.querySelector('.ProseMirror');
      if (pm) {
        pm.querySelectorAll('.notion-drop-target-top, .notion-drop-target-bottom').forEach((el) => {
          el.classList.remove('notion-drop-target-top', 'notion-drop-target-bottom');
        });
      }
      setDropIndicator((prev) => ({ ...prev, show: false }));
    };

    const handleDragOver = (e: DragEvent) => {
      if (!draggedNodeInfoRef.current) return;
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }

      const pm = document.querySelector('.ProseMirror');
      if (!pm) return;

      const targetDom = document.elementFromPoint(e.clientX, e.clientY);
      if (!targetDom || !pm.contains(targetDom)) return;

      let el: HTMLElement | null = targetDom as HTMLElement;
      while (el && el.parentElement && !el.parentElement.classList.contains('ProseMirror')) {
        el = el.parentElement;
      }

      if (el && el.parentElement?.classList.contains('ProseMirror')) {
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const insertAfter = e.clientY > midY;

        clearDropStyles();
        if (insertAfter) {
          el.classList.add('notion-drop-target-bottom');
          setDropIndicator({
            top: rect.bottom,
            left: rect.left,
            width: rect.width,
            show: true
          });
        } else {
          el.classList.add('notion-drop-target-top');
          setDropIndicator({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            show: true
          });
        }

        currentDropTargetRef.current = { el, insertAfter };
      }
    };

    const handleDrop = (e: DragEvent) => {
      if (!draggedNodeInfoRef.current || !currentDropTargetRef.current || !editor) {
        clearDropStyles();
        draggedNodeInfoRef.current = null;
        currentDropTargetRef.current = null;
        return;
      }

      e.preventDefault();
      const { pos: srcPos, size: srcSize, json: srcJson } = draggedNodeInfoRef.current;
      const { el: targetEl, insertAfter } = currentDropTargetRef.current;

      try {
        const targetPos = editor.view.posAtDOM(targetEl, 0);
        const targetNode = editor.state.doc.nodeAt(targetPos);

        if (targetNode && typeof targetPos === 'number') {
          let destPos = targetPos;
          if (insertAfter) {
            destPos = targetPos + targetNode.nodeSize;
          }

          // Move content
          if (destPos < srcPos) {
            editor
              .chain()
              .focus()
              .deleteRange({ from: srcPos, to: srcPos + srcSize })
              .insertContentAt(destPos, srcJson)
              .run();
          } else if (destPos > srcPos + srcSize) {
            editor
              .chain()
              .focus()
              .insertContentAt(destPos, srcJson)
              .deleteRange({ from: srcPos, to: srcPos + srcSize })
              .run();
          }
        }
      } catch (err) {
        console.error('Error during block drop:', err);
      }

      clearDropStyles();
      draggedNodeInfoRef.current = null;
      currentDropTargetRef.current = null;
      setPos((p) => ({ ...p, show: false }));
    };

    const handleDragEnd = () => {
      clearDropStyles();
      draggedNodeInfoRef.current = null;
      currentDropTargetRef.current = null;
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragend', handleDragEnd);
      clearDropStyles();
    };
  }, [editor]);

  // Actions
  const handleDuplicate = () => {
    if (!editor || !activeNodeRef.current) return;
    const pos = editor.view.posAtDOM(activeNodeRef.current, 0);
    const node = editor.state.doc.nodeAt(pos);
    if (node) {
      editor.chain().focus().insertContentAt(pos + node.nodeSize, node.toJSON()).run();
    }
    setMenuOpen(false);
    setPos((p) => ({ ...p, show: false }));
  };

  const handleDelete = () => {
    if (!editor || !activeNodeRef.current) return;
    const pos = editor.view.posAtDOM(activeNodeRef.current, 0);
    const node = editor.state.doc.nodeAt(pos);
    if (node) {
      editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
    }
    setMenuOpen(false);
    setPos((p) => ({ ...p, show: false }));
  };

  const handleAddBelow = () => {
    if (!editor || !activeNodeRef.current) return;
    const pos = editor.view.posAtDOM(activeNodeRef.current, 0);
    const node = editor.state.doc.nodeAt(pos);
    if (node) {
      editor.chain().focus().insertContentAt(pos + node.nodeSize, { type: 'paragraph' }).run();
    }
    setMenuOpen(false);
  };

  const turnInto = (type: string, options?: any) => {
    if (!editor || !activeNodeRef.current) return;
    const pos = editor.view.posAtDOM(activeNodeRef.current, 0);
    editor.commands.setNodeSelection(pos);

    switch (type) {
      case 'heading':
        editor.chain().focus().toggleHeading(options).run();
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
      case 'callout':
        editor.chain().focus().setCallout().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
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

    setMenuOpen(false);
    setPos((p) => ({ ...p, show: false }));
  };

  return (
    <>
      {/* Drop Indicator Bar */}
      {dropIndicator.show && (
        <div
          className="fixed pointer-events-none z-[100] flex items-center transition-all"
          style={{
            top: dropIndicator.top - 2,
            left: dropIndicator.left,
            width: dropIndicator.width
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 -ml-1 shadow-sm" />
          <div className="flex-1 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 -mr-1 shadow-sm" />
        </div>
      )}

      {/* Drag Handle */}
      {(pos.show || menuOpen) && (
        <div
          ref={handleRef}
          className="fixed flex items-center gap-0.5 select-none z-[80] p-0.5 rounded-lg border shadow-sm transition-all"
          style={{
            top: pos.top,
            left: pos.left,
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderColor: 'var(--border-subtle, #e5e7eb)',
            color: 'var(--text-primary, #111827)'
          }}
          onMouseEnter={() => !menuOpen && setPos((p) => ({ ...p, show: true }))}
        >
          {/* Add Block Below */}
          <button
            onClick={handleAddBelow}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted, #6b7280)' }}
            title={t.addBelowTooltip}
          >
            <Plus size={14} />
          </button>

          {/* Grip & Actions Menu Trigger */}
          <div className="relative">
            <button
              className={`p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-all cursor-grab active:cursor-grabbing ${
                menuOpen ? 'bg-black/10 dark:bg-white/15' : ''
              }`}
              style={{ color: 'var(--text-muted, #6b7280)' }}
              draggable={!menuOpen}
              onDragStart={(e) => {
                if (activeNodeRef.current && editor) {
                  const pos = editor.view.posAtDOM(activeNodeRef.current, 0);
                  const node = editor.state.doc.nodeAt(pos);
                  if (node) {
                    draggedNodeInfoRef.current = {
                      pos,
                      size: node.nodeSize,
                      json: node.toJSON()
                    };
                    e.dataTransfer.setData('text/plain', node.textContent || '');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setDragImage(activeNodeRef.current, 10, 10);
                  }
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              title={t.dragHandleTooltip}
            >
              <GripVertical size={14} />
            </button>

            {/* Menu Pop-up with Solid System Colors */}
            {menuOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 w-60 rounded-2xl shadow-2xl border p-1.5 flex flex-col gap-0.5 z-[95] animate-in fade-in zoom-in-95 duration-100"
                style={{
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  borderColor: 'var(--border-subtle, #e5e7eb)',
                  color: 'var(--text-primary, #111827)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {t.actions}
                </div>

                <button
                  onClick={handleDuplicate}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs font-medium transition-colors text-left w-full cursor-pointer"
                >
                  <Copy size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{t.duplicate}</span>
                </button>

                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors text-left w-full cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>{t.delete}</span>
                </button>

                <div className="h-px w-full my-1" style={{ backgroundColor: 'var(--border-subtle)' }} />

                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {t.turnInto}
                </div>

                <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5 pr-1">
                  <button
                    onClick={() => turnInto('paragraph')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <Type size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{t.blankPage || 'Text'}</span>
                  </button>

                  <button
                    onClick={() => turnInto('heading', { level: 1 })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <Heading1 size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Heading 1</span>
                  </button>

                  <button
                    onClick={() => turnInto('heading', { level: 2 })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <Heading2 size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Heading 2</span>
                  </button>

                  <button
                    onClick={() => turnInto('heading', { level: 3 })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <Heading3 size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Heading 3</span>
                  </button>

                  <button
                    onClick={() => turnInto('taskList')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <CheckSquare size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>To-do list</span>
                  </button>

                  <button
                    onClick={() => turnInto('bulletList')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <List size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Bulleted list</span>
                  </button>

                  <button
                    onClick={() => turnInto('orderedList')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <ListOrdered size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Numbered list</span>
                  </button>

                  <button
                    onClick={() => turnInto('callout')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <Info size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Callout</span>
                  </button>

                  <button
                    onClick={() => turnInto('codeBlock')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <Code size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Code block</span>
                  </button>

                  <button
                    onClick={() => turnInto('blockquote')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <Quote size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Quote</span>
                  </button>

                  <button
                    onClick={() => turnInto('toggleList')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors text-left w-full cursor-pointer"
                  >
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Toggle list</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
