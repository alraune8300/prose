import { CodeBlock } from '@tiptap/extension-code-block'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const CodeBlockComponent = ({ node }: any) => {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(node.textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <NodeViewWrapper className="relative my-4 group">
      <div 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <button 
          onClick={copy}
          className="p-1.5 rounded flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="rounded-lg p-4 m-0 overflow-x-auto text-sm font-mono" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}

export const CustomCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent)
  }
})
