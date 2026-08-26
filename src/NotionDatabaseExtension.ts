import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NotionDatabaseView } from './NotionDatabaseView';

export const NotionDatabaseExtension = Node.create({
  name: 'notionDatabase',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      databaseId: { default: null },
      viewType: { default: 'table' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="notion-database"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'notion-database' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(NotionDatabaseView);
  }
});
