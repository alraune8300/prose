import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { MentionList } from './MentionList';
import { globalCodexEntities } from './editorExtensions';

export default function getSuggestionOptions() {
  return {
    items: ({ query }: { query: string }) => {
      const entities = globalCodexEntities || [];
      return entities
        .filter(item => item.name.toLowerCase().startsWith(query.toLowerCase()) || 
                (item.aliases && item.aliases.some((a: string) => a.toLowerCase().startsWith(query.toLowerCase()))))
        .slice(0, 5);
    },

    render: () => {
      let component: ReactRenderer;
      let popup: any;

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) return;

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },

        onUpdate(props: any) {
          component.updateProps(props);
          if (!props.clientRect) return;
          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0].hide();
            return true;
          }
          return (component.ref as any)?.onKeyDown(props);
        },

        onExit() {
          if (popup && popup[0]) {
             popup[0].destroy();
          }
          component.destroy();
        },
      };
    },
  };
}
