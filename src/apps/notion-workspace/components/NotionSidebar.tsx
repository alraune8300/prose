import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Edit3, Copy, Trash2, Menu, Search, Edit, LayoutDashboard, ArrowLeftRight } from 'lucide-react';
import { NotionPage } from '../../../types';
import { LucideIconRenderer } from './LucideIconRenderer';
import { ThemeColors } from '../../../theme';
import { getNotionI18n } from '../i18n';
import { Lang } from '../../../i18n';

interface Props {
  pages: NotionPage[];
  activePageId: string | null;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  onActivePageChange: (id: string | null) => void;
  onCreatePage: (parentId: string | null) => void;
  onUpdatePage: (id: string, updates: Partial<NotionPage>) => void;
  onDuplicatePage: (id: string) => void;
  onDeletePage: (id: string) => void;
  onSwitchToDocument: () => void;
  onConvertToDoc?: (id: string) => void;
  onOpenTrash?: () => void;
  theme?: ThemeColors;
  lang?: Lang;
}

export function NotionSidebar({
  pages,
  activePageId,
  sidebarOpen,
  setSidebarOpen,
  onActivePageChange,
  onCreatePage,
  onUpdatePage,
  onDuplicatePage,
  onDeletePage,
  onSwitchToDocument,
  onConvertToDoc,
  onOpenTrash,
  lang = 'en'
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const t = getNotionI18n(lang);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startRename = (page: NotionPage) => {
    setEditingId(page.id);
    setEditTitle(page.title || t.untitled);
    setContextMenu(null);
  };

  const submitRename = () => {
    if (editingId) {
      onUpdatePage(editingId, { title: editTitle });
      setEditingId(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setContextMenu({ id: pageId, x: e.clientX, y: e.clientY });
  };

  const deletedCount = pages.filter((p) => p.isDeleted).length;

  const renderTree = (parentId: string | null = null, depth = 0) => {
    const children = pages
      .filter((p) => p.parentId === parentId && !p.isDeleted)
      .filter((p) => !searchQuery || (p.title || t.untitled).toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.order - b.order);

    if (children.length === 0) return null;

    return (
      <div className="flex flex-col">
        {children.map((page) => {
          const hasChildren = pages.some((p) => p.parentId === page.id && !p.isDeleted);
          const isExpanded = expanded[page.id];
          const isActive = activePageId === page.id;

          return (
            <div key={page.id}>
              <div
                className="group flex items-center justify-between py-1 px-2 rounded-lg cursor-pointer transition-colors text-sm hover:bg-black/5 dark:hover:bg-white/5 relative select-none"
                style={{
                  paddingLeft: `${depth * 12 + 8}px`,
                  backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)'
                }}
                onClick={() => onActivePageChange(page.id)}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div
                    className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${
                      hasChildren ? '' : 'invisible'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(page.id);
                    }}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                  <LucideIconRenderer name={page.icon || 'FileText'} size={15} />

                  {editingId === page.id ? (
                    <input
                      autoFocus
                      className="bg-transparent outline-none border-b border-blue-500 w-full text-xs sm:text-sm"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={submitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate text-xs sm:text-sm font-normal">
                      {page.title || t.untitled}
                    </span>
                  )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-2 transition-opacity">
                  <button
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                    onClick={(e) => handleContextMenu(e, page.id)}
                    title={t.clickForMenu}
                  >
                    <MoreHorizontal size={13} />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreatePage(page.id);
                      setExpanded((p) => ({ ...p, [page.id]: true }));
                    }}
                    title={t.addPage}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {isExpanded && hasChildren && <div>{renderTree(page.id, depth + 1)}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div
        className={`shrink-0 flex flex-col border-r h-full transition-all duration-300 ease-in-out relative group/sidebar select-none
          ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: 'var(--text-muted)', color: 'var(--bg-surface)' }}
            >
              N
            </div>
            <span className="text-sm font-semibold truncate flex-1" style={{ color: 'var(--text-primary)' }}>
              {t.workspace}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onCreatePage(null)}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={t.addPage}
              style={{ color: 'var(--text-muted)' }}
            >
              <Edit size={15} />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Close Sidebar (Ctrl+\)"
              style={{ color: 'var(--text-muted)' }}
            >
              <Menu size={15} />
            </button>
          </div>
        </div>

        {/* Search Bar / Input Toggle */}
        <div className="px-2 pt-1 pb-2">
          {showSearch ? (
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
            >
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-xs"
                style={{ color: 'var(--text-primary)' }}
                autoFocus
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearch(false);
                }}
                className="text-[10px] opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors text-left"
              style={{ color: 'var(--text-muted)' }}
            >
              <Search size={14} /> <span className="font-medium">{t.search}</span>
            </button>
          )}
        </div>

        {/* Primary Navigation Menu */}
        <div className="flex flex-col px-2 mb-3 space-y-0.5">
          {/* Main Page / Dashboard Button */}
          <button
            onClick={() => onActivePageChange(null)}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
              activePageId === null ? 'shadow-xs font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              backgroundColor: activePageId === null ? 'var(--bg-secondary)' : 'transparent',
              color: activePageId === null ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            <LayoutDashboard size={15} />
            <span className="truncate">{t.mainPage}</span>
          </button>

          {/* Switch to Document Studio */}
          <button
            onClick={onSwitchToDocument}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition-colors text-left cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            title={t.documentStudio}
          >
            <div className="flex items-center gap-2.5">
              <ArrowLeftRight size={14} />
              <span>{t.documentStudio}</span>
            </div>
          </button>

          {/* Trash */}
          <button
            onClick={onOpenTrash}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition-colors text-left cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="flex items-center gap-2.5">
              <Trash2 size={14} />
              <span>{t.trash}</span>
            </div>
            {deletedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-black/10 dark:bg-white/10">
                {deletedCount}
              </span>
            )}
          </button>
        </div>

        {/* Tree and Pages View */}
        <div className="flex-1 overflow-y-auto px-1 pb-16 scrollbar-hide">
          {/* Favorites */}
          {pages.some((p) => p.isFavorite && !p.isDeleted) && (
            <div className="mb-4">
              <div
                className="px-2 mb-1 text-[11px] font-semibold flex items-center justify-between rounded py-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="flex items-center gap-1 opacity-70">
                  <ChevronDown size={12} /> {t.favorites}
                </span>
              </div>
              <div className="space-y-0.5">
                {pages
                  .filter((p) => p.isFavorite && !p.isDeleted)
                  .map((page) => (
                    <div
                      key={page.id}
                      onClick={() => onActivePageChange(page.id)}
                      className="flex items-center gap-2 px-2.5 py-1 rounded-lg cursor-pointer transition-colors text-xs hover:bg-black/5 dark:hover:bg-white/5"
                      style={{
                        backgroundColor: activePageId === page.id ? 'var(--bg-secondary)' : 'transparent',
                        color: activePageId === page.id ? 'var(--text-primary)' : 'var(--text-muted)'
                      }}
                    >
                      <LucideIconRenderer name={page.icon || 'FileText'} size={14} />
                      <span className="truncate flex-1 font-normal">{page.title || t.untitled}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Private / All Pages */}
          <div>
            <div
              className="px-2 mb-1 text-[11px] font-semibold group/section flex items-center justify-between rounded py-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="flex items-center gap-1 opacity-70">
                <ChevronDown size={12} /> {t.privatePages}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreatePage(null);
                }}
                className="opacity-0 group-hover/section:opacity-100 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-opacity cursor-pointer"
                title={t.addPage}
              >
                <Plus size={13} />
              </button>
            </div>
            <div className="space-y-0.5">{renderTree(null)}</div>
          </div>
        </div>

        {/* Bottom Quick Action */}
        <div
          className="absolute bottom-0 left-0 right-0 p-2 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
        >
          <button
            onClick={() => onCreatePage(null)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer w-full"
            style={{ color: 'var(--text-muted)' }}
          >
            <Plus size={14} />
            <span>{t.addPage}</span>
          </button>
        </div>
      </div>

      {/* Solid Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[9999] w-48 rounded-xl shadow-2xl border py-1 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 150),
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
            onClick={(e) => {
              e.stopPropagation();
              const page = pages.find((p) => p.id === contextMenu.id);
              if (page) startRename(page);
            }}
          >
            <Edit3 size={13} /> {t.rename}
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicatePage(contextMenu.id);
              setContextMenu(null);
            }}
          >
            <Copy size={13} /> {t.duplicate}
          </button>
          {onConvertToDoc && (
            <button
              className="w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
              onClick={(e) => {
                e.stopPropagation();
                onConvertToDoc(contextMenu.id);
                setContextMenu(null);
              }}
            >
              <ArrowLeftRight size={13} /> {t.bridgeToDoc}
            </button>
          )}
          <div className="h-px w-full my-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
          <button
            className="w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDeletePage(contextMenu.id);
              setContextMenu(null);
            }}
          >
            <Trash2 size={13} /> {t.delete}
          </button>
        </div>
      )}
    </>
  );
}
