import tippy, { delegate } from 'tippy.js';
import type { CodexEntity } from './types';

export function setupMentionHover(container: HTMLElement, getEntities: () => CodexEntity[]) {
  return delegate(container, {
    target: '.codex-mention',
    theme: 'light',
    placement: 'top',
    interactive: true,
    delay: [200, 0],
    onShow(instance) {
      const id = instance.reference.getAttribute('data-entity-id');
      const entities = getEntities();
      const entity = entities.find(e => e.id === id);
      if (!entity) {
        return false;
      }
      
      const el = document.createElement('div');
      el.className = 'p-2 max-w-[200px] text-sm text-left font-sans';
      el.innerHTML = `
        <div class="font-bold text-amber-600 mb-1">${entity.name}</div>
        <div class="text-[10px] uppercase opacity-50 mb-1 font-bold">${entity.type}</div>
        <div class="text-xs opacity-80">${entity.traits || 'No traits provided.'}</div>
      `;
      instance.setContent(el);
    }
  });
}
