import { Extension } from '@tiptap/core';

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.fontSize?.replace('px', '') || null,
            renderHTML: (attrs: Record<string, unknown>) => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (size: number | string) => ({ chain }: { chain: () => { setMark: (type: string, attrs: Record<string, string | null>) => { run: () => boolean } } }) =>
        chain().setMark('textStyle', { fontSize: String(size) }).run(),
      unsetFontSize: () => ({ chain }: { chain: () => { setMark: (type: string, attrs: Record<string, string | null>) => { removeEmptyTextStyle: () => { run: () => boolean } } } }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as unknown as Record<string, unknown>;
  },
});

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return { types: ['textStyle'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.lineHeight || null,
            renderHTML: (attrs: Record<string, unknown>) => {
              if (!attrs.lineHeight) return {};
              return { style: `line-height: ${attrs.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight: number | string) => ({ chain }: { chain: () => { setMark: (type: string, attrs: Record<string, string | null>) => { run: () => boolean } } }) =>
        chain().setMark('textStyle', { lineHeight: String(lineHeight) }).run(),
      unsetLineHeight: () => ({ chain }: { chain: () => { setMark: (type: string, attrs: Record<string, string | null>) => { removeEmptyTextStyle: () => { run: () => boolean } } } }) =>
        chain().setMark('textStyle', { lineHeight: null }).removeEmptyTextStyle().run(),
    } as unknown as Record<string, unknown>;
  },
});

export const TextTransform = Extension.create({
  name: 'textTransform',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        textTransform: {
          default: null,
          parseHTML: (el) => (el as HTMLElement).style.textTransform || null,
          renderHTML: (attrs: Record<string, unknown>) => {
            if (!attrs.textTransform) return {};
            return { style: `text-transform: ${attrs.textTransform}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setTextTransform: (transform: string) => ({ chain }: { chain: () => { setMark: (type: string, attrs: Record<string, string | null>) => { run: () => boolean } } }) =>
        chain().setMark('textStyle', { textTransform: transform }).run(),
    } as unknown as Record<string, unknown>;
  },
});

export const FontFeatures = Extension.create({
  name: 'fontFeatures',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontFeatureSettings: {
          default: null,
          parseHTML: (el) => (el as HTMLElement).style.fontFeatureSettings || null,
          renderHTML: (attrs: Record<string, unknown>) => {
            if (!attrs.fontFeatureSettings) return {};
            return { style: `font-feature-settings: ${attrs.fontFeatureSettings}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontFeatures: (features: string) => ({ chain }: { chain: () => { setMark: (type: string, attrs: Record<string, string | null>) => { run: () => boolean } } }) =>
        chain().setMark('textStyle', { fontFeatureSettings: features }).run(),
    } as unknown as Record<string, unknown>;
  },
});

export const LetterSpacing = Extension.create({
  name: 'letterSpacing',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        letterSpacing: {
          default: null,
          parseHTML: (el) => (el as HTMLElement).style.letterSpacing?.replace('px', '') || null,
          renderHTML: (attrs: Record<string, unknown>) => {
            if (!attrs.letterSpacing) return {};
            return { style: `letter-spacing: ${attrs.letterSpacing}px` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setLetterSpacing: (spacing: number | string) => ({ chain }: { chain: () => { setMark: (type: string, attrs: Record<string, string | null>) => { run: () => boolean } } }) =>
        chain().setMark('textStyle', { letterSpacing: String(spacing) }).run(),
    } as unknown as Record<string, unknown>;
  },
});

export const WordSpacing = Extension.create({
  name: 'wordSpacing',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        wordSpacing: {
          default: null,
          parseHTML: (el) => (el as HTMLElement).style.wordSpacing?.replace('px', '') || null,
          renderHTML: (attrs: Record<string, unknown>) => {
            if (!attrs.wordSpacing) return {};
            return { style: `word-spacing: ${attrs.wordSpacing}px` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setWordSpacing: (spacing: number | string) => ({ chain }: { chain: () => { setMark: (type: string, attrs: Record<string, string | null>) => { run: () => boolean } } }) =>
        chain().setMark('textStyle', { wordSpacing: String(spacing) }).run(),
    } as unknown as Record<string, unknown>;
  },
});

export const IndentExtension = Extension.create({
  name: 'indentExtension',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      indentStep: 24,
      maxIndent: 120,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const marginLeft = element.style.marginLeft;
              return marginLeft ? parseInt(marginLeft, 10) || 0 : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) {
                return {};
              }
              return {
                style: `margin-left: ${attributes.indent}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch, commands }: { tr: unknown; state: { selection: { from: number; to: number }; doc: { nodesBetween: (from: number, to: number, callback: (node: { type: { name: string }; attrs: Record<string, number> }, pos: number) => void) => void } }; dispatch?: (tr: unknown) => void; commands?: Record<string, (arg?: string) => boolean> }) => {
        if (commands && typeof commands.sinkListItem === 'function' && commands.sinkListItem('listItem')) {
          return true;
        }
        const { selection } = state;
        let updated = false;
        state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            const nextIndent = Math.min(currentIndent + this.options.indentStep, this.options.maxIndent);
            if (dispatch) {
              (tr as { setNodeMarkup: (pos: number, type: undefined, attrs: Record<string, unknown>) => void }).setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: nextIndent,
              });
            }
            updated = true;
          }
        });
        return updated;
      },
      outdent: () => ({ tr, state, dispatch, commands }: { tr: unknown; state: { selection: { from: number; to: number }; doc: { nodesBetween: (from: number, to: number, callback: (node: { type: { name: string }; attrs: Record<string, number> }, pos: number) => void) => void } }; dispatch?: (tr: unknown) => void; commands?: Record<string, (arg?: string) => boolean> }) => {
        if (commands && typeof commands.liftListItem === 'function' && commands.liftListItem('listItem')) {
          return true;
        }
        const { selection } = state;
        let updated = false;
        state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            const nextIndent = Math.max(currentIndent - this.options.indentStep, 0);
            if (dispatch) {
              (tr as { setNodeMarkup: (pos: number, type: undefined, attrs: Record<string, unknown>) => void }).setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: nextIndent,
              });
            }
            updated = true;
          }
        });
        return updated;
      },
    } as unknown as Record<string, unknown>;
  },
});


import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImageComponent } from './ResizableImageComponent';

export const ResizableImage = Image.extend({
  addOptions() {
    return {
      ...(this.parent?.() as any),
      allowBase64: true,
    }
  },
  addAttributes() {
    return {
      ...(this.parent?.() as any),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) {
            return {}
          }
          return {
            width: attributes.width,
          }
        },
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) {
            return {}
          }
          return {
            height: attributes.height,
          }
        },
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
});
