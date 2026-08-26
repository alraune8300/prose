import { Extension } from '@tiptap/core';

export const SmartEnter = Extension.create({
  name: 'smartEnter',
  
  addKeyboardShortcuts() {
    return {
      'Enter': ({ editor }) => {
        // Only apply this logic within regular paragraphs
        if (!editor.isActive('paragraph')) {
          return false;
        }
        
        // Do not interfere if we are inside a list (lists have their own Enter logic)
        if (editor.isActive('listItem') || editor.isActive('taskItem')) {
          return false;
        }

        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty) return false;

        // If the paragraph is entirely empty, just do default (which might turn it into a normal block or jump out)
        if ($from.parent.textContent.length === 0) {
          return false;
        }

        const nodeBefore = $from.nodeBefore;
        
        // If the user hit Enter immediately after another Enter (double Enter)
        // This is represented by a hardBreak immediately before the cursor
        if (nodeBefore && nodeBefore.type.name === 'hardBreak') {
          editor.chain()
            .deleteRange({ from: $from.pos - 1, to: $from.pos })
            .splitBlock()
            .run();
          return true;
        }

        // Single Enter: just insert a line break (soft break) within the same block
        editor.commands.setHardBreak();
        return true;
      }
    };
  }
});
