import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, FolderOpen, FolderInput, Download, Upload, Grid, List, Trash2, Edit2, Check, X, RotateCcw, Home, AlertCircle, PaintRoller, Github, ChevronRight, ChevronLeft, Archive, ArchiveRestore } from 'lucide-react';

import { Project, ThemeColors, Folder } from './types';
import { db, getAllProjectsFromDB, saveProjectToDB, deleteProjectFromDB, getAllFoldersFromDB, saveFolderToDB } from './db';
import { exportToJsonBackup, importJsonBackupFile } from './fileHandlers';
import { Lang, t, LANG_LABELS } from './i18n';
import { CustomSelect } from './CustomSelect';

interface WelcomeScreenProps {
  theme: ThemeColors;
  themeMode?: string;
  onSelectTheme?: (themeId: string) => void;
  onOpenThemeModal?: () => void;
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
  initialFolderId?: string | null;
  onFolderChange?: (folderId: string | null) => void;
}

const LANGUAGES: {value: Lang, label: string}[] = (Object.keys(LANG_LABELS) as Lang[]).map(key => ({
  value: key,
  label: LANG_LABELS[key]
}));

type SortOption = 'lastOpened' | 'updated' | 'newest' | 'oldest' | 'nameAZ' | 'nameZA' | 'pages';

interface FolderCardShapeProps {
  isHovered: boolean;
  isDragOver: boolean;
  accent: string;
  folderBg: string;
  folderBorder: string;
  folderHoverBg: string;
  folderHoverBorder: string;
}

const FolderCardShape: React.FC<FolderCardShapeProps> = ({
  isHovered,
  isDragOver,
  accent,
  folderBg,
  folderBorder,
  folderHoverBg,
  folderHoverBorder,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(320);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const tabWidth = Math.min(135, Math.max(105, width * 0.42));
  const r = 14;
  const tabH = 18;
  const h = 140;

  // Mathematically continuous single SVG path:
  // 1. Top-left of tab (0, 0) rounded with arc
  // 2. Tab top horizontal
  // 3. Smooth slope into shoulder
  // 4. Shoulder horizontal
  // 5. Top-right of body rounded
  // 6. Right edge & bottom rounded corners
  // 7. Left edge up to tab
  const pathD = `
    M 0 ${tabH + r}
    L 0 ${r}
    A ${r} ${r} 0 0 1 ${r} 0
    L ${tabWidth - 10} 0
    Q ${tabWidth} 0 ${tabWidth + 4} 6
    L ${tabWidth + 10} ${tabH - 4}
    Q ${tabWidth + 14} ${tabH} ${tabWidth + 22} ${tabH}
    L ${width - r} ${tabH}
    A ${r} ${r} 0 0 1 ${width} ${tabH + r}
    L ${width} ${h - r}
    A ${r} ${r} 0 0 1 ${width - r} ${h}
    L ${r} ${h}
    A ${r} ${r} 0 0 1 0 ${h - r}
    Z
  `;

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none">
      <svg width={width} height={h} className="w-full h-full overflow-visible">
        <path
          d={pathD}
          fill={isHovered ? folderHoverBg : folderBg}
          stroke={isDragOver ? accent : (isHovered ? folderHoverBorder : folderBorder)}
          strokeWidth={isDragOver ? 2 : 1}
          strokeLinejoin="round"
          className="transition-colors duration-150"
        />
      </svg>
    </div>
  );
};

function WelcomeScreen({ theme, onSelectTheme, onOpenThemeModal, uiFont, lang = 'vi', onChangeLang, onOpenProject, onImport, onExportAll, onOpenGithubCloudSave, onEmptyAllTrash, onReloadProjects, refreshTrigger, initialFolderId, onFolderChange }: WelcomeScreenProps) {
    
  const [projects, setProjects] = useState<Project[]>([]);
  const activeProjects = projects.filter(p => !p.isDeleted && !p.isArchived);
  const archivedProjects = projects.filter(p => !p.isDeleted && p.isArchived);
  const trashedProjects = projects.filter(p => p.isDeleted);
  const [folders, setFolders] = useState<Folder[]>([]);
  const activeFolders = folders.filter(f => !f.isDeleted && !f.isArchived);
  const archivedFolders = folders.filter(f => !f.isDeleted && f.isArchived);
  const trashedFolders = folders.filter(f => f.isDeleted);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      return (localStorage.getItem('kgv-file-view-mode') as 'grid' | 'list') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('kgv-file-view-mode', mode);
    } catch (e) {
      console.warn('Could not save view mode preference:', e);
    }
  };
  const [searchQuery] = useState('');
  const [tab, setTab] = useState<'active' | 'archive' | 'trash'>('active');
  const [timeGreeting, setTimeGreeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t(lang, 'goodMorning') || 'Good morning';
    if (hour < 18) return t(lang, 'goodAfternoon') || 'Good afternoon';
    return t(lang, 'goodEvening') || 'Good evening';
  });
  
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
  const [dragProjectId, setDragProjectId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'root'>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId ?? null);

  useEffect(() => {
    if (initialFolderId !== undefined) {
      setCurrentFolderId(initialFolderId);
    }
  }, [initialFolderId]);

  const handleSelectFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    if (onFolderChange) {
      onFolderChange(folderId);
    }
  }, [onFolderChange]);

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    try {
      return (localStorage.getItem('kgv-file-sort-by') as SortOption) || 'lastOpened';
    } catch {
      return 'lastOpened';
    }
  });

  const handleSetSortBy = (val: SortOption) => {
    setSortBy(val);
    try {
      localStorage.setItem('kgv-file-sort-by', val);
    } catch (e) {
      console.warn('Could not save sort by preference:', e);
    }
  };
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; type: 'project' | 'folder' | null; id: string | null; name: string }>({
    isOpen: false,
    type: null,
    id: null,
    name: ''
  });



  const folderHoverBg = useMemo(() => {
    if (theme.accent.startsWith('#')) {
      return theme.isDark ? `${theme.accent}24` : `${theme.accent}1c`;
    }
    return theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)';
  }, [theme.accent, theme.isDark]);

  const fileBg = useMemo(() => {
    if (theme.accent.startsWith('#')) {
      return theme.isDark ? `${theme.accent}10` : `${theme.accent}0a`;
    }
    return theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  }, [theme.accent, theme.isDark]);

  const fileHoverBg = useMemo(() => {
    if (theme.accent.startsWith('#')) {
      return theme.isDark ? `${theme.accent}20` : `${theme.accent}16`;
    }
    return theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  }, [theme.accent, theme.isDark]);

  const fileBorder = useMemo(() => {
    if (theme.accent.startsWith('#')) {
      return `${theme.accent}2e`;
    }
    return theme.accentMid || (theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)');
  }, [theme.accent, theme.accentMid, theme.isDark]);

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
    setToastMsg({ text: t(lang, 'projectMoved') || 'Project moved successfully', type: 'success' });
  };

  const handleArchiveProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    await saveProjectToDB({ 
      ...project, 
      isArchived: true, 
      archivedAt: new Date().toISOString() 
    });
    await loadData();
    if (onReloadProjects) onReloadProjects();
    setToastMsg({ text: t(lang, 'itemArchived') || 'Project moved to archive', type: 'success' });
  };

  const handleUnarchiveProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    await saveProjectToDB({ 
      ...project, 
      isArchived: false, 
      archivedAt: null 
    });
    await loadData();
    if (onReloadProjects) onReloadProjects();
    setToastMsg({ text: t(lang, 'itemUnarchived') || 'Project restored from archive', type: 'success' });
  };

  const handleArchiveFolder = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    await saveFolderToDB({
      ...folder,
      isArchived: true,
      archivedAt: new Date().toISOString()
    });
    await loadData();
    setToastMsg({ text: t(lang, 'itemArchived') || 'Folder moved to archive', type: 'success' });
  };

  const handleUnarchiveFolder = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    await saveFolderToDB({
      ...folder,
      isArchived: false,
      archivedAt: null
    });
    await loadData();
    setToastMsg({ text: t(lang, 'itemUnarchived') || 'Folder restored from archive', type: 'success' });
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
      created_at: Date.now(),
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
          const { projects: importedProjects, folders: importedFolders } = await importJsonBackupFile(file);
          if (importedProjects && importedProjects.length > 0) {
            for (const proj of importedProjects) {
              await saveProjectToDB(proj);
            }
          }
          if (importedFolders && importedFolders.length > 0) {
            for (const folder of importedFolders) {
              await saveFolderToDB(folder);
            }
          }
          await loadData();
          if (onReloadProjects) {
            await onReloadProjects();
          }
          setToastMsg({ text: t(lang, 'backupSuccess'), type: 'success' });
        } catch (err) {
          console.error('Import backup error:', err);
          setToastMsg({ text: t(lang, 'backupError'), type: 'error' });
        }
      }
    };
    input.click();
  };

  const targetProjectList = tab === 'active' ? activeProjects : tab === 'archive' ? archivedProjects : trashedProjects;
  const filteredProjects = targetProjectList.filter(p => {
    const matchesFolder = tab === 'active' ? (p.folderId || null) === currentFolderId : true;
    const matchesSearch = !searchQuery.trim() || 
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.pages || []).some(page => (page.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  const displayedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'lastOpened') {
      const aTime = new Date(a.lastOpened || a.lastModified || a.createdAt || 0).getTime();
      const bTime = new Date(b.lastOpened || b.lastModified || b.createdAt || 0).getTime();
      return bTime - aTime;
    }
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

  const targetFolderList = tab === 'active' ? activeFolders : tab === 'archive' ? archivedFolders : trashedFolders;
  const filteredFolders = targetFolderList.filter(f => {
    const matchesFolder = tab === 'active' ? (f.parentId || null) === currentFolderId : true;
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
              <div className="p-2 rounded-full" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: theme.textMuted }}>
                <AlertCircle size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-bold">{t(lang, 'confirmDelete')}</h3>
                <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                  {deleteConfirmDialog.type === 'folder' 
                    ? t(lang, 'confirmDeleteFolderMsg')?.replace('{name}', deleteConfirmDialog.name)
                    : t(lang, 'confirmDeleteProjectMsg')?.replace('{name}', deleteConfirmDialog.name)}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setDeleteConfirmDialog({ isOpen: false, type: null, id: null, name: '' })} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-neutral-500/10 cursor-pointer">
                {t(lang, 'cancel')}
              </button>
              <button onClick={executeHardDelete} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm cursor-pointer">
                {t(lang, 'delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-fade-in-up text-sm font-medium" style={{ backgroundColor: theme.isDark ? '#333' : '#fff', color: theme.text, border: `1px solid ${theme.border}` }}>
          {toastMsg.type === 'success' ? <Check size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-red-500" />}
          {toastMsg.text}
        </div>
      )}

      {/* SIDEBAR - Redesigned */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col px-8 py-12 md:py-16">
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl tracking-tight" style={{ color: theme.text, fontFamily: `'${uiFont}', sans-serif` }}>
            dotter
          </h1>
        </div>

        <nav className="flex flex-col gap-6">
          <button 
            onClick={() => setTab('active')} 
            className={`text-left text-lg flex items-center gap-2 transition-all cursor-pointer ${tab === 'active' ? 'font-medium opacity-100' : 'font-light opacity-70 hover:opacity-100'}`}
            style={{ color: theme.text }}
          >
            {t(lang, 'files') || 'Files'}
          </button>
          
          <button 
            onClick={() => setTab('archive')} 
            className={`text-left text-lg flex items-center gap-2 transition-all cursor-pointer ${tab === 'archive' ? 'font-medium opacity-100' : 'font-light opacity-70 hover:opacity-100'}`}
            style={{ color: theme.text }}
          >
            {t(lang, 'archive') || 'Archive'}
          </button>
          
          <button 
            onClick={() => setTab('trash')} 
            className={`text-left text-lg flex items-center gap-2 transition-all cursor-pointer ${tab === 'trash' ? 'font-medium opacity-100' : 'font-light opacity-70 hover:opacity-100'}`}
            style={{ color: theme.text }}
          >
            {t(lang, 'trash') || 'Trash'}
          </button>
        </nav>

        {/* Bottom Sidebar Actions */}
        <div className="mt-auto pt-8 flex items-center gap-4">
          {onOpenThemeModal && (
            <button 
              onClick={onOpenThemeModal} 
              className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer" 
              style={{ color: theme.text }}
              title={t(lang, 'theme') || 'Theme'}
            >
              <PaintRoller size={24} strokeWidth={1.5} />
            </button>
          )}
          {onOpenGithubCloudSave && (
            <button 
              onClick={onOpenGithubCloudSave} 
              className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer" 
              style={{ color: theme.text }}
              title="GitHub Sync"
            >
              <Github size={24} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 md:px-12 py-10 md:py-16 overflow-y-auto">
        
        {/* Header Greeting */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl mb-3" style={{ color: theme.text, fontFamily: `'${uiFont}', sans-serif` }}>
            {timeGreeting},
          </h2>
          <h2 className="text-4xl md:text-5xl" style={{ color: theme.text, fontFamily: `'${uiFont}', sans-serif` }}>
            {t(lang, 'whatAreWeWriting') || t(lang, 'tagline') || 'What are we writing today?'}
          </h2>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8 text-[15px]">
          <div className="flex flex-wrap items-center gap-8">
            
            {/* Create Menu */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsNewMenuOpen(!isNewMenuOpen); setIsDataMenuOpen(false); }}
                className="flex items-center gap-1 font-medium hover:opacity-70 transition-opacity cursor-pointer"
                style={{ color: theme.text }}
              >
                {t(lang, 'createMenu') || 'Create'} <ChevronRight size={14} className={`transform transition-transform ${isNewMenuOpen ? 'rotate-90' : 'rotate-90'}`} />
              </button>
              
              {isNewMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-2xl shadow-xl border overflow-hidden z-20 animate-fade-in-up" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.borderFaint}` }}>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button onClick={() => { handleNewProject(); setIsNewMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.text }}>
                      <FileText size={16} className="opacity-70" /> {t(lang, 'newProject')}
                    </button>
                    {tab === 'active' && (
                      <button onClick={() => { handleNewFolder(); setIsNewMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.text }}>
                        <FolderInput size={16} className="opacity-70" /> {t(lang, 'newFolder')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* File Menu */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsDataMenuOpen(!isDataMenuOpen); setIsNewMenuOpen(false); }}
                className="flex items-center gap-1 font-medium hover:opacity-70 transition-opacity cursor-pointer"
                style={{ color: theme.text }}
              >
                {t(lang, 'fileMenu') || 'File'} <ChevronRight size={14} className={`transform transition-transform ${isDataMenuOpen ? 'rotate-90' : 'rotate-90'}`} />
              </button>
              
              {isDataMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl shadow-xl border overflow-hidden z-20 animate-fade-in-up" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.borderFaint}` }}>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button onClick={() => { handleImportBackupJson(); setIsDataMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.text }}>
                      <Upload size={16} className="opacity-70" /> {t(lang, 'backupImport')}
                    </button>
                    <button onClick={() => { handleExportBackupJson(); setIsDataMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-500/10 transition-colors cursor-pointer" style={{ color: theme.text }}>
                      <Download size={16} className="opacity-70" /> {t(lang, 'backupExport')}
                    </button>
                    {onEmptyAllTrash && tab === 'trash' && trashedProjects.length + trashedFolders.length > 0 && (
                      <>
                        <div className="h-px w-full my-1" style={{ backgroundColor: theme.borderFaint }}></div>
                        <button onClick={() => { handleEmptyAllTrash(); setIsDataMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer">
                          <Trash2 size={16} /> {t(lang, 'emptyBin')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Breadcrumbs */}
            {currentFolderId && tab === 'active' && (
              <div className="flex items-center gap-2 font-medium" style={{ color: theme.text }}>
                <span className="opacity-30">|</span>
                <button onClick={() => handleSelectFolder(null)} className="hover:opacity-70 transition-opacity cursor-pointer">{t(lang, 'home') || 'Home'}</button>
                <ChevronLeft size={14} className="opacity-50" />
                <span>{breadcrumbs[breadcrumbs.length - 1]?.name || t(lang, 'folderLabel') || 'Folder'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Language */}
            {onChangeLang && (
              <CustomSelect
                value={lang}
                onChange={(val) => onChangeLang(val)}
                theme={theme}
                fontFamily={uiFont}
                buttonClassName="bg-transparent outline-none cursor-pointer p-0 m-0 border-none"
                buttonStyle={{ fontFamily: uiFont, color: theme.text }}
                options={LANGUAGES}
                disableSearch={true}
                renderButtonContent={() => (
                  <div className="flex items-center gap-1 font-medium hover:opacity-70 transition-opacity text-[15px]">
                    {t(lang, 'language') || 'Language'} <ChevronRight size={14} className="rotate-90" />
                  </div>
                )}
              />
            )}
            
            {/* Sort */}
            <CustomSelect
              value={sortBy}
              onChange={(val) => handleSetSortBy(val as SortOption)}
              theme={theme}
              disableSearch={true}
              fontFamily={uiFont}
              buttonClassName="bg-transparent outline-none cursor-pointer p-0 m-0 border-none"
              buttonStyle={{ fontFamily: uiFont, color: theme.text }}
              options={[
                { value: 'lastOpened', label: t(lang, 'sortLastOpened') || 'Last Opened' },
                { value: 'updated', label: t(lang, 'sortUpdated') || 'Recently Updated' },
                { value: 'newest', label: t(lang, 'sortNewest') || 'Newest' },
                { value: 'oldest', label: t(lang, 'sortOldest') || 'Oldest' },
                { value: 'nameAZ', label: t(lang, 'sortNameAZ') || 'Name (A-Z)' },
                { value: 'nameZA', label: t(lang, 'sortNameZA') || 'Name (Z-A)' },
                { value: 'pages', label: t(lang, 'sortPages') || 'Pages' }
              ]}
              renderButtonContent={() => (
                <div className="flex items-center gap-1 font-medium hover:opacity-70 transition-opacity text-[15px]">
                  {t(lang, 'sortBy') || 'Sort by'} <ChevronRight size={14} className="rotate-90" />
                </div>
              )}
            />

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 opacity-70">
              <button 
                onClick={() => handleSetViewMode('grid')}
                className={`p-1 rounded cursor-pointer transition-colors ${viewMode === 'grid' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                style={{ color: theme.text }}
                title={t(lang, 'gridView') || 'Grid view'}
              >
                <Grid size={18} strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => handleSetViewMode('list')}
                className={`p-1 rounded cursor-pointer transition-colors ${viewMode === 'list' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                style={{ color: theme.text }}
                title={t(lang, 'listView') || 'List view'}
              >
                <List size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar - only show if there are many items or if already searching, or we can just hide it completely to match the UI. 
            The UI has no search bar. I will hide it to strictly match the image. */}
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar">
          {displayedFolders.length === 0 && displayedProjects.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-40" style={{ color: theme.textMuted }}>
               <div className="text-xl" style={{ fontFamily: `'${uiFont}', sans-serif` }}>{t(lang, 'emptyStateTitle') || "It's quiet here..."}</div>
               <div className="text-sm mt-2 font-light">{t(lang, 'emptyStateSubtitle') || 'Create a new project to get started.'}</div>
             </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* Folders */}
              {displayedFolders.map(folder => {
                const folderFileCount = activeProjects.filter(p => (p.folderId || null) === folder.id).length;
                return (
                  <div 
                    key={folder.id}
                    draggable={tab === 'active'}
                    onDragStart={(e) => {
                      if (tab === 'active') {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folder.id }));
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragProjectId) setDragOverFolderId(folder.id);
                    }}
                    onDragLeave={(e) => { e.preventDefault(); setDragOverFolderId(null); }}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOverFolderId(null);
                      if (dragProjectId) handleMoveProject(folder.id, dragProjectId);
                    }}
                    onClick={() => tab === 'active' && handleSelectFolder(folder.id)}
                    className="group relative h-36 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between p-4 sm:p-5 select-none"
                    style={{
                      backgroundColor: dragOverFolderId === folder.id ? folderHoverBg : fileBg,
                      borderColor: dragOverFolderId === folder.id ? theme.accent : fileBorder
                    }}
                    onMouseEnter={(e) => {
                      if (dragOverFolderId !== folder.id) e.currentTarget.style.backgroundColor = fileHoverBg;
                    }}
                    onMouseLeave={(e) => {
                      if (dragOverFolderId !== folder.id) e.currentTarget.style.backgroundColor = fileBg;
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      {editingFolderId === folder.id && tab === 'active' ? (
                        <div className="flex items-center gap-2 w-full z-10" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-transparent border-b outline-none px-1 text-base font-medium"
                            style={{ borderColor: theme.accent, color: theme.text }}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditFolder(folder, e as unknown as React.MouseEvent)}
                          />
                          <button onClick={(e) => handleSaveEditFolder(folder, e)} className="text-green-500 cursor-pointer p-1"><Check size={16}/></button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(null); }} className="text-red-500 cursor-pointer p-1"><X size={16}/></button>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-[17px] font-medium tracking-tight truncate leading-snug" title={folder.name || t(lang, 'untitledFolder') || 'Untitled Folder'} style={{ color: theme.text, fontFamily: `'${uiFont}', sans-serif` }}>
                            {folder.name || t(lang, 'untitledFolder') || 'Untitled Folder'}
                          </h3>
                        </div>
                      )}

                      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {tab === 'active' ? (
                          <>
                            <button onClick={(e) => handleStartEditFolder(folder.id, folder.name, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'rename') || 'Rename'}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => handleArchiveFolder(folder, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'archive') || 'Archive'}>
                              <Archive size={14} />
                            </button>
                            <button onClick={(e) => handleSoftDeleteFolder(folder, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'trash') || 'Trash'}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : tab === 'archive' ? (
                          <>
                            <button onClick={(e) => handleUnarchiveFolder(folder, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'unarchive') || 'Unarchive'}>
                              <ArchiveRestore size={14} />
                            </button>
                            <button onClick={(e) => handleSoftDeleteFolder(folder, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'trash') || 'Trash'}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={(e) => handleRestoreFolder(folder, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'restore') || 'Restore'}>
                              <RotateCcw size={14} />
                            </button>
                            <button onClick={(e) => promptHardDelete('folder', folder.id, folder.name, e)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer" title={t(lang, 'deletePermanently') || 'Delete permanently'}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                       <div className="flex items-center gap-2 opacity-50">
                         <FolderOpen size={18} strokeWidth={1.5} style={{ color: theme.text }} />
                         {tab === 'active' && (
                           <span className="text-xs font-mono font-medium" style={{ color: theme.text }}>
                             {folderFileCount} {folderFileCount === 1 ? (t(lang, 'fileLabelSingular') || 'file') : (t(lang, 'fileLabelPlural') || 'files')}
                           </span>
                         )}
                       </div>
                       <span className="text-[10px] font-mono uppercase tracking-wider opacity-40" style={{ color: theme.text }}>
                         {t(lang, 'folderLabel') || 'Folder'}
                       </span>
                    </div>
                  </div>
                );
              })}

              {/* Projects */}
              {displayedProjects.map(project => (
                <div 
                  key={project.id}
                  draggable={tab === 'active'}
                  onDragStart={(e) => {
                    if (tab === 'active') {
                      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'project', id: project.id }));
                      setDragProjectId(project.id);
                    }
                  }}
                  onDragEnd={() => setDragProjectId(null)}
                  onClick={() => (tab === 'active' || tab === 'archive') && onOpenProject(project.id)}
                  className={`group relative h-36 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between p-4 sm:p-5 select-none ${dragProjectId === project.id ? 'opacity-50' : 'opacity-100'}`}
                  style={{
                    backgroundColor: fileBg,
                    borderColor: fileBorder
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = fileHoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = fileBg;
                  }}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    {editingProjectId === project.id && tab === 'active' ? (
                      <div className="flex items-center gap-2 w-full z-10" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-transparent border-b outline-none px-1 text-base font-medium"
                          style={{ borderColor: theme.accent, color: theme.text }}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditProject(project, e as unknown as React.MouseEvent)}
                        />
                        <button onClick={(e) => handleSaveEditProject(project, e)} className="text-green-500 cursor-pointer p-1"><Check size={16}/></button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingProjectId(null); }} className="text-red-500 cursor-pointer p-1"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-[17px] font-medium tracking-tight truncate leading-snug" title={project.title || t(lang, 'untitledProject') || 'Untitled'} style={{ color: theme.text, fontFamily: `'${uiFont}', sans-serif` }}>
                          {project.title || t(lang, 'untitledProject') || 'Untitled'}
                        </h3>
                      </div>
                    )}

                    <div className="flex-shrink-0 flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {tab === 'active' ? (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setMovingProjectId(project.id); }} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'moveToFolder') || 'Move to folder'}>
                            <FolderInput size={14} />
                          </button>
                          <button onClick={(e) => handleStartEditProject(project.id, project.title, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'rename') || 'Rename'}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={(e) => handleArchiveProject(project, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'archive') || 'Archive'}>
                            <Archive size={14} />
                          </button>
                          <button onClick={(e) => handleSoftDeleteProject(project, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'trash') || 'Trash'}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : tab === 'archive' ? (
                        <>
                          <button onClick={(e) => handleUnarchiveProject(project, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'unarchive') || 'Unarchive'}>
                            <ArchiveRestore size={14} />
                          </button>
                          <button onClick={(e) => handleSoftDeleteProject(project, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'trash') || 'Trash'}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={(e) => handleRestoreProject(project, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'restore') || 'Restore'}>
                            <RotateCcw size={14} />
                          </button>
                          <button onClick={(e) => promptHardDelete('project', project.id, project.title, e)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer" title={t(lang, 'deletePermanently') || 'Delete permanently'}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2">
                     <div className="flex items-center gap-2 opacity-50">
                       <FileText size={17} strokeWidth={1.5} style={{ color: theme.text }} />
                       <span className="text-xs uppercase tracking-wider font-light" style={{ color: theme.text }}>
                         {Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(project.lastModified || project.createdAt || Date.now()))}
                       </span>
                     </div>
                     {project.pages && project.pages.length > 1 && (
                       <span className="text-[11px] font-mono opacity-40 px-1.5 py-0.5 rounded border" style={{ borderColor: theme.borderFaint, color: theme.text }}>
                         {project.pages.length}p
                       </span>
                     )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // LIST VIEW
            <div className="flex flex-col gap-2">
              {/* Folders List */}
              {displayedFolders.map(folder => {
                const folderFileCount = activeProjects.filter(p => (p.folderId || null) === folder.id).length;
                return (
                  <div 
                    key={folder.id}
                    draggable={tab === 'active'}
                    onDragStart={(e) => {
                      if (tab === 'active') {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folder.id }));
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragProjectId) setDragOverFolderId(folder.id);
                    }}
                    onDragLeave={(e) => { e.preventDefault(); setDragOverFolderId(null); }}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOverFolderId(null);
                      if (dragProjectId) handleMoveProject(folder.id, dragProjectId);
                    }}
                    onClick={() => tab === 'active' && handleSelectFolder(folder.id)}
                    className="group flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer select-none"
                    style={{
                      backgroundColor: dragOverFolderId === folder.id ? folderHoverBg : fileBg,
                      borderColor: dragOverFolderId === folder.id ? theme.accent : fileBorder
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      {editingFolderId === folder.id && tab === 'active' ? (
                        <div className="flex items-center gap-2 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-transparent border-b outline-none px-1 text-sm font-medium"
                            style={{ borderColor: theme.accent, color: theme.text }}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditFolder(folder, e as unknown as React.MouseEvent)}
                          />
                          <button onClick={(e) => handleSaveEditFolder(folder, e)} className="text-green-500 cursor-pointer p-1"><Check size={15}/></button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(null); }} className="text-red-500 cursor-pointer p-1"><X size={15}/></button>
                        </div>
                      ) : (
                        <>
                          <FolderOpen size={18} className="opacity-50 flex-shrink-0" style={{ color: theme.text }} />
                          <span className="font-medium text-[15px] truncate" title={folder.name || t(lang, 'untitledFolder') || 'Untitled Folder'} style={{ color: theme.text, fontFamily: `'${uiFont}', sans-serif` }}>
                            {folder.name || t(lang, 'untitledFolder') || 'Untitled Folder'}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                      {tab === 'active' && (
                        <span className="text-xs font-mono opacity-50 hidden sm:inline-block" style={{ color: theme.text }}>
                          {folderFileCount} {folderFileCount === 1 ? (t(lang, 'fileLabelSingular') || 'file') : (t(lang, 'fileLabelPlural') || 'files')}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {tab === 'active' ? (
                          <>
                            <button onClick={(e) => handleStartEditFolder(folder.id, folder.name, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'rename') || 'Rename'}>
                              <Edit2 size={14}/>
                            </button>
                            <button onClick={(e) => handleArchiveFolder(folder, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'archive') || 'Archive'}>
                              <Archive size={14}/>
                            </button>
                            <button onClick={(e) => handleSoftDeleteFolder(folder, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'trash') || 'Trash'}>
                              <Trash2 size={14}/>
                            </button>
                          </>
                        ) : tab === 'archive' ? (
                          <>
                            <button onClick={(e) => handleUnarchiveFolder(folder, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'unarchive') || 'Unarchive'}>
                              <ArchiveRestore size={14}/>
                            </button>
                            <button onClick={(e) => handleSoftDeleteFolder(folder, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'trash') || 'Trash'}>
                              <Trash2 size={14}/>
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={(e) => handleRestoreFolder(folder, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'restore') || 'Restore'}>
                              <RotateCcw size={14}/>
                            </button>
                            <button onClick={(e) => promptHardDelete('folder', folder.id, folder.name, e)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer" title={t(lang, 'deletePermanently') || 'Delete permanently'}>
                              <Trash2 size={14}/>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Projects List */}
              {displayedProjects.map(project => (
                <div 
                  key={project.id}
                  draggable={tab === 'active'}
                  onDragStart={(e) => {
                    if (tab === 'active') {
                      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'project', id: project.id }));
                      setDragProjectId(project.id);
                    }
                  }}
                  onDragEnd={() => setDragProjectId(null)}
                  onClick={() => (tab === 'active' || tab === 'archive') && onOpenProject(project.id)}
                  className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer select-none ${dragProjectId === project.id ? 'opacity-50' : 'opacity-100'}`}
                  style={{
                    backgroundColor: fileBg,
                    borderColor: fileBorder
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = fileHoverBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = fileBg; }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                    {editingProjectId === project.id && tab === 'active' ? (
                      <div className="flex items-center gap-2 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-transparent border-b outline-none px-1 text-sm font-medium"
                          style={{ borderColor: theme.accent, color: theme.text }}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditProject(project, e as unknown as React.MouseEvent)}
                        />
                        <button onClick={(e) => handleSaveEditProject(project, e)} className="text-green-500 cursor-pointer p-1"><Check size={15}/></button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingProjectId(null); }} className="text-red-500 cursor-pointer p-1"><X size={15}/></button>
                      </div>
                    ) : (
                      <>
                        <FileText size={18} className="opacity-50 flex-shrink-0" style={{ color: theme.text }} />
                        <span className="font-medium text-[15px] truncate" title={project.title || t(lang, 'untitledProject') || 'Untitled'} style={{ color: theme.text, fontFamily: `'${uiFont}', sans-serif` }}>
                          {project.title || t(lang, 'untitledProject') || 'Untitled'}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <span className="text-xs opacity-50 font-light hidden sm:inline-block" style={{ color: theme.text }}>
                      {Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(project.lastModified || project.createdAt || Date.now()))}
                    </span>
                    {project.pages && project.pages.length > 1 && (
                      <span className="text-[11px] font-mono opacity-40 px-1.5 py-0.5 rounded border hidden sm:inline-block" style={{ borderColor: theme.borderFaint, color: theme.text }}>
                        {project.pages.length}p
                      </span>
                    )}
                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {tab === 'active' ? (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setMovingProjectId(project.id); }} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'moveToFolder') || 'Move to folder'}>
                            <FolderInput size={14}/>
                          </button>
                          <button onClick={(e) => handleStartEditProject(project.id, project.title, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'rename') || 'Rename'}>
                            <Edit2 size={14}/>
                          </button>
                          <button onClick={(e) => handleArchiveProject(project, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'archive') || 'Archive'}>
                            <Archive size={14}/>
                          </button>
                          <button onClick={(e) => handleSoftDeleteProject(project, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'trash') || 'Trash'}>
                            <Trash2 size={14}/>
                          </button>
                        </>
                      ) : tab === 'archive' ? (
                        <>
                          <button onClick={(e) => handleUnarchiveProject(project, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'unarchive') || 'Unarchive'}>
                            <ArchiveRestore size={14}/>
                          </button>
                          <button onClick={(e) => handleSoftDeleteProject(project, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'trash') || 'Trash'}>
                            <Trash2 size={14}/>
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={(e) => handleRestoreProject(project, e)} className="p-1.5 rounded-lg hover:bg-neutral-500/20 transition-colors cursor-pointer" style={{ color: theme.text }} title={t(lang, 'restore') || 'Restore'}>
                            <RotateCcw size={14}/>
                          </button>
                          <button onClick={(e) => promptHardDelete('project', project.id, project.title, e)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer" title={t(lang, 'deletePermanently') || 'Delete permanently'}>
                            <Trash2 size={14}/>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Move Project Dialog */}
        {movingProjectId && (
          <div className="absolute inset-0 z-50 flex flex-col p-8 animate-fade-in-up backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col" style={{ backgroundColor: theme.surface, borderRadius: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: theme.borderFaint }}>
                <h2 className="text-xl font-medium" style={{ color: theme.text }}>{t(lang, 'moveToFolder')}</h2>
                <button onClick={() => setMovingProjectId(null)} className="p-2 rounded-full hover:bg-neutral-500/20 cursor-pointer" style={{ color: theme.text }}>
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                <button
                  onClick={() => handleMoveProject(null)}
                  className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:bg-neutral-500/10 cursor-pointer"
                  style={{ borderColor: theme.borderFaint, color: theme.text }}
                >
                  <Home size={20} className="opacity-60" />
                  <span className="font-medium text-lg">{t(lang, 'homeRoot') || 'Home (Root)'}</span>
                </button>
                {activeFolders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => handleMoveProject(folder.id)}
                    className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:bg-neutral-500/10 cursor-pointer"
                    style={{ borderColor: theme.borderFaint, color: theme.text }}
                  >
                    <FolderOpen size={20} className="opacity-60" />
                    <span className="font-medium text-lg">{folder.name || t(lang, 'untitledFolder') || 'Untitled Folder'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default WelcomeScreen;
