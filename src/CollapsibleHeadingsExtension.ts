/* eslint-disable @typescript-eslint/no-unused-vars, no-empty */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { Node as ProseMirrorNode } from 'prosemirror-model';

export const collapsiblePluginKey = new PluginKey('collapsibleHeadings');

// Store collapsed heading unique signatures (e.g. pos or heading content)
let collapsedSet = new Set<string>();

export function foldAllHeadingsInDoc(editorView: EditorView) {
  if (!editorView || !editorView.state) return;

  const scrollContainer = document.querySelector('.kgv-scroll');
  const prevScroll = scrollContainer ? scrollContainer.scrollTop : 0;

  const newSet = new Set<string>();
  editorView.state.doc.descendants((node: ProseMirrorNode, pos: number) => {
    if (node.type.name === 'heading') {
      const key = `${pos}-${node.textContent.slice(0, 30)}`;
      newSet.add(key);
    }
  });
  collapsedSet = newSet;
  editorView.dispatch(editorView.state.tr.setMeta(collapsiblePluginKey, { updated: true }));

  if (scrollContainer) {
    requestAnimationFrame(() => { scrollContainer.scrollTop = prevScroll; });
  }
}

export function unfoldAllHeadingsInDoc(editorView: EditorView) {
  if (!editorView || !editorView.state) return;

  const scrollContainer = document.querySelector('.kgv-scroll');
  const prevScroll = scrollContainer ? scrollContainer.scrollTop : 0;

  collapsedSet.clear();
  editorView.dispatch(editorView.state.tr.setMeta(collapsiblePluginKey, { updated: true }));

  if (scrollContainer) {
    requestAnimationFrame(() => { scrollContainer.scrollTop = prevScroll; });
  }
}

export function toggleHeadingFold(editorView: EditorView, pos: number, textContent: string) {
  if (!editorView || !editorView.state) return;
  const key = `${pos}-${textContent.slice(0, 30)}`;

  const scrollContainer = document.querySelector('.kgv-scroll');
  let prevScroll = 0;
  let headingY = 0;
  if (scrollContainer) {
    prevScroll = scrollContainer.scrollTop;
    try {
      headingY = editorView.coordsAtPos(pos).top;
    } catch (e) {}
  }

  if (collapsedSet.has(key)) {
    collapsedSet.delete(key);
  } else {
    collapsedSet.add(key);
  }
  
  editorView.dispatch(editorView.state.tr.setMeta(collapsiblePluginKey, { updated: true }));

  if (scrollContainer) {
    requestAnimationFrame(() => {
      try {
        if (headingY > 0) {
           const newHeadingY = editorView.coordsAtPos(pos).top;
           const diff = newHeadingY - headingY;
           scrollContainer.scrollTop += diff;
        } else {
           scrollContainer.scrollTop = prevScroll;
        }
      } catch (e) {
        scrollContainer.scrollTop = prevScroll;
      }
    });
  }
}

export const CollapsibleHeadingsExtension = Extension.create({
  name: 'collapsibleHeadings',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: collapsiblePluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldDecorations, oldState, newState) {
            const decorations: Decoration[] = [];
            const doc = newState.doc;

            const headings: { pos: number; level: number; node: ProseMirrorNode; key: string }[] = [];

            doc.descendants((node, pos) => {
              if (node.type.name === 'heading') {
                const level = node.attrs.level || 1;
                const key = `${pos}-${node.textContent.slice(0, 30)}`;
                headings.push({ pos, level, node, key });
              }
            });

            for (let i = 0; i < headings.length; i++) {
              const current = headings[i];
              const isCollapsed = collapsedSet.has(current.key);

              // 1. Add Chevron Toggle widget at start of heading
              const chevronWidget = document.createElement('span');
              chevronWidget.className = 'kgv-fold-chevron-container select-none inline-flex items-center justify-center mr-1.5 cursor-pointer opacity-60 hover:opacity-100 transition-all';
              chevronWidget.title = isCollapsed ? 'Mở rộng khối' : 'Thu gọn khối';
              chevronWidget.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="kgv-fold-chevron ${isCollapsed ? '-rotate-90' : 'rotate-0'} transition-transform duration-200">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              `;

              chevronWidget.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('kgv-toggle-heading-fold', {
                  detail: { pos: current.pos, text: current.node.textContent }
                }));
              });

              decorations.push(
                Decoration.widget(current.pos + 1, chevronWidget, { side: -1 })
              );

              // If collapsed, find section end & hide nodes + add word count badge
              if (isCollapsed) {
                // Find end of section: next heading with level <= current.level or end of doc
                let sectionEndPos = doc.content.size;
                for (let j = i + 1; j < headings.length; j++) {
                  if (headings[j].level <= current.level) {
                    sectionEndPos = headings[j].pos;
                    break;
                  }
                }

                const headingEndPos = current.pos + current.node.nodeSize;

                // Calculate total word count in hidden range
                let hiddenWordCount = 0;
                doc.nodesBetween(headingEndPos, sectionEndPos, (node) => {
                  if (node.isText && node.text) {
                    const words = node.text.trim().split(/\s+/).filter(Boolean);
                    hiddenWordCount += words.length;
                  }
                });

                // Add word count badge widget at end of heading
                const badgeWidget = document.createElement('span');
                badgeWidget.className = 'kgv-fold-badge select-none ml-2 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide bg-amber-500/15 text-amber-500 border border-amber-500/30 inline-flex items-center gap-1 cursor-pointer hover:bg-amber-500/25 transition-all';
                badgeWidget.title = 'Nhấp để mở rộng khối nội dung này';
                badgeWidget.innerHTML = `<span>[... ${hiddenWordCount.toLocaleString()} từ]</span>`;

                badgeWidget.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('kgv-toggle-heading-fold', {
                    detail: { pos: current.pos, text: current.node.textContent }
                  }));
                });

                decorations.push(
                  Decoration.widget(current.pos + current.node.nodeSize - 1, badgeWidget, { side: 1 })
                );

                // Add node decorations to hide all child block nodes in section
                doc.nodesBetween(headingEndPos, sectionEndPos, (childNode, childPos) => {
                  if (childNode.isBlock && childPos >= headingEndPos && childPos < sectionEndPos) {
                    decorations.push(
                      Decoration.node(childPos, childPos + childNode.nodeSize, {
                        class: 'kgv-folded-hidden',
                      })
                    );
                  }
                });
              }
            }

            return DecorationSet.create(doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
