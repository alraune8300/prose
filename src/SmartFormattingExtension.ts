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
        find: /(?:^|[\s{(<'"\u2018\u201C[])(")$/,
        handler: ({ chain, range, match }) => {
          if (!window.__formatState?.smartQuotes) return null;
          
          chain().insertContentAt({ from: range.from + match[0].length - 1, to: range.to }, '“').run();
        },
      }),
      new InputRule({
        find: /"$/,
        handler: ({ chain, range }) => {
          if (!window.__formatState?.smartQuotes) return null;
          chain().insertContentAt({ from: range.from, to: range.to }, '”').run();
        },
      }),
      new InputRule({
        find: /(?:^|[\s{(<'"\u2018\u201C[])(')$/,
        handler: ({ chain, range, match }) => {
          if (!window.__formatState?.smartQuotes) return null;
          
          chain().insertContentAt({ from: range.from + match[0].length - 1, to: range.to }, '‘').run();
        },
      }),
      new InputRule({
        find: /'$/,
        handler: ({ chain, range }) => {
          if (!window.__formatState?.smartQuotes) return null;
          chain().insertContentAt({ from: range.from, to: range.to }, '’').run();
        },
      }),

      // Ellipses
      new InputRule({
        find: /\.\.\.$/,
        handler: ({ chain, range }) => {
          if (!window.__formatState?.smartEllipses) return null;
          chain().insertContentAt({ from: range.from, to: range.to }, '…').run();
        },
      }),

      // Dashes
      new InputRule({
        find: /--$/,
        handler: ({ chain, range }) => {
          const mode = window.__formatState?.dashesMode || 'em';
          if (mode === 'disabled') return null;
          if (mode === 'em') {
            chain().insertContentAt({ from: range.from, to: range.to }, '—').run();
          } else if (mode === 'en-em') {
            chain().insertContentAt({ from: range.from, to: range.to }, '–').run();
          }
        },
      }),
      new InputRule({
        find: /–-$/, // en-dash followed by hyphen
        handler: ({ chain, range }) => {
          const mode = window.__formatState?.dashesMode || 'em';
          if (mode === 'en-em') {
            chain().insertContentAt({ from: range.from, to: range.to }, '—').run();
          }
        }
      }),

      // Smart Arrows
      // Right arrow: ->, -->, –>, —>, - >
      new InputRule({
        find: /(?:-->|–>|—>|->|-\s>)$/,
        handler: ({ chain, range }) => {
          if (window.__formatState?.smartArrows === false) return null;
          chain().insertContentAt({ from: range.from, to: range.to }, '→').run();
        },
      }),

      // Left arrow: <-, <--, <–, <—, < -
      new InputRule({
        find: /(?:<--|<–|<—|<-|<\s-)$/,
        handler: ({ chain, range }) => {
          if (window.__formatState?.smartArrows === false) return null;
          chain().insertContentAt({ from: range.from, to: range.to }, '←').run();
        },
      }),

      // Bidirectional arrow: <->, ←>, <–>, <—>
      new InputRule({
        find: /(?:<->|←>|<–>|<—>)$/,
        handler: ({ chain, range }) => {
          if (window.__formatState?.smartArrows === false) return null;
          chain().insertContentAt({ from: range.from, to: range.to }, '↔').run();
        },
      }),

      // Double right arrow: =>, ==>, = >
      new InputRule({
        find: /(?:==>|=>|=\s>)$/,
        handler: ({ chain, range }) => {
          if (window.__formatState?.smartArrows === false) return null;
          chain().insertContentAt({ from: range.from, to: range.to }, '⇒').run();
        },
      }),

      // Double left arrow: <==, <==
      new InputRule({
        find: /<==$/,
        handler: ({ chain, range }) => {
          if (window.__formatState?.smartArrows === false) return null;
          chain().insertContentAt({ from: range.from, to: range.to }, '⇐').run();
        },
      }),

      // Double bidirectional arrow: <=>, ⇐>
      new InputRule({
        find: /(?:<=>|⇐>)$/,
        handler: ({ chain, range }) => {
          if (window.__formatState?.smartArrows === false) return null;
          chain().insertContentAt({ from: range.from, to: range.to }, '⇔').run();
        },
      })
    ];
  }
});
