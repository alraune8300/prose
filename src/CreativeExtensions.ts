import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { splitSentences, extractWords } from './nlp';

export const rhythmPluginKey = new PluginKey('rhythmView');
export const dialoguePluginKey = new PluginKey('dialogueIsolator');
export const editorialPluginKey = new PluginKey('editorialInspector');

export const CreativeExtensions = Extension.create({
  name: 'creativeExtensions',

  addProseMirrorPlugins() {
    return [
      // Rhythm View Plugin
      new Plugin({
        key: rhythmPluginKey,
        state: {
          init() { return { enabled: false, lang: 'en', decorations: DecorationSet.empty }; },
          apply(tr, oldState) {
            const meta = tr.getMeta(rhythmPluginKey);
            const enabled = meta?.enabled !== undefined ? meta.enabled : oldState.enabled;
            const lang = meta?.lang !== undefined ? meta.lang : oldState.lang;

            if (!enabled) return { enabled, lang, decorations: DecorationSet.empty };
            if (!tr.docChanged && !meta) return { enabled, lang, decorations: oldState.decorations.map(tr.mapping, tr.doc) };

            const decorations: Decoration[] = [];
            tr.doc.descendants((node, pos) => {
              if (node.isTextblock && node.textContent) {
                const sentences = splitSentences(node.textContent, lang);
                sentences.forEach(s => {
                  const words = extractWords(s.text, lang);
                  let lengthClass = '';
                  const isCJK = ['zh', 'ja', 'ko'].includes(lang);
                  const count = isCJK ? s.text.length : words.length;

                  if (isCJK) {
                    if (count < 15) lengthClass = 'rhythm-short';
                    else if (count <= 50) lengthClass = 'rhythm-medium';
                    else lengthClass = 'rhythm-long';
                  } else {
                    if (count < 8) lengthClass = 'rhythm-short';
                    else if (count <= 25) lengthClass = 'rhythm-medium';
                    else lengthClass = 'rhythm-long';
                  }

                  decorations.push(Decoration.inline(pos + 1 + s.from, pos + 1 + s.to, {
                    class: `rhythm-sentence ${lengthClass}`
                  }));
                });
              }
            });

            return { enabled, lang, decorations: DecorationSet.create(tr.doc, decorations) };
          }
        },
        props: {
          decorations(state) { return rhythmPluginKey.getState(state)?.decorations; }
        }
      }),

      // Dialogue Isolator Plugin
      new Plugin({
        key: dialoguePluginKey,
        state: {
          init() { return { enabled: false, decorations: DecorationSet.empty }; },
          apply(tr, oldState) {
            const meta = tr.getMeta(dialoguePluginKey);
            const enabled = meta?.enabled !== undefined ? meta.enabled : oldState.enabled;

            if (!enabled) {
              // We could just return empty and use body class to remove opacity, but we can also use decorations for the non-dialogue.
              return { enabled, decorations: DecorationSet.empty };
            }
            if (!tr.docChanged && !meta) return { enabled, decorations: oldState.decorations.map(tr.mapping, tr.doc) };

            const decorations: Decoration[] = [];
            // Regex for dialogues: "...", '...', «...», ‹...›, 「...」, 『...』, or lines starting with - or —
            const dialogueRegex = /(["'«‹「『].*?["'»›」』])|(^[-—]\s*.*)/gm;
            
            tr.doc.descendants((node, pos) => {
              if (node.isTextblock && node.textContent) {
                // Decorate the whole block as 'non-dialogue-block' first
                decorations.push(Decoration.node(pos, pos + node.nodeSize, { class: 'non-dialogue-block' }));
                
                let match;
                while ((match = dialogueRegex.exec(node.textContent)) !== null) {
                   decorations.push(Decoration.inline(pos + 1 + match.index, pos + 1 + match.index + match[0].length, { class: 'dialogue-text' }));
                }
              }
            });

            return { enabled, decorations: DecorationSet.create(tr.doc, decorations) };
          }
        },
        props: {
          decorations(state) { return dialoguePluginKey.getState(state)?.decorations; }
        }
      }),

      // Editorial Inspector Plugin
      new Plugin({
        key: editorialPluginKey,
        state: {
          init() { return { highlightWords: [], lang: 'en', decorations: DecorationSet.empty }; },
          apply(tr, oldState) {
            const meta = tr.getMeta(editorialPluginKey);
            const highlightWords = meta?.highlightWords !== undefined ? meta.highlightWords : oldState.highlightWords;
            const lang = meta?.lang !== undefined ? meta.lang : oldState.lang;

            if (!highlightWords || highlightWords.length === 0) return { highlightWords, lang, decorations: DecorationSet.empty };
            if (!tr.docChanged && !meta) return { highlightWords, lang, decorations: oldState.decorations.map(tr.mapping, tr.doc) };

            const decorations: Decoration[] = [];
            
            tr.doc.descendants((node, pos) => {
              if (node.isTextblock && node.textContent) {
                const words = extractWords(node.textContent, lang);
                words.forEach(w => {
                  const match = highlightWords.find((hw: any) => hw.word === w.word);
                  if (match) {
                    decorations.push(Decoration.inline(pos + 1 + w.index, pos + 1 + w.index + w.length, {
                      class: `editorial-highlight severity-${match.severity}`
                    }));
                  }
                });
              }
            });

            return { highlightWords, lang, decorations: DecorationSet.create(tr.doc, decorations) };
          }
        },
        props: {
          decorations(state) { return editorialPluginKey.getState(state)?.decorations; }
        }
      })
    ];
  }
});
