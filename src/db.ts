import Dexie, { Table } from 'dexie';
import type { Project, PageFormat, Folder, VersionSnapshot } from './types';

export interface AppSettings {
  id: string; // 'current'
  activeProjectId?: string;
  activePageId?: string;
  currentTheme?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  pageFormat?: PageFormat;
  isLeftPanelOpen?: boolean;
  isRightPanelOpen?: boolean;
  typewriterMode?: boolean;
  isFocusMode?: boolean;
  isPreviewMode?: boolean;
  language?: string;
  updatedAt?: string;
}

export interface ReferenceDocumentState {
  id: string; // 'last_used'
  title: string;
  type: 'text' | 'pdf' | 'docx' | 'markdown' | 'image' | 'code';
  content: string;
  displayMode: 'live' | 'extract' | 'edit';
  docxHtml?: string | null;
  fileBlob?: Blob | null;
  fileName?: string;
  mimeType?: string;
  fileMeta?: { size?: number; pageCount?: number };
  fontSizeOffset?: number;
  lastUpdated: string;
}

export interface MoodboardItem {
  id: string;
  projectId?: string;
  title: string;
  dataUrl: string;
  url?: string;
  width?: number;
  height?: number;
  palette?: string[];
  tags?: string[];
  createdAt: string;
}

export class WritingAppDexieDB extends Dexie {
  projects!: Table<Project, string>;
  appSettings!: Table<AppSettings, string>;
  folders!: Table<Folder, string>;
  versions!: Table<VersionSnapshot, string>;
  referenceDocument!: Table<ReferenceDocumentState, string>;
  moodboard!: Table<MoodboardItem, string>;

  constructor() {
    super('KgvWritingAppDexieDB');
    
    this.version(1).stores({
      projects: 'id, title, lastModified',
      appSettings: 'id',
    });
    this.version(2).stores({
      projects: 'id, title, lastModified, folderId',
      appSettings: 'id',
      folders: 'id, name, isDeleted'
    });
    this.version(3).stores({
      projects: 'id, title, lastModified, folderId',
      appSettings: 'id',
      folders: 'id, name, isDeleted',
      versions: 'id, pageId, timestamp'
    });
    this.version(4).stores({
      projects: 'id, title, lastModified, folderId',
      appSettings: 'id',
      folders: 'id, name, isDeleted',
      versions: 'id, pageId, timestamp',
      referenceDocument: 'id'
    });
    this.version(5).stores({
      projects: 'id, title, lastModified, folderId',
      appSettings: 'id',
      folders: 'id, name, isDeleted',
      versions: 'id, pageId, timestamp',
      referenceDocument: 'id',
      moodboard: 'id, projectId, createdAt'
    });
  }
}

export const db = new WritingAppDexieDB();

export async function getAllMoodboardItemsFromDB(projectId?: string): Promise<MoodboardItem[]> {
  try {
    if (projectId) {
      const items = await db.moodboard.where('projectId').equals(projectId).toArray();
      if (items.length > 0) return items;
    }
    return await db.moodboard.toArray();
  } catch (err) {
    console.warn('Error reading moodboard from Dexie:', err);
    return [];
  }
}

export async function saveMoodboardItemToDB(item: MoodboardItem): Promise<void> {
  try {
    await db.moodboard.put(item);
  } catch (err) {
    console.warn('Error saving moodboard item to Dexie:', err);
  }
}

export async function deleteMoodboardItemFromDB(id: string): Promise<void> {
  try {
    await db.moodboard.delete(id);
  } catch (err) {
    console.warn('Error deleting moodboard item from Dexie:', err);
  }
}

export async function clearMoodboardFromDB(): Promise<void> {
  try {
    await db.moodboard.clear();
  } catch (err) {
    console.warn('Error clearing moodboard in Dexie:', err);
  }
}


export async function getAllProjectsFromDB(): Promise<Project[]> {
  try {
    return await db.projects.toArray();
  } catch (err) {
    console.warn('Error reading projects from Dexie:', err);
    return [];
  }
}

export async function getProjectFromDB(id: string): Promise<Project | undefined> {
  try {
    return await db.projects.get(id);
  } catch (err) {
    console.warn('Error reading project from Dexie:', err);
    return undefined;
  }
}

export async function saveProjectToDB(project: Project): Promise<void> {
  try {
    await db.projects.put({ ...project, lastModified: new Date().toISOString() });
  } catch (err) {
    console.warn('Error saving project to Dexie:', err);
  }
}

export async function deleteProjectFromDB(id: string): Promise<void> {
  try {
    await db.projects.delete(id);
  } catch (err) {
    console.warn('Error deleting project from Dexie:', err);
  }
}

export async function getAllFoldersFromDB(): Promise<Folder[]> {
  try {
    return await db.folders.toArray();
  } catch (err) {
    console.warn('Error reading folders from Dexie:', err);
    return [];
  }
}

export async function saveFolderToDB(folder: Folder): Promise<void> {
  try {
    await db.folders.put(folder);
  } catch (err) {
    console.warn('Error saving folder to Dexie:', err);
  }
}

export async function getAppSettings(): Promise<AppSettings | undefined> {
  try {
    return await db.appSettings.get('current');
  } catch (err) {
    console.warn('Error reading appSettings from Dexie:', err);
    return undefined;
  }
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const existing = (await db.appSettings.get('current')) || { id: 'current' };
    await db.appSettings.put({
      ...existing,
      ...settings,
      id: 'current',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error saving appSettings to Dexie:', err);
  }
}


export async function getPageVersionsFromDB(pageId: string): Promise<VersionSnapshot[]> {
  try {
    return await db.versions.where('pageId').equals(pageId).sortBy('timestamp');
  } catch (err) {
    console.warn('Error reading versions from Dexie:', err);
    return [];
  }
}

export async function savePageVersionToDB(version: VersionSnapshot): Promise<void> {
  try {
    await db.versions.put(version);
  } catch (err) {
    console.warn('Error saving version to Dexie:', err);
  }
}

export async function deletePageVersionFromDB(id: string): Promise<void> {
  try {
    await db.versions.delete(id);
  } catch (err) {
    console.warn('Error deleting version from Dexie:', err);
  }
}

export async function saveReferenceDocumentToDB(doc: Omit<ReferenceDocumentState, 'id' | 'lastUpdated'>): Promise<void> {
  try {
    await db.referenceDocument.put({
      ...doc,
      id: 'last_used',
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error saving reference document to Dexie:', err);
  }
}

export async function getReferenceDocumentFromDB(): Promise<ReferenceDocumentState | undefined> {
  try {
    return await db.referenceDocument.get('last_used');
  } catch (err) {
    console.warn('Error getting reference document from Dexie:', err);
    return undefined;
  }
}

export async function clearReferenceDocumentFromDB(): Promise<void> {
  try {
    await db.referenceDocument.delete('last_used');
  } catch (err) {
    console.warn('Error clearing reference document from Dexie:', err);
  }
}
