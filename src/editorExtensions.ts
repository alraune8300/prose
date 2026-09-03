import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  ResizableImage,
  FontSize,
  LineHeight,
  TextTransform,
  FontFeatures,
  LetterSpacing,
  WordSpacing,
  IndentExtension,
} from './tiptapExtensions';
import { CreativeExtensions } from './CreativeExtensions';
import { CodexMention } from './CodexMentionExtension';
import getSuggestionOptions from './mentionSuggestion';
import { AnnotationHighlight } from './AnnotationHighlightExtension';
import { SearchHighlightExtension } from './SearchHighlightExtension';
import { SmartFormatting } from './SmartFormattingExtension';
import { CollapsibleHeadingsExtension } from './CollapsibleHeadingsExtension';

export interface CodexEntity {
  id?: string;
  name: string;
  category?: string;
  aliases?: string[];
  [key: string]: unknown;
}

export let globalCodexEntities: CodexEntity[] = [];

export function setGlobalCodexEntities(entities: CodexEntity[]) {
  globalCodexEntities = entities || [];
}

export const getEditorExtensions = () => [
  CreativeExtensions,
  CodexMention.configure({ suggestion: getSuggestionOptions() }),
  StarterKit.configure({
    link: false,
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    horizontalRule: {},
  }),
  Table.extend({
    addAttributes() {
      return {
        alignment: {
          default: 'full',
          parseHTML: (element) => element.getAttribute('data-align') || 'full',
          renderHTML: (attributes) => ({
            'data-align': attributes.alignment || 'full',
          }),
        },
        styleType: {
          default: 'grid',
          parseHTML: (element) => element.getAttribute('data-table-style') || 'grid',
          renderHTML: (attributes) => ({
            'data-table-style': attributes.styleType || 'grid',
          }),
        },
        cellPadding: {
          default: 'normal',
          parseHTML: (element) => element.getAttribute('data-padding') || 'normal',
          renderHTML: (attributes) => ({
            'data-padding': attributes.cellPadding || 'normal',
          }),
        },
        caption: {
          default: '',
          parseHTML: (element) => element.getAttribute('data-caption') || '',
          renderHTML: (attributes) => ({
            'data-caption': attributes.caption || '',
          }),
        },
        showCaption: {
          default: false,
          parseHTML: (element) => element.getAttribute('data-show-caption') === 'true',
          renderHTML: (attributes) => ({
            'data-show-caption': attributes.showCaption ? 'true' : 'false',
          }),
        },
        sourceNote: {
          default: '',
          parseHTML: (element) => element.getAttribute('data-source-note') || '',
          renderHTML: (attributes) => ({
            'data-source-note': attributes.sourceNote || '',
          }),
        },
        showSourceNote: {
          default: false,
          parseHTML: (element) => element.getAttribute('data-show-source-note') === 'true',
          renderHTML: (attributes) => ({
            'data-show-source-note': attributes.showSourceNote ? 'true' : 'false',
          }),
        },
      };
    },
  }).configure({
    resizable: true,
    HTMLAttributes: {
      class: 'kgv-rich-table border-collapse w-full my-4 border text-sm',
    },
  }),
  TableRow.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        backgroundColor: {
          default: null,
          parseHTML: (element) => element.getAttribute('data-bg') || element.style.backgroundColor || null,
          renderHTML: (attributes) => {
            if (!attributes.backgroundColor) return {};
            return {
              'data-bg': attributes.backgroundColor,
              style: `background-color: ${attributes.backgroundColor};`,
            };
          },
        },
      };
    },
  }),
  TableCell.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        backgroundColor: {
          default: null,
          parseHTML: (element: HTMLElement) => element.getAttribute('data-bg') || element.style.backgroundColor || null,
          renderHTML: (attributes: Record<string, unknown>) => {
            if (!attributes.backgroundColor) return {};
            return {
              'data-bg': attributes.backgroundColor as string,
              style: `background-color: ${attributes.backgroundColor};`,
            };
          },
        },
      };
    },
  }).configure({
    HTMLAttributes: {
      class: 'border p-2 min-w-[80px] relative align-top',
    },
  }),
  TableHeader.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        backgroundColor: {
          default: null,
          parseHTML: (element: HTMLElement) => element.getAttribute('data-bg') || element.style.backgroundColor || null,
          renderHTML: (attributes: Record<string, unknown>) => {
            if (!attributes.backgroundColor) return {};
            return {
              'data-bg': attributes.backgroundColor as string,
              style: `background-color: ${attributes.backgroundColor};`,
            };
          },
        },
      };
    },
  }).configure({
    HTMLAttributes: {
      class: 'border p-2 min-w-[80px] font-semibold bg-slate-500/10 align-top text-left',
    },
  }),
  CollapsibleHeadingsExtension,
  AnnotationHighlight,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'kgv-smart-link',
      rel: 'noopener noreferrer',
    },
    autolink: true,
  }),
  SmartFormatting,
  SearchHighlightExtension,
  TextStyle,
  Color,
  FontFamily,
  FontSize,
  LineHeight,
  TextTransform,
  FontFeatures,
  LetterSpacing,
  WordSpacing,
  Superscript,
  Subscript,
  IndentExtension,
  ResizableImage,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
];
