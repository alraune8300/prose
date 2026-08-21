import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const searchHighlightKey = new PluginKey('searchHighlight');

export function getSearchHighlightPlugin() {
  return new Plugin({
    key: searchHighlightKey,
    state: {
      init() {
        return {
          searchTerm: '',
          matchCase: false,
          wholeWord: false,
          regex: false,
          decorations: DecorationSet.empty,
          resultsCount: 0
        };
      },
      apply(tr, oldState) {
        const meta = tr.getMeta(searchHighlightKey);
        let { searchTerm, matchCase, wholeWord, regex } = oldState;
        
        let changed = false;
        if (meta) {
          if (meta.searchTerm !== undefined && meta.searchTerm !== searchTerm) { searchTerm = meta.searchTerm; changed = true; }
          if (meta.matchCase !== undefined && meta.matchCase !== matchCase) { matchCase = meta.matchCase; changed = true; }
          if (meta.wholeWord !== undefined && meta.wholeWord !== wholeWord) { wholeWord = meta.wholeWord; changed = true; }
          if (meta.regex !== undefined && meta.regex !== regex) { regex = meta.regex; changed = true; }
        }

        if (!tr.docChanged && !changed) {
           return oldState;
        }

        const decos: Decoration[] = [];
        let resultsCount = 0;

        if (searchTerm) {
          try {
            const flags = matchCase ? 'g' : 'gi';
            let reStr = regex ? searchTerm : searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            if (wholeWord) {
                reStr = `\\b${reStr}\\b`;
            }
            
            
            tr.doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                let match;
                const localRe = new RegExp(reStr, flags);
                while ((match = localRe.exec(node.text)) !== null) {
                  resultsCount++;
                  decos.push(Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                    class: 'search-result-highlight',
                    style: 'background-color: rgba(255, 213, 79, 0.4); border-radius: 2px; border-bottom: 2px solid #FFC107;'
                  }));
                  // To avoid infinite loops for zero-length matches
                  if (match[0].length === 0) break;
                }
              }
            });
          } catch { /* ignore */ }
        }
        
        if (changed || tr.docChanged) {
           setTimeout(() => {
              window.dispatchEvent(new CustomEvent('kgv-search-results-count', { detail: resultsCount }));
           }, 0);
        }

        return {
          searchTerm, matchCase, wholeWord, regex,
          decorations: DecorationSet.create(tr.doc, decos),
          resultsCount
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

export const SearchHighlightExtension = Extension.create({
  name: 'searchHighlight',
  addProseMirrorPlugins() {
    return [getSearchHighlightPlugin()];
  }
});
