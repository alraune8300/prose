import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { NotionPage } from '../../../types';

interface NotionStore {
  pages: Record<string, NotionPage>;
  activePageId: string | null;
  setActivePageId: (id: string | null) => void;
  createPage: (parentId?: string | null, data?: Partial<NotionPage>) => void;
  updatePage: (id: string, data: Partial<NotionPage>) => void;
  updatePageContent: (id: string, content: string | any) => void;
  duplicatePage: (id: string) => void;
  deletePage: (id: string) => void;
  restorePage: (id: string) => void;
  permanentlyDeletePage: (id: string) => void;
  restoreWorkspaceData: (pages: Record<string, NotionPage>, activePageId?: string | null) => void;
  emptyTrash: () => void;
}

// In-memory debounce timer map for content updates
const contentDebounceTimers: Record<string, NodeJS.Timeout> = {};

export const useNotionStore = create<NotionStore>()(
  persist(
    (set, get) => ({
      pages: {},
      activePageId: null,
      setActivePageId: (id) => set({ activePageId: id }),
      createPage: (parentId = null, data = {}) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newPage: NotionPage = {
          id,
          parentId,
          title: data.title || '',
          icon: data.icon || 'FileText',
          coverUrl: data.coverUrl || (data as any).cover || null,
          properties: data.properties || { Status: 'Not Started' },
          content: data.content || '',
          createdAt: now,
          updatedAt: now,
          order: Date.now(),
          isFavorite: false,
          isDeleted: false,
          ...data,
        };
        set((state) => ({
          pages: { ...state.pages, [id]: newPage },
          activePageId: id,
        }));
      },
      updatePage: (id, data) => {
        set((state) => {
          const page = state.pages[id];
          if (!page) return state;
          return {
            pages: {
              ...state.pages,
              [id]: { ...page, ...data, updatedAt: new Date().toISOString() },
            },
          };
        });
      },
      updatePageContent: (id, content) => {
        // Immediate in-memory state update for responsive UI typing
        set((state) => {
          const page = state.pages[id];
          if (!page) return state;
          return {
            pages: {
              ...state.pages,
              [id]: { ...page, content, updatedAt: new Date().toISOString() },
            },
          };
        });

        // Debounced persistence to avoid thrashing localStorage I/O (350ms debounce)
        if (contentDebounceTimers[id]) {
          clearTimeout(contentDebounceTimers[id]);
        }
        contentDebounceTimers[id] = setTimeout(() => {
          delete contentDebounceTimers[id];
          const latestState = get();
          try {
            const payload = {
              state: {
                pages: latestState.pages,
                activePageId: latestState.activePageId
              },
              version: 0
            };
            localStorage.setItem('notion_workspace_tree_v1', JSON.stringify(payload));
          } catch (err) {
            console.warn('Debounced persistence error:', err);
          }
        }, 350);
      },
      duplicatePage: (id) => {
        const state = get();
        const page = state.pages[id];
        if (!page) return;

        const newPages = { ...state.pages };
        
        const duplicateRecursive = (originalId: string, newParentId: string | null): string => {
          const original = newPages[originalId];
          if (!original) return '';
          const newId = uuidv4();
          newPages[newId] = {
            ...original,
            id: newId,
            parentId: newParentId,
            title: newParentId === page.parentId ? `${original.title} (Copy)` : original.title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: Date.now(),
            isDeleted: false,
          };
          
          Object.values(state.pages)
            .filter((p) => p.parentId === originalId)
            .forEach((child) => {
              duplicateRecursive(child.id, newId);
            });
            
          return newId;
        };

        const rootNewId = duplicateRecursive(id, page.parentId);
        
        set({
          pages: newPages,
          activePageId: rootNewId,
        });
      },
      deletePage: (id) => {
        set((state) => {
          const newPages = { ...state.pages };
          const now = Date.now();
          
          // Recursively find and mark all descendant children as deleted
          const deleteRecursive = (targetId: string) => {
            if (newPages[targetId]) {
              newPages[targetId] = { ...newPages[targetId], isDeleted: true, deletedAt: now };
            }
            Object.values(newPages)
              .filter((p) => p.parentId === targetId && !p.isDeleted)
              .forEach((child) => {
                deleteRecursive(child.id);
              });
          };
          
          deleteRecursive(id);
          
          return {
            pages: newPages,
            activePageId: state.activePageId === id ? null : state.activePageId,
          };
        });
      },
      restorePage: (id) => {
        set((state) => {
          const newPages = { ...state.pages };
          
          // Recursively restore target page and its parents/children
          const restoreRecursive = (targetId: string) => {
            if (newPages[targetId]) {
              newPages[targetId] = { ...newPages[targetId], isDeleted: false, deletedAt: undefined };
            }
            // Also restore parent if it was deleted
            const parentId = newPages[targetId]?.parentId;
            if (parentId && newPages[parentId]?.isDeleted) {
              newPages[parentId] = { ...newPages[parentId], isDeleted: false, deletedAt: undefined };
            }
            Object.values(newPages)
              .filter((p) => p.parentId === targetId)
              .forEach((child) => {
                restoreRecursive(child.id);
              });
          };
          
          restoreRecursive(id);
          return { pages: newPages };
        });
      },
      permanentlyDeletePage: (id) => {
        set((state) => {
          const newPages = { ...state.pages };
          
          // Recursively remove target page and all descendant children
          const deleteRecursive = (targetId: string) => {
            const childIds = Object.values(newPages)
              .filter((p) => p.parentId === targetId)
              .map((p) => p.id);
            
            childIds.forEach((childId) => {
              deleteRecursive(childId);
            });

            delete newPages[targetId];
          };
          
          deleteRecursive(id);
          
          return {
            pages: newPages,
            activePageId: state.activePageId === id ? null : state.activePageId,
          };
        });
      },
      restoreWorkspaceData: (pages, activePageId = null) => {
        set({
          pages,
          activePageId: activePageId || Object.keys(pages)[0] || null,
        });
      },
      emptyTrash: () => {
        set((state) => {
          const newPages = { ...state.pages };
          Object.keys(newPages).forEach((id) => {
            if (newPages[id].isDeleted) {
              delete newPages[id];
            }
          });
          return { pages: newPages };
        });
      }
    }),
    {
      name: 'notion_workspace_tree_v1',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (Object.keys(state.pages || {}).length === 0) {
          const rootId = uuidv4();
          const childId = uuidv4();
          const now = new Date().toISOString();
          
          state.pages = {
            [rootId]: {
              id: rootId,
              parentId: null,
              title: 'Getting Started',
              icon: 'Sparkles',
              coverUrl: null,
              properties: { Status: 'In Progress' },
              content: '<h1>Welcome to Notion Workspace</h1><p>Start writing here...</p>',
              createdAt: now,
              updatedAt: now,
              order: 0,
              isFavorite: true,
              isDeleted: false
            },
            [childId]: {
              id: childId,
              parentId: rootId,
              title: 'Quick Notes',
              icon: 'FileText',
              coverUrl: null,
              properties: { Status: 'Not Started' },
              content: '<h2>Ideas</h2><ul><li>Idea 1</li></ul>',
              createdAt: now,
              updatedAt: now,
              order: 1,
              isFavorite: false,
              isDeleted: false
            }
          };
          state.activePageId = rootId;
        }
      },
    }
  )
);
