/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Page, Folder, SyncStatus, Project } from './types'
import { Lang, t as i18nT } from './i18n'
import { Home, Highlighter,  Folder as FolderIcon, Edit2, FileText, Trash2, ChevronDown, RotateCcw, X, MoreHorizontal, Upload, Plus, PanelLeftClose, Bookmark, BookOpen, Activity, Type, Table as TableIcon } from 'lucide-react'
import { importJsonBackupFile } from './fileHandlers'
import FootnotesPanel from './FootnotesPanel'
import HighlightsPanel from './HighlightsPanel'
import CitationsPanel from './CitationsPanel'
import TableInspectorPanel from './TableInspectorPanel'
import { StoryCodexPanel } from './StoryCodexPanel'
import { EditorialInspectorPanel } from './EditorialInspectorPanel'
import type { CitationSource, CitationStyle } from './citationsEngine'
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
  const onDeletePage = (props.onDeletePage || props.onDeleteDoc || (() => {})) as (id: string) => void
  const onRenamePage = (props.onRenamePage || (() => {})) as (id: string, name: string) => void
  const syncStatus: SyncStatus = (props.syncStatus || 'saved') as SyncStatus
  const lastSaved: Date = (props.lastSaved || new Date()) as Date
  const bin: Page[] = activeProject ? activeProject.bin : (Array.isArray(props.bin) ? (props.bin as Page[]) : [])
  const onRestorePage = (props.onRestorePage || (() => {})) as (id: string) => void
  const onPermanentDelete = (props.onPermanentDelete || (() => {})) as (id: string) => void
  const onEmptyBin = (props.onEmptyBin || (() => {})) as () => void

  const folders: Folder[] = activeProject ? activeProject.folders : (Array.isArray(props.folders) ? (props.folders as Folder[]) : [])
  const activeFolders = folders.filter(f => !f.isDeleted)

  const onRenameFolder = (props.onRenameFolder || (() => {})) as (id: string, name: string) => void
  const onDeleteFolder = (props.onDeleteFolder || (() => {})) as (id: string) => void
  const onMovePageToFolder = (props.onMovePageToFolder || props.onMoveDoc || (() => {})) as (pageId: string, folderId: string | undefined) => void
  
  const onOpenGithubCloudSave = (props.onOpenGithubCloudSave || (() => {})) as () => void

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const [renamingProjId, setRenamingProjId] = useState<string | null>(null)
  const [projRenameVal, setProjRenameVal] = useState('')
  const [, setTick] = useState(0)
  const [activeTab, setActiveTab] = useState<'pages' | 'drafts'>('pages')
  const [binOpen, setBinOpen] = useState(false)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [folderRenameVal, setFolderRenameVal] = useState('')
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
          await importJsonBackupFile(file)
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

  
  const commitRename = (id: string) => {
    if (renameVal.trim()) onRenamePage(id, renameVal.trim())
    setRenamingId(null)
  }

  const commitFolderRename = (id: string) => {
    if (folderRenameVal.trim()) onRenameFolder(id, folderRenameVal.trim())
    setRenamingFolderId(null)
  }

    const renderPage = (page: Page, indent = 0) => {
    const isHoveredOrActive = activePageId === page.id;
    return (
      <div 
        key={page.id}
        className="group relative"
        draggable
        onDragStart={() => setDragPageId(page.id)}
        onDragEnd={() => { setDragPageId(null); setDragOverFolderId(null) }}
        style={{
          margin: '4px 10px',
          marginLeft: 10 + indent * 14,
          borderRadius: 12,
          border: `1px solid ${isHoveredOrActive ? c.border : 'transparent'}`,
          background: isHoveredOrActive ? (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
          padding: '12px 14px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          opacity: dragPageId === page.id ? 0.4 : 1,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}
        onClick={() => { setFolderMenuOpenId(null); onSelectPage(page.id) }}
        onDoubleClick={() => { setFolderMenuOpenId(null); setRenamingId(page.id); setRenameVal(page.title) }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
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
                fontFamily: uiFont, fontSize: '0.85rem',
                background: 'transparent', border: 'none',
                outline: `1.5px solid ${c.accent}`, borderRadius: 4, color: c.text,
              }}
            />
          ) : (
            <span style={{
              fontFamily: uiFont, fontSize: '0.85rem', fontWeight: 500,
              color: c.text, lineHeight: 1.3,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1
            }}>
              {page.title}
            </span>
          )}
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" style={{ background: isHoveredOrActive ? (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : c.surface, borderRadius: 4 }}>
            <button
              onClick={e => { e.stopPropagation(); onDeletePage(page.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: c.textMuted }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e05050')}
              onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: c.textMuted }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span style={{ fontSize: '0.65rem', fontFamily: uiFont }}>{timeSince(new Date(page.updatedAt || Date.now()), lang)}</span>
          </div>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: c.accent, opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.5rem', fontWeight: 'bold' }}>
            A
          </div>
        </div>
      </div>
    )
  }

const renderFolder = (folder: Folder, depth = 0) => {
    const isCollapsed = collapsedFolders.has(folder.id)
    const childFolders = activeFolders.filter(f => f.parentId === folder.id)
    const folderPages = (activeTab === 'drafts' ? drafts : nonDrafts).filter(p => p.folderId === folder.id)

    return (
      <div key={folder.id} style={{ marginLeft: depth > 0 ? 12 : 0, marginTop: 4 }}>
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
            padding: '4px 6px', margin: '2px 6px', borderRadius: 6,
            background: dragOverFolderId === folder.id ? (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
            transition: 'background 0.1s', cursor: 'pointer',
          }}
          onClick={() => {
            setCollapsedFolders(prev => {
              const next = new Set(prev)
              if (next.has(folder.id)) next.delete(folder.id)
              else next.add(folder.id)
              return next
            })
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
                width: '100%', padding: '4px 8px',
                fontFamily: uiFont, fontSize: '0.78rem',
                background: 'transparent', border: 'none',
                outline: `1px solid ${c.accent}`, borderRadius: 4, color: c.text,
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <ChevronDown
                size={14}
                style={{
                  color: c.textMuted, transition: 'transform 0.2s',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  flexShrink: 0
                }}
              />
              <span style={{
                fontFamily: uiFont, fontSize: '0.75rem', fontWeight: 600,
                color: c.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {folder.name}
              </span>
            </div>
          )}
          
          {!renamingFolderId && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center" onClick={e => e.stopPropagation()}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={e => { e.stopPropagation(); setFolderMenuOpenId(folderMenuOpenId === folder.id ? null : folder.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: c.textMuted }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
                >
                  <MoreHorizontal size={14} />
                </button>
                
                {folderMenuOpenId === folder.id && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: c.panel, border: `1px solid ${c.borderFaint}`, borderRadius: 6, padding: '4px', display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 120 }}>
                    <button
                      onClick={e => { e.stopPropagation(); onNewPage(activeTab === 'drafts', folder.id); setCollapsedFolders(prev => { const next = new Set(prev); next.delete(folder.id); return next; }); setFolderMenuOpenId(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', color: c.text, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: uiFont, width: '100%', textAlign: 'left', borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'))}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <FileText size={12} /> {t(lang, 'newDocument')?.replace('+', '').trim() || 'New Document'}
                    </button>
                    <div style={{ height: 1, background: c.borderFaint, margin: '2px 0' }} />
                    <button
                      onClick={e => { e.stopPropagation(); setRenamingFolderId(folder.id); setFolderRenameVal(folder.name); setFolderMenuOpenId(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', color: c.text, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: uiFont, width: '100%', textAlign: 'left', borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'))}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Edit2 size={12} /> {t(lang, 'rename')}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteFolder(folder.id); setFolderMenuOpenId(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', color: '#e05050', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: uiFont, width: '100%', textAlign: 'left', borderRadius: 4 }}
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
                  marginLeft: 6 + (depth + 1) * 14 + 6, padding: '4px 10px',
                  fontFamily: uiFont, fontSize: '0.68rem', color: c.textMuted, fontStyle: 'italic',
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
    const rootPages = list.filter(p => !p.folderId || !folders.find(f => f.id === p.folderId))

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
              padding: '10px 12px', fontFamily: uiFont, fontSize: '0.72rem',
              color: c.textMuted, fontStyle: 'italic',
              background: dragOverFolderId === 'root' ? (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
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
              background: dragOverFolderId === 'root' ? (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
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

  return (
    <div
      style={{
        width: 320, flexShrink: 0, display: 'flex', flexDirection: 'row',
        height: '100%', maxHeight: '100%',
        background: c.panel,
        overflow: 'hidden',
      }}
    >
      {/* Vertical tab strip */}
      <div style={{
        width: 44, flexShrink: 0, height: '100%',
        background: c.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)',
        borderRight: `1px solid ${c.borderFaint}`,
        display: 'flex', flexDirection: 'column',
        paddingTop: 12, overflowY: 'auto', gap: 4, alignItems: 'center'
      }}>
        {onGoHome && (
          <button
            onClick={onGoHome}
            title={t(lang, 'returnToWelcome') || 'Return to Welcome Screen'}
            style={{
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: 8,
              background: 'transparent',
              color: c.textMuted,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.color = c.textMuted; e.currentTarget.style.background = 'transparent' }}
          >
            <Home size={18} />
          </button>
        )}
        {onGoHome && <div style={{ width: 24, height: 1, background: c.borderFaint, margin: '4px 0' }} />}
        {[
          { key: 'files', icon: FileText, label: t(lang, 'files') || 'Files' },
          { key: 'codex', icon: Type, label: t(lang, 'storyCodex') || 'Story Codex' },
          { key: 'editorial', icon: Activity, label: t(lang, 'editorial') || 'Editorial' },
          { key: 'footnotes', icon: Bookmark, label: t(lang, 'footnotes') || 'Footnotes' },
          { key: 'citations', icon: BookOpen, label: t(lang, 'citations') || 'Citations' },
          { key: 'table', icon: TableIcon, label: t(lang, 'table') || 'Table' },
          { key: 'highlights', icon: Highlighter, label: lang === 'vi' ? 'Highlights' : 'Highlights' },
        ].map(tab => {
          const active = (props.leftSidebarMainTab || 'files') === tab.key
          return (
            <button
              key={tab.key}
              title={tab.label}
              onClick={() => (props.onLeftSidebarMainTabChange as (k: string) => void)?.(tab.key)}
              style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', borderRadius: 8,
                background: active ? (c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
                color: active ? c.text : c.textMuted,
                boxShadow: active ? (c.isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)') : 'none',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) { e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
              }}
              onMouseLeave={e => {
                if (!active) { e.currentTarget.style.color = c.textMuted; e.currentTarget.style.background = 'transparent' }
              }}
            >
              <tab.icon size={18} />
            </button>
          )
        })}
      </div>

      <div
        onClick={() => setFolderMenuOpenId(null)}
        style={{
          flex: 1, flexShrink: 0, display: 'flex', flexDirection: 'column',
          height: '100%', maxHeight: '100%',
          borderRight: `1px solid ${c.borderFaint}`,
          overflow: 'hidden', minWidth: 0,
        }}
      >
        {/* Header */}
      <div style={{ padding: '16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: `1px solid ${c.borderFaint}`, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, height: 24, minWidth: 0, overflow: 'hidden' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, overflow: 'hidden' }}
            onClick={() => setShowProjSearch(v => !v)}
            title={t(lang, 'switchProject') || 'Switch Project'}
          >
            <div style={{ position: 'relative', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FolderIcon size={18} style={{ color: c.accent, fill: c.accent, opacity: 0.2, position: 'absolute' }} />
              <FolderIcon size={18} style={{ color: c.accent, position: 'absolute' }} />
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 600, color: c.text, fontFamily: uiFont, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '18px', display: 'flex', alignItems: 'center' }}>
              {activeProject?.title || 'English'}
            </span>
          </div>
        </div>

        {onCloseSidebar && (
          <button
            type="button"
            onClick={onCloseSidebar}
            title={t(lang, 'collapse') || 'Collapse'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', color: c.textMuted,
              cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.color = c.textMuted; e.currentTarget.style.background = 'transparent' }}
          >
            <PanelLeftClose size={17} />
          </button>
        )}
      </div>
      {/* Project Switcher Dropdown (Conditional) */}
      {showProjSearch && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: `1px solid ${c.borderFaint}`, background: c.surface }}>
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
                  width: '100%', padding: '4px 8px', fontFamily: uiFont, fontSize: '0.85rem',
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '3px' }}
                >
                  <Edit2 size={13} />
                </button>
                {projectsProp.length > 1 && (
                  <button
                    type="button"
                    title={t(lang, 'deleteProject') || 'Delete Project'}
                    onClick={() => { if (window.confirm('Delete project?')) onDeleteProject(activeProjectId) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '3px' }}
                  >
                    <Trash2 size={13} />
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
                width: '100%', padding: '6px 8px', fontFamily: uiFont, fontSize: '0.8rem',
                background: c.bg, border: `1px solid ${c.borderFaint}`, borderRadius: 6,
                color: c.text, outline: 'none'
              }}
            />
            {projSearchQuery && (
              <button onClick={() => setProjSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '2px' }} title="Clear search">
                <X size={12} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onNewProject} style={{ flex: 1, padding: '6px', background: (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), color: c.accent, borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}>+ {t(lang, 'newProject') || 'New Project'}</button>
            <button onClick={handleLeftPanelImport} style={{ flex: 1, padding: '6px', background: c.bg, color: c.text, border: `1px solid ${c.borderFaint}`, borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Upload size={12} /> {t(lang, 'importFile') || 'Import'}
            </button>
          </div>
        </div>
      )}


      {/* Main scrollable body */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', overflowX: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {(props.leftSidebarMainTab || 'files') === 'codex' ? (
          <StoryCodexPanel
            theme={props.theme as any}
            uiFont={props.uiFont as any}
            lang={props.lang as any}
            entities={props.codexEntities as any || []}
            onUpdate={props.onUpdateCodexEntities || (() => {})}
            editor={props.editor as any}
          />
        ) : (props.leftSidebarMainTab || 'files') === 'editorial' ? (
          <EditorialInspectorPanel
            theme={props.theme as any}
            uiFont={props.uiFont as any}
            lang={props.lang as any}
            editor={props.editor as any}
            onHighlightWord={props.onEditorialHighlight || (() => {})}
          />
        ) : (props.leftSidebarMainTab || 'files') === 'table' ? (
          <TableInspectorPanel
            editor={props.editor as Editor | null}
            theme={{
              bg: c.bg,
              text: c.text,
              textMuted: c.textMuted,
              textFaint: c.textMuted,
              accent: c.accent,
              accentLight: (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              border: c.border,
              borderFaint: c.borderFaint,
              surface: c.surface,
              isDark: c.isDark,
            }}
            lang={lang}
            uiFont={uiFont}
          />
        ) : (props.leftSidebarMainTab || 'files') === 'footnotes' ? (
          <FootnotesPanel
            theme={{
              bg: c.bg,
              text: c.text,
              textMuted: c.textMuted,
              textFaint: c.textMuted,
              accent: c.accent,
              accentLight: (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              border: c.border,
              borderFaint: c.borderFaint,
              surface: c.surface,
              isDark: c.isDark,
            }}
            uiFont={uiFont}
            docFont={(props.docFont as string) || 'Georgia'}
            lang={lang}
            rawContent={(props.activePage as { content?: string } | undefined)?.content || ''}
            onUpdateFootnoteContent={(props.onUpdateFootnoteContent as unknown as (id: string, content: string) => void) || (() => {})}
            onInsertNewFootnote={(props.onInsertNewFootnote as unknown as () => void) || (() => {})}
            onDeleteFootnote={(props.onDeleteFootnote as unknown as (id: string) => void) || (() => {})}
            onScrollToEditorMarker={(props.onScrollToEditorMarker as unknown as (id: string) => void) || (() => {})}
            activeHighlightedId={props.activeFootnoteHighlight as string | null | undefined}
            onClearHighlight={(props.onClearFootnoteHighlight as unknown as () => void) || (() => {})}
          />
        ) : (props.leftSidebarMainTab || 'files') === 'highlights' ? (
          <HighlightsPanel theme={props.theme as any} editor={props.editor as any} lang={props.lang as any} uiFont={props.uiFont as any} />
        ) : (props.leftSidebarMainTab || 'files') === 'citations' ? (
          <CitationsPanel
            theme={{
              bg: c.bg,
              text: c.text,
              textMuted: c.textMuted,
              textFaint: c.textMuted,
              accent: c.accent,
              accentLight: (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              border: c.border,
              borderFaint: c.borderFaint,
              surface: c.surface,
              isDark: c.isDark,
            }}
            uiFont={uiFont}
            lang={lang}
            sources={(props.citationSources as unknown as CitationSource[]) || []}
            onUpdateSources={(props.onUpdateCitationSources as unknown as (sources: CitationSource[]) => void) || (() => {})}
            currentStyle={(props.citationStyle as unknown as CitationStyle) || 'apa'}
            onChangeStyle={(props.onUpdateCitationStyle as unknown as (style: CitationStyle) => void) || (() => {})}
            onInsertCitationMarker={(props.onInsertCitationMarker as unknown as (key: string) => void) || (() => {})}
          />
        ) : (
          <div className="p-3 space-y-4">
            {/* Pages Section */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color={c.textMuted} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: c.text, fontFamily: uiFont, letterSpacing: '0.05em' }}>{t(lang, 'pages')}</span>
                </div>
                <button 
                  onClick={() => { setActiveTab('pages'); onNewPage(false); }} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {renderTabContent(false)}
            </div>

            {/* Drafts Section */}
            <div style={{ marginTop: 16 }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 8 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                   <span style={{ fontSize: '0.9rem', fontWeight: 600, color: c.text, fontFamily: uiFont, letterSpacing: '0.05em' }}>{t(lang, 'drafts')}</span>
                 </div>
                 <button 
                   onClick={() => { setActiveTab('drafts'); onNewPage(true); }} 
                   style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}
                 >
                   <Plus size={16} />
                 </button>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 {renderTabContent(true)}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0, borderTop: `1px solid ${c.borderFaint}` }}>
        {onOpenGithubCloudSave && (
          <button 
            onClick={onOpenGithubCloudSave}
            style={{ 
              width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${c.border}`, 
              background: 'transparent', color: c.text, fontFamily: uiFont, fontSize: '0.75rem', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.background = c.surface }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            {t(lang, 'cloudSaveSync') || 'Cloud Save & Sync'}
          </button>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setBinOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} title="Bin">
              <Trash2 size={16} /> {t(lang, 'bin')?.toUpperCase() || 'BIN'}
            </button>
          </div>
          
          {/* Sync Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.65rem', color: c.textMuted, fontFamily: uiFont }}>{syncLabel}</span>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: syncDotColor, boxShadow: syncStatus === 'saving' ? `0 0 0 3px ${syncDotColor}44` : 'none', transition: 'all 0.3s' }} />
          </div>
        </div>
      </div>
      
      {/* Bin Overlay */}
      {binOpen && (
        <div style={{ position: 'absolute', bottom: 'calc(64px + env(safe-area-inset-bottom))', left: 16, width: 248, background: c.panel, border: `1px solid ${c.border}`, borderRadius: 12, padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: `1px solid ${c.borderFaint}`, paddingBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(lang, 'bin')}</span>
            {bin.length > 0 && (
              <button onClick={onEmptyBin} style={{ fontSize: '0.7rem', color: '#e05050', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>{t(lang, 'emptyBin') || 'Empty All'}</button>
            )}
          </div>
          {bin.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: c.textMuted, textAlign: 'center', padding: '16px 0' }}>{t(lang, 'noDeletedItems') || 'No deleted items'}</div>
          ) : (
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bin.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', background: c.surface, borderRadius: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, paddingRight: 8 }}>{p.title}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => onRestorePage(p.id)} style={{ padding: 4, background: (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), color: c.accent, borderRadius: 4, border: 'none', cursor: 'pointer' }} title={t(lang, 'restore') || 'Restore'}><RotateCcw size={12} /></button>
                    <button onClick={() => onPermanentDelete(p.id)} style={{ padding: 4, background: 'rgba(224, 80, 80, 0.1)', color: '#e05050', borderRadius: 4, border: 'none', cursor: 'pointer' }} title={t(lang, 'deleteForever') || 'Delete Forever'}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  )
}

export default React.memo(LeftPanel, (prevProps, nextProps) => {
  if (prevProps.leftSidebarMainTab !== nextProps.leftSidebarMainTab) return false;
  if (prevProps.citationStyle !== nextProps.citationStyle) return false;
  if (prevProps.activeFootnoteHighlight !== nextProps.activeFootnoteHighlight) return false;
  if (prevProps.citationSources !== nextProps.citationSources) return false;
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

      // Shallow structural check: id, title, folderId
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
