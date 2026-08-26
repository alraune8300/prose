import React, { useEffect, useState } from 'react';
import { ThemeColors } from './types';
import { NotionSidebar } from './apps/notion-workspace/components/NotionSidebar';
import { NotionDashboard } from './apps/notion-workspace/components/NotionDashboard';
import { NotionCanvas } from './apps/notion-workspace/components/NotionCanvas';
import { Trash } from './apps/notion-workspace/components/Trash';
import { useNotionStore } from './apps/notion-workspace/stores/notionStore';
import { Menu, MoreHorizontal, ArrowUpRight, LayoutDashboard, ChevronRight } from 'lucide-react';
import { LucideIconRenderer } from './apps/notion-workspace/components/LucideIconRenderer';
import { CustomSelect } from './CustomSelect';
import { PRESETS } from './theme';
import type { ThemeMode } from './types';
import { GoogleFontsPanel } from './GoogleFontsPanel';
import { getNotionI18n } from './apps/notion-workspace/i18n';
import { Lang } from './i18n';
import { exportWorkspaceBackup, importWorkspaceBackup } from './services/notionBackupService';
import { Download, Upload } from 'lucide-react';

interface Props {
  theme: ThemeColors;
  themeMode: ThemeMode;
  onSelectTheme: (mode: ThemeMode, customId?: string) => void;
  lang: Lang;
  onSelectLang?: (lang: Lang) => void;
  uiFont: string;
  docFont: string;
  onSetUiFont: (font: string) => void;
  onSetDocFont: (font: string) => void;
  onOpenGoogleFonts?: (target: 'ui' | 'doc') => void;
  onSwitchToDocument: () => void;
  onExportToDocument: (title: string, content: string, pageId?: string) => void;
}

export default function NotionWorkspaceRoot({
  theme,
  themeMode,
  onSelectTheme,
  lang,
  onSelectLang,
  uiFont,
  docFont,
  onSetUiFont,
  onSetDocFont,
  onSwitchToDocument,
  onExportToDocument
}: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [showGoogleFontsModal, setShowGoogleFontsModal] = useState(false);
  const [googleFontsTarget, setGoogleFontsTarget] = useState<'ui' | 'doc'>('doc');
  const [backupToast, setBackupToast] = useState<{ msg: string; success: boolean } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const {
    pages,
    activePageId,
    setActivePageId,
    createPage,
    updatePage,
    duplicatePage,
    deletePage,
    restorePage,
    permanentlyDeletePage,
    emptyTrash
  } = useNotionStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showTrash, setShowTrash] = useState(false);

  const t = getNotionI18n(lang);

  useEffect(() => {
    const handleReset = () => setActivePageId(null);
    window.addEventListener('reset-notion-page', handleReset);
    return () => window.removeEventListener('reset-notion-page', handleReset);
  }, [setActivePageId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '\\') {
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleImport = (e: any) => {
      const { title, content } = e.detail;
      createPage(null, { title, content });
    };
    window.addEventListener('import-to-notion', handleImport);
    return () => window.removeEventListener('import-to-notion', handleImport);
  }, [createPage]);

  const activePage = activePageId ? pages[activePageId] : null;

  const handleOpenFonts = (target: 'ui' | 'doc') => {
    setGoogleFontsTarget(target);
    setShowGoogleFontsModal(true);
  };

  // Apply theme variables globally to this root
  const themeStyle = {
    '--bg-primary': theme.background || theme.bg,
    '--bg-surface': theme.panel || theme.bg,
    '--bg-secondary': theme.backgroundMuted || theme.surface,
    '--border-subtle': theme.border,
    '--text-primary': theme.text,
    '--text-muted': theme.textMuted || theme.muted,
    '--accent-color': theme.accent,
    fontFamily: uiFont
  } as React.CSSProperties;

  const pagesList = Object.values(pages);

  return (
    <div className="w-full h-full flex overflow-hidden" style={themeStyle}>
      <NotionSidebar
        pages={pagesList}
        activePageId={activePageId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onActivePageChange={setActivePageId}
        onCreatePage={createPage}
        onUpdatePage={updatePage}
        onDuplicatePage={duplicatePage}
        onDeletePage={deletePage}
        onSwitchToDocument={onSwitchToDocument}
        onConvertToDoc={(id) => {
          const page = pages.find((p) => p.id === id);
          if (page) {
            onExportToDocument(page.title, page.content, page.id);
          }
        }}
        onOpenTrash={() => setShowTrash(true)}
        theme={theme}
        lang={lang}
      />

      <div
        className="flex-1 min-w-0 flex flex-col relative h-full"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Topbar */}
        <div
          className="h-12 flex items-center justify-between px-4 shrink-0 border-b select-none z-20"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
        >
          {/* Left Breadcrumb & Sidebar Toggle */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0 overflow-hidden" style={{ color: 'var(--text-muted)' }}>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer mr-1"
                title="Toggle Sidebar (Ctrl+\)"
              >
                <Menu size={16} />
              </button>
            )}

            {/* Main Page / Dashboard Direct Button */}
            <button
              onClick={() => setActivePageId(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium ${
                !activePage ? 'bg-black/5 dark:bg-white/10 text-primary' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ color: !activePage ? 'var(--text-primary)' : 'var(--text-muted)' }}
              title={t.mainPage}
            >
              <LayoutDashboard size={14} />
              <span>{t.mainPage}</span>
            </button>

            {activePage && (
              <>
                <ChevronRight size={13} className="shrink-0 opacity-40" />
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg truncate max-w-[200px] sm:max-w-[320px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  <LucideIconRenderer name={activePage.icon || 'FileText'} size={15} />
                  <span className="truncate">{activePage.title || t.untitled}</span>
                </span>
              </>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 text-xs">
            {activePage && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onExportToDocument(activePage.title, activePage.content, activePage.id)}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                  style={{ color: 'var(--text-muted)' }}
                  title="Bridge to Document Studio"
                >
                  <ArrowUpRight size={14} />
                  <span className="hidden sm:inline">{t.documentStudio}</span>
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([activePage.content], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${activePage.title || t.untitled}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                  style={{ color: 'var(--text-muted)' }}
                  title={t.exportHtml}
                >
                  {t.exportHtml.split(' ')[0]}
                </button>
              </div>
            )}

            {/* Settings & Appearance Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                title={t.settings}
              >
                <MoreHorizontal size={18} />
              </button>

              {showSettings && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowSettings(false)} />
                  <div
                    className="absolute right-0 top-full mt-1.5 w-64 rounded-2xl shadow-2xl border z-[95] p-3 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-100"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div>
                      <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        {t.language || 'Language'}
                      </div>
                      <CustomSelect
                        value={lang}
                        onChange={(val) => onSelectLang && onSelectLang(val as Lang)}
                        options={[
                          { value: 'en', label: 'English' },
                          { value: 'vi', label: 'Tiếng Việt' },
                          { value: 'fr', label: 'Français' },
                          { value: 'de', label: 'Deutsch' },
                          { value: 'es', label: 'Español' },
                          { value: 'it', label: 'Italiano' },
                          { value: 'ko', label: '한국어' },
                          { value: 'zh', label: '中文' },
                          { value: 'ja', label: '日本語' }
                        ]}
                        theme={theme}
                        buttonClassName="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl border transition-colors outline-none cursor-pointer"
                        buttonStyle={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)'
                        }}
                        dropdownClassName="w-[200px]"
                        disableSearch={true}
                      />
                    </div>

                    <div>
                      <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        {t.theme}
                      </div>
                      <CustomSelect
                        value={themeMode}
                        onChange={(val) => onSelectTheme(val as ThemeMode)}
                        options={PRESETS.map((p) => ({ value: p.name.toLowerCase(), label: p.name }))}
                        theme={theme}
                        buttonClassName="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl border transition-colors outline-none cursor-pointer"
                        buttonStyle={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)'
                        }}
                        dropdownClassName="w-[200px]"
                        disableSearch={true}
                      />
                    </div>

                    <div>
                      <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        {t.pageFont}
                      </div>
                      <CustomSelect
                        value={docFont}
                        onChange={(val) => {
                          if (val === 'google_fonts') {
                            handleOpenFonts('doc');
                            setShowSettings(false);
                          } else {
                            onSetDocFont(val);
                          }
                        }}
                        options={[
                          { value: 'Inter', label: 'Inter (Sans)' },
                          { value: 'Merriweather', label: 'Merriweather (Serif)' },
                          { value: 'Fira Code', label: 'Fira Code (Mono)' },
                          ...(!['Inter', 'Merriweather', 'Fira Code'].includes(docFont)
                            ? [{ value: docFont, label: docFont }]
                            : []),
                          { value: 'google_fonts', label: t.browseGoogleFonts }
                        ]}
                        theme={theme}
                        buttonClassName="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl border transition-colors outline-none cursor-pointer"
                        buttonStyle={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)'
                        }}
                        dropdownClassName="w-[200px]"
                        disableSearch={true}
                      />
                    </div>

                    <div>
                      <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        {t.uiFont}
                      </div>
                      <CustomSelect
                        value={uiFont}
                        onChange={(val) => {
                          if (val === 'google_fonts') {
                            handleOpenFonts('ui');
                            setShowSettings(false);
                          } else {
                            onSetUiFont(val);
                          }
                        }}
                        options={[
                          { value: 'Inter', label: 'Inter (Sans)' },
                          ...(uiFont !== 'Inter' ? [{ value: uiFont, label: uiFont }] : []),
                          { value: 'google_fonts', label: t.browseGoogleFonts }
                        ]}
                        theme={theme}
                        buttonClassName="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl border transition-colors outline-none cursor-pointer"
                        buttonStyle={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)'
                        }}
                        dropdownClassName="w-[200px]"
                        disableSearch={true}
                      />
                    </div>

                    {/* Backup & Restore Workspace Section */}
                    <div className="pt-2 border-t flex flex-col gap-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>
                        {t.workspace} Backup
                      </div>
                      <button
                        onClick={() => {
                          try {
                            exportWorkspaceBackup();
                            setBackupToast({ msg: t.exportBackup + ' ✓', success: true });
                            setTimeout(() => setBackupToast(null), 3000);
                          } catch {
                            setBackupToast({ msg: 'Export failed', success: false });
                            setTimeout(() => setBackupToast(null), 3000);
                          }
                          setShowSettings(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <Download size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{t.exportBackup}</span>
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const success = await importWorkspaceBackup(file);
                            if (success) {
                              setBackupToast({ msg: t.backupSuccess, success: true });
                            } else {
                              setBackupToast({ msg: t.backupFail, success: false });
                            }
                            setTimeout(() => setBackupToast(null), 4000);
                          }
                          if (e.target) e.target.value = '';
                        }}
                      />

                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowSettings(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <Upload size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{t.importBackup}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Backup Toast Notification */}
        {backupToast && (
          <div className="fixed bottom-6 right-6 z-[10001] px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: backupToast.success ? '#22c55e' : '#ef4444',
              color: 'var(--text-primary)'
            }}
          >
            <div className={`w-2 h-2 rounded-full ${backupToast.success ? 'bg-green-500' : 'bg-red-500'}`} />
            {backupToast.msg}
          </div>
        )}

        {/* Trash Modal (Solid Color & Confirmation Support) */}
        {showTrash && (
          <Trash
            pages={pages}
            onClose={() => setShowTrash(false)}
            onRestore={restorePage}
            onPermanentlyDelete={permanentlyDeletePage}
            onEmptyTrash={emptyTrash}
            lang={lang}
            theme={theme}
          />
        )}

        {/* Google Fonts Modal */}
        {showGoogleFontsModal && (
          <GoogleFontsPanel
            theme={theme}
            uiFont={uiFont}
            lang={lang}
            bodyFont={docFont}
            uiFontRole={uiFont}
            onClose={() => setShowGoogleFontsModal(false)}
            onApplyToDoc={(font) => {
              onSetDocFont(font);
            }}
            onApplyToUi={(font) => {
              onSetUiFont(font);
            }}
            onAssignRole={(role, font) => {
              if (role === 'ui') onSetUiFont(font);
              else onSetDocFont(font);
            }}
            onSelect={(font) => {
              if (googleFontsTarget === 'ui') {
                onSetUiFont(font);
              } else {
                onSetDocFont(font);
              }
            }}
          />
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center relative">
          {activePage ? (
            <NotionCanvas
              page={activePage as any}
              theme={theme}
              docFont={docFont}
              lang={lang}
              sidebarOpen={sidebarOpen}
              onChange={(updates) => updatePage(activePage.id, updates as any)}
              onSetDocFont={onSetDocFont}
              onOpenGoogleFonts={() => handleOpenFonts('doc')}
            />
          ) : (
            <NotionDashboard
              onCreateEmpty={() => createPage(null)}
              onCreateTemplate={(type) => {
                let defaultData = {};
                if (type === 'table')
                  defaultData = {
                    title: t.newTable,
                    icon: 'Table',
                    content: JSON.stringify({
                      type: 'doc',
                      content: [{ type: 'database', attrs: { activeView: 'table' } }]
                    })
                  };
                if (type === 'kanban')
                  defaultData = {
                    title: t.kanbanBoard,
                    icon: 'Kanban',
                    content: JSON.stringify({
                      type: 'doc',
                      content: [{ type: 'database', attrs: { activeView: 'board' } }]
                    })
                  };
                if (type === 'reading-list')
                  defaultData = {
                    title: t.readingList,
                    icon: 'BookOpen',
                    content:
                      '<h2>Books to read</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false">The Design of Everyday Things</li></ul>'
                  };
                if (type === 'project-tracker')
                  defaultData = { title: t.projectTracker, icon: 'LayoutList' };
                if (type === 'personal-notes')
                  defaultData = { title: t.personalNotes, icon: 'FileText' };
                createPage(null, defaultData);
              }}
              recentPages={[...pagesList].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))}
              onOpenPage={setActivePageId}
              theme={theme}
              lang={lang}
            />
          )}
        </div>
      </div>
    </div>
  );
}
