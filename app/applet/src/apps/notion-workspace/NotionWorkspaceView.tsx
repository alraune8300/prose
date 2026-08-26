import React, { useState, useEffect, useCallback } from 'react';
import { ThemeColors, Lang } from '../../types';
import { useNotionStore } from './stores/notionStore';
import { NotionSidebar } from './components/NotionSidebar';
import { NotionHeader } from './components/NotionHeader';
import { NotionCanvas } from './components/NotionCanvas';
import { NotionSearchModal } from './components/NotionSearchModal';
import { Plus, Sparkles } from 'lucide-react';

interface NotionWorkspaceViewProps {
  theme: ThemeColors;
  lang: Lang;
  uiFont: string;
  onSwitchToDocument: () => void;
}

export const NotionWorkspaceView: React.FC<NotionWorkspaceViewProps> = ({
  theme,
  lang,
  uiFont,
  onSwitchToDocument
}) => {
  const {
    pages,
    activePage,
    activePageId,
    sidebarWidth,
    isSidebarOpen,
    expandedPageIds,
    setActivePageId,
    createPage,
    updatePage,
    deletePage,
    duplicatePage,
    toggleFavorite,
    toggleExpandPage,
    setSidebarOpen,
    toggleSidebar,
    setSidebarWidth
  } = useNotionStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + P or Cmd + P -> Quick Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      // Ctrl + \ or Cmd + \ -> Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // Export page to markdown
  const handleExportMarkdown = useCallback(() => {
    if (!activePage) return;

    const convertNodeToMarkdown = (node: any): string => {
      if (!node) return '';
      if (node.type === 'heading') {
        const hashes = '#'.repeat(node.attrs?.level || 1);
        const text = node.content?.map((c: any) => c.text || '').join('') || '';
        return `\n${hashes} ${text}\n`;
      }
      if (node.type === 'paragraph') {
        const text = node.content?.map((c: any) => c.text || '').join('') || '';
        return `\n${text}\n`;
      }
      if (node.type === 'bulletList') {
        return (
          '\n' +
          (node.content || [])
            .map((item: any) => `- ${item.content?.map((c: any) => c.content?.map((t: any) => t.text || '').join('')).join('')}`)
            .join('\n') +
          '\n'
        );
      }
      if (node.type === 'taskList') {
        return (
          '\n' +
          (node.content || [])
            .map((item: any) => `[${item.attrs?.checked ? 'x' : ' '}] ${item.content?.map((c: any) => c.content?.map((t: any) => t.text || '').join('')).join('')}`)
            .join('\n') +
          '\n'
        );
      }
      if (node.type === 'blockquote') {
        const text = (node.content || []).map((c: any) => c.content?.map((t: any) => t.text || '').join('')).join('\n');
        return `\n> ${text}\n`;
      }
      return '';
    };

    let md = `# ${activePage.icon ? activePage.icon + ' ' : ''}${activePage.title || 'Untitled'}\n\n`;

    if (activePage.properties && Object.keys(activePage.properties).length > 0) {
      md += `<!-- Properties -->\n`;
      Object.entries(activePage.properties).forEach(([k, v]) => {
        md += `- **${k}**: ${Array.isArray(v) ? v.join(', ') : v}\n`;
      });
      md += `\n---\n\n`;
    }

    if (activePage.content?.content) {
      md += activePage.content.content.map(convertNodeToMarkdown).join('\n');
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activePage.title || 'notion-page'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }, [activePage]);

  return (
    <div
      className="w-full h-full flex overflow-hidden select-none"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: uiFont
      }}
    >
      {/* 1. Left Notion Sidebar */}
      <NotionSidebar
        pages={pages}
        activePageId={activePageId}
        expandedPageIds={expandedPageIds}
        sidebarWidth={sidebarWidth}
        isOpen={isSidebarOpen}
        theme={theme}
        lang={lang}
        uiFont={uiFont}
        onSelectPage={setActivePageId}
        onCreatePage={(parentId) => createPage(parentId)}
        onDeletePage={deletePage}
        onDuplicatePage={duplicatePage}
        onToggleFavorite={toggleFavorite}
        onToggleExpand={toggleExpandPage}
        onSetWidth={setSidebarWidth}
        onToggleSidebar={toggleSidebar}
        onOpenSearch={() => setIsSearchOpen(true)}
        onSwitchToDocument={onSwitchToDocument}
      />

      {/* 2. Main Notion Workspace Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        {activePage ? (
          <>
            <NotionHeader
              page={activePage}
              allPages={pages}
              isSidebarOpen={isSidebarOpen}
              theme={theme}
              onToggleSidebar={toggleSidebar}
              onToggleFavorite={toggleFavorite}
              onSelectPage={setActivePageId}
              onExportMarkdown={handleExportMarkdown}
            />
            <NotionCanvas
              key={activePage.id}
              page={activePage}
              theme={theme}
              uiFont={uiFont}
              onUpdate={(updates) => updatePage(activePage.id, updates)}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6 select-none">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border
              }}
            >
              📄
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-base font-semibold" style={{ color: theme.text }}>
                Chưa có trang nào được chọn
              </h3>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                Chọn một trang ở thanh bên hoặc tạo một trang hoàn toàn mới để bắt đầu ghi chú.
              </p>
            </div>
            <button
              onClick={() => createPage(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-sm hover:opacity-90"
              style={{
                backgroundColor: theme.accent,
                color: '#ffffff'
              }}
            >
              <Plus size={14} />
              <span>Tạo trang mới</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Global Quick Search Modal */}
      <NotionSearchModal
        isOpen={isSearchOpen}
        pages={pages}
        theme={theme}
        onSelectPage={setActivePageId}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};
