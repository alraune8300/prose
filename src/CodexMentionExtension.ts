import Mention from '@tiptap/extension-mention';

export const CodexMention = Mention.extend({
  name: 'codexMention',
  
  parseHTML() {
    return [
      {
        tag: 'span[data-entity-id]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        class: 'codex-mention cursor-pointer font-semibold text-amber-600 dark:text-amber-400',
        'data-entity-id': node.attrs.id,
      },
      `@${node.attrs.label}`,
    ]
  },
});
