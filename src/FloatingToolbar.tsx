
import React, { useState, useEffect, useRef } from 'react';
import { Highlighter, Type, Bold, Italic, Strikethrough, GripVertical } from 'lucide-react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import type { ThemeColors } from './types';

const HIGHLIGHT_COLORS = [
  { id: 'amber', bg: 'bg-amber-500/20' },
  { id: 'emerald', bg: 'bg-emerald-500/20' },
  { id: 'rose', bg: 'bg-rose-500/20' },
  { id: 'blue', bg: 'bg-blue-500/20' },
  { id: 'violet', bg: 'bg-violet-500/20' },
  { id: 'zinc', bg: 'bg-gray-500/20' },
];

const TEXT_COLORS = [
  { id: 'default', color: 'inherit' },
  { id: 'emerald', color: '#10b981' },
  { id: 'slate', color: '#64748b' },
  { id: 'amber', color: '#f59e0b' },
  { id: 'rose', color: '#f43f5e' },
  { id: 'violet', color: '#8b5cf6' },
];

export function FloatingToolbar({ editor, theme }: { editor: Editor | null, theme: ThemeColors }) {
  const [showHighlight, setShowHighlight] = useState(false);
  const [showColor, setShowColor] = useState(false);
  
  // Dragging logic for the BubbleMenu
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Reset offset when selection changes significantly so it snaps back to the text
    const updateSelection = () => {
      setDragOffset({ x: 0, y: 0 });
      setShowColor(false);
      setShowHighlight(false);
    };
    if (editor) {
      editor.on('selectionUpdate', updateSelection);
      return () => editor.off('selectionUpdate', updateSelection);
    }
  }, [editor]);

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = { x: clientX - dragOffset.x, y: clientY - dragOffset.y };
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (isDragging) {
        setDragOffset({
          x: clientX - dragStart.current.x,
          y: clientY - dragStart.current.y
        });
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      // Prevent scrolling while dragging
      if (e.cancelable) e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  if (!editor) return null;

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ duration: 100, placement: 'top', animation: 'fade' }}
      className="z-50 flex items-center gap-1 p-1 rounded-xl shadow-lg border backdrop-blur-md"
      style={{ 
        backgroundColor: theme.isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)', 
        borderColor: theme.border,
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease',
      }}
    >
      <div 
        className="flex items-center justify-center px-1 cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100"
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        style={{ touchAction: 'none' }}
      >
        <GripVertical size={14} />
      </div>

      <div className="flex items-center gap-0.5 pr-1 border-r border-black/10 dark:border-white/10">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
      </div>

      {/* Color Dropdown */}
      <div className="relative">
        <button
          onClick={() => { setShowColor(!showColor); setShowHighlight(false); }}
          className={`p-1.5 rounded-lg transition-colors ${showColor ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
          title="Text Color"
        >
          <Type size={16} />
        </button>
        {showColor && (
          <div 
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 rounded-xl shadow-xl border flex gap-1.5" 
            style={{ 
              backgroundColor: theme.isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
              borderColor: theme.border 
            }}
          >
            {TEXT_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  if (c.id === 'default') {
                    editor.chain().focus().unsetColor().run();
                  } else {
                    editor.chain().focus().setColor(c.color).run();
                  }
                  setShowColor(false);
                }}
                className="w-6 h-6 rounded-full border border-black/10 dark:border-white/10 hover:scale-110 transition-transform flex items-center justify-center text-[10px] font-bold"
                style={{ 
                  backgroundColor: c.color === 'inherit' ? (theme.isDark ? '#e5e7eb' : '#374151') : c.color,
                  color: c.color === 'inherit' ? (theme.isDark ? '#000' : '#fff') : 'transparent'
                }}
                title={c.id}
              >
                {c.id === 'default' ? 'T' : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Highlight Dropdown */}
      <div className="relative">
        <button
          onClick={() => { setShowHighlight(!showHighlight); setShowColor(false); }}
          className={`p-1.5 rounded-lg transition-colors ${showHighlight ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
          title="Highlight"
        >
          <Highlighter size={16} />
        </button>
        {showHighlight && (
          <div 
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 rounded-xl shadow-xl border flex gap-1.5" 
            style={{ 
              backgroundColor: theme.isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
              borderColor: theme.border 
            }}
          >
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  editor.chain().focus().setHighlight({ color: c.id }).run();
                  setShowHighlight(false);
                }}
                className={`w-6 h-6 rounded-full ${c.bg} border border-black/10 dark:border-white/10 hover:scale-110 transition-transform`}
                title={c.id}
              />
            ))}
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}
