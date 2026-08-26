import React, { useState, useEffect, useCallback } from 'react';
import { FileText, FolderOpen, FolderInput, Plus, Download, Upload, Grid, List, Trash2, Edit2, Check, X, RotateCcw, Home, AlertCircle, Search, ArrowUpDown, FileJson, Clock, Palette } from 'lucide-react';

import { Project, ThemeColors, Folder } from './types';
import { db, getAllProjectsFromDB, saveProjectToDB, deleteProjectFromDB, getAllFoldersFromDB, saveFolderToDB } from './db';
import { exportToJsonBackup, importJsonBackupFile } from './fileHandlers';
import { Lang, t } from './i18n';
import { PRESETS, THEME_CATEGORIES } from './theme';
import { CustomSelect } from './CustomSelect';

interface WelcomeScreenProps {
  theme: ThemeColors;
  themeMode?: string;
  onSelectTheme?: (themeId: string) => void;
  uiFont: string;
  lang?: Lang;
  onChangeLang?: (l: Lang) => void;
  onOpenProject: (projectId: string, pageId?: string) => void;
  onImport: () => void;
  onExportAll: () => void;
  onOpenGithubCloudSave?: () => void;
  onEmptyAllTrash?: () => Promise<void> | void;
  onReloadProjects?: () => Promise<void> | void;
  refreshTrigger?: number;
}

const LANGUAGES: {value: Lang, label: string}[] = [
  {value: 'en', label: 'English'},
  {value: 'vi', label: 'Tiếng Việt'},
  {value: 'fr', label: 'Français'},
  {value: 'de', label: 'Deutsch'},
  {value: 'it', label: 'Italiano'},
  {value: 'es', label: 'Español'},
  {value: 'ko', label: '한국어'},
  {value: 'zh', label: '中文'},
  {value: 'ja', label: '日本語'}
];

type SortOption = 'updated' | 'newest' | 'oldest' | 'nameAZ' | 'nameZA' | 'pages';

function WelcomeScreen({ theme, themeMode, onSelectTheme, uiFont, lang = 'vi', onChangeLang, onOpenProject, onImport, onExportAll, onOpenGithubCloudSave, onEmptyAllTrash, onReloadProjects, refreshTrigger }: WelcomeScreenProps) {
    
  const [projects, setProjects] = useState<Project[]>([]);
  const activeProjects = projects.filter(p => !p.isDeleted);
  const trashedProjects = projects.filter(p => p.isDeleted);
  const [folders, setFolders] = useState<Folder[]>([]);
  const activeFolders = folders.filter(f => !f.isDeleted);
  const trashedFolders = folders.filter(f => f.isDeleted);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tab, setTab] = useState<'active' | 'trash'>('active');
  const [timeGreeting, setTimeGreeting] = useState('');
  
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
  const [dragProjectId, setDragProjectId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'root'>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [themeSearchQuery, setThemeSearchQuery] = useState('');
  const [themeCategoryFilter, setThemeCategoryFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; type: 'project' | 'folder' | null; id: string | null; name: string }>({
    isOpen: false,
    type: null,
    id: null,
    name: ''
  });

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const loadData = useCallback(async () => {
    const projs = await getAllProjectsFromDB();
    const flds = await getAllFoldersFromDB();
    setProjects(projs);
    setFolders(flds);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  useEffect(() => {
    const handleClickOutside = () => {
      setIsNewMenuOpen(false);
      setIsDataMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting(t(lang, 'goodMorning') || 'Good morning');
    else if (hour < 18) setTimeGreeting(t(lang, 'goodAfternoon') || 'Good afternoon');
    else setTimeGreeting(t(lang, 'goodEvening') || 'Good evening');
  }, [lang]);

  const handleMoveProject = async (folderId: string | null, targetProjId?: string) => {
    const pId = targetProjId || movingProjectId;
    if (!pId) return;
    const project = activeProjects.find(p => p.id === pId) || trashedProjects.find(p => p.id === pId);
    if (!project) return;
    
    const updatedProj = { ...project, lastModified: new Date().toISOString() };
    if (folderId) {
      updatedProj.folderId = folderId;
    } else {
      delete updatedProj.folderId;
    }

    await saveProjectToDB(updatedProj);
    setMovingProjectId(null);
    setDragProjectId(null);
    await loadData();
    if (onReloadProjects) onReloadProjects();
    setToastMsg(t(lang, 'projectMoved') || 'Project moved successfully');
  };

  const handleSoftDeleteProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    await saveProjectToDB({ 
      ...project, 
      isDeleted: true, 
      deletedAt: new Date().toISOString() 
    });
    loadData();
  };

  const handleRestoreProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    await saveProjectToDB({ 
      ...project, 
      isDeleted: false, 
      deletedAt: null 
    });
    loadData();
  };

  const handleSoftDeleteFolder = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    await saveFolderToDB({
      ...folder,
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });
    loadData();
  };

  const handleRestoreFolder = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    await saveFolderToDB({
      ...folder,
      isDeleted: false,
      deletedAt: null
    });
    loadData();
  };

  const promptHardDelete = (type: 'project' | 'folder', id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmDialog({ isOpen: true, type, id, name });
  };

  const executeHardDelete = async () => {
    const { type, id } = deleteConfirmDialog;
    if (!type || !id) return;

    if (type === 'project') {
      await deleteProjectFromDB(id);
    } else if (type === 'folder') {
      await db.transaction('rw', [db.folders, db.projects], async () => {
        await db.folders.delete(id);
        await db.projects.where('folderId').equals(id).delete();
      });
    }
    
    setDeleteConfirmDialog({ isOpen: false, type: null, id: null, name: '' });
    loadData();
  };

  const handleEmptyAllTrash = async () => {
    if (onEmptyAllTrash) {
      await onEmptyAllTrash();
      await loadData();
    }
  };

  const handleStartEditProject = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(id);
    setEditingFolderId(null);
    setEditName(currentName);
  };

  const handleStartEditFolder = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(id);
    setEditingProjectId(null);
    setEditName(currentName);
  };

  const handleSaveEditProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editName.trim()) {
      await saveProjectToDB({ ...project, title: editName.trim() });
      loadData();
    }
    setEditingProjectId(null);
  };

  const handleSaveEditFolder = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editName.trim()) {
      await saveFolderToDB({ ...folder, name: editName.trim() });
      loadData();
    }
    setEditingFolderId(null);
  };

  const handleNewProject = async () => {
    const newProj: Project = {
      id: 'proj-' + Date.now(),
      title: t(lang, 'newProject') || 'New Project',
      pages: [{
        id: 'page-' + Date.now(),
        title: 'Untitled Document',
        content: '<p></p>',
        isDraft: false,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }],
      drafts: [],
      folders: [],
      bin: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isDeleted: false,
      folderId: currentFolderId,
    };
    await saveProjectToDB(newProj);
    await loadData();
    if (onReloadProjects) await onReloadProjects();
    onOpenProject(newProj.id, newProj.pages[0].id);
  };

  const handleNewFolder = async () => {
    const newFld: Folder = {
      id: 'fld-' + Date.now(),
      name: t(lang, 'newFolder') || 'New Folder',
      parentId: currentFolderId || undefined,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };
    await saveFolderToDB(newFld);
    await loadData();
  };

  
  const getBreadcrumbs = () => {
    const crumbs = [];
    let curr = currentFolderId;
    while (curr) {
      const f = folders.find(x => x.id === curr);
      if (f) {
        crumbs.unshift(f);
        curr = f.parentId || null;
      } else {
        break;
      }
    }
    return crumbs;
  };
  const breadcrumbs = getBreadcrumbs();

  const handleExportBackupJson = () => {
    exportToJsonBackup(projects, folders);
    setToastMsg({ text: t(lang, 'backupExport'), type: 'success' });
  };

  const handleImportBackupJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          await importJsonBackupFile(file);
          await loadData();
          setToastMsg({ text: t(lang, 'backupSuccess'), type: 'success' });
        } catch (err) {
          console.error('Import backup error:', err);
          setToastMsg({ text: t(lang, 'backupError'), type: 'error' });
        }
      }
    };
    input.click();
  };

  const filteredProjects = (tab === 'active' ? activeProjects : trashedProjects).filter(p => {
    const matchesFolder = (p.folderId || null) === currentFolderId;
    const matchesSearch = !searchQuery.trim() || 
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.pages || []).some(page => (page.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  const displayedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'updated') {
      return new Date(b.lastModified || b.createdAt || 0).getTime() - new Date(a.lastModified || a.createdAt || 0).getTime();
    }
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    if (sortBy === 'nameAZ') {
      return (a.title || 'Untitled').localeCompare(b.title || 'Untitled', undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'nameZA') {
      return (b.title || 'Untitled').localeCompare(a.title || 'Untitled', undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'pages') {
      const countA = (a.pages?.length || 0) + (a.drafts?.length || 0);
      const countB = (b.pages?.length || 0) + (b.drafts?.length || 0);
      return countB - countA;
    }
    return 0;
  });

  const filteredFolders = (tab === 'active' ? activeFolders : trashedFolders).filter(f => {
    const matchesFolder = (f.parentId || null) === currentFolderId;
    const matchesSearch = !searchQuery.trim() || (f.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const displayedFolders = [...filteredFolders].sort((a, b) => {
    if (sortBy === 'nameAZ') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'nameZA') return (b.name || '').localeCompare(a.name || '');
    return 0;
  });

  return (
    <div 
      className="h-full w-full flex flex-col md:flex-row transition-all duration-500 ease-in-out font-sans relative overflow-hidden" 
      style={{ 
        background: theme.bg, 
        color: theme.text, 
        fontFamily: `'${uiFont}', 'Inter', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif` 
      }}
    >
      {/* Delete Confirmation Modal */}
      {deleteConfirmDialog.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="p-6 rounded-2xl shadow-xl flex flex-col gap-5 animate-fade-in-up" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full text-red-500" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertCircle size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: theme.text }}>{t(lang, 'deleteConfirmTitle')}</h3>
                <p className="text-xs mt-1" style={{ color: theme.textMuted }}>{t(lang, 'deleteConfirmDesc')}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-2">
              <button 
                onClick={() => setDeleteConfirmDialog({ isOpen: false, type: null, id: null, name: '' })}
                className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ color: theme.textMuted,   }}
              >
                {t(lang, 'cancel')}
              </button>
              <button 
                onClick={executeHardDelete}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors hover:bg-red-600 bg-red-500"
              >
                {t(lang, 'confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}


            {/* Move Project Modal */}
      {movingProjectId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setMovingProjectId(null)}>
          <div className="p-5 rounded-2xl shadow-xl flex flex-col gap-4 animate-fade-in-up w-[320px] max-w-full" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-sm" style={{ color: theme.text }}>{t(lang, 'moveToFolder') || 'Move to folder...'}</h3>
            <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto">
              <button
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-colors text-sm"
                style={{ color: theme.text, backgroundColor: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.panel}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => handleMoveProject(null)}
              >
                <Home size={14} style={{ color: theme.textMuted }} />
                <span>{t(lang, 'home') || 'Home'}</span>
              </button>
              {activeFolders.map(folder => (
                <button
                  key={folder.id}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-colors text-sm truncate"
                  style={{ color: theme.text, backgroundColor: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.panel}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handleMoveProject(folder.id)}
                >
                  <FolderOpen size={14} style={{ color: theme.textMuted }} />
                  <span className="truncate">{folder.name || 'Untitled Folder'}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end mt-1">
              <button 
                onClick={() => setMovingProjectId(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ color: theme.textMuted }}
              >
                {t(lang, 'cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation (Responsive: Header bar on mobile, left column on md+) */}
      <div 
        className="w-full md:w-64 flex-shrink-0 flex flex-row md:flex-col pt-4 md:pt-12 px-4 sm:px-6 pb-4 md:pb-6 border-b md:border-b-0 md:border-r items-center md:items-start justify-between md:justify-between gap-3"
        style={{ borderColor: theme.borderFaint, backgroundColor: theme.surface }}
      >
        <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-10 w-full">
          <div className="mb-0 md:mb-0 px-0 md:px-2 flex items-center justify-center md:justify-start w-full">
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl md:text-3xl font-serif tracking-tight" style={{ color: theme.text, fontFamily: `'${uiFont}', Georgia, serif` }}>
                Prose
              </h2>
            </div>
          </div>
          <nav className="flex flex-row md:flex-col gap-2 w-full mt-2">
            <button 
              onClick={() => setTab('active')} 
              className="flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2.5 rounded-full transition-all border"
              style={{ 
                backgroundColor: tab === 'active' ? 'transparent' : 'transparent',
                borderColor: tab === 'active' ? theme.border : 'transparent',
                color: tab === 'active' ? theme.text : theme.textMuted
              }}
              onMouseEnter={e => { if (tab !== 'active') e.currentTarget.style.backgroundColor = theme.panel; }}
              onMouseLeave={e => { if (tab !== 'active') e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Home size={16} strokeWidth={tab === 'active' ? 2 : 1.5} />
              <span className="font-medium text-xs md:text-sm">{t(lang, 'active')}</span>
            </button>
            
            <button 
              onClick={() => setTab('trash')} 
              className="flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2.5 rounded-full transition-all border"
              style={{ 
                backgroundColor: tab === 'trash' ? 'transparent' : 'transparent',
                borderColor: tab === 'trash' ? theme.border : 'transparent',
                color: tab === 'trash' ? theme.text : theme.textMuted
              }}
              onMouseEnter={e => { if (tab !== 'trash') e.currentTarget.style.backgroundColor = theme.panel; }}
              onMouseLeave={e => { if (tab !== 'trash') e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Trash2 size={16} strokeWidth={tab === 'trash' ? 2 : 1.5} />
              <span className="font-medium text-xs md:text-sm">{t(lang, 'trash')}</span>
            </button>
          </nav>
        </div>

        {/* Bottom Area: Theme Settings Button & GitHub Cloud Save */}
        <div className="w-full pt-4 mt-auto border-t flex flex-col gap-2" style={{ borderColor: theme.borderFaint }}>
          {onSelectTheme && (
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="w-full px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.text,
                fontFamily: uiFont,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.backgroundColor = theme.panel; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.backgroundColor = theme.surface; }}
            >
              <Palette size={14} style={{ color: theme.accent }} />
              <span>{t(lang, 'themePresets') || 'Themes'}</span>
            </button>
          )}

          {onOpenGithubCloudSave && (
            <button
              onClick={onOpenGithubCloudSave}
              className="w-full px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.text,
                fontFamily: uiFont,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.backgroundColor = theme.panel; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.backgroundColor = theme.surface; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span>{t(lang, 'cloudSave')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto w-full min-w-0" 
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        onClick={() => { setIsNewMenuOpen(false); setIsDataMenuOpen(false); }}
      >
        {/* Header / Greeting */}
        <div className="w-full max-w-5xl flex flex-col md:flex-row items-start md:items-end justify-between mt-4 mb-10 gap-4 animate-fade-in-up relative z-40">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl md:text-5xl tracking-tight" style={{ color: theme.text, fontFamily: `'${uiFont}', Georgia, serif` }}>
              {timeGreeting},
            </h1>
            <p className="text-lg md:text-xl font-light" style={{ color: theme.textFaint }}>
              {t(lang, 'whatAreWeWriting')}
            </p>
          </div>
          
          {/* Header Right Actions */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {onChangeLang && (
              <div className="flex items-center">
                <CustomSelect
                  value={lang}
                  onChange={(val) => onChangeLang(val)}
                  theme={theme}
                  fontFamily={uiFont}
                  buttonClassName="bg-transparent text-xs outline-none font-medium flex items-center gap-1 border rounded-full px-3 py-1.5 transition-all cursor-pointer"
                  buttonStyle={{ fontFamily: uiFont, borderColor: theme.borderFaint, color: theme.text }}
                  options={LANGUAGES}
                  disableSearch={true}
                />
              </div>
            )}
            {tab === 'active' && (
              <div className="flex items-center gap-2">
               {/* Data (Import/Export) Dropdown */}
               <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsDataMenuOpen(!isDataMenuOpen); setIsNewMenuOpen(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer font-medium text-sm border"
                    style={{ 
                      borderColor: theme.borderFaint,
                      backgroundColor: 'transparent', 
                      color: theme.text 
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.panel; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Upload size={16} strokeWidth={2} />
                    <span className="hidden sm:inline">{t(lang, 'importDocument')}</span>
                  </button>
                  {isDataMenuOpen && (
                    <div 
                      className="absolute top-full right-0 mt-2 w-56 rounded-xl shadow-xl py-2 z-50 animate-fade-in-up flex flex-col"
                      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
                    >
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textFaint }}>
                        Import
                      </div>
                      <button onClick={() => { onImport(); setIsDataMenuOpen(false); }} className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm transition-colors" style={{ color: theme.text }} onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.panel} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Upload size={16} style={{ color: theme.textMuted }} />
                        <span>{t(lang, 'importDocumentBtn')}</span>
                      </button>
                      <button onClick={() => { handleImportBackupJson(); setIsDataMenuOpen(false); }} className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm transition-colors" style={{ color: theme.text }} onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.panel} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <FileJson size={16} className="text-emerald-500" />
                        <span>{t(lang, 'backupImport')}</span>
                      </button>
                      
                      <div className="h-[1px] w-full my-1" style={{ backgroundColor: theme.borderFaint }} />
                      
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textFaint }}>
                        Export
                      </div>
                      <button onClick={() => { onExportAll(); setIsDataMenuOpen(false); }} className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm transition-colors" style={{ color: theme.text }} onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.panel} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Download size={16} style={{ color: theme.textMuted }} />
                        <span>{t(lang, 'exportDocumentsBtn')}</span>
                      </button>
                      <button onClick={() => { handleExportBackupJson(); setIsDataMenuOpen(false); }} className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm transition-colors" style={{ color: theme.text }} onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.panel} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <FileJson size={16} className="text-amber-500" />
                        <span>{t(lang, 'backupExport')}</span>
                      </button>
                    </div>
                  )}
               </div>

               {/* New Button with Dropdown */}
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsNewMenuOpen(!isNewMenuOpen); setIsDataMenuOpen(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer font-medium text-sm border"
                    style={{ 
                      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: theme.text, borderColor: theme.border
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <Plus size={16} strokeWidth={2} />
                    <span>{t(lang, 'new')}</span>
                  </button>
                  {isNewMenuOpen && (
                    <div 
                      className="absolute top-full right-0 mt-2 w-56 rounded-xl shadow-xl py-2 z-50 animate-fade-in-up flex flex-col"
                      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
                    >
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textFaint }}>
                        Documents
                      </div>
                      <button onClick={() => { handleNewProject(); setIsNewMenuOpen(false); }} className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm transition-colors" style={{ color: theme.text }} onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.panel} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <FileText size={16} style={{ color: theme.textMuted }} />
                        <span>{t(lang, 'newDocument').replace('+', '').trim()}</span>
                      </button>
                      
                      <div className="h-[1px] w-full my-1" style={{ backgroundColor: theme.borderFaint }} />
                      
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textFaint }}>
                        Folders
                      </div>
                      <button onClick={() => { handleNewFolder(); setIsNewMenuOpen(false); }} className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm transition-colors" style={{ color: theme.text }} onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.panel} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <FolderOpen size={16} style={{ color: theme.textMuted }} />
                        <span>{t(lang, 'newFolder')}</span>
                      </button>
                    </div>
                  )}
                </div>
            </div>
          )}
        </div>
        </div>

        {/* Quick Actions & Navigation Toolbar */}
        <div className="w-full max-w-5xl flex flex-col gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {/* Row 2: Search input, Sort selector & View Mode Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: theme.borderFaint }}>
            {/* Search Input */}
            <div className="flex-1 min-w-[220px] max-w-md relative flex items-center">
              <Search size={14} className="absolute left-3 pointer-events-none" style={{ color: theme.textFaint }} />
              <input 
                type="text"
                placeholder={t(lang, 'searchProjects')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs border outline-none transition-all"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.borderFaint,
                  color: theme.text,
                }}
                onFocus={(e) => e.target.style.borderColor = theme.accent}
                onBlur={(e) => e.target.style.borderColor = theme.borderFaint}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-xs p-1 rounded-full hover:opacity-80"
                  style={{ color: theme.textMuted }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Sort & View Mode controls */}
            <div className="flex items-center gap-2">
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs" style={{ backgroundColor: theme.surface, borderColor: theme.borderFaint }}>
                <ArrowUpDown size={13} style={{ color: theme.textFaint }} />
                <span className="text-[11px] font-medium hidden sm:inline" style={{ color: theme.textMuted }}>{t(lang, 'sortBy')}:</span>
                <CustomSelect
                  value={sortBy}
                  onChange={(val) => setSortBy(val as SortOption)}
                  theme={theme}
                  buttonClassName="bg-transparent text-xs outline-none font-medium flex items-center gap-1"
                  options={[
                    { value: 'updated', label: t(lang, 'sortUpdated') },
                    { value: 'newest', label: t(lang, 'sortNewest') },
                    { value: 'oldest', label: t(lang, 'sortOldest') },
                    { value: 'nameAZ', label: t(lang, 'sortNameAZ') },
                    { value: 'nameZA', label: t(lang, 'sortNameZA') },
                    { value: 'pages', label: t(lang, 'sortPagesCount') },
                  ]}
                  dropdownClassName="w-48 right-0"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 rounded-xl p-1 border" style={{ backgroundColor: theme.surface, borderColor: theme.borderFaint }}>
                <button 
                  onClick={() => setViewMode('grid')} 
                  className="p-1.5 rounded-lg transition-all cursor-pointer"
                  title={t(lang, 'viewGrid')}
                  style={{ 
                    backgroundColor: viewMode === 'grid' ? theme.bg : 'transparent',
                    color: viewMode === 'grid' ? theme.text : theme.textFaint
                  }}
                >
                  <Grid size={15} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className="p-1.5 rounded-lg transition-all cursor-pointer"
                  title={t(lang, 'viewList')}
                  style={{ 
                    backgroundColor: viewMode === 'list' ? theme.bg : 'transparent',
                    color: viewMode === 'list' ? theme.text : theme.textFaint
                  }}
                >
                  <List size={15} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Breadcrumbs */}
        {tab === 'active' && currentFolderId !== null && (
          <div className="w-full max-w-5xl mb-4 flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
            <button 
              onClick={() => setCurrentFolderId(null)} 
              className={`hover:underline px-2 py-1 -ml-2 rounded transition-colors ${dragOverFolderId === 'root' ? 'bg-black/10 dark:bg-white/10' : ''}`}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId('root'); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(null); }}
              onDrop={(e) => {
                e.preventDefault(); e.stopPropagation(); setDragOverFolderId(null);
                if (dragProjectId) handleMoveProject(null, dragProjectId);
              }}
            >
              {t(lang, 'home')}
            </button>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={b.id}>
                <span>/</span>
                <button 
                  onClick={() => setCurrentFolderId(b.id)}
                  className={`hover:underline ${i === breadcrumbs.length - 1 ? 'font-medium' : ''}`}
                  style={{ color: i === breadcrumbs.length - 1 ? theme.text : theme.textMuted }}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
        {tab === 'trash' && (trashedProjects.length > 0 || trashedFolders.length > 0) && (
          <div className="w-full max-w-5xl mb-4 flex items-center justify-between p-3 rounded-xl border animate-fade-in-up" style={{ backgroundColor: theme.surface, borderColor: theme.borderFaint }}>
            <span className="text-xs font-medium" style={{ color: theme.textMuted }}>
              {t(lang, 'deletedItems')} ({trashedProjects.length + trashedFolders.length})
            </span>
            <button
              onClick={handleEmptyAllTrash}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer transition-all"
              style={{ borderColor: theme.borderFaint }}
            >
              <Trash2 size={13} />
              <span>{t(lang, 'emptyBin')}</span>
            </button>
          </div>
        )}

        {/* Projects / Files Grid */}
        <div className="w-full max-w-5xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {displayedProjects.length === 0 && displayedFolders.length === 0 ? (
            <div 
              className="w-full py-24 flex flex-col items-center justify-center border border-dashed rounded-2xl"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <FileText size={32} className="mb-4" strokeWidth={1.5} style={{ color: theme.textFaint }} />
              <p className="font-light text-sm" style={{ color: theme.textMuted }}>
                {tab === 'active' ? t(lang, 'noProjectsFound') : t(lang, 'trashIsEmpty')}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4' : 'flex flex-col gap-2'}>
              
              {/* Render Folders First */}
              {displayedFolders.map((folder) => {
                if (viewMode === 'grid') {
                  return (
                    <div 
                      key={folder.id}
                      onClick={() => tab === 'active' && setCurrentFolderId(folder.id)}
                      className={`group relative w-full h-[140px] pt-[16px] transition-all ${tab === 'active' ? 'cursor-pointer hover:-translate-y-1' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(folder.id); }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(null); }}
                      onDrop={(e) => {
                        e.preventDefault(); e.stopPropagation(); setDragOverFolderId(null);
                        if (dragProjectId) handleMoveProject(folder.id, dragProjectId);
                      }}
                      onMouseEnter={(e) => {
                        const bgEls = e.currentTarget.querySelectorAll('.folder-bg');
                        bgEls.forEach(el => (el as HTMLElement).style.borderColor = theme.border);
                      }}
                      onMouseLeave={(e) => {
                        const bgEls = e.currentTarget.querySelectorAll('.folder-bg');
                        bgEls.forEach(el => (el as HTMLElement).style.borderColor = theme.borderFaint);
                      }}
                    >
                      {/* Folder Tab Shape */}
                      <div 
                        className="folder-bg absolute top-0 left-0 w-[45%] h-[17px] rounded-tl-2xl rounded-tr-lg border-t border-l border-r transition-colors"
                        style={{ backgroundColor: theme.surface, borderColor: theme.borderFaint }}
                      />
                      {/* Folder Body Shape */}
                      <div 
                        className="folder-bg absolute top-[16px] left-0 right-0 bottom-0 rounded-b-2xl rounded-tr-2xl border transition-colors shadow-sm"
                        style={{ backgroundColor: theme.surface, borderColor: dragOverFolderId === folder.id ? theme.accent : theme.borderFaint, borderTopLeftRadius: 0, borderWidth: dragOverFolderId === folder.id ? 2 : 1 }}
                      />
                      {/* Mask Line */}
                      <div 
                        className="absolute top-[16px] left-[1px] h-[2px] z-10"
                        style={{ width: 'calc(45% - 2px)', backgroundColor: theme.surface }}
                      />

                      {/* Content */}
                      <div className="relative z-20 w-full h-full p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-4">
                            {editingFolderId === folder.id && tab === 'active' ? (
                              <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="text" 
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-transparent border-b outline-none px-1 py-0.5 text-xl font-serif"
                                  style={{ borderColor: theme.accent, color: theme.text, fontFamily: `'${uiFont}', Georgia, serif` }}
                                  autoFocus
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEditFolder(folder, e as unknown as React.MouseEvent)}
                                />
                                <button onClick={(e) => handleSaveEditFolder(folder, e)} className="p-1 rounded text-green-500 hover:bg-green-500/10 transition-colors cursor-pointer"><Check size={14}/></button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(null); }} className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"><X size={14}/></button>
                              </div>
                            ) : (
                              <h3 className="text-xl font-medium tracking-wide truncate" style={{ color: theme.text, fontFamily: `'${uiFont}', Georgia, serif` }}>
                                {folder.name || 'Untitled Folder'}
                              </h3>
                            )}
                          </div>
                          {/* Actions (Always visible) */}
                          <div className="flex-shrink-0 flex items-center gap-1 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            {tab === 'active' ? (
                              <>
                                <button onClick={(e) => handleStartEditFolder(folder.id, folder.name, e)} className="p-1.5 rounded-md hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.textMuted }} title="Rename">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={(e) => handleSoftDeleteFolder(folder, e)} className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title={t(lang, 'moveToTrash')}>
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={(e) => handleRestoreFolder(folder, e)} className="p-1.5 rounded-md hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.textMuted }} title="Restore">
                                  <RotateCcw size={14} />
                                </button>
                                <button onClick={(e) => promptHardDelete('folder', folder.id, folder.name, e)} className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title={t(lang, 'deleteForever')}>
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[0.7rem] font-light" style={{ color: theme.textMuted }}>
                          <Clock size={12} strokeWidth={1.5} />
                          <span>{folder.created_at ? Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(folder.created_at)) : t(lang, 'recently') || 'Recently'}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={folder.id}
                  onClick={() => tab === 'active' && setCurrentFolderId(folder.id)}
                  className={`group relative flex flex-col justify-center px-4 py-3 rounded-md border transition-colors ${tab === 'active' ? 'cursor-pointer hover:-translate-y-0.5 shadow-sm' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(folder.id); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(null); }}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation(); setDragOverFolderId(null);
                    if (dragProjectId) handleMoveProject(folder.id, dragProjectId);
                  }}
                  style={{ 
                    backgroundColor: 'transparent',
                    borderColor: dragOverFolderId === folder.id ? theme.accent : theme.borderFaint
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.surface;
                    e.currentTarget.style.borderColor = theme.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = theme.borderFaint;
                  }}
                >
                  <div className="flex items-center space-x-2 w-full pr-24">
                    <div className="flex-shrink-0" style={{ color: theme.textMuted }}>
                      <FolderOpen size={16} strokeWidth={1.5} />
                    </div>

                    <div className="flex-1 min-w-0 flex items-center">
                      {editingFolderId === folder.id && tab === 'active' ? (
                        <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-transparent border-b outline-none px-1 py-0.5 text-sm font-medium"
                            style={{ borderColor: theme.accent, color: theme.text }}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditFolder(folder, e as unknown as React.MouseEvent)}
                          />
                          <button onClick={(e) => handleSaveEditFolder(folder, e)} className="p-1 rounded text-green-500 hover:bg-green-500/10 transition-colors cursor-pointer"><Check size={14}/></button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(null); }} className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"><X size={14}/></button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-medium tracking-wide truncate" style={{ color: theme.text }}>
                          {folder.name || 'Untitled Folder'}
                        </h3>
                      )}
                    </div>
                  </div>

                  {/* Actions (Always visible) */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {tab === 'active' ? (
                      <>
                        <button onClick={(e) => handleStartEditFolder(folder.id, folder.name, e)} className="p-1.5 rounded-md hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.textMuted }} title={t(lang, 'rename')}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={(e) => handleSoftDeleteFolder(folder, e)} className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title={t(lang, 'moveToTrash')}>
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={(e) => handleRestoreFolder(folder, e)} className="p-1.5 rounded-md hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.textMuted }} title={t(lang, 'restore')}>
                          <RotateCcw size={13} />
                        </button>
                        <button onClick={(e) => promptHardDelete('folder', folder.id, folder.name, e)} className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title={t(lang, 'deleteForever')}>
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                );
              })}

              {/* Render Projects */}
              {displayedProjects.map((project) => (
                <div 
                  key={project.id}
                  draggable={tab === 'active'}
                  onDragStart={(e) => { e.stopPropagation(); setDragProjectId(project.id); }}
                  onDragEnd={(e) => { e.stopPropagation(); setDragProjectId(null); setDragOverFolderId(null); }}
                  onClick={() => tab === 'active' && onOpenProject(project.id)}
                  className={`group relative flex flex-col justify-center px-4 py-3 rounded-md border transition-colors ${tab === 'active' ? 'cursor-pointer hover:-translate-y-0.5 shadow-sm' : ''} ${dragProjectId === project.id ? 'opacity-50' : ''}`}
                  style={{ 
                    backgroundColor: 'transparent',
                    borderColor: theme.borderFaint
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.surface;
                    e.currentTarget.style.borderColor = theme.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = theme.borderFaint;
                  }}
                >
                  {/* Single Stream Line: Icon + Title */}
                  <div className="flex items-center space-x-2 w-full pr-24">
                    <div className="flex-shrink-0" style={{ color: theme.textFaint }}>
                      <FileText size={14} strokeWidth={1.5} />
                    </div>

                    <div className="flex-1 min-w-0 flex items-center">
                      {editingProjectId === project.id && tab === 'active' ? (
                        <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-transparent border-b outline-none px-1 py-0.5 text-sm font-medium"
                            style={{ borderColor: theme.accent, color: theme.text }}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditProject(project, e as unknown as React.MouseEvent)}
                          />
                          <button onClick={(e) => handleSaveEditProject(project, e)} className="p-1 rounded text-green-500 hover:bg-green-500/10 transition-colors cursor-pointer"><Check size={14}/></button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingProjectId(null); }} className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"><X size={14}/></button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-medium tracking-wide truncate" style={{ color: theme.text }}>
                          {project.title || t(lang, 'untitledProject')}
                        </h3>
                      )}
                    </div>
                  </div>

                  {/* Sub-Metadata Line */}
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-light tracking-wider uppercase ml-6" style={{ color: theme.textFaint }}>
                    <span>{project.pages.length} {project.pages.length === 1 ? t(lang, 'pageSingular') : t(lang, 'pagePlural')}</span>
                    <span>•</span>
                    <span>{Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(project.lastModified || project.createdAt || Date.now()))}</span>
                  </div>



                  {/* Actions (Always visible) */}
                  <div className="absolute top-3 right-3 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {tab === 'active' ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setMovingProjectId(project.id); }} className="p-1.5 rounded-md hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.textMuted }} title={t(lang, 'moveToFolder') || 'Move to Folder'}>
                          <FolderInput size={13} />
                        </button>
                        <button onClick={(e) => handleStartEditProject(project.id, project.title, e)} className="p-1.5 rounded-md hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.textMuted }} title={t(lang, 'rename')}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={(e) => handleSoftDeleteProject(project, e)} className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title={t(lang, 'moveToTrash')}>
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={(e) => handleRestoreProject(project, e)} className="p-1.5 rounded-md hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.textMuted }} title={t(lang, 'restore')}>
                          <RotateCcw size={13} />
                        </button>
                        <button onClick={(e) => promptHardDelete('project', project.id, project.title, e)} className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title={t(lang, 'deleteForever')}>
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div 
          className="fixed right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2 animate-fade-in-up"
          style={{ 
            bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
            backgroundColor: toastMsg.type === 'success' ? (theme.isDark ? '#064e3b' : '#ecfdf5') : (theme.isDark ? '#7f1d1d' : '#fef2f2'),
            borderColor: toastMsg.type === 'success' ? '#10b981' : '#ef4444',
            color: toastMsg.type === 'success' ? (theme.isDark ? '#a7f3d0' : '#065f46') : (theme.isDark ? '#fecaca' : '#991b1b')
          }}
        >
          {toastMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 hover:opacity-75"><X size={14} /></button>
        </div>
      )}

      {/* Theme Modal Popup */}
      {isThemeModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setIsThemeModalOpen(false)}>
          <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.borderFaint }}>
              <div>
                <h2 className="text-xl font-serif" style={{ color: theme.text, fontFamily: `'${uiFont}', Georgia, serif` }}>
                  {t(lang, 'themePresets') || 'Themes'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: theme.textFaint }}>
                  {t(lang, 'customizeWritingExperience') || 'Customize your writing experience and color palette.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-48 sm:w-64">
                  <Search size={14} className="absolute left-3 top-2.5" style={{ color: theme.textFaint }} />
                  <input
                    type="text"
                    placeholder={t(lang, 'searchThemes') || 'Search for themes...'}
                    value={themeSearchQuery}
                    onChange={e => setThemeSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 rounded-lg text-xs border outline-none"
                    style={{ 
                      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', 
                      borderColor: theme.border, 
                      color: theme.text,
                      fontFamily: uiFont
                    }}
                  />
                  {themeSearchQuery && (
                    <button onClick={() => setThemeSearchQuery('')} className="absolute right-2.5 top-2.5 text-xs" style={{ color: theme.textMuted }}>
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setIsThemeModalOpen(false)}
                  className="p-1.5 rounded-lg hover:opacity-80 transition-colors cursor-pointer"
                  style={{ color: theme.textMuted }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Categories + Theme Grid */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Sidebar categories */}
              <div className="w-full md:w-56 p-4 border-r overflow-y-auto flex md:flex-col gap-1.5 flex-shrink-0" style={{ borderColor: theme.borderFaint, backgroundColor: theme.bg }}>
                <button
                  onClick={() => setThemeCategoryFilter('all')}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left cursor-pointer"
                  style={{
                    backgroundColor: themeCategoryFilter === 'all' ? theme.accentLight : 'transparent',
                    color: themeCategoryFilter === 'all' ? theme.accent : theme.text,
                    fontWeight: themeCategoryFilter === 'all' ? 600 : 400,
                    fontFamily: uiFont,
                    border: `1px solid ${themeCategoryFilter === 'all' ? theme.accent : theme.borderFaint}`
                  }}
                >
                  <span>All themes</span>
                  <span className="text-[10px] opacity-70 font-mono">{PRESETS.length}</span>
                </button>
                {THEME_CATEGORIES.map(cat => {
                  const count = PRESETS.filter(p => cat.presetNames.includes(p.name)).length;
                  const isActive = themeCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setThemeCategoryFilter(cat.id)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left truncate cursor-pointer"
                      style={{
                        backgroundColor: isActive ? theme.accentLight : 'transparent',
                        color: isActive ? theme.accent : theme.text,
                        fontWeight: isActive ? 600 : 400,
                        fontFamily: uiFont,
                        border: `1px solid ${isActive ? theme.accent : theme.borderFaint}`
                      }}
                    >
                      <span className="truncate mr-2">{cat.label}</span>
                      <span className="text-[10px] opacity-70 font-mono flex-shrink-0">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Theme Grid */}
              <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ backgroundColor: theme.surface }}>
                {PRESETS.filter(preset => {
                  const matchesCategory = themeCategoryFilter === 'all' || 
                    THEME_CATEGORIES.find(c => c.id === themeCategoryFilter)?.presetNames.includes(preset.name);
                  const matchesSearch = !themeSearchQuery.trim() || preset.name.toLowerCase().includes(themeSearchQuery.toLowerCase());
                  return matchesCategory && matchesSearch;
                }).map(preset => {
                  const isActive = themeMode === preset.name;
                  return (
                    <div
                      key={preset.name}
                      onClick={() => {
                        if (onSelectTheme) onSelectTheme(preset.name);
                      }}
                      className="group relative p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5 shadow-xs"
                      style={{
                        backgroundColor: isActive ? theme.accentLight : theme.bg,
                        borderColor: isActive ? theme.accent : theme.border,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          {[preset.bg, preset.accent, preset.surface].map((clr, i) => (
                            <div key={i} className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: clr }} />
                          ))}
                        </div>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: theme.accent }}>
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold tracking-wide truncate" style={{ color: theme.text, fontFamily: uiFont }}>
                          {preset.name}
                        </span>
                        <span className="text-[10px] mt-0.5" style={{ color: theme.textFaint }}>
                          {preset.isDark ? 'Dark Theme' : 'Light Theme'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(WelcomeScreen);
