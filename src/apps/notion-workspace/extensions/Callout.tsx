import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { Info } from 'lucide-react'
import React from 'react'

const CalloutComponent = () => {
  return (
    <NodeViewWrapper className="flex items-start gap-3 p-4 my-4 border rounded-md" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
      <div className="shrink-0 mt-0.5" style={{ color: 'var(--text-primary)' }}>
        <Info size={18} strokeWidth={1.5} />
      </div>
      <NodeViewContent className="flex-1 min-w-0 m-0 callout-content" />
    </NodeViewWrapper>
  )
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent)
  },

  addCommands() {
    return {
      setCallout: () => ({ commands }) => {
        return commands.setNode(this.name)
      },
      toggleCallout: () => ({ commands }) => {
        return commands.toggleNode(this.name, 'paragraph')
      },
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: () => ReturnType
      toggleCallout: () => ReturnType
    }
  }
}
