import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react'
import { ChevronRight } from 'lucide-react'
import React from 'react'

const ToggleListComponent = ({ node, updateAttributes }: NodeViewProps) => {
  const isOpen = (node?.attrs?.open !== undefined) ? node.attrs.open !== false : true;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateAttributes({ open: !isOpen })
  }

  return (
    <NodeViewWrapper
      className={`notion-toggle-item my-1 relative group select-text ${isOpen ? 'is-open' : 'is-closed'}`}
      data-type="toggle"
      data-open={isOpen ? 'true' : 'false'}
    >
      <div className="flex items-start">
        <button
          type="button"
          contentEditable={false}
          onClick={handleToggle}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer mr-1 mt-0.5 select-none"
          style={{ color: 'var(--text-muted)' }}
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          <ChevronRight
            size={16}
            strokeWidth={2}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          />
        </button>
        <div className="flex-1 min-w-0">
          <NodeViewContent className="notion-toggle-content" />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const ToggleList = Node.create({
  name: 'toggleList',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: element => element.getAttribute('data-open') !== 'false',
        renderHTML: attributes => ({
          'data-open': attributes.open !== false ? 'true' : 'false',
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toggle"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleListComponent)
  },

  addCommands() {
    return {
      setToggleList: () => ({ commands }) => {
        return commands.setNode(this.name, { open: true })
      },
      toggleToggleList: () => ({ commands }) => {
        return commands.toggleNode(this.name, 'paragraph', { open: true })
      },
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggleList: {
      setToggleList: () => ReturnType
      toggleToggleList: () => ReturnType
    }
  }
}

