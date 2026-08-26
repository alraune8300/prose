import { useNotionStore } from '../apps/notion-workspace/stores/notionStore';
import { NotionPage } from '../types';

export const NOTION_WORKSPACE_STORAGE_KEY = 'notion_workspace_tree_v1';

export interface NotionWorkspaceBackupPayload {
  version: string;
  appName: string;
  exportedAt: number;
  workspaceData: Record<string, NotionPage> | NotionPage[];
}

/**
 * 1. Exports full Notion Workspace backup as a JSON file:
 * - Reads full page tree, hierarchy, database rows, coverUrls from `notion_workspace_tree_v1`
 * - Bundles into standard backup schema with timestamp and metadata
 * - Triggers browser download of `notion-workspace-backup-[TIMESTAMP].json`
 */
export function exportWorkspaceBackup(): void {
  try {
    const storeState = useNotionStore.getState();
    const pages = storeState.pages || {};

    const backupPayload: NotionWorkspaceBackupPayload = {
      version: '1.0',
      appName: 'NotionWorkspace',
      exportedAt: Date.now(),
      workspaceData: pages,
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    
    downloadAnchor.href = url;
    downloadAnchor.download = `notion-workspace-backup-${Date.now()}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export Notion Workspace backup:', error);
    throw error;
  }
}

/**
 * 2. Validates and restores a Notion Workspace backup from a JSON file:
 * - Reads and validates integrity of `workspaceData` and `version`
 * - Updates `notion_workspace_tree_v1` and store state in memory & storage
 * - Dispatches reload events to refresh components
 * - Returns true on success, false otherwise
 */
export async function importWorkspaceBackup(jsonFile: File): Promise<boolean> {
  try {
    if (!jsonFile) {
      throw new Error('No file provided');
    }

    const textContent = await jsonFile.text();
    const data = JSON.parse(textContent);

    // Validate payload structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON structure');
    }

    if (!data.version || !data.workspaceData) {
      throw new Error('Missing required backup fields (version or workspaceData)');
    }

    const normalizedPages: Record<string, NotionPage> = {};

    if (Array.isArray(data.workspaceData)) {
      data.workspaceData.forEach((page: Partial<NotionPage>) => {
        if (page && page.id) {
          normalizedPages[page.id] = {
            id: page.id,
            parentId: page.parentId || null,
            title: page.title || 'Untitled',
            icon: page.icon || 'FileText',
            coverUrl: page.coverUrl || null,
            properties: page.properties || { Status: 'Not Started' },
            content: page.content || '',
            createdAt: page.createdAt || new Date().toISOString(),
            updatedAt: page.updatedAt || new Date().toISOString(),
            order: typeof page.order === 'number' ? page.order : Date.now(),
            isFavorite: Boolean(page.isFavorite),
            isDeleted: Boolean(page.isDeleted),
          };
        }
      });
    } else if (typeof data.workspaceData === 'object') {
      Object.entries(data.workspaceData).forEach(([key, page]) => {
        const p = page as Partial<NotionPage>;
        if (p && typeof p === 'object') {
          const pageId = p.id || key;
          normalizedPages[pageId] = {
            id: pageId,
            parentId: p.parentId || null,
            title: p.title || 'Untitled',
            icon: p.icon || 'FileText',
            coverUrl: p.coverUrl || null,
            properties: p.properties || { Status: 'Not Started' },
            content: p.content || '',
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || new Date().toISOString(),
            order: typeof p.order === 'number' ? p.order : Date.now(),
            isFavorite: Boolean(p.isFavorite),
            isDeleted: Boolean(p.isDeleted),
          };
        }
      });
    } else {
      throw new Error('Unrecognized workspaceData format');
    }

    const pageCount = Object.keys(normalizedPages).length;
    if (pageCount === 0) {
      throw new Error('Backup contains no valid pages');
    }

    // Determine first active page (non-deleted if possible)
    const nonDeleted = Object.values(normalizedPages).filter(p => !p.isDeleted);
    const activePageId = nonDeleted.length > 0 ? nonDeleted[0].id : Object.keys(normalizedPages)[0];

    // Apply to Zustand store and trigger persistence
    const store = useNotionStore.getState();
    if (typeof store.restoreWorkspaceData === 'function') {
      store.restoreWorkspaceData(normalizedPages, activePageId);
    } else {
      useNotionStore.setState({
        pages: normalizedPages,
        activePageId,
      });
    }

    // Trigger workspace update event
    window.dispatchEvent(new CustomEvent('notion-workspace-restored', {
      detail: { pageCount, activePageId }
    }));

    return true;
  } catch (error) {
    console.error('Failed to import Notion Workspace backup:', error);
    return false;
  }
}
