/* eslint-disable @typescript-eslint/no-unused-vars */
import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface HighlightData {
  id: string;
  index: number;
  color: string;
  memo: string;
  text: string;
  from: number;
  to: number;
}

export const highlightPluginKey = new PluginKey('annotationHighlight');

export const AnnotationHighlight = Mark.create({
  name: 'annotationHighlight',

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-hl-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-hl-id': attributes.id };
        },
      },
      color: {
        default: 'amber',
        parseHTML: element => element.getAttribute('data-hl-color') || 'amber',
        renderHTML: attributes => {
          return { 'data-hl-color': attributes.color };
        },
      },
      memo: {
        default: '',
        parseHTML: element => element.getAttribute('data-hl-memo') || '',
        renderHTML: attributes => {
          return { 'data-hl-memo': attributes.memo };
        },
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark[data-hl-id]',
      },
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
      class: `hl-annotation hl-${color} cursor-pointer transition-colors duration-200`,
      style: `background-color: ${bgColor}; color: inherit;`
    }), 0];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: highlightPluginKey,
        state: {
          init(config, instance) {
            return { decorations: DecorationSet.empty, highlights: [] };
          },
          apply(tr, oldState, oldEditorState, newEditorState) {
            // Only update if doc changed
            if (!tr.docChanged && oldState) {
               // But wait, if decorations need to be mapped
               return {
                 decorations: oldState.decorations.map(tr.mapping, tr.doc),
                 highlights: oldState.highlights
               };
            }

            const highlightsMap = new Map<string, HighlightData>();
            const highlightsOrder: string[] = [];

            newEditorState.doc.descendants((node, pos) => {
              if (node.isText && node.marks) {
                const mark = node.marks.find(m => m.type.name === 'annotationHighlight');
                if (mark) {
                  const id = mark.attrs.id;
                  if (!highlightsMap.has(id)) {
                    highlightsOrder.push(id);
                    highlightsMap.set(id, {
                      id,
                      index: highlightsOrder.length, // 1-based index
                      color: mark.attrs.color,
                      memo: mark.attrs.memo,
                      text: node.text || '',
                      from: pos,
                      to: pos + node.nodeSize
                    });
                  } else {
                    const existing = highlightsMap.get(id)!;
                    existing.text += (node.text || '');
                    existing.to = pos + node.nodeSize;
                  }
                }
              }
            });

            const highlights = highlightsOrder.map(id => highlightsMap.get(id)!);

            // Create decorations for badges at the end of each highlight
            const decorations: Decoration[] = [];
            highlights.forEach(hl => {
                            const badge = document.createElement('sup');
              
              let badgeColor = '';
              switch (hl.color) {
                case 'amber': badgeColor = '#d97706'; break;
                case 'emerald': badgeColor = '#059669'; break;
                case 'rose': badgeColor = '#e11d48'; break;
                case 'blue': badgeColor = '#2563eb'; break;
                case 'violet': badgeColor = '#7c3aed'; break;
                case 'zinc': badgeColor = '#52525b'; break;
                default: badgeColor = '#d97706';
              }
              
              badge.className = 'hl-badge select-none';
              badge.style.cssText = `
                color: ${badgeColor};
                font-size: 0.7em;
                font-weight: 800;
                margin-right: 2px;
                vertical-align: super;
                line-height: 0;
              `;
              badge.textContent = hl.index.toString();
              badge.contentEditable = 'false';
              
              decorations.push(Decoration.widget(hl.from, badge, { side: -1 }));
            });

            // Dispatch event for UI
            if (typeof window !== 'undefined') {
              // We use requestAnimationFrame to avoid dispatching during render cycle
              requestAnimationFrame(() => {
                window.dispatchEvent(new CustomEvent('kgv-highlights-updated', { detail: highlights }));
              });
            }

            return {
              decorations: DecorationSet.create(newEditorState.doc, decorations),
              highlights
            };
          }
        },
        props: {
          decorations(state) {
            return highlightPluginKey.getState(state)?.decorations;
          }
        }
      })
    ];
  },
  
  
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': () => this.editor.commands.toggleHighlight({}),
      'Mod-\\': () => {
         this.editor.chain().focus().unsetAllMarks().run();
         return true;
      }
    };
  },
  
  addCommands() {

    return {
      
      setHighlight: (attributes) => ({ commands, editor, tr }) => {
        const { from, to, empty } = editor.state.selection;
        if (empty) return false;

        let existingId = null;
        let existingMemo = '';
        
        editor.state.doc.nodesBetween(from, to, (node) => {
            if (node.isText && node.marks) {
                const mark = node.marks.find(m => m.type.name === 'annotationHighlight');
                if (mark) {
                    existingId = mark.attrs.id;
                    existingMemo = mark.attrs.memo;
                }
            }
        });

        if (existingId) {
            attributes.id = existingId;
            attributes.memo = existingMemo || '';
        } else if (!attributes.id) {
            attributes.id = 'hl-' + Math.random().toString(36).substring(2, 9);
        }
        
        return commands.setMark('annotationHighlight', attributes);
      },

      toggleHighlight: (attributes) => ({ commands }) => {
        if (!attributes.id) {
            attributes.id = 'hl-' + Math.random().toString(36).substring(2, 9);
        }
        return commands.toggleMark(this.name, attributes);
      },
      unsetHighlight: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
      updateHighlightMemo: (id, memo) => ({ editor, tr }) => {
        let modified = false;
        editor.state.doc.descendants((node, pos) => {
          if (node.isText && node.marks) {
            const mark = node.marks.find(m => m.type.name === this.name && m.attrs.id === id);
            if (mark) {
              tr.addMark(pos, pos + node.nodeSize, this.type.create({ ...mark.attrs, memo }));
              modified = true;
            }
          }
        });
        return modified;
      },
      updateHighlightColor: (id, color) => ({ editor, tr }) => {
        let modified = false;
        editor.state.doc.descendants((node, pos) => {
          if (node.isText && node.marks) {
            const mark = node.marks.find(m => m.type.name === this.name && m.attrs.id === id);
            if (mark) {
              tr.addMark(pos, pos + node.nodeSize, this.type.create({ ...mark.attrs, color }));
              modified = true;
            }
          }
        });
        return modified;
      },
      removeHighlightById: (id) => ({ editor, tr }) => {
         let modified = false;
         editor.state.doc.descendants((node, pos) => {
          if (node.isText && node.marks) {
            const mark = node.marks.find(m => m.type.name === this.name && m.attrs.id === id);
            if (mark) {
              tr.removeMark(pos, pos + node.nodeSize, this.type);
              modified = true;
            }
          }
        });
        return modified;
      }
    };
  }
});
