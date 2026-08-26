import React, { useState } from 'react';
import { Home, ArrowLeftRight, Plus, ChevronRight } from 'lucide-react';
import { LucideIconRenderer } from './LucideIconRenderer';
import { ThemeColors } from '../../../theme';
import { useNotionStore } from '../stores/notionStore';
import { getNotionI18n } from '../i18n';
import { Lang } from '../../../i18n';

interface Props {
  onCreateEmpty: () => void;
  onCreateTemplate?: (templateType: string) => void;
  recentPages: any[];
  onOpenPage: (id: string) => void;
  theme?: ThemeColors;
  lang?: Lang;
}

export function NotionDashboard({ onCreateEmpty, recentPages, onOpenPage, lang = 'en' }: Props) {
  const { pages, createPage } = useNotionStore();
  const pagesList = Object.values(pages);
  const rootPages = pagesList.filter((p) => !p.parentId && !p.isDeleted);

  const t = getNotionI18n(lang);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (nodes: any[], depth = 0) => {
    return nodes.map((node) => {
      const children = pagesList.filter((p) => p.parentId === node.id && !p.isDeleted);
      const isExpanded = !!expandedNodes[node.id];
      const hasChildren = children.length > 0;

      return (
        <div key={node.id}>
          <div
            onClick={() => onOpenPage(node.id)}
            className="flex items-center justify-between py-2 px-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
            style={{ paddingLeft: `${depth * 16 + 10}px` }}
          >
            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
              <div
                className="w-5 h-5 flex items-center justify-center cursor-pointer shrink-0 opacity-50 hover:opacity-100"
                onClick={(e) => (hasChildren ? toggleNode(node.id, e) : undefined)}
              >
                {hasChildren ? (
                  <ChevronRight
                    size={14}
                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                )}
              </div>
              <LucideIconRenderer
                name={node.icon || 'FileText'}
                size={16}
                className="shrink-0"
                style={{ color: 'var(--text-muted)' }}
              />
              <span className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {node.title || t.untitled}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  createPage(node.id);
                  setExpandedNodes((prev) => ({ ...prev, [node.id]: true }));
                }}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-muted)' }}
                title={t.addPage}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          {isExpanded && hasChildren && <div>{renderTree(children, depth + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 w-full flex justify-center overflow-y-auto relative pb-24 select-none">
      <div className="w-full max-w-2xl px-4 md:px-8 py-8 flex flex-col gap-8">
        {/* Top Nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl border flex items-center justify-center font-bold text-sm shadow-xs"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)'
              }}
            >
              N
            </div>
            <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-full p-1 border" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                className="px-4 py-1.5 rounded-full shadow-xs flex items-center justify-center text-xs font-semibold transition-all"
                style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              >
                <Home size={14} className="mr-1.5" />
                <span>{t.mainPage}</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switch-workspace', { detail: 'document' }))}
            className="h-9 px-3 rounded-xl border flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs font-medium cursor-pointer shadow-xs"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
            title={t.documentStudio}
          >
            <ArrowLeftRight size={14} />
            <span className="hidden sm:inline">{t.documentStudio}</span>
          </button>
        </div>

        {/* Recents */}
        {recentPages.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
              {t.favorites || 'Pages'}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {recentPages.slice(0, 5).map((page) => (
                <div
                  key={page.id}
                  onClick={() => onOpenPage(page.id)}
                  className="w-48 h-32 shrink-0 rounded-2xl border flex flex-col overflow-hidden cursor-pointer snap-start hover:shadow-lg transition-all group"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
                >
                  <div
                    className="h-16 w-full relative"
                    style={{
                      backgroundImage: page.coverUrl ? `url(${page.coverUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: page.coverUrl ? undefined : 'var(--bg-secondary)'
                    }}
                  />
                  <div className="flex-1 p-3 flex flex-col justify-center relative">
                    <div
                      className="absolute -top-3.5 left-3 p-1 rounded-lg border shadow-xs"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                    >
                      <LucideIconRenderer
                        name={page.icon || 'FileText'}
                        size={14}
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>
                    <span
                      className="text-xs sm:text-sm font-semibold line-clamp-1 mt-1 truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {page.title || t.untitled}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Private Pages */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between group px-1">
            <h2 className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
              {t.privatePages}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onCreateEmpty()}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                title={t.addPage}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <div className="flex flex-col space-y-0.5">{renderTree(rootPages)}</div>
        </div>
      </div>
    </div>
  );
}
