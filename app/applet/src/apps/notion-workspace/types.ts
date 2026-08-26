export type NotionPropertyType = 'status' | 'tags' | 'date' | 'text' | 'number' | 'checkbox' | 'url';

export interface NotionPage {
  id: string;
  parentId: string | null; // null = root page in sidebar
  title: string;
  icon: string;
  cover: string | null;
  coverUrl?: string | null;
  properties: {
    status?: string;
    tags?: string[];
    date?: string;
    [key: string]: any;
  };
  content: any; // TipTap JSON
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  isDeleted?: boolean;
  deletedAt?: number;
  order: number;
}

export interface NotionWorkspaceState {
  pages: NotionPage[];
  activePageId: string | null;
  sidebarWidth: number;
  isSidebarOpen: boolean;
  expandedPageIds: string[];
}
