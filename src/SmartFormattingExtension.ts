import { Extension, InputRule } from '@tiptap/core';
import type { FormatState } from './types';

// Declare global property for formatState
declare global {
  interface Window {
    __formatState?: FormatState;
  }
}

export const SmartFormatting = Extension.create({
  name: 'smartFormatting',
  addInputRules() {
    return [
      // Smart Quotes
      new InputRule({
        find: /(?:^|[\s{\[\(<'"\u2018\u201C])(")$/,
        handler: ({ state, range, match }) => {
          if (!window.__formatState?.smartQuotes) return null;
          const { tr } = state;
          tr.insertText('“', range.from + match[0].length - 1, range.to);
        },
      }),
      new InputRule({
        find: /"$/,
        handler: ({ state, range }) => {
          if (!window.__formatState?.smartQuotes) return null;
          state.tr.insertText('”', range.from, range.to);
        },
      }),
      new InputRule({
        find: /(?:^|[\s{\[\(<'"\u2018\u201C])(')$/,
        handler: ({ state, range, match }) => {
          if (!window.__formatState?.smartQuotes) return null;
          const { tr } = state;
          tr.insertText('‘', range.from + match[0].length - 1, range.to);
        },
      }),
      new InputRule({
        find: /'$/,
        handler: ({ state, range }) => {
          if (!window.__formatState?.smartQuotes) return null;
          state.tr.insertText('’', range.from, range.to);
        },
      }),

      // Ellipses
      new InputRule({
        find: /\.\.\.$/,
        handler: ({ state, range }) => {
          if (!window.__formatState?.smartEllipses) return null;
          state.tr.insertText('…', range.from, range.to);
        },
      }),

      // Dashes
      new InputRule({
        find: /--$/,
        handler: ({ state, range }) => {
          const mode = window.__formatState?.dashesMode || 'em';
          if (mode === 'disabled') return null;
          if (mode === 'em') {
            state.tr.insertText('—', range.from, range.to);
          } else if (mode === 'en-em') {
            state.tr.insertText('–', range.from, range.to);
          }
        },
      }),
      new InputRule({
        find: /–-$/, // en-dash followed by hyphen
        handler: ({ state, range }) => {
          const mode = window.__formatState?.dashesMode || 'em';
          if (mode === 'en-em') {
            state.tr.insertText('—', range.from, range.to);
          }
        }
      })
    ];
  }
});
