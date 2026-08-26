import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Edit3,
  Copy,
  Trash2,
  Menu,
  Home,
  LayoutDashboard,
  FileText,
  Star,
  Layers
} from 'lucide-react';
import { NotionPage } from '../types';
import { LucideIconRenderer } from './LucideIconRenderer';
import { ThemeColors } from '../../../types';
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
  onSwitchToDocument?: () => void;
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
  onOpenTrash,
  theme,
  lang = 'en'
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const t = getNotionI18n(lang);

  // Active pages (non-deleted)
  const activePages = pages.filter((p) => !p.isDeleted);
  const deletedCount = pages.filter((p) => p.isDeleted).length;

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
    setEditTitle(page.title);
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
    setContextMenu({ id: pageId, x: e.clientX, y: e.clientY });
  };

  const renderTree = (parentId: string | null = null, depth = 0) => {
    const children = activePages
      .filter((p) => p.parentId === parentId)
      .sort((a, b) => a.order - b.order);

    if (children.length === 0) return null;

    return (
      <div className="flex flex-col space-y-0.5">
        {children.map((page) => {
          const hasChildren = activePages.some((p) => p.parentId === page.id);
          const isExpanded = expanded[page.id];
          const isActive = activePageId === page.id;

          return (
            <div key={page.id}>
              <div
                className="group flex items-center justify-between py-1.5 px-2 rounded-xl cursor-pointer transition-all text-xs select-none"
                style={{
                  paddingLeft: `${depth * 12 + 8}px`,
                  backgroundColor: isActive ? 'var(--bg-secondary, #f3f4f6)' : 'transparent',
                  color: isActive ? 'var(--text-primary, #111827)' : 'var(--text-muted, #6b7280)',
                  fontWeight: isActive ? 600 : 400
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
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </div>

                  <div className="shrink-0 text-sm">
                    <LucideIconRenderer name={page.icon || 'FileText'} size={15} />
                  </div>

                  {editingId === page.id ? (
                    <input
                      autoFocus
                      className="bg-transparent outline-none border-b border-blue-500 w-full text-xs font-normal"
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
                    <span className="truncate block">{page.title || t.untitled}</span>
                  )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-2 transition-opacity">
                  <button
                    className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    onClick={(e) => handleContextMenu(e, page.id)}
                    title={t.actions}
                  >
                    <MoreHorizontal size={13} />
                  </button>
                  <button
                    className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreatePage(page.id);
                      setExpanded((p) => ({ ...p, [page.id]: true }));
                    }}
                    title={t.addInside}
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

  const favoritePages = activePages.filter((p) => p.isFavorite);

  return (
    <>
      <div
        className={`shrink-0 flex flex-col border-r h-full transition-all duration-300 ease-in-out relative select-none
          ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-none'}`}
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderColor: 'var(--border-subtle, #e5e7eb)',
          color: 'var(--text-primary, #111827)'
        }}
      >
        {/* Workspace Switcher & Close */}
        <div
          className="h-12 flex items-center justify-between px-3 shrink-0 border-b"
          style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="p-1.5 rounded-lg shrink-0"
              style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)' }}
            >
              <Layers size={15} className="text-blue-500" />
            </div>
            <span className="text-xs font-semibold truncate tracking-tight">Notion Workspace</span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted, #6b7280)' }}
            title="Collapse Sidebar (Ctrl+\)"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Main Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Main Page Button (Dashboard / Trang chính) */}
          <button
            onClick={() => onActivePageChange(null)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activePageId === null
                ? 'font-semibold shadow-sm'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              backgroundColor: activePageId === null ? 'var(--bg-secondary, #f3f4f6)' : 'transparent',
              color: activePageId === null ? 'var(--text-primary, #111827)' : 'var(--text-muted, #6b7280)'
            }}
          >
            <LayoutDashboard size={15} className={activePageId === null ? 'text-blue-500' : ''} />
            <span className="flex-1 text-left">{t.mainPage}</span>
          </button>

          {/* Favorites */}
          {favoritePages.length > 0 && (
            <div>
              <div
                className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: 'var(--text-muted, #6b7280)' }}
              >
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span>{t.favorites}</span>
              </div>
              <div className="space-y-0.5">
                {favoritePages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => onActivePageChange(page.id)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors text-xs hover:bg-black/5 dark:hover:bg-white/5 truncate"
                    style={{
                      backgroundColor:
                        activePageId === page.id ? 'var(--bg-secondary, #f3f4f6)' : 'transparent',
                      color:
                        activePageId === page.id
                          ? 'var(--text-primary, #111827)'
                          : 'var(--text-muted, #6b7280)',
                      fontWeight: activePageId === page.id ? 600 : 400
                    }}
                  >
                    <LucideIconRenderer name={page.icon || 'FileText'} size={14} />
                    <span className="truncate flex-1">{page.title || t.untitled}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pages Tree */}
          <div>
            <div
              className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between group rounded py-0.5"
              style={{ color: 'var(--text-muted, #6b7280)' }}
            >
              <span>{t.pages}</span>
              <button
                onClick={() => onCreatePage(null)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={t.addPage}
              >
                <Plus size={13} />
              </button>
            </div>
            <div className="mt-1">{renderTree(null)}</div>
          </div>
        </div>

        {/* Sidebar Footer: Trash & Quick Add */}
        <div
          className="p-2 border-t flex flex-col gap-1 shrink-0"
          style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}
        >
          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted, #6b7280)' }}
            >
              <div className="flex items-center gap-2">
                <Trash2 size={14} />
                <span>{t.trash}</span>
              </div>
              {deletedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  {deletedCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => onCreatePage(null)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted, #6b7280)' }}
          >
            <Plus size={14} />
            <span>{t.addPage}</span>
          </button>
        </div>
      </div>

      {/* Context Menu with Solid Colors */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[110] w-48 rounded-2xl shadow-2xl border p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 160),
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderColor: 'var(--border-subtle, #e5e7eb)',
            color: 'var(--text-primary, #111827)'
          }}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              const page = activePages.find((p) => p.id === contextMenu.id);
              if (page) startRename(page);
            }}
          >
            <Edit3 size={14} style={{ color: 'var(--text-muted)' }} />
            <span>{t.rename}</span>
          </button>

          <button
            className="w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicatePage(contextMenu.id);
              setContextMenu(null);
            }}
          >
            <Copy size={14} style={{ color: 'var(--text-muted)' }} />
            <span>{t.duplicate}</span>
          </button>

          <div className="h-px w-full my-1" style={{ backgroundColor: 'var(--border-subtle)' }} />

          <button
            className="w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDeletePage(contextMenu.id);
              setContextMenu(null);
            }}
          >
            <Trash2 size={14} />
            <span>{t.delete}</span>
          </button>
        </div>
      )}
    </>
  );
}
