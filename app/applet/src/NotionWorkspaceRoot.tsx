import React, { useState, useEffect } from 'react';
import { ThemeColors } from './theme';
import { NotionSidebar } from './apps/notion-workspace/components/NotionSidebar';
import { NotionDashboard } from './apps/notion-workspace/components/NotionDashboard';
import { NotionCanvas } from './apps/notion-workspace/components/NotionCanvas';
import { getNotionTree, saveNotionPageToDB, deleteNotionPageFromDB, NotionPage } from './db';
import { Menu, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LucideIconRenderer } from './apps/notion-workspace/components/LucideIconRenderer';

interface Props {
  theme: ThemeColors;
  lang: 'en' | 'vi';
  uiFont: string;
  onSwitchToDocument: () => void;
}

export default function NotionWorkspaceRoot({ theme, lang, uiFont, onSwitchToDocument }: Props) {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadTree();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '\\') {
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadTree = async () => {
    const tree = await getNotionTree();
    
    if (tree.length === 0) {
      const p1: NotionPage = {
        id: uuidv4(),
        parentId: null,
        title: 'Getting Started',
        icon: 'Hand',
        cover: '',
        content: '<h1>Welcome to your workspace</h1><p>This is a new page.</p>',
        properties: { Status: 'In Progress', Tags: 'Welcome' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
        isFavorite: true
      };
      await saveNotionPageToDB(p1);
      setPages([p1]);
      setActivePageId(p1.id);
    } else {
      setPages(tree);
    }
  };

  const handleCreatePage = async (parentId: string | null = null, defaultData: Partial<NotionPage> = {}) => {
    const newPage: NotionPage = {
      id: uuidv4(),
      parentId,
      title: defaultData.title || '',
      icon: defaultData.icon || 'FileText',
      cover: '',
      content: defaultData.content || '',
      properties: defaultData.properties || { Status: 'Not Started' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: Date.now(),
      isFavorite: false
    };
    await saveNotionPageToDB(newPage);
    setPages(prev => [...prev, newPage]);
    setActivePageId(newPage.id);
  };

  const handleUpdatePage = async (id: string, updates: Partial<NotionPage>) => {
    const page = pages.find(p => p.id === id);
    if (!page) return;
    const newPage = { ...page, ...updates, updatedAt: new Date().toISOString() };
    await saveNotionPageToDB(newPage);
    setPages(prev => prev.map(p => p.id === id ? newPage : p));
  };

  const handleDuplicatePage = async (id: string) => {
    const page = pages.find(p => p.id === id);
    if (!page) return;
    const newPage = { ...page, id: uuidv4(), title: `${page.title} (Copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await saveNotionPageToDB(newPage);
    setPages(prev => [...prev, newPage]);
    setActivePageId(newPage.id);
  };

  const handleDeletePage = async (id: string) => {
    await deleteNotionPageFromDB(id);
    setPages(prev => prev.filter(p => p.id !== id && p.parentId !== id)); // simple cascade
    if (activePageId === id) setActivePageId(null);
  };

  const activePage = pages.find(p => p.id === activePageId);

  // Apply theme variables globally to this root
  const themeStyle = {
    '--bg-primary': theme.background,
    '--bg-surface': theme.panel,
    '--bg-secondary': theme.backgroundMuted,
    '--border-subtle': theme.border,
    '--text-primary': theme.text,
    '--text-muted': theme.textMuted,
    fontFamily: uiFont
  } as React.CSSProperties;

  return (
    <div className="w-full h-full flex overflow-hidden" style={themeStyle}>
      <NotionSidebar 
        pages={pages}
        activePageId={activePageId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onActivePageChange={setActivePageId}
        onCreatePage={handleCreatePage}
        onUpdatePage={handleUpdatePage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onSwitchToDocument={onSwitchToDocument}
        theme={theme}
      />

      <div className="flex-1 min-w-0 flex flex-col relative h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Topbar */}
        <div className="h-12 flex items-center justify-between px-4 shrink-0 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                title="Toggle Sidebar (Ctrl+\\)"
              >
                <Menu size={18} />
              </button>
            )}
            {activePage && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-sm font-medium">
                <LucideIconRenderer name={activePage.icon || 'FileText'} size={16} /> 
                <span style={{ color: 'var(--text-primary)' }}>{activePage.title || 'Untitled'}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {activePage && (
              <button 
                className="px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Export to Document Studio"
              >
                <ArrowUpRight size={14} /> Export
              </button>
            )}
            <button className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center">
          {activePage ? (
            <NotionCanvas 
              page={activePage} 
              theme={theme} 
              onChange={(updates) => handleUpdatePage(activePage.id, updates)}
            />
          ) : (
            <NotionDashboard 
              onCreateEmpty={() => handleCreatePage(null)}
              onCreateTemplate={(type) => {
                let defaultData = {};
                if (type === 'table') defaultData = { title: 'New Table', icon: 'Table', properties: { Type: 'Database' } };
                if (type === 'kanban') defaultData = { title: 'Kanban Board', icon: 'Kanban', properties: { Type: 'Board' } };
                if (type === 'reading-list') defaultData = { title: 'Reading List', icon: 'BookOpen', content: '<h2>Books to read</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false">The Design of Everyday Things</li></ul>' };
                if (type === 'project-tracker') defaultData = { title: 'Project Tracker', icon: 'LayoutList' };
                if (type === 'personal-notes') defaultData = { title: 'Personal Notes', icon: 'FileText' };
                handleCreatePage(null, defaultData);
              }}
              recentPages={[...pages].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())}
              onOpenPage={setActivePageId}
              theme={theme}
            />
          )}
        </div>
      </div>
    </div>
  );
}
