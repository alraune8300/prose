import React from 'react';
import { FilePlus, Table, Kanban, BookOpen, LayoutList, FileText, Clock, Sparkles } from 'lucide-react';
import { LucideIconRenderer } from './LucideIconRenderer';
import { NotionPage } from '../types';
import { ThemeColors } from '../../../types';
import { getNotionI18n } from '../i18n';
import { Lang } from '../../../i18n';

interface Props {
  onCreateEmpty: () => void;
  onCreateTemplate: (templateType: string) => void;
  recentPages: NotionPage[];
  onOpenPage: (id: string) => void;
  theme?: ThemeColors;
  lang?: Lang;
}

export function NotionDashboard({
  onCreateEmpty,
  onCreateTemplate,
  recentPages,
  onOpenPage,
  theme,
  lang = 'en'
}: Props) {
  const t = getNotionI18n(lang);
  const activeRecentPages = recentPages.filter((p) => !p.isDeleted);

  return (
    <div
      className="flex-1 overflow-y-auto w-full flex flex-col items-center py-12 px-6 sm:px-12 select-none"
      style={{ color: 'var(--text-primary, #111827)' }}
    >
      <div className="w-full max-w-3xl space-y-10">
        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-2xl shadow-sm"
            style={{ backgroundColor: 'var(--bg-secondary, #f3f4f6)' }}
          >
            <Sparkles size={26} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.dashboard}</h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted, #6b7280)' }}>
              Notion Workspace
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: 'var(--text-muted, #6b7280)' }}
          >
            {t.actions}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button
              onClick={onCreateEmpty}
              className="flex flex-col items-start gap-2.5 p-4 rounded-2xl border transition-all text-left group hover:shadow-md cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderColor: 'var(--border-subtle, #e5e7eb)'
              }}
            >
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <FilePlus size={20} strokeWidth={1.75} />
              </div>
              <div>
                <span className="font-semibold text-sm block">{t.blankPage}</span>
                <span className="text-[11px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {t.addPage}
                </span>
              </div>
            </button>

            <button
              onClick={() => onCreateTemplate('table')}
              className="flex flex-col items-start gap-2.5 p-4 rounded-2xl border transition-all text-left group hover:shadow-md cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderColor: 'var(--border-subtle, #e5e7eb)'
              }}
            >
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Table size={20} strokeWidth={1.75} />
              </div>
              <div>
                <span className="font-semibold text-sm block">{t.table}</span>
                <span className="text-[11px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Database
                </span>
              </div>
            </button>

            <button
              onClick={() => onCreateTemplate('kanban')}
              className="flex flex-col items-start gap-2.5 p-4 rounded-2xl border transition-all text-left group hover:shadow-md cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderColor: 'var(--border-subtle, #e5e7eb)'
              }}
            >
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Kanban size={20} strokeWidth={1.75} />
              </div>
              <div>
                <span className="font-semibold text-sm block">{t.kanban}</span>
                <span className="text-[11px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Board View
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Templates */}
        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: 'var(--text-muted, #6b7280)' }}
          >
            {t.templates}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div
              onClick={() => onCreateTemplate('reading-list')}
              className="group cursor-pointer p-4 rounded-2xl border transition-all flex items-center gap-3.5 hover:shadow-sm"
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderColor: 'var(--border-subtle, #e5e7eb)'
              }}
            >
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <BookOpen size={18} strokeWidth={1.75} />
              </div>
              <div>
                <span className="text-sm font-semibold block">{t.readingList}</span>
              </div>
            </div>

            <div
              onClick={() => onCreateTemplate('project-tracker')}
              className="group cursor-pointer p-4 rounded-2xl border transition-all flex items-center gap-3.5 hover:shadow-sm"
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderColor: 'var(--border-subtle, #e5e7eb)'
              }}
            >
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <LayoutList size={18} strokeWidth={1.75} />
              </div>
              <div>
                <span className="text-sm font-semibold block">{t.projectTracker}</span>
              </div>
            </div>

            <div
              onClick={() => onCreateTemplate('personal-notes')}
              className="group cursor-pointer p-4 rounded-2xl border transition-all flex items-center gap-3.5 hover:shadow-sm"
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderColor: 'var(--border-subtle, #e5e7eb)'
              }}
            >
              <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                <FileText size={18} strokeWidth={1.75} />
              </div>
              <div>
                <span className="text-sm font-semibold block">{t.personalNotes}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Opened */}
        {activeRecentPages.length > 0 && (
          <div>
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5"
              style={{ color: 'var(--text-muted, #6b7280)' }}
            >
              <Clock size={13} />
              <span>{t.recents}</span>
            </h2>
            <div
              className="rounded-2xl border p-2 space-y-0.5"
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderColor: 'var(--border-subtle, #e5e7eb)'
              }}
            >
              {activeRecentPages.slice(0, 6).map((page) => (
                <div
                  key={page.id}
                  onClick={() => onOpenPage(page.id)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                    <LucideIconRenderer name={page.icon || 'FileText'} size={16} />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {page.title || t.untitled}
                    </span>
                  </div>
                  <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
