import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Heading1, Heading2, Heading3, CheckSquare, List, ListOrdered, Quote, ChevronRight, Minus, Table, Columns3, type LucideIcon } from 'lucide-react';

interface SlashCommandItem {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  action: (editor: Editor) => void;
}

const COMMANDS: SlashCommandItem[] = [
  { id: 'h1', title: 'Heading 1', subtitle: 'Big section heading.', icon: Heading1, action: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2', title: 'Heading 2', subtitle: 'Medium section heading.', icon: Heading2, action: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', title: 'Heading 3', subtitle: 'Small section heading.', icon: Heading3, action: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'todo', title: 'To-do list', subtitle: 'Track tasks with a to-do list.', icon: CheckSquare, action: (editor: Editor) => editor.chain().focus().toggleTaskList().run() },
  { id: 'bullet', title: 'Bulleted list', subtitle: 'Simple bulleted list.', icon: List, action: (editor: Editor) => editor.chain().focus().toggleBulletList().run() },
  { id: 'ordered', title: 'Numbered list', subtitle: 'Numbered ordered list.', icon: ListOrdered, action: (editor: Editor) => editor.chain().focus().toggleOrderedList().run() },
  { id: 'quote', title: 'Quote', subtitle: 'Capture a blockquote.', icon: Quote, action: (editor: Editor) => editor.chain().focus().toggleBlockquote().run() },
  { id: 'toggle', title: 'Toggle List', subtitle: 'Toggles can hide and show content.', icon: ChevronRight, action: (editor: Editor) => editor.chain().focus().setToggleList().run() },
  { id: 'divider', title: 'Divider', subtitle: 'Visually divide blocks.', icon: Minus, action: (editor: Editor) => editor.chain().focus().setHorizontalRule().run() },
  { id: 'table', title: 'Database (Table)', subtitle: 'Advanced database table.', icon: Table, action: (editor: any) => editor.chain().focus().setDatabase('table').run() },
  { id: 'board', title: 'Database (Board)', subtitle: 'Advanced database board.', icon: Columns3, action: (editor: any) => editor.chain().focus().setDatabase('board').run() },
];

export function SlashCommandMenu({
  editor,
  query,
  x,
  y,
  range,
  onClose
}: {
  editor: Editor;
  query: string;
  x: number;
  y: number;
  range: { from: number; to: number };
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const filtered = COMMANDS.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) || 
    cmd.id.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filtered.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filtered[selectedIndex];
        if (cmd) {
          editor.chain().focus().deleteRange(range).run();
          cmd.action(editor);
        }
        onClose();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [filtered, selectedIndex, editor, range, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div 
      className="fixed z-50 flex flex-col w-64 rounded-2xl shadow-2xl border p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: x,
        top: y + 20,
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        Blocks
      </div>
      <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5 pr-0.5">
        {filtered.map((cmd, index) => {
          const Icon = cmd.icon;
          const isSelected = index === selectedIndex;
          return (
            <button 
              key={cmd.id}
              onClick={() => {
                editor.chain().focus().deleteRange(range).run();
                cmd.action(editor);
                onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left cursor-pointer"
              style={{ 
                backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                color: 'var(--text-primary)'
              }}
            >
              <Icon size={16} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold">{cmd.title}</span>
                <span className="text-[10px] opacity-60 truncate">{cmd.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
