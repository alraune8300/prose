/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import {  Page, Folder, SyncStatus, Project } from './types'
import { Lang, t as i18nT } from './i18n'
import { 
  Home, Folder as FolderIcon, Edit2, FileText, Trash2, 
  ChevronDown, ChevronRight, X, ArrowLeft,
  PaintRoller, Github, Archive, Plus, ChevronUp, PanelLeftClose
 } from 'lucide-react'
import { importJsonBackupFile } from './fileHandlers';
import { saveProjectToDB, saveFolderToDB } from './db';

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
  const uiFont = props.uiFont as string | undefined;
  const cProp = props.c as Record<string, unknown> | undefined
  const themeProp = props.theme as Record<string, unknown> | undefined

  const c = {
    bg: (cProp?.bg || themeProp?.bg || '#ffffff') as string,
    heroGrad: (cProp?.heroGrad || themeProp?.heroGrad || '#ffffff') as string,
    panel: (cProp?.panel || themeProp?.panel || '#f9f9f9') as string,
    surface: (cProp?.surface || themeProp?.surface || '#ffffff') as string,
    text: (cProp?.text || themeProp?.text || '#333333') as string,
    textMuted: (cProp?.textMuted || themeProp?.textMuted || '#888888') as string,
    borderFaint: (cProp?.borderFaint || themeProp?.borderFaint || '#eaeaea') as string,
    accent: (cProp?.accent || themeProp?.accent || '#555555') as string,
    accentLight: (cProp?.accentLight || themeProp?.accentLight || '#f0f0f0') as string,
    accentMid: (cProp?.accentMid || themeProp?.accentMid || '#dddddd') as string,
    isDark: Boolean(cProp?.isDark || themeProp?.isDark)
  }

  const lang = (props.lang || 'en') as Lang
  
  const projects = (props.projects || []) as Project[]
  const activeProjectId = props.activeProjectId as string | null
  
  const activeProject = projects.find(p => p.id === activeProjectId)

  const folders = (activeProject?.folders || []) as Folder[]
  const rawPages = (activeProject?.pages || []) as Page[]
  const rawDrafts = (activeProject?.drafts || []) as Page[]
  const rawScratchpads = (activeProject?.scratchpad || []) as Page[]

  const rootPages = rawPages.filter(p => !p.isArchived)
  const drafts = rawDrafts.filter(p => !p.isArchived)
  const scratchpads = rawScratchpads.filter(p => !p.isArchived)
  
  // Create merged list to find activePage safely
  const allPages = [...rawPages, ...rawDrafts, ...rawScratchpads];
  
  const activePageId = props.activePageId as string | null
  const syncStatus = (props.syncStatus || 'synced') as SyncStatus

  const onSelectPage = (props.onSelectPage || props.onSelectDoc || (() => {})) as (id: string) => void
  const onNewPage = (props.onNewPage || props.onNewDoc || (() => {})) as (isDraft?: boolean, folderId?: string, isScratchpad?: boolean) => void
  const onNewScratchpad = (props.onNewScratchpad || (() => {})) as () => void
  const onRenamePage = (props.onRenamePage || props.onRenameDoc || (() => {})) as (id: string, title: string) => void
  const onRenameProject = (props.onRenameProject || (() => {})) as (id: string, name: string) => void
  const onRenameScratchpadSection = (props.onRenameScratchpadSection || (() => {})) as (title: string) => void
  const onDeletePage = (props.onDeletePage || props.onDeleteDoc || (() => {})) as (id: string) => void
  
  const onSelectProject = (props.onSelectProject || (() => {})) as (id: string | null) => void

  const onRenameFolder = (props.onRenameFolder || (() => {})) as (id: string, name: string) => void
  const onDeleteFolder = (props.onDeleteFolder || (() => {})) as (id: string) => void
  const onMovePageToFolder = (props.onMovePageToFolder || props.onMoveDoc || (() => {})) as (pageId: string, folderId: string | undefined) => void
  
  const onOpenGithubCloudSave = props.onOpenGithubCloudSave as (() => void) | undefined;
  const onOpenThemeModal = props.onOpenThemeModal as (() => void) | undefined;
  const onClose = (props.onClose || props.onCloseSidebar) as (() => void) | undefined;
  const onGoHome = (props.onGoHome || props.onGoToRoot) as (() => void) | undefined;

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const [renamingProjId, setRenamingProjId] = useState<string | null>(null)
  const [projRenameVal, setProjRenameVal] = useState('')
  const [, setTick] = useState(0)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [folderRenameVal, setFolderRenameVal] = useState('')
  
  const [pageMenuOpenId, setPageMenuOpenId] = useState<string | null>(null)
  
  const [dragPageId, setDragPageId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'root'>(null)
  
  // Custom Accordion States for the 3 main sections - default expanded so files show immediately
  const [pagesExpanded, setPagesExpanded] = useState(true);
  const [draftsExpanded, setDraftsExpanded] = useState(true);
  const [scratchpadExpanded, setScratchpadExpanded] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = () => {
      setPageMenuOpenId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const commitRename = (id: string) => {
    if (renameVal.trim()) onRenamePage(id, renameVal.trim())
    setRenamingId(null)
  }

  const commitProjRename = (id: string) => {
    if (projRenameVal.trim()) onRenameProject(id, projRenameVal.trim())
    setRenamingProjId(null)
  }
  
  const commitFolderRename = (id: string) => {
    if (folderRenameVal.trim()) onRenameFolder(id, folderRenameVal.trim())
    setRenamingFolderId(null)
  }

  const toggleFolder = (id: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const t = i18nT

  let syncDotColor = '#4caf50'
  if (syncStatus === 'syncing') syncDotColor = '#fbbf24'
  if (syncStatus === 'error') syncDotColor = '#ef4444'

  let syncLabel = t(lang, 'savedJustNow') || 'Saved just now'
  if (syncStatus === 'syncing') syncLabel = t(lang, 'savingEllipsis') || 'Saving...'
  if (syncStatus === 'error') syncLabel = t(lang, 'syncError') || 'Sync error'
  
  const handleAddNewPage = (isDraft: boolean, isScratchpad: boolean) => {
    onNewPage(isDraft, undefined, isScratchpad);
  };

  const renderPage = (p: Page, depth: number) => {
    const isActive = p.id === activePageId
    
    return (
      <div 
        key={p.id}
        draggable
        onDragStart={() => setDragPageId(p.id)}
        onDragEnd={() => setDragPageId(null)}
        onClick={() => {
          onSelectPage(p.id)
        }}
        style={{
          display: 'flex', flexDirection: 'column',
          cursor: 'pointer',
          padding: '8px 0', borderBottom: `1px solid ${c.borderFaint}`,
          marginLeft: depth * 12
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {renamingId === p.id ? (
            <input
              autoFocus
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={() => commitRename(p.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename(p.id)
                if (e.key === 'Escape') setRenamingId(null)
              }}
              style={{
                width: '100%', padding: 0,
                fontFamily: (uiFont || 'inherit'), fontSize: '1rem',
                background: 'transparent', border: 'none',
                outline: 'none', color: c.text,
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, overflow: 'hidden' }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: (uiFont || 'inherit'), fontSize: "1.05rem", color: isActive ? c.text : c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.title || t(lang, 'untitled')}
              </span>
              <span style={{ flexShrink: 0, fontFamily: (uiFont || 'inherit'), fontSize: "0.65rem", color: c.textMuted, opacity: 0.6, whiteSpace: "nowrap" }}>
                {timeSince(new Date(p.updatedAt || p.lastModified), lang)}
              </span>
            </div>
          )}
          
          {!renamingId && (
            <button
              onClick={e => { 
                e.stopPropagation(); 
                setPageMenuOpenId(pageMenuOpenId === p.id ? null : p.id); 
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 8px', display: 'flex', alignItems: 'center' }}
            >
              {pageMenuOpenId === p.id ? (
                <ChevronUp size={16} style={{ color: c.text }} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={16} style={{ color: c.text }} strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>

        {pageMenuOpenId === p.id && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, marginBottom: 4 }}>
            <button
              onClick={e => { e.stopPropagation(); setRenamingId(p.id); setRenameVal(p.title); setPageMenuOpenId(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: c.text, display: 'flex', fontSize: '1rem', fontFamily: (uiFont || 'inherit'), width: '100%', textAlign: 'right', justifyContent: 'flex-end' }}
            >
              {t(lang, 'rename') || 'Rename'}
            </button>
            <button
              onClick={e => { 
                e.stopPropagation(); 
                if (props.onArchivePage) (props.onArchivePage as (id: string) => void)(p.id);
                setPageMenuOpenId(null); 
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: c.text, display: 'flex', fontSize: '1rem', fontFamily: (uiFont || 'inherit'), width: '100%', textAlign: 'right', justifyContent: 'flex-end' }}
            >
              {t(lang, 'archive') || 'Archive'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDeletePage(p.id); setPageMenuOpenId(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: c.text, display: 'flex', fontSize: '1rem', fontFamily: (uiFont || 'inherit'), width: '100%', textAlign: 'right', justifyContent: 'flex-end' }}
            >
              {t(lang, 'delete') || 'Delete'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderSectionHeader = (title: string, onAdd: () => void, isExpanded: boolean, setExpanded: (v: boolean) => void) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: 8 }} onClick={() => setExpanded(!isExpanded)}>
      <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.9rem', color: c.text, textTransform: 'capitalize' }}>
        {title}
      </span>
      <button 
        onClick={e => { e.stopPropagation(); onAdd(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, padding: 0, display: 'flex', alignItems: 'center' }}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
  
  const activePage = allPages.find(p => p.id === activePageId)

  return (
    <div 
      style={{ 
        width: 260, height: '100%', display: 'flex', flexDirection: 'column', 
        background: c.panel,
        borderRight: `1px solid ${c.borderFaint}`,
        overflow: 'hidden'
      }}
    >
        {/* Header Breadcrumbs */}
        <div style={{ padding: '24px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => {}} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: c.text, display: 'flex', visibility: 'hidden' }}>
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '1.2rem', color: c.text }}>
                {activeProject?.name || activeProject?.title || t(lang, 'myNotes') || 'My Notes'}
              </span>
              <ChevronDown size={16} strokeWidth={1.5} style={{ color: c.text, display: 'none' }} />
            </div>
            <button onClick={() => { if (onClose) onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: c.text, display: 'flex' }}>
              <PanelLeftClose size={18} strokeWidth={1.5} />
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderBottom: `1px solid ${c.textMuted}`, paddingBottom: 12 }}>
            <span onClick={() => { if (onGoHome) onGoHome(); }} style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.85rem', color: c.text, cursor: 'pointer' }}>{t(lang, 'home') || 'Home'}</span>
            {activePage?.folderId && (
              <>
                <ChevronRight size={10} strokeWidth={3} style={{ color: c.text }} />
                <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.85rem', color: c.text }}>{folders.find(f => f.id === activePage.folderId)?.name || t(lang, 'folderLabel') || 'Folder'}</span>
              </>
            )}
            <ChevronRight size={10} strokeWidth={3} style={{ color: c.text }} />
            <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.85rem', color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{activePage?.title || t(lang, 'fileNameLabel') || 'File name'}</span>
          </div>
        </div>

        {/* Content */}
        <div className="kgv-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* Pages Section */}
              <div style={{ marginBottom: 16 }}>
                {renderSectionHeader(t(lang, 'pagesSection') || t(lang, 'pages') || 'Pages', () => { handleAddNewPage(false, false); }, pagesExpanded, setPagesExpanded)}
                {pagesExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {rootPages.map(p => renderPage(p, 0))}
                  </div>
                )}
              </div>
              <div style={{ borderBottom: `1px solid ${c.borderFaint}`, margin: '0 0 16px 0' }} />

              {/* Drafts Section */}
              <div style={{ marginBottom: 16 }}>
                {renderSectionHeader(t(lang, 'draftsSection') || t(lang, 'draft') || 'Draft', () => { handleAddNewPage(true, false); }, draftsExpanded, setDraftsExpanded)}
                {draftsExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {drafts.map(p => renderPage(p, 0))}
                  </div>
                )}
              </div>
              <div style={{ borderBottom: `1px solid ${c.borderFaint}`, margin: '0 0 16px 0' }} />

              {/* Scratchpad Section */}
              <div style={{ marginBottom: 16 }}>
                {renderSectionHeader(t(lang, 'scratchpadSection') || t(lang, 'scratchpad') || 'Scratchpad', () => { 
                   if (onNewScratchpad) {
                     onNewScratchpad();
                   } else {
                     handleAddNewPage(false, true);
                   }
                }, scratchpadExpanded, setScratchpadExpanded)}
                {scratchpadExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {scratchpads.map(p => renderPage(p, 0))}
                  </div>
                )}
              </div>
              
            </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                style={{
                  padding: 0, border: 'none', background: 'transparent', display: 'flex', cursor: 'pointer'
                }}
              >
                <PaintRoller size={24} strokeWidth={1.5} style={{ color: c.text }} />
              </button>
            )}
            {onOpenGithubCloudSave && (
              <button 
                onClick={onOpenGithubCloudSave}
                style={{ 
                  padding: 0, border: 'none', background: 'transparent', display: 'flex', cursor: 'pointer'
                }}
              >
                <Github size={24} strokeWidth={1.5} style={{ color: c.text }} />
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', color: c.textMuted, fontFamily: (uiFont || 'inherit') }}>{syncLabel}</span>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: syncDotColor, transition: 'all 0.3s' }} />
          </div>
        </div>
    </div>
  )
}
export default LeftPanel
