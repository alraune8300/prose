import React from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Bold, Italic, Strikethrough, Code, Link2, Highlighter } from 'lucide-react'

export function NotionBubbleMenu({ editor }: { editor: any }) {
  if (!editor) return null

  return (
    <BubbleMenu editor={editor} className="flex items-center gap-1 p-1 rounded-xl shadow-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${editor.isActive('bold') ? 'bg-black/10 dark:bg-white/10' : ''}`}
        style={{ color: 'var(--text-primary)' }}
      >
        <Bold size={14} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${editor.isActive('italic') ? 'bg-black/10 dark:bg-white/10' : ''}`}
        style={{ color: 'var(--text-primary)' }}
      >
        <Italic size={14} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${editor.isActive('strike') ? 'bg-black/10 dark:bg-white/10' : ''}`}
        style={{ color: 'var(--text-primary)' }}
      >
        <Strikethrough size={14} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${editor.isActive('code') ? 'bg-black/10 dark:bg-white/10' : ''}`}
        style={{ color: 'var(--text-primary)' }}
      >
        <Code size={14} strokeWidth={1.5} />
      </button>
      <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
      <button
        onClick={() => {
          const url = window.prompt('URL')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}
        className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${editor.isActive('link') ? 'bg-black/10 dark:bg-white/10' : ''}`}
        style={{ color: 'var(--text-primary)' }}
      >
        <Link2 size={14} strokeWidth={1.5} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${editor.isActive('highlight') ? 'bg-black/10 dark:bg-white/10' : ''}`}
        style={{ color: 'var(--text-primary)' }}
      >
        <Highlighter size={14} strokeWidth={1.5} />
      </button>
    </BubbleMenu>
  )
}
