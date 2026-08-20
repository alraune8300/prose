import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const spellcheckKey = new PluginKey('spellcheck');

export function getSpellcheckPlugin() {
  return new Plugin({
    key: spellcheckKey,
    state: {
      init() {
        return {
          enabled: false,
          checker: null,
          decorations: DecorationSet.empty,
        };
      },
      apply(tr, oldState) {
        const meta = tr.getMeta(spellcheckKey);
        let { enabled, checker } = oldState;
        
        let changed = false;
        if (meta) {
          if (meta.enabled !== undefined && meta.enabled !== enabled) { enabled = meta.enabled; changed = true; }
          if (meta.checker !== undefined && meta.checker !== checker) { checker = meta.checker; changed = true; }
        }

        if (!tr.docChanged && !changed) {
           return oldState;
        }

        let decos: Decoration[] = [];
        
        if (enabled && checker) {
          tr.doc.descendants((node, pos) => {
            if (node.isText && node.text) {
              const text = node.text;
              const wordRegex = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
              let match;
              while ((match = wordRegex.exec(text)) !== null) {
                const word = match[0];
                if (!checker.correct(word)) {
                  decos.push(Decoration.inline(pos + match.index, pos + match.index + word.length, {
                    nodeName: 'span',
                    class: 'spell-error',
                    style: 'text-decoration: underline wavy red; text-underline-offset: 3px; cursor: pointer;'
                  }, {
                    isSpellError: true,
                    word: word,
                    from: pos + match.index,
                    to: pos + match.index + word.length
                  }));
                }
              }
            }
          });
        }

        return {
          enabled, checker,
          decorations: DecorationSet.create(tr.doc, decos)
        };
      }
    },
    props: {
      decorations(state) {
        return this.getState(state).decorations;
      }
    }
  });
}

export const SpellcheckExtension = Extension.create({
  name: 'spellcheck',
  addProseMirrorPlugins() {
    return [getSpellcheckPlugin()];
  }
});
