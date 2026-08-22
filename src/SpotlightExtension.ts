import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const spotlightKey = new PluginKey('spotlightFocus');

export interface SpotlightOptions {
  enabled: boolean;
}

export const SpotlightExtension = Extension.create<SpotlightOptions>({
  name: 'spotlight',

  addOptions() {
    return {
      enabled: false,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: spotlightKey,
        state: {
          init() {
            return {
              enabled: false,
              decorations: DecorationSet.empty,
              activePos: -1,
            };
          },
          apply(tr, oldState) {
            const meta = tr.getMeta(spotlightKey);
            let enabled = oldState.enabled;
            let forceUpdate = false;

            if (meta && meta.enabled !== undefined) {
              if (meta.enabled !== enabled) {
                enabled = meta.enabled;
                forceUpdate = true;
              }
            }

            if (!enabled) {
              return {
                enabled: false,
                decorations: DecorationSet.empty,
                activePos: -1,
              };
            }

            // Calculate active block decoration on selection change or doc change or enabled toggle
            if (forceUpdate || tr.selectionSet || tr.docChanged) {
              const { from } = tr.selection;
              const decos: Decoration[] = [];

              if (tr.doc && tr.doc.nodeSize > 2) {
                try {
                  const $pos = tr.doc.resolve(Math.min(Math.max(0, from), tr.doc.content.size));
                  // Find the top-level block inside the document (depth 1)
                  if ($pos.depth >= 1) {
                    const node = $pos.node(1);
                    const startPos = $pos.start(1) - 1;
                    if (startPos >= 0 && node) {
                      decos.push(
                        Decoration.node(startPos, startPos + node.nodeSize, {
                          class: 'kgv-spotlight-active-block',
                        })
                      );
                    }
                  } else if ($pos.parent && $pos.parent !== tr.doc) {
                    const startPos = $pos.start() - 1;
                    if (startPos >= 0) {
                      decos.push(
                        Decoration.node(startPos, startPos + $pos.parent.nodeSize, {
                          class: 'kgv-spotlight-active-block',
                        })
                      );
                    }
                  }
                } catch {
                  // Ignore pos resolution edge cases
                }
              }

              return {
                enabled: true,
                decorations: DecorationSet.create(tr.doc, decos),
                activePos: from,
              };
            }

            return {
              enabled,
              decorations: oldState.decorations.map(tr.mapping, tr.doc),
              activePos: oldState.activePos,
            };
          },
        },
        props: {
          decorations(state) {
            const pluginState = spotlightKey.getState(state);
            return pluginState?.enabled ? pluginState.decorations : DecorationSet.empty;
          },
          attributes(state) {
            const pluginState = spotlightKey.getState(state);
            if (pluginState?.enabled) {
              return {
                class: 'kgv-spotlight-mode-active',
              };
            }
            return {};
          },
        },
      }),
    ];
  },
});
