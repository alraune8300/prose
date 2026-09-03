/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import {  Page, Folder, SyncStatus, Project } from './types'
import { Lang, t as i18nT } from './i18n'
import {
  Home, Highlighter, Folder as FolderIcon, FolderOpen, Edit2, FileText, Trash2,
  ChevronDown, RotateCcw, X, MoreHorizontal, Upload, Plus, PanelLeftClose, Bookmark,
  BookOpen, Table as TableIcon, List,  Cloud, PaintRoller, Github,  Archive, ArchiveRestore, Pin, StickyNote
 } from 'lucide-react'
import { importJsonBackupFile } from './fileHandlers';
import { saveProjectToDB, saveFolderToDB } from './db';
import type { Editor } from '@tiptap/react'

function timeSince(date: Date, lang: Lang): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 10) return i18nT(lang, 'justNow') || 'just now'
  
  try {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: 'short' });
    if (seconds < 60) return rtf.format(-seconds, 'second');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return rtf.format(-minutes, 'minute');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return rtf.format(-hours, 'hour');
    const days = Math.floor(hours / 24);
    return rtf.format(-days, 'day');
  } catch {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }
}

function LeftPanel(props: Record<string, unknown>) {
  const cProp = props.c as Record<string, unknown> | undefined
  const themeProp = props.theme as Record<string, unknown> | undefined

  const c = {
    bg: (cProp?.bg || themeProp?.bg || '#ffffff') as string,
    heroGrad: (cProp?.heroGrad || themeProp?.heroGrad || '#ffffff') as string,
    cardGrad: (cProp?.cardGrad || themeProp?.cardGrad || '#ffffff') as string,
    text: (cProp?.text || themeProp?.text || '#111827') as string,
    textMuted: (cProp?.textMuted || themeProp?.textMuted || themeProp?.muted || '#4b5563') as string,
    textFaint: (cProp?.textMuted || themeProp?.textMuted || themeProp?.faint || '#9ca3af') as string,
    accent: (cProp?.accent || themeProp?.accent || '#2563eb') as string,
    accentLight: (cProp?.accentLight || themeProp?.accentLight || themeProp?.accentSoft || '#dbeafe') as string,
    accentMid: (cProp?.accentMid || themeProp?.accentMid || '#60a5fa') as string,
    border: (cProp?.border || themeProp?.border || '#e5e7eb') as string,
    borderFaint: (cProp?.borderFaint || themeProp?.borderFaint || '#f3f4f6') as string,
    surface: (cProp?.surface || themeProp?.surface || '#ffffff') as string,
    header: (cProp?.header || themeProp?.header || '#ffffff') as string,
    panel: (cProp?.panel || themeProp?.panel || '#ffffff') as string,
    status: (cProp?.status || themeProp?.status || '#ffffff') as string,
    isDark: Boolean(cProp?.isDark ?? themeProp?.isDark ?? false),
  }

  const uiFont = (props.uiFont || 'Inter') as string
  const lang: Lang = (props.lang || 'vi') as Lang

  const t = (l: Lang, key: string) => {
    if (props.t && typeof props.t === 'object' && (props.t as Record<string, string>)[key]) {
      return (props.t as Record<string, string>)[key]
    }
    if (typeof props.t === 'function') {
      return (props.t as (lang: Lang, k: string) => string)(l, key)
    }
    return i18nT(l, key as Parameters<typeof i18nT>[1]) || key
  }

  const projectsProp = Array.isArray(props.projects) ? (props.projects as Project[]) : []
  const activeProjectId = (props.activeProjectId || (projectsProp[0]?.id || '')) as string
  const activeProject = projectsProp.find(p => p.id === activeProjectId) || projectsProp[0]

  const onNewProject = (props.onNewProject || (props.onAddDoc ? (() => (props.onAddDoc as () => void)()) : (() => {}))) as () => void
  const onRenameProject = (props.onRenameProject || (() => {})) as (id: string, name: string) => void
  const onDeleteProject = (props.onDeleteProject || (() => {})) as (id: string) => void
  const onGoHome = props.onGoHome as (() => void) | undefined
  const onGoToRoot = props.onGoToRoot as (() => void) | undefined
  const onGoToFolder = props.onGoToFolder as ((folderId?: string | null) => void) | undefined
  const activeProjectFolder = (props.activeProjectFolder || null) as Folder | null
  const projectFolderBreadcrumbs = (props.projectFolderBreadcrumbs || []) as Folder[]
  const onCloseSidebar = (props.onCloseSidebar || props.onClose) as (() => void) | undefined

  const docsProp = props.docs as Array<Record<string, unknown>> | undefined
  const rawPages = activeProject
    ? [...activeProject.pages, ...activeProject.drafts]
    : props.pages || (docsProp ? docsProp.map(d => ({
        id: d.id as string,
        title: (d.title as string) || 'Untitled',
        content: (d.content as string) || '',
        isDraft: false,
        createdAt: new Date((d.updated_at as string) || Date.now()).toISOString(),
        lastModified: new Date((d.updated_at as string) || Date.now()).toISOString(),
        folderId: (d.folder_id as string) || (d.folderId as string) || undefined,
      })) : [])
  const pages: Page[] = Array.isArray(rawPages) ? (rawPages as Page[]) : []

  const activePageId = (props.activePageId || props.activeId || '') as string
  const onSelectPage = (props.onSelectPage || props.onSelectDoc || (() => {})) as (id: string) => void
  const onNewPage = (props.onNewPage || (props.onAddDoc ? (() => (props.onAddDoc as () => void)()) : (() => {}))) as (isDraft?: boolean, folderId?: string) => void
  const onNewScratchpad = (props.onNewScratchpad || (() => onNewPage(false))) as () => void
  const onTogglePinPage = (props.onTogglePinPage || (() => {})) as (id: string) => void
  const onDeletePage = (props.onDeletePage || props.onDeleteDoc || (() => {})) as (id: string) => void
  const onRenamePage = (props.onRenamePage || (() => {})) as (id: string, name: string) => void
  const syncStatus: SyncStatus = (props.syncStatus || 'saved') as SyncStatus
  const lastSaved: Date = (props.lastSaved || new Date()) as Date
  const bin: Page[] = activeProject ? activeProject.bin : (Array.isArray(props.bin) ? (props.bin as Page[]) : [])
  const archive: Page[] = activeProject ? (activeProject.archive || []) : (Array.isArray(props.archive) ? (props.archive as Page[]) : [])
  const scratchpads: Page[] = activeProject ? (activeProject.scratchpad || []) : pages.filter(p => p.isScratchpad)
  const onRestorePage = (props.onRestorePage || (() => {})) as (id: string) => void
  const onPermanentDelete = (props.onPermanentDelete || (() => {})) as (id: string) => void
  const onEmptyBin = (props.onEmptyBin || (() => {})) as () => void
  const onArchivePage = (props.onArchivePage || (() => {})) as (id: string) => void
  const onUnarchivePage = (props.onUnarchivePage || (() => {})) as (id: string) => void
  const onRenameScratchpadSection = (props.onRenameScratchpadSection || (() => {})) as (name: string) => void

  const folders: Folder[] = activeProject ? activeProject.folders : (Array.isArray(props.folders) ? (props.folders as Folder[]) : [])
  const activeFolders = folders.filter(f => !f.isDeleted)

  const onRenameFolder = (props.onRenameFolder || (() => {})) as (id: string, name: string) => void
  const onDeleteFolder = (props.onDeleteFolder || (() => {})) as (id: string) => void
  const onMovePageToFolder = (props.onMovePageToFolder || props.onMoveDoc || (() => {})) as (pageId: string, folderId: string | undefined) => void
  
  const onOpenGithubCloudSave = props.onOpenGithubCloudSave as (() => void) | undefined;
  const onOpenThemeModal = props.onOpenThemeModal as (() => void) | undefined;

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const [renamingProjId, setRenamingProjId] = useState<string | null>(null)
  const [projRenameVal, setProjRenameVal] = useState('')
  const [, setTick] = useState(0)
  const [activeTab, setActiveTab] = useState<'pages' | 'drafts'>('pages')
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [folderRenameVal, setFolderRenameVal] = useState('')
  const [renamingScratchpadTitle, setRenamingScratchpadTitle] = useState(false)
  const [scratchpadTitleVal, setScratchpadTitleVal] = useState('')
  const [folderMenuOpenId, setFolderMenuOpenId] = useState<string | null>(null)
  
  const [dragPageId, setDragPageId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'root'>(null)
  const [projSearchQuery, setProjSearchQuery] = useState('')
  const [showProjSearch, setShowProjSearch] = useState(false)

  const handleLeftPanelImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md,.docx,.pdf,.html,.json'
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      if (file.name.toLowerCase().endsWith('.json')) {
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
          if (props.onReloadProjects) {
            await (props.onReloadProjects as () => void | Promise<void>)()
          }
        } catch {
          if (props.onImportFile) {
            await (props.onImportFile as (file: File) => void | Promise<void>)(file)
          }
        }
      } else {
        if (props.onImportFile) {
          await (props.onImportFile as (file: File) => void | Promise<void>)(file)
        }
      }
    }
    input.click()
  }

  useEffect(() => {
    const id = setInterval(() => setTick(tk => tk + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const nonDrafts = activeProject ? activeProject.pages : pages.filter(p => !p.isDraft)
  const drafts = activeProject ? activeProject.drafts : pages.filter(p => p.isDraft)

  const syncDotColor = { saved: '#4caf72', saving: '#f0a030', unsaved: c.textMuted, error: '#e05050' }[syncStatus]
  const syncLabel = {
    saved: `${t(lang, 'saved')} ${timeSince(lastSaved, lang)}`,
    saving: t(lang, 'saving'),
    unsaved: t(lang, 'unsaved'),
    error: t(lang, 'saveError'),
  }[syncStatus]

  const itemAccentHoverBg = c.accent.startsWith('#')
    ? (c.isDark ? `${c.accent}1c` : `${c.accent}12`)
    : (c.accentLight || (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'))

  const itemAccentActiveBg = c.accent.startsWith('#')
    ? (c.isDark ? `${c.accent}2c` : `${c.accent}20`)
    : (c.accentLight || (c.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'))

  const commitRename = (id: string) => {
    if (renameVal.trim()) onRenamePage(id, renameVal.trim())
    setRenamingId(null)
  }

  const commitFolderRename = (id: string) => {
    if (folderRenameVal.trim()) onRenameFolder(id, folderRenameVal.trim())
    setRenamingFolderId(null)
  }

  const renderPage = (page: Page, indent = 0) => {
    const isActive = activePageId === page.id;
    return (
      <div 
        key={page.id}
        className="group relative"
        draggable
        onDragStart={() => setDragPageId(page.id)}
        onDragEnd={() => { setDragPageId(null); setDragOverFolderId(null) }}
        style={{
          margin: '2px 6px',
          marginLeft: 6 + indent * 14,
          borderRadius: 7,
          border: `1px solid ${isActive ? c.accent : 'transparent'}`,
          background: isActive ? itemAccentActiveBg : 'transparent',
          padding: '7px 10px',
          cursor: 'pointer',
          transition: 'all 0.12s ease',
          opacity: dragPageId === page.id ? 0.4 : 1,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}
        onClick={() => { setFolderMenuOpenId(null); onSelectPage(page.id) }}
        onDoubleClick={() => { setFolderMenuOpenId(null); setRenamingId(page.id); setRenameVal(page.title) }}
        onMouseEnter={e => {
          if (!isActive) e.currentTarget.style.background = itemAccentHoverBg
        }}
        onMouseLeave={e => {
          if (!isActive) e.currentTarget.style.background = 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          {renamingId === page.id ? (
            <input
              autoFocus
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={() => commitRename(page.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename(page.id)
                if (e.key === 'Escape') setRenamingId(null)
              }}
              onClick={e => e.stopPropagation()}
              style={{
                flex: 1, padding: '2px 4px',
                fontFamily: uiFont, fontSize: '0.8rem',
                background: 'transparent', border: 'none',
                outline: `1.5px solid ${c.accent}`, borderRadius: 4, color: c.text,
              }}
            />
          ) : (
            <span style={{
              fontFamily: uiFont, fontSize: '0.8rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? c.accent : c.text, lineHeight: 1.35,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
              display: 'flex', alignItems: 'center', gap: 5
            }}>
              {page.isPinned && (
                <Pin size={11} style={{ color: c.accent, fill: c.accent, flexShrink: 0 }} />
              )}
              <span className="truncate">{page.title}</span>
            </span>
          )}
          
          <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); setFolderMenuOpenId(null); setRenamingId(page.id); setRenameVal(page.title); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: c.textMuted, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
              title={t(lang, 'rename') || "Rename"}
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onArchivePage(page.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: c.textMuted, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
              title={t(lang, 'archiveDocument') || "Archive"}
            >
              <Archive size={12} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDeletePage(page.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: c.textMuted, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e05050')}
              onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
              title={t(lang, 'delete') || "Delete"}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.64rem', color: isActive ? c.accent : c.textMuted, opacity: isActive ? 0.9 : 0.7, fontFamily: uiFont }}>
            {timeSince(new Date(page.updatedAt || page.lastModified || Date.now()), lang)}
          </span>
        </div>
      </div>
    )
  }

  const renderFolder = (folder: Folder, depth = 0) => {
    const isCollapsed = collapsedFolders.has(folder.id)
    const childFolders = activeFolders.filter(f => f.parentId === folder.id)
    const folderPages = [...(activeTab === 'drafts' ? drafts : nonDrafts).filter(p => p.folderId === folder.id)].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    })

    return (
      <div key={folder.id} style={{ marginLeft: depth > 0 ? 10 : 0, marginTop: 2 }}>
        <div
          className="group relative flex items-center justify-between"
          onDragOver={e => { e.preventDefault(); setDragOverFolderId(folder.id) }}
          onDragLeave={() => setDragOverFolderId(null)}
          onDrop={e => {
            e.preventDefault()
            if (dragPageId) onMovePageToFolder(dragPageId, folder.id)
            setDragOverFolderId(null)
          }}
          style={{
            padding: '4px 8px', margin: '1px 6px', borderRadius: 6,
            background: dragOverFolderId === folder.id ? itemAccentActiveBg : 'transparent',
            border: `1px solid ${dragOverFolderId === folder.id ? c.accent : 'transparent'}`,
            transition: 'all 0.12s', cursor: 'pointer',
          }}
          onClick={() => {
            setCollapsedFolders(prev => {
              const next = new Set(prev)
              if (next.has(folder.id)) next.delete(folder.id)
              else next.add(folder.id)
              return next
            })
          }}
          onMouseEnter={e => {
            if (dragOverFolderId !== folder.id) e.currentTarget.style.background = itemAccentHoverBg
          }}
          onMouseLeave={e => {
            if (dragOverFolderId !== folder.id) e.currentTarget.style.background = 'transparent'
          }}
        >
          {renamingFolderId === folder.id ? (
            <input
              autoFocus
              value={folderRenameVal}
              onChange={e => setFolderRenameVal(e.target.value)}
              onBlur={() => commitFolderRename(folder.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitFolderRename(folder.id)
                if (e.key === 'Escape') setRenamingFolderId(null)
              }}
              style={{
                width: '100%', padding: '2px 6px',
                fontFamily: uiFont, fontSize: '0.75rem',
                background: 'transparent', border: 'none',
                outline: `1px solid ${c.accent}`, borderRadius: 4, color: c.text,
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-1.5 overflow-hidden flex-1">
              <ChevronDown
                size={13}
                style={{
                  color: c.accent, transition: 'transform 0.2s',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  flexShrink: 0
                }}
              />
              <span style={{
                fontFamily: uiFont, fontSize: '0.74rem', fontWeight: 600,
                color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {folder.name}
              </span>
              <span style={{ fontSize: '0.62rem', color: c.accent, opacity: 0.85 }}>
                ({folderPages.length})
              </span>
            </div>
          )}
          
          {!renamingFolderId && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center" onClick={e => e.stopPropagation()}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={e => { e.stopPropagation(); setFolderMenuOpenId(folderMenuOpenId === folder.id ? null : folder.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: c.accent, display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.accent)}
                >
                  <MoreHorizontal size={13} />
                </button>
                
                {folderMenuOpenId === folder.id && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: c.panel, border: `1px solid ${c.borderFaint}`, borderRadius: 6, padding: '4px', display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', minWidth: 120 }}>
                    <button
                      onClick={e => { e.stopPropagation(); onNewPage(activeTab === 'drafts', folder.id); setCollapsedFolders(prev => { const next = new Set(prev); next.delete(folder.id); return next; }); setFolderMenuOpenId(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px 8px', color: c.text, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontFamily: uiFont, width: '100%', textAlign: 'left', borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = itemAccentHoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <FileText size={12} style={{ color: c.accent }} /> {t(lang, 'newDocument')?.replace('+', '').trim() || 'New Document'}
                    </button>
                    <div style={{ height: 1, background: c.borderFaint, margin: '2px 0' }} />
                    <button
                      onClick={e => { e.stopPropagation(); setRenamingFolderId(folder.id); setFolderRenameVal(folder.name); setFolderMenuOpenId(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px 8px', color: c.text, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontFamily: uiFont, width: '100%', textAlign: 'left', borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = itemAccentHoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Edit2 size={12} style={{ color: c.accent }} /> {t(lang, 'rename')}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteFolder(folder.id); setFolderMenuOpenId(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px 8px', color: '#e05050', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontFamily: uiFont, width: '100%', textAlign: 'left', borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = c.isDark ? 'rgba(224,80,80,0.15)' : 'rgba(224,80,80,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Trash2 size={12} /> {t(lang, 'delete')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Children */}
        {!isCollapsed && (
          <div>
            {childFolders.map(cf => renderFolder(cf, depth + 1))}
            {folderPages.map(p => renderPage(p, depth + 1))}
            {childFolders.length === 0 && folderPages.length === 0 && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOverFolderId(folder.id) }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={e => {
                  e.preventDefault()
                  if (dragPageId) onMovePageToFolder(dragPageId, folder.id)
                  setDragOverFolderId(null)
                }}
                style={{
                  marginLeft: 6 + (depth + 1) * 14 + 6, padding: '4px 8px',
                  fontFamily: uiFont, fontSize: '0.66rem', color: c.textMuted, fontStyle: 'italic',
                }}
              >
                {t(lang, 'dropFilesHere')}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTabContent = (isDraftSection: boolean) => {
    const list = isDraftSection ? drafts : nonDrafts
    const rootFolders = folders.filter(f => f.parentId === null)
    const rootPages = list.filter(p => !p.folderId || !folders.find(f => f.id === p.folderId)).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    })

    return (
      <div>
        {/* Root folders */}
        {rootFolders.map(f => renderFolder(f, 0))}

        {/* Root-level pages drop zone */}
        {rootPages.length === 0 && rootFolders.length === 0 ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragOverFolderId('root') }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={e => {
              e.preventDefault()
              if (dragPageId) onMovePageToFolder(dragPageId, undefined)
              setDragOverFolderId(null)
            }}
            style={{
              padding: '8px 10px', fontFamily: uiFont, fontSize: '0.7rem',
              color: c.textMuted, fontStyle: 'italic',
              background: dragOverFolderId === 'root' ? (c.accentLight) : 'transparent',
              borderRadius: 6, margin: '2px 6px', transition: 'background 0.1s',
            }}
          >
            {isDraftSection ? t(lang, 'noDraftsYet') : t(lang, 'noPagesYet')}
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragOverFolderId('root') }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={e => {
              e.preventDefault()
              if (dragPageId) onMovePageToFolder(dragPageId, undefined)
              setDragOverFolderId(null)
            }}
            style={{
              background: dragOverFolderId === 'root' ? (c.accentLight) : 'transparent',
              border: dragOverFolderId === 'root' ? `1px dashed ${c.accentMid}` : 'none',
              borderRadius: 6, margin: '2px 4px', transition: 'all 0.1s',
            }}
          >
            {rootPages.map(p => renderPage(p, 0))}
          </div>
        )}
      </div>
    )
  }

  const handleOpenArchive = () => {
    if (props.onOpenRightPanel) {
      (props.onOpenRightPanel as (tab: string) => void)('archive');
    } else {
      window.dispatchEvent(new CustomEvent('kgv-open-right-panel', { detail: { tab: 'archive' } }));
    }
  };

  const handleOpenTrash = () => {
    if (props.onOpenRightPanel) {
      (props.onOpenRightPanel as (tab: string) => void)('trash');
    } else {
      window.dispatchEvent(new CustomEvent('kgv-open-right-panel', { detail: { tab: 'trash' } }));
    }
  };

  return (
    <div
      id="left-panel-root"
      onClick={() => setFolderMenuOpenId(null)}
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: c.panel,
        borderRight: `1px solid ${c.borderFaint}`,
        overflow: 'hidden',
        fontFamily: uiFont,
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 14px 10px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, borderBottom: `1px solid ${c.borderFaint}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              flex: 1,
              minWidth: 0,
              padding: '4px 6px',
              marginLeft: -6,
              borderRadius: 6,
              transition: 'background 0.12s',
            }}
            onClick={() => setShowProjSearch(v => !v)}
            title={t(lang, 'switchProject') || 'Switch Project'}
            onMouseEnter={e => { e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <FolderIcon size={15} style={{ color: c.accent, flexShrink: 0 }} />
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: c.text, fontFamily: uiFont, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeProject?.title || 'Project'}
            </span>
            <ChevronDown size={13} style={{ color: c.textMuted, opacity: 0.7, flexShrink: 0 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                title={t(lang, 'returnToWelcome') || 'Return to Welcome Screen'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', color: c.textMuted,
                  cursor: 'pointer', padding: 5, borderRadius: 6, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = c.textMuted; e.currentTarget.style.background = 'transparent'; }}
              >
                <Home size={14} />
              </button>
            )}
            {onCloseSidebar && (
              <button
                type="button"
                onClick={onCloseSidebar}
                title={t(lang, 'collapse') || 'Collapse'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', color: c.textMuted,
                  cursor: 'pointer', padding: 5, borderRadius: 6, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = c.textMuted; e.currentTarget.style.background = 'transparent'; }}
              >
                <PanelLeftClose size={14} />
              </button>
            )}
          </div>
        </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {/* Home / Return button */}
            <button
              onClick={onGoToRoot || onGoHome}
              title={lang === 'vi' ? 'Quay về trang chủ' : 'Return to Home'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 7px',
                borderRadius: 5,
                fontSize: '0.7rem',
                fontWeight: 500,
                background: c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: c.textMuted,
                border: `1px solid ${c.borderFaint}`,
                cursor: 'pointer',
                transition: 'all 0.12s',
                fontFamily: uiFont,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.borderColor = c.border; }}
              onMouseLeave={e => { e.currentTarget.style.color = c.textMuted; e.currentTarget.style.borderColor = c.borderFaint; }}
            >
              <Home size={11} style={{ flexShrink: 0 }} />
              <span>{lang === 'vi' ? 'Trang chủ' : 'Home'}</span>
            </button>

            {/* Folder Breadcrumb / Badge(s) */}
            {projectFolderBreadcrumbs && projectFolderBreadcrumbs.length > 0 ? (
              projectFolderBreadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <span style={{ color: c.textMuted, opacity: 0.35, fontSize: '0.65rem' }}>/</span>
                  <button
                    onClick={() => onGoToFolder ? onGoToFolder(crumb.id) : (onGoHome && onGoHome())}
                    title={lang === 'vi' ? `Quay lại thư mục: ${crumb.name}` : `Back to folder: ${crumb.name}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 7px',
                      borderRadius: 5,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      background: c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      color: c.accent,
                      border: `1px solid ${c.borderFaint}`,
                      cursor: 'pointer',
                      maxWidth: 120,
                      transition: 'all 0.12s',
                      fontFamily: uiFont,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = c.accentLight; e.currentTarget.style.borderColor = c.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = c.borderFaint; }}
                  >
                    <FolderOpen size={11} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {crumb.name}
                    </span>
                  </button>
                </React.Fragment>
              ))
            ) : activeProjectFolder ? (
              <>
                <span style={{ color: c.textMuted, opacity: 0.35, fontSize: '0.65rem' }}>/</span>
                <button
                  onClick={() => onGoToFolder ? onGoToFolder(activeProjectFolder.id) : (onGoHome && onGoHome())}
                  title={lang === 'vi' ? `Quay lại thư mục: ${activeProjectFolder.name}` : `Back to folder: ${activeProjectFolder.name}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 7px',
                    borderRadius: 5,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    background: c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    color: c.accent,
                    border: `1px solid ${c.borderFaint}`,
                    cursor: 'pointer',
                    maxWidth: 120,
                    transition: 'all 0.12s',
                    fontFamily: uiFont,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = c.accentLight; e.currentTarget.style.borderColor = c.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = c.borderFaint; }}
                >
                  <FolderOpen size={11} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeProjectFolder.name}
                  </span>
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Project Switcher Dropdown */}
        {showProjSearch && (
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, borderBottom: `1px solid ${c.borderFaint}`, background: c.surface }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {renamingProjId === activeProjectId ? (
                <input
                  autoFocus
                  value={projRenameVal}
                  onChange={e => setProjRenameVal(e.target.value)}
                  onBlur={() => { if (projRenameVal.trim()) onRenameProject(activeProjectId, projRenameVal.trim()); setRenamingProjId(null) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { if (projRenameVal.trim()) onRenameProject(activeProjectId, projRenameVal.trim()); setRenamingProjId(null) }
                    if (e.key === 'Escape') setRenamingProjId(null)
                  }}
                  style={{
                    width: '100%', padding: '3px 6px', fontFamily: uiFont, fontSize: '0.8rem',
                    background: 'transparent', border: `1px solid ${c.accent}`, borderRadius: 5, color: c.text,
                  }}
                />
              ) : (
                <>
                  <div style={{ flex: 1 }} />
                  <button
                    type="button"
                    title={t(lang, 'renameProject') || 'Rename Project'}
                    onClick={() => { setRenamingProjId(activeProjectId); setProjRenameVal(activeProject?.title || '') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '2px' }}
                  >
                    <Edit2 size={12} />
                  </button>
                  {projectsProp.length > 1 && (
                    <button
                      type="button"
                      title={t(lang, 'deleteProject') || 'Delete Project'}
                      onClick={() => { if (window.confirm('Delete project?')) onDeleteProject(activeProjectId) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '2px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
              <input
                placeholder={t(lang, "searchProjects")}
                value={projSearchQuery}
                onChange={e => setProjSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '5px 8px', fontFamily: uiFont, fontSize: '0.78rem',
                  background: c.bg, border: `1px solid ${c.borderFaint}`, borderRadius: 5,
                  color: c.text, outline: 'none'
                }}
              />
              {projSearchQuery && (
                <button onClick={() => setProjSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '2px' }} title="Clear search">
                  <X size={12} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <button onClick={onNewProject} style={{ flex: 1, padding: '5px', background: (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), color: c.accent, borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>+ {t(lang, 'newProject') || 'New Project'}</button>
              <button onClick={handleLeftPanelImport} style={{ flex: 1, padding: '5px', background: c.bg, color: c.text, border: `1px solid ${c.borderFaint}`, borderRadius: 5, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Upload size={11} /> {t(lang, 'importFile') || 'Import'}
              </button>
            </div>
          </div>
        )}

        {/* Main scrollable body */}
        <div style={{ flex: 1, height: '100%', overflowY: 'auto', overflowX: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="p-2 space-y-3">
              {/* Pages Section */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} color={c.accent} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: c.text, fontFamily: uiFont, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t(lang, 'pages')}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: c.accent, opacity: 0.85 }}>
                      ({nonDrafts.length})
                    </span>
                  </div>
                  <button 
                    onClick={() => { setActiveTab('pages'); onNewPage(false); }} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.accent, padding: 2, display: 'flex', alignItems: 'center' }}
                    title={t(lang, 'newPage') || 'New Page'}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {renderTabContent(false)}
              </div>

              {/* Drafts Section */}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: c.text, fontFamily: uiFont, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t(lang, 'drafts')}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: c.accent, opacity: 0.85 }}>
                      ({drafts.length})
                    </span>
                  </div>
                  <button 
                    onClick={() => { setActiveTab('drafts'); onNewPage(true); }} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.accent, padding: 2, display: 'flex', alignItems: 'center' }}
                    title={t(lang, 'newDraft') || 'New Draft'}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {renderTabContent(true)}
                </div>
              </div>

              {/* Scratchpad Section */}
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StickyNote size={14} style={{ color: c.accent }} />
                    {renamingScratchpadTitle ? (
                      <input
                        autoFocus
                        value={scratchpadTitleVal}
                        onChange={e => setScratchpadTitleVal(e.target.value)}
                        onBlur={() => {
                          if (scratchpadTitleVal.trim()) onRenameScratchpadSection(scratchpadTitleVal.trim());
                          setRenamingScratchpadTitle(false);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (scratchpadTitleVal.trim()) onRenameScratchpadSection(scratchpadTitleVal.trim());
                            setRenamingScratchpadTitle(false);
                          }
                          if (e.key === 'Escape') setRenamingScratchpadTitle(false);
                        }}
                        onClick={e => e.stopPropagation()}
                        style={{
                          fontSize: '0.74rem', fontWeight: 600, color: c.text, fontFamily: uiFont, textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: 'transparent', border: `1px solid ${c.accent}`, outline: 'none', padding: '0 4px', borderRadius: 4, width: '120px'
                        }}
                      />
                    ) : (
                      <div className="group/sctitle flex items-center gap-1 cursor-pointer" onClick={() => { setRenamingScratchpadTitle(true); setScratchpadTitleVal(activeProject?.scratchpadName || t(lang, 'scratchpad') || 'Scratchpad'); }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: c.text, fontFamily: uiFont, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {activeProject?.scratchpadName || t(lang, 'scratchpad')}
                        </span>
                        <div className="opacity-0 group-hover/sctitle:opacity-100 transition-opacity">
                          <Edit2 size={10} style={{ color: c.accent }} />
                        </div>
                      </div>
                    )}
                    <span style={{ fontSize: '0.64rem', color: c.accent, opacity: 0.85 }}>
                      ({scratchpads.length})
                    </span>
                  </div>
                  <button 
                    onClick={() => onNewScratchpad()} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.accent, padding: 2, display: 'flex', alignItems: 'center' }}
                    title={t(lang, 'newScratchpad') || 'New Scratchpad'}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {scratchpads.length === 0 ? (
                    <div style={{
                      padding: '6px 10px', fontFamily: uiFont, fontSize: '0.7rem',
                      color: c.textMuted, fontStyle: 'italic', borderRadius: 6, margin: '2px 6px'
                    }}>
                      {t(lang, 'scratchpadEmpty') || 'No scratchpad notes'}
                    </div>
                  ) : (
                    [...scratchpads].sort((a, b) => {
                      if (a.isPinned && !b.isPinned) return -1;
                      if (!a.isPinned && b.isPinned) return 1;
                      return 0;
                    }).map(p => renderPage(p, 0))
                  )}
                </div>
              </div>
            </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, borderTop: `1px solid ${c.borderFaint}` }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {onOpenGithubCloudSave && (
              <button 
                onClick={onOpenGithubCloudSave}
                title={t(lang, 'cloudSaveSync') || 'Cloud Sync'}
                style={{ 
                  padding: '5px', borderRadius: 6, border: 'none', 
                  background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.12s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Github size={16} style={{ color: c.text }} />
              </button>
            )}
            {onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                title={t(lang, 'themePresets') || 'Themes'}
                style={{
                  padding: '5px', borderRadius: 6, border: 'none',
                  background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.12s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <PaintRoller size={16} style={{ color: c.text }} />
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {/* Sync Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.64rem', color: c.textMuted, fontFamily: uiFont }}>{syncLabel}</span>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: syncDotColor, transition: 'all 0.3s' }} />
            </div>
          </div>
        </div>
    </div>
  )
}

export default React.memo(LeftPanel, (prevProps, nextProps) => {
  if (prevProps.leftSidebarMainTab !== nextProps.leftSidebarMainTab) return false;
  if (prevProps.activeFootnoteHighlight !== nextProps.activeFootnoteHighlight) return false;
  if ((prevProps.activePage as { content?: string })?.content !== (nextProps.activePage as { content?: string })?.content) return false;
  if (prevProps.activeProjectId !== nextProps.activeProjectId) return false;
  if (prevProps.activePageId !== nextProps.activePageId) return false;
  if (prevProps.sidebarOpen !== nextProps.sidebarOpen) return false;
  if (prevProps.themeMode !== nextProps.themeMode) return false;
  if (prevProps.lang !== nextProps.lang) return false;
  if (prevProps.syncStatus !== nextProps.syncStatus) return false;

  const checkProjects = (p1: typeof prevProps.projects, p2: typeof nextProps.projects) => {
    if (p1.length !== p2.length) return false;
    for (let i = 0; i < p1.length; i++) {
      const proj1 = p1[i];
      const proj2 = p2[i];
      if (proj1.id !== proj2.id || proj1.title !== proj2.title) return false;
      if (proj1.pages?.length !== proj2.pages?.length) return false;
      if (proj1.drafts?.length !== proj2.drafts?.length) return false;
      if (proj1.folders?.length !== proj2.folders?.length) return false;

      const checkArr = (arr1: Partial<Page>[], arr2: Partial<Page>[]) => {
        if (!arr1 || !arr2) return arr1 === arr2;
        for (let j = 0; j < arr1.length; j++) {
          if (arr1[j].id !== arr2[j].id) return false;
          if (arr1[j].title !== arr2[j].title) return false;
          if (arr1[j].folderId !== arr2[j].folderId) return false;
        }
        return true;
      };
      if (!checkArr(proj1.pages, proj2.pages)) return false;
      if (!checkArr(proj1.drafts, proj2.drafts)) return false;
      if (!checkArr(proj1.folders, proj2.folders)) return false;
    }
    return true;
  };

  return checkProjects(prevProps.projects, nextProps.projects);
});
