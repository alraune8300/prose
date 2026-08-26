import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { ThemeColors } from '../../../types';
import {
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Table as TableIcon,
  Sparkles,
  Info
} from 'lucide-react';

interface NotionSlashMenuProps {
  editor: Editor | null;
  theme: ThemeColors;
  isOpen: boolean;
  position: { top: number; left: number };
  query: string;
  onClose: () => void;
}

interface CommandItem {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: (editor: Editor) => void;
  keywords: string[];
}

export const NotionSlashMenu: React.FC<NotionSlashMenuProps> = ({
  editor,
  theme,
  isOpen,
  position,
  query,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    {
      title: 'Heading 1',
      subtitle: 'Tiêu đề lớn cấp 1',
      icon: <Heading1 size={16} />,
      keywords: ['h1', 'heading', 'title', 'tieu de'],
      action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
      title: 'Heading 2',
      subtitle: 'Tiêu đề vừa cấp 2',
      icon: <Heading2 size={16} />,
      keywords: ['h2', 'heading', 'subheading'],
      action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      title: 'Heading 3',
      subtitle: 'Tiêu đề nhỏ cấp 3',
      icon: <Heading3 size={16} />,
      keywords: ['h3', 'heading', 'section'],
      action: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      title: 'To-do List',
      subtitle: 'Danh sách công việc có checkbox',
      icon: <CheckSquare size={16} />,
      keywords: ['todo', 'task', 'check', 'cong viec'],
      action: (ed) => {
        if ((ed.commands as any).toggleTaskList) {
          (ed.chain().focus() as any).toggleTaskList().run();
        }
      }
    },
    {
      title: 'Bulleted List',
      subtitle: 'Danh sách dấu chấm gạch đầu dòng',
      icon: <List size={16} />,
      keywords: ['bullet', 'list', 'danh sach', 'cham'],
      action: (ed) => ed.chain().focus().toggleBulletList().run()
    },
    {
      title: 'Numbered List',
      subtitle: 'Danh sách đánh số thứ tự (1, 2, 3...)',
      icon: <ListOrdered size={16} />,
      keywords: ['number', 'order', 'danh sach so'],
      action: (ed) => ed.chain().focus().toggleOrderedList().run()
    },
    {
      title: 'Quote',
      subtitle: 'Trích dẫn khối nội dung',
      icon: <Quote size={16} />,
      keywords: ['quote', 'trich dan'],
      action: (ed) => ed.chain().focus().toggleBlockquote().run()
    },
    {
      title: 'Code Block',
      subtitle: 'Khối mã nguồn định dạng chuyên biệt',
      icon: <Code size={16} />,
      keywords: ['code', 'snippet', 'lap trinh'],
      action: (ed) => ed.chain().focus().toggleCodeBlock().run()
    },
    {
      title: 'Divider',
      subtitle: 'Đường kẻ ngang phân cách khối',
      icon: <Minus size={16} />,
      keywords: ['divider', 'hr', 'line', 'ke ngang'],
      action: (ed) => ed.chain().focus().setHorizontalRule().run()
    },
    {
      title: 'Table',
      subtitle: 'Chèn bảng 3x3 tương tác',
      icon: <TableIcon size={16} />,
      keywords: ['table', 'bang', 'grid'],
      action: (ed) => {
        if ((ed.commands as any).insertTable) {
          (ed.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        }
      }
    }
  ];

  const filteredCommands = commands.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.subtitle.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (editor && filteredCommands[selectedIndex]) {
          // delete the slash and query before executing
          filteredCommands[selectedIndex].action(editor);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, editor, onClose]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 rounded-xl shadow-2xl overflow-hidden border p-1 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto kgv-scroll"
      style={{
        top: Math.min(window.innerHeight - 300, Math.max(10, position.top)),
        left: Math.min(window.innerWidth - 300, Math.max(10, position.left)),
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text
      }}
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
        Khối cơ bản (Basic Blocks)
      </div>

      <div className="flex flex-col gap-0.5">
        {filteredCommands.map((cmd, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={cmd.title}
              onClick={() => {
                if (editor) {
                  cmd.action(editor);
                  onClose();
                }
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors text-xs"
              style={{
                backgroundColor: isSelected ? theme.accentLight : 'transparent',
                color: theme.text
              }}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: theme.panel,
                  borderColor: theme.borderFaint,
                  color: isSelected ? theme.accent : theme.textMuted
                }}
              >
                {cmd.icon}
              </div>
              <div className="flex flex-col truncate">
                <span className="font-medium truncate">{cmd.title}</span>
                <span className="text-[10px] opacity-75 truncate" style={{ color: theme.textMuted }}>
                  {cmd.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
