/* eslint-disable @typescript-eslint/no-unused-vars */
import { Mark, mergeAttributes } from '@tiptap/core';

export const highlightPluginKey = null;

export const AnnotationHighlight = Mark.create({
  name: 'annotationHighlight',

  addAttributes() {
    return {
      color: {
        default: 'amber',
        parseHTML: element => element.getAttribute('data-hl-color') || 'amber',
        renderHTML: attributes => {
          return { 'data-hl-color': attributes.color };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark[data-hl-color]',
      },
      {
        tag: 'mark',
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const color = HTMLAttributes['data-hl-color'] || 'amber';
    
    let bgColor = '';
    switch (color) {
      case 'amber': bgColor = 'rgba(245, 158, 11, 0.35)'; break;
      case 'emerald': bgColor = 'rgba(16, 185, 129, 0.35)'; break;
      case 'rose': bgColor = 'rgba(244, 63, 94, 0.35)'; break;
      case 'blue': bgColor = 'rgba(59, 130, 246, 0.35)'; break;
      case 'violet': bgColor = 'rgba(139, 92, 246, 0.35)'; break;
      case 'zinc': bgColor = 'rgba(113, 113, 122, 0.35)'; break;
      default: bgColor = 'rgba(245, 158, 11, 0.35)';
    }

    return ['mark', mergeAttributes(HTMLAttributes, { 
      class: `hl-${color} cursor-text transition-colors duration-200`,
      style: `background-color: ${bgColor}; color: inherit;`
    }), 0];
  },

  addCommands() {
    return {
      setHighlight: (attributes) => ({ commands }) => {
        return commands.setMark('annotationHighlight', attributes);
      },
      unsetHighlight: () => ({ commands }) => {
        return commands.unsetMark('annotationHighlight');
      },
    };
  },
});
