import { useState, useEffect, useSyncExternalStore } from 'react';
import { NotionPage, NotionWorkspaceState } from '../types';

const STORAGE_KEY = 'notion_workspace_tree_v1';
const SIDEBAR_STATE_KEY = 'notion_workspace_sidebar_v1';

// Initial Mock Content
const INITIAL_ROOT_ID = 'page-getting-started';
const INITIAL_CHILD_ID = 'page-quick-notes';

const INITIAL_GETTING_STARTED_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '👋 Chào mừng bạn đến với Notion Workspace!' }]
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Đây là không gian làm việc dạng khối (Block Editor) độc lập, kết hợp cây trang đệ quy lồng nhau và tự động đồng bộ theo bảng màu giao diện của toàn bộ hệ thống.'
        }
      ]
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: '✨ Các tính năng cốt lõi' }]
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cây thư mục trang lồng nhau không giới hạn (Nested Page Tree)' }] }]
        },
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Gõ lệnh / (Slash Command) để mở menu chèn nhanh các khối' }] }]
        },
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bảng thuộc tính trang đa dạng (Status, Tags, Date, Custom Key-Value)' }] }]
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tùy biến Emoji Icon & Ảnh bìa Cover cho từng trang' }] }]
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Xuất bản (Sync) trang Notion sang Document Studio khi cần' }] }]
        }
      ]
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '💡 Mẹo nhanh: Nhấn phím Ctrl + \\ để ẩn/hiện Sidebar, hoặc dùng thanh kéo để điều chỉnh độ rộng!' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }]
    }
  ]
};

const INITIAL_QUICK_NOTES_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '📝 Ghi chú nhanh (Quick Notes)' }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Ghi lại mọi ý tưởng, đầu việc cần làm hoặc tài liệu tham khảo tại đây.' }]
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ý tưởng bài viết mới cho tuần tới' }] }]
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Thu thập feedback từ người dùng giao diện' }] }]
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cải tiến bảng thuộc tính trang (Property Grid)' }] }]
        }
      ]
    }
  ]
};

function getInitialPages(): NotionPage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load Notion pages from localStorage:', e);
  }

  // Fallback to Mock Data
  const now = Date.now();
  const rootPage: NotionPage = {
    id: INITIAL_ROOT_ID,
    parentId: null,
    title: 'Getting Started',
    icon: '👋',
    cover: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2000&auto=format&fit=crop',
    properties: {
      status: 'In Progress',
      tags: ['Welcome', 'Guide'],
      date: new Date().toISOString().split('T')[0]
    },
    content: INITIAL_GETTING_STARTED_CONTENT,
    createdAt: now - 3600000,
    updatedAt: now,
    isFavorite: true,
    order: 0
  };

  const childPage: NotionPage = {
    id: INITIAL_CHILD_ID,
    parentId: INITIAL_ROOT_ID,
    title: 'Quick Notes',
    icon: '📝',
    cover: null,
    properties: {
      status: 'To Do',
      tags: ['Ideas', 'Draft'],
      date: new Date().toISOString().split('T')[0]
    },
    content: INITIAL_QUICK_NOTES_CONTENT,
    createdAt: now - 1800000,
    updatedAt: now,
    isFavorite: false,
    order: 1
  };

  const initial = [rootPage, childPage];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

function getInitialSidebarState(): { width: number; isOpen: boolean; expanded: string[] } {
  try {
    const raw = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        width: typeof parsed.width === 'number' ? Math.max(180, Math.min(480, parsed.width)) : 260,
        isOpen: parsed.isOpen !== false,
        expanded: Array.isArray(parsed.expanded) ? parsed.expanded : [INITIAL_ROOT_ID]
      };
    }
  } catch {}
  return { width: 260, isOpen: true, expanded: [INITIAL_ROOT_ID] };
}

// Global in-memory state
const initialSidebar = getInitialSidebarState();
const initialPages = getInitialPages();

let state: NotionWorkspaceState = {
  pages: initialPages,
  activePageId: initialPages.length > 0 ? initialPages[0].id : null,
  sidebarWidth: initialSidebar.width,
  isSidebarOpen: initialSidebar.isOpen,
  expandedPageIds: initialSidebar.expanded
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function persistPages(pages: NotionPage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  } catch (e) {
    console.error('Failed to save Notion pages to localStorage:', e);
  }
}

function persistSidebar(width: number, isOpen: boolean, expanded: string[]) {
  try {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify({ width, isOpen, expanded }));
  } catch {}
}

export const notionStore = {
  getState(): NotionWorkspaceState {
    return state;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  setActivePageId(id: string | null) {
    if (state.activePageId === id) return;
    state = { ...state, activePageId: id };
    notify();
  },

  createPage(parentId: string | null = null, title = 'Untitled', icon = '📄'): NotionPage {
    const id = 'page-' + crypto.randomUUID();
    const now = Date.now();
    const newPage: NotionPage = {
      id,
      parentId,
      title: title || 'Untitled',
      icon: icon || '📄',
      cover: null,
      properties: {
        status: 'To Do',
        tags: [],
        date: new Date().toISOString().split('T')[0]
      },
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: []
          }
        ]
      },
      createdAt: now,
      updatedAt: now,
      order: state.pages.length,
      isFavorite: false
    };

    const newExpanded = parentId && !state.expandedPageIds.includes(parentId)
      ? [...state.expandedPageIds, parentId]
      : state.expandedPageIds;

    const newPages = [...state.pages, newPage];
    state = {
      ...state,
      pages: newPages,
      activePageId: id,
      expandedPageIds: newExpanded
    };

    persistPages(newPages);
    persistSidebar(state.sidebarWidth, state.isSidebarOpen, newExpanded);
    notify();
    return newPage;
  },

  updatePage(id: string, updates: Partial<NotionPage>) {
    const existing = state.pages.find((p) => p.id === id);
    if (!existing) return;

    const updatedPage: NotionPage = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };

    const newPages = state.pages.map((p) => (p.id === id ? updatedPage : p));
    state = {
      ...state,
      pages: newPages
    };

    persistPages(newPages);
    notify();
  },

  deletePage(id: string) {
    // Soft delete page and its descendants to Trash
    const toDelete = new Set<string>([id]);
    let added = true;
    while (added) {
      added = false;
      state.pages.forEach((p) => {
        if (p.parentId && toDelete.has(p.parentId) && !toDelete.has(p.id)) {
          toDelete.add(p.id);
          added = true;
        }
      });
    }

    const now = Date.now();
    const newPages = state.pages.map((p) => {
      if (toDelete.has(p.id)) {
        return { ...p, isDeleted: true, deletedAt: now };
      }
      return p;
    });

    let nextActiveId = state.activePageId;
    if (state.activePageId && toDelete.has(state.activePageId)) {
      const remaining = newPages.filter(p => !p.isDeleted);
      nextActiveId = remaining.length > 0 ? remaining[0].id : null;
    }

    state = {
      ...state,
      pages: newPages,
      activePageId: nextActiveId
    };

    persistPages(newPages);
    notify();
  },

  restorePage(id: string) {
    const toRestore = new Set<string>([id]);
    let added = true;
    while (added) {
      added = false;
      state.pages.forEach((p) => {
        if (p.parentId && toRestore.has(p.id) && p.parentId && !toRestore.has(p.parentId)) {
          toRestore.add(p.parentId);
          added = true;
        }
        if (p.parentId && toRestore.has(p.parentId) && !toRestore.has(p.id)) {
          toRestore.add(p.id);
          added = true;
        }
      });
    }

    const newPages = state.pages.map((p) => {
      if (toRestore.has(p.id)) {
        return { ...p, isDeleted: false, deletedAt: undefined };
      }
      return p;
    });

    state = {
      ...state,
      pages: newPages,
      activePageId: id
    };

    persistPages(newPages);
    notify();
  },

  permanentlyDeletePage(id: string) {
    const toDelete = new Set<string>([id]);
    let added = true;
    while (added) {
      added = false;
      state.pages.forEach((p) => {
        if (p.parentId && toDelete.has(p.parentId) && !toDelete.has(p.id)) {
          toDelete.add(p.id);
          added = true;
        }
      });
    }

    const newPages = state.pages.filter((p) => !toDelete.has(p.id));
    let nextActiveId = state.activePageId;
    if (state.activePageId && toDelete.has(state.activePageId)) {
      const remaining = newPages.filter(p => !p.isDeleted);
      nextActiveId = remaining.length > 0 ? remaining[0].id : null;
    }

    state = {
      ...state,
      pages: newPages,
      activePageId: nextActiveId
    };

    persistPages(newPages);
    notify();
  },

  emptyTrash() {
    const newPages = state.pages.filter((p) => !p.isDeleted);
    state = {
      ...state,
      pages: newPages
    };
    persistPages(newPages);
    notify();
  },

  duplicatePage(id: string): NotionPage | null {
    const original = state.pages.find((p) => p.id === id);
    if (!original) return null;

    const newId = 'page-' + crypto.randomUUID();
    const now = Date.now();
    const duplicated: NotionPage = {
      ...original,
      id: newId,
      title: `${original.title} (Bản sao)`,
      createdAt: now,
      updatedAt: now,
      order: state.pages.length,
      isFavorite: false
    };

    const newPages = [...state.pages, duplicated];
    state = {
      ...state,
      pages: newPages,
      activePageId: newId
    };

    persistPages(newPages);
    notify();
    return duplicated;
  },

  toggleFavorite(id: string) {
    const page = state.pages.find((p) => p.id === id);
    if (!page) return;

    this.updatePage(id, { isFavorite: !page.isFavorite });
  },

  setPageProperty(id: string, propKey: string, value: any) {
    const page = state.pages.find((p) => p.id === id);
    if (!page) return;

    const newProps = { ...page.properties, [propKey]: value };
    this.updatePage(id, { properties: newProps });
  },

  removePageProperty(id: string, propKey: string) {
    const page = state.pages.find((p) => p.id === id);
    if (!page) return;

    const newProps = { ...page.properties };
    delete newProps[propKey];
    this.updatePage(id, { properties: newProps });
  },

  toggleExpandPage(id: string) {
    const exists = state.expandedPageIds.includes(id);
    const newExpanded = exists
      ? state.expandedPageIds.filter((item) => item !== id)
      : [...state.expandedPageIds, id];

    state = { ...state, expandedPageIds: newExpanded };
    persistSidebar(state.sidebarWidth, state.isSidebarOpen, newExpanded);
    notify();
  },

  setSidebarOpen(isOpen: boolean) {
    state = { ...state, isSidebarOpen: isOpen };
    persistSidebar(state.sidebarWidth, isOpen, state.expandedPageIds);
    notify();
  },

  toggleSidebar() {
    this.setSidebarOpen(!state.isSidebarOpen);
  },

  setSidebarWidth(width: number) {
    const clamped = Math.max(180, Math.min(480, width));
    state = { ...state, sidebarWidth: clamped };
    persistSidebar(clamped, state.isSidebarOpen, state.expandedPageIds);
    notify();
  },

  movePage(pageId: string, newParentId: string | null, newOrder?: number) {
    if (pageId === newParentId) return;
    const page = state.pages.find((p) => p.id === pageId);
    if (!page) return;

    const newPages = state.pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          parentId: newParentId,
          order: typeof newOrder === 'number' ? newOrder : p.order,
          updatedAt: Date.now()
        };
      }
      return p;
    });

    state = { ...state, pages: newPages };
    persistPages(newPages);
    notify();
  }
};

export function useNotionStore() {
  const storeState = useSyncExternalStore(
    notionStore.subscribe,
    notionStore.getState,
    notionStore.getState
  );

  return {
    ...storeState,
    activePage: storeState.pages.find((p) => p.id === storeState.activePageId) || null,
    setActivePageId: notionStore.setActivePageId.bind(notionStore),
    createPage: notionStore.createPage.bind(notionStore),
    updatePage: notionStore.updatePage.bind(notionStore),
    deletePage: notionStore.deletePage.bind(notionStore),
    restorePage: notionStore.restorePage.bind(notionStore),
    permanentlyDeletePage: notionStore.permanentlyDeletePage.bind(notionStore),
    emptyTrash: notionStore.emptyTrash.bind(notionStore),
    duplicatePage: notionStore.duplicatePage.bind(notionStore),
    toggleFavorite: notionStore.toggleFavorite.bind(notionStore),
    setPageProperty: notionStore.setPageProperty.bind(notionStore),
    removePageProperty: notionStore.removePageProperty.bind(notionStore),
    toggleExpandPage: notionStore.toggleExpandPage.bind(notionStore),
    setSidebarOpen: notionStore.setSidebarOpen.bind(notionStore),
    toggleSidebar: notionStore.toggleSidebar.bind(notionStore),
    setSidebarWidth: notionStore.setSidebarWidth.bind(notionStore),
    movePage: notionStore.movePage.bind(notionStore)
  };
}
