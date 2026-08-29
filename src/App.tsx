import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  THEMES, deriveCustomTheme, WELCOME_ID,
  BUILTIN_FONTS,
} from './theme';
import { getDict, type Dict } from './i18n';
import { exportTxt, exportJson } from './exportUtils';
import { isMarkdownText, parseMarkdownToHtml } from "./clipboardEngine";
import { importFile, exportToOdt, exportToHtmlFile, exportToMarkdownFile, exportToJsonBackup } from './fileHandlers';
import { saveApiKey, loadApiKey, injectGoogleFont, reinjectSavedFonts } from './googleFontsApi';
import {  X, Plus, Minus, ZoomIn, Eye, Maximize2, PanelLeft, Hourglass, Coffee, Settings, LayoutList, Columns, Brain, FileText, GitCompare, Table, FoldVertical, UnfoldVertical, Terminal, Sparkles, Trash2 , Activity, Type } from 'lucide-react';
import type { Editor as TiptapEditorType } from '@tiptap/react';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import BlockOrganizerPanel from './BlockOrganizerPanel';
import FlashcardStudio from './FlashcardStudio';
import GoogleFontsPanel from './GoogleFontsPanel';
import SplitRevisionStudio from './SplitRevisionStudio';
import CommandPaletteModal, { type CommandItem } from './CommandPaletteModal';
import Editor from './Editor';
import Toolbar from './Toolbar';
import WelcomeScreen from './WelcomeScreen';
import ThemeStudioModal from './ThemeStudioModal';
import GithubCloudSaveModal from './GithubCloudSaveModal';
import ReferenceComparePanel from './ReferenceComparePanel';
import { ZenReader } from "./ZenReader";
import LinkHoverPreview from './LinkHoverPreview';
import WordCountDropdown from './WordCountDropdown';
import type { CitationSource, CitationStyle } from './citationsEngine';
import type { Document, Folder, ThemeColors, ThemeMode, CustomTheme, CustomFont, Lang, Project, Page, FormatState, PageFormat, Panel } from './types';
import { PAPER_SIZES_PX } from './types';
import { getAllProjectsFromDB, saveProjectToDB, deleteProjectFromDB, getAppSettings, saveAppSettings, db, getAllFoldersFromDB } from './db';

// --- localStorage helpers ---
const LS = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string): void { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  getJSON<T>(k: string): T | null { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) as T : null; } catch { return null; } },
  setJSON(k: string, v: unknown): void { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};

function loadThemeMode(): ThemeMode {
  const v = LS.get('kgv-theme');
  return v || 'light';
}
function loadCustomThemes(): CustomTheme[] {
  const p = LS.getJSON<CustomTheme[]>('kgv-custom-themes');
  if (Array.isArray(p)) return p;
  
  // Migration from old single custom theme
  const single = LS.getJSON<any>('kgv-custom-theme');
  if (single && single.bg && single.text) {
    const migrated: CustomTheme = {
      id: 'custom-legacy',
      name: 'Legacy Custom',
      isCustom: true,
      bg: single.bg,
      text: single.text,
      accent: single.accent || '#2563EB',
      surface: single.bg,
      textMuted: single.text,
      border: single.text
    };
    return [migrated];
  }
  return [];
}
function loadFont(): string { return LS.get('kgv-font') || 'Merriweather'; }
function loadHeadingFont(): string { return LS.get('kgv-heading-font') || 'Playfair Display'; }
function loadMonoFont(): string { return LS.get('kgv-mono-font') || 'JetBrains Mono'; }
function loadUiFont(): string { return LS.get('kgv-ui-font') || 'Inter'; }
function loadLang(): Lang {
  const v = LS.get('kgv-lang');
  if (v === 'en' || v === 'vi' || v === 'fr' || v === 'de' || v === 'it' || v === 'es' || v === 'ko' || v === 'zh' || v === 'ja') {
    return v;
  }
  return 'vi';
}
function loadFontSize(): number { const v = LS.get('kgv-font-size'); return v ? parseInt(v, 10) : 18; }
function loadCustomFont(): CustomFont | null { return LS.getJSON<CustomFont>('kgv-custom-font'); }
function loadCustomFonts(): CustomFont[] {
  const list = LS.getJSON<CustomFont[]>('kgv-custom-fonts');
  if (Array.isArray(list) && list.length > 0) return list;
  const single = loadCustomFont();
  return single ? [single] : [];
}

export function injectCustomFontCSS(f: CustomFont) {
  const familyName = (f.family || f.name || 'CustomFont').trim();
  const styleId = `kgv-custom-font-style-${familyName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  const cleanFamily = familyName.replace(/["']/g, '');
  styleEl.textContent = `
    @font-face {
      font-family: "${cleanFamily}";
      src: url("${f.dataUrl}");
      font-display: swap;
    }
  `;
}

async function applyCustomFont(f: CustomFont): Promise<string> {
  const cleanFamily = (f.family || f.name || 'CustomFont').replace(/["']/g, '').trim();
  if (!cleanFamily || !f.dataUrl) return cleanFamily;

  injectCustomFontCSS({ ...f, family: cleanFamily });

  try {
    if ('FontFace' in window) {
      const fontFace = new FontFace(cleanFamily, `url(${f.dataUrl})`);
      await fontFace.load();
      document.fonts.add(fontFace);
    }
  } catch (err) {
    console.warn(`FontFace API warning for font ${cleanFamily}:`, err);
  }

  return cleanFamily;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [activePageId, setActivePageId] = useState('');
  const [isWorkspaceActive, setIsWorkspaceActive] = useState(false);

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  const allPagesInActiveProj = useMemo(() => {
    if (!activeProject) return [];
    return [...(activeProject.pages || []), ...(activeProject.drafts || [])];
  }, [activeProject]);

  const activePage = useMemo(() => {
    if (!activeProject) return undefined;
    const found = allPagesInActiveProj.find((p) => p.id === activePageId);
    return found || activeProject.pages?.[0] || activeProject.drafts?.[0];
  }, [activeProject, allPagesInActiveProj, activePageId]);

  const safeActiveContent = useMemo(() => {
    let c = activePage?.content || "";
    if (!c) return c;
    if (c.includes("&lt;p&gt;") || c.includes("&lt;h") || c.includes("&lt;div&gt;")) {
        const doc = new DOMParser().parseFromString(c, "text/html");
        c = doc.documentElement.textContent || c;
    }
    if (!/<(p|h[1-6]|ul|ol|blockquote|table|div)>/i.test(c) && isMarkdownText(c) >= 1) {
      c = parseMarkdownToHtml(c);
    }
    return c;
  }, [activePage?.content]);

  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  // We can still use customTheme state for the CURRENT active custom theme if themeMode === 'custom' or its id
  const [customTheme, setCustomTheme] = useState<CustomTheme | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [docFont, setDocFont] = useState(() => loadFont());
  const [headingFont, setHeadingFont] = useState(() => loadHeadingFont());
  const [monoFont, setMonoFont] = useState(() => loadMonoFont());
  const [uiFont, setUiFont] = useState('Inter');
  const [customFonts, setCustomFonts] = useState<CustomFont[]>(() => loadCustomFonts());
  const [injectedGoogleFonts, setInjectedGoogleFonts] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('kgv-injected-gfonts');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    const handleInjected = (e: Event) => setInjectedGoogleFonts((e as CustomEvent).detail);
    window.addEventListener('kgv-gfont-injected', handleInjected);
    return () => window.removeEventListener('kgv-gfont-injected', handleInjected);
  }, []);
  const [customFont, setCustomFont] = useState<CustomFont | null>(() => {
    const list = loadCustomFonts();
    return list.length > 0 ? list[list.length - 1] : null;
  });
  const [lang, setLang] = useState<Lang>(() => loadLang());
  const [fontSize, setFontSize] = useState(18);
  const [apiKey, setApiKey] = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [readerStyle, setReaderStyle] = useState<"classic" | "zen">("zen");
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isSplitRevisionOpen, setIsSplitRevisionOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'block' | 'flashcard'>('normal');
  const [activeFootnoteHighlight, setActiveFootnoteHighlight] = useState<string | null>(null);
  const [blockViewOpen, setBlockViewOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [activeBlockEditor, setActiveBlockEditor] = useState<TiptapEditorType | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<Panel>('settings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [zoomInput, setZoomInput] = useState<string>('100');
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const [citationSources, setCitationSources] = useState<CitationSource[]>(() => {
    try {
      const raw = localStorage.getItem('kgv-citation-sources');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('apa');
  const [leftSidebarMainTab, setLeftSidebarMainTab] = useState<'files' | 'footnotes' | 'citations' | 'table' | 'highlights' | 'editorial' | 'codex' | 'outline'>('files');
  const previousLeftSidebarTabRef = useRef<'files' | 'footnotes' | 'citations'>('files');

  // Command Palette states
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [codexEntities, setCodexEntities] = useState<any[]>([]);
  const [editorialHighlight, setEditorialHighlight] = useState<any>(null);
  const [creativeOptions, setCreativeOptions] = useState({ rhythmEnabled: false, dialogueEnabled: false, lang: 'en' });
  
  useEffect(() => {
    // Load codex entities from DB if available, we'll store them in AppSettings for now
    getAppSettings().then(s => {
      if (s?.codexEntities) setCodexEntities(s.codexEntities);
    });
  }, []);
  
  const handleUpdateCodexEntities = (entities: any[]) => {
    setCodexEntities(entities);
    getAppSettings().then(s => {
      saveAppSettings({ ...(s || {}), codexEntities: entities } as any);
    });
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setSidebarOpen(true);
        setLeftSidebarMainTab('outline');
      }
    };
    const handleOpenTable = () => {
      setRightPanelTab('table');
      setRightOpen(true);
    };

    const handleTableActiveChange = (e: Event) => {
      const { inTable } = (e as CustomEvent).detail || {};
      if (inTable) {
        setLeftSidebarMainTab((currentTab) => {
          if (currentTab !== 'table') {
            previousLeftSidebarTabRef.current = currentTab as 'files' | 'footnotes' | 'citations';
          }
          return 'table';
        });
      } else {
        setLeftSidebarMainTab((currentTab) => {
          if (currentTab === 'table') {
            return previousLeftSidebarTabRef.current || 'files';
          }
          return currentTab;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('kgv-open-table-picker', handleOpenTable);
    window.addEventListener('kgv-table-active-change', handleTableActiveChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('kgv-open-table-picker', handleOpenTable);
      window.removeEventListener('kgv-table-active-change', handleTableActiveChange);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kgv-citation-sources', JSON.stringify(citationSources));
    } catch (err) {
      console.error('Failed to save citations', err);
    }
  }, [citationSources]);

  // Footnote and citation open event listeners -> switches Left sidebar tabs and opens sidebar
  useEffect(() => {
    const handleFootnoteClicked = (e: Event) => {
      const { id } = (e as CustomEvent).detail || {};
      if (id) {
        setActiveFootnoteHighlight(id);
        setLeftSidebarMainTab('footnotes');
        setSidebarOpen(true);
      }
    };
    const handleOpenCitations = () => {
      setLeftSidebarMainTab('citations');
      setSidebarOpen(true);
    };
    const handleOpenFootnotes = () => {
      setLeftSidebarMainTab('footnotes');
      setSidebarOpen(true);
    };
    window.addEventListener('kgv-footnote-clicked', handleFootnoteClicked);
    window.addEventListener('kgv-open-citations', handleOpenCitations);
    window.addEventListener('kgv-open-footnotes', handleOpenFootnotes);
    return () => {
      window.removeEventListener('kgv-footnote-clicked', handleFootnoteClicked);
      window.removeEventListener('kgv-open-citations', handleOpenCitations);
      window.removeEventListener('kgv-open-footnotes', handleOpenFootnotes);
    };
  }, []);

  const handleInsertCitationMarker = (key: string) => {
    if (!activePage) return;
    const updated = (safeActiveContent) + ` [@${key}] `;
    updatePageContent(activePage.id, updated);
  };

  // Global drag & drop prevention to stop browser from navigating/refreshing when files are dropped outside handled zones
  useEffect(() => {
    const preventDefaultDrag = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDefaultDrag, false);
    window.addEventListener('drop', preventDefaultDrag, false);
    return () => {
      window.removeEventListener('dragover', preventDefaultDrag);
      window.removeEventListener('drop', preventDefaultDrag);
    };
  }, []);

  const handleUpdateFootnoteContent = (id: string, newContent: string) => {
    if (!activePage) return;
    const current = safeActiveContent;
    const defRegex = new RegExp(`\\[\\^${id}\\]:\\s*[^\\n<]*`, 'g');
    let updated = current;
    if (defRegex.test(current)) {
      updated = current.replace(defRegex, `[^${id}]: ${newContent}`);
    } else {
      updated = `${current}\n\n[^${id}]: ${newContent}`;
    }
    handleContentChange(updated);
  };

  const handleInsertNewFootnote = useCallback(() => {
    const current = safeActiveContent;
    // Find highest footnote number
    const regex = /\[\^(\d+)\]/g;
    let maxNum = 0;
    let m;
    while ((m = regex.exec(current)) !== null) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
    const nextNum = String(maxNum + 1);
    window.dispatchEvent(new CustomEvent('kgv-insert-footnote', { detail: { id: nextNum } }));
  }, [activePage?.content]);

  const handleDeleteFootnote = (id: string) => {
    if (!activePage) return;
    const current = safeActiveContent;
    const inlineRegex = new RegExp(`\\[\\^${id}\\]`, 'g');
    const defRegex = new RegExp(`\\[\\^${id}\\]:[^\\n<]*\\n?`, 'g');
    const updated = current.replace(inlineRegex, '').replace(defRegex, '');
    handleContentChange(updated);
  };

  const handleScrollToEditorMarker = (id: string) => {
    window.dispatchEvent(new CustomEvent('kgv-scroll-to-editor-footnote', { detail: { id } }));
  };

  const handleInsertQuoteToEditor = (quoteText: string) => {
    window.dispatchEvent(new CustomEvent('kgv-insert-quote', { detail: { text: quoteText } }));
  };

  useEffect(() => {
    // Detect tablet size on initial load to enlarge the default UI zoom to 120%
    const width = window.innerWidth;
    if (width >= 768 && width < 1024) {
      setZoomPercent(120);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const sidebarWidth = (sidebarOpen && window.innerWidth >= 768) ? 260 : 0;
      const rightPanelWidth = (rightOpen && window.innerWidth >= 768) ? 300 : 0;
      const padding = window.innerWidth >= 640 ? 48 : 32;
      const available = window.innerWidth - sidebarWidth - rightPanelWidth - padding;
      setContainerWidth(available);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, rightOpen]);

  // --- Android Navigation Gesture (Back Button) Support ---
  useEffect(() => {
    if (isWorkspaceActive) {
      window.history.pushState({ workspace: true }, '');
    }
  }, [isWorkspaceActive]);

  useEffect(() => {
    const handlePopState = () => {
      let handled = false;
      
      setGithubModalOpen(prev => { if (prev) { handled = true; return false; } return prev; });
      if (handled) { window.history.pushState({ workspace: true }, ''); return; }
      
      setFontExplorerOpen(prev => { if (prev) { handled = true; return false; } return prev; });
      if (handled) { window.history.pushState({ workspace: true }, ''); return; }
      
      setIsFocusMode(prev => { if (prev) { handled = true; return false; } return prev; });
      if (handled) { window.history.pushState({ workspace: true }, ''); return; }
      
      setIsPreviewMode(prev => { if (prev) { handled = true; return false; } return prev; });
      if (handled) { window.history.pushState({ workspace: true }, ''); return; }
      
      if (window.innerWidth < 768) {
        setRightOpen(prev => { if (prev) { handled = true; return false; } return prev; });
        if (handled) { window.history.pushState({ workspace: true }, ''); return; }
        
        setSidebarOpen(prev => { if (prev) { handled = true; return false; } return prev; });
        if (handled) { window.history.pushState({ workspace: true }, ''); return; }
      }

      setIsWorkspaceActive(prev => {
        if (prev) {
          handled = true;
          return false;
        }
        return prev;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  // --------------------------------------------------------

  useEffect(() => {
    setZoomInput(String(zoomPercent));
  }, [zoomPercent]);

  const commitZoomInput = () => {
    const num = parseInt(zoomInput, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(50, Math.min(250, num));
      setZoomPercent(clamped);
      setZoomInput(String(clamped));
    } else {
      setZoomInput(String(zoomPercent));
    }
  };

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [networkToast, setNetworkToast] = useState<{ message: string; type: 'offline' | 'online' } | null>(null);
  const [exportToast, setExportToast] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkToast({ message: 'Reconnected. Syncing workspace in the background...', type: 'online' });
      setTimeout(() => setNetworkToast(null), 4000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkToast({ message: 'Offline Mode Active. Writing is saved locally on your device.', type: 'offline' });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (!navigator.onLine) {
      setNetworkToast({ message: 'Offline Mode Active. Writing is saved locally on your device.', type: 'offline' });
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [fontExplorerOpen, setFontExplorerOpen] = useState(false);
  
  const [formatState, setFormatState] = useState<FormatState>(() => {
    const saved = LS.getJSON<FormatState>('kgv-format-state');
    return {
      fontFam: loadFont(),
      headingFontFam: loadHeadingFont(),
      monoFontFam: loadMonoFont(),
      fontSize: fontSize,
      lineH: 1.7,
      align: 'left',
      maxW: 794,
      paraSpacing: 1,
      letterSpacing: 0,
      wordSpacing: 0,
      smartQuotes: true,
      smartEllipses: true,
      markdownShortcuts: true,
      doubleSpacePeriod: false,
      toggleHeadings: false,
      dashesMode: 'en-em',
      firstLineIndent: false,
      pageNumbering: {
        enabled: false,
        position: 'bottom-center',
        style: 'arabic',
        skipTitlePage: true,
      },
      ...(saved || {}),
    };
  });

  useEffect(() => {
    LS.setJSON('kgv-format-state', formatState);
  }, [formatState]);

  useEffect(() => {
    document.documentElement.style.setProperty('--kgv-body-font', `'${docFont}', Georgia, serif`);
    document.documentElement.style.setProperty('--kgv-doc-font', `'${docFont}', Georgia, serif`);
    document.documentElement.style.setProperty('--kgv-heading-font', `'${headingFont}', serif`);
    document.documentElement.style.setProperty('--kgv-mono-font', `'${monoFont}', monospace`);
    document.documentElement.style.setProperty('--kgv-ui-font', `'${uiFont}', sans-serif`);
  }, [docFont, headingFont, monoFont, uiFont]);

  const [pageFormat, setPageFormat] = useState<PageFormat>({
    paperSize: 'A4',
    orientation: 'portrait',
    mode: 'pages',
  });



  const recalculatePagination = useCallback(() => {
    // No-op under the new Multi-page DOM Wrapper architecture
  }, []);



  // 1. KEYBOARD RESIZE LOCK: Only recalculate pagination on width changes
  useEffect(() => {
    let lastWidth = window.innerWidth;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (currentWidth !== lastWidth) {
        lastWidth = currentWidth;
        recalculatePagination();
      }
    };

    window.addEventListener('resize', handleResize);

    const viewport = window.visualViewport;
    const handleViewportResize = () => {
      if (viewport) {
        const currentWidth = viewport.width;
        // Small tolerance of 5px to avoid subpixel noise on zoom
        if (Math.abs(currentWidth - lastWidth) > 5) {
          lastWidth = currentWidth;
          recalculatePagination();
        }
      }
    };

    if (viewport) {
      viewport.addEventListener('resize', handleViewportResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (viewport) {
        viewport.removeEventListener('resize', handleViewportResize);
      }
    };
  }, [recalculatePagination]);

  const [viewportAppStyle, setViewportAppStyle] = useState<React.CSSProperties>({});

  // 3. LOCK APP VIEWPORT: Prevent virtual keyboard from pushing the entire layout up
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const lockViewport = () => {
      // Apply offset to counteract the browser's automatic upward shift when keyboard appears
      setViewportAppStyle({
        position: 'fixed',
        top: `${viewport.offsetTop}px`,
        left: `${viewport.offsetLeft}px`,
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
      });
    };

    viewport.addEventListener('resize', lockViewport);
    viewport.addEventListener('scroll', lockViewport);
    window.addEventListener('resize', lockViewport);
    
    lockViewport();
    
    return () => {
      viewport.removeEventListener('resize', lockViewport);
      viewport.removeEventListener('scroll', lockViewport);
      window.removeEventListener('resize', lockViewport);
    };
  }, []);

  const [editorInstance, setEditorInstance] = useState<TiptapEditorType | null>(null);

  const handleFormatChange = useCallback((updates: Partial<FormatState>) => {
    setFormatState(prev => ({ ...prev, ...updates }));
    if (updates.fontSize) setFontSize(updates.fontSize);
    if (updates.fontFam) {
      setDocFont(updates.fontFam);
      LS.set('kgv-font', updates.fontFam);
    }
    if (updates.headingFontFam) {
      setHeadingFont(updates.headingFontFam);
      LS.set('kgv-heading-font', updates.headingFontFam);
    }
    if (updates.monoFontFam) {
      setMonoFont(updates.monoFontFam);
      LS.set('kgv-mono-font', updates.monoFontFam);
    }
  }, []);

  useEffect(() => {
    window.__formatState = formatState;
  }, [formatState]);

  const restoreScroll = useCallback(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      if (editorInstance) {
        const editor = editorInstance as unknown as {
          commands: { focus: () => void };
          view: {
            state: { selection: { head: number } };
            coordsAtPos: (pos: number) => { top: number } | null;
          };
          isDestroyed: boolean;
        };
        if (!editor?.isDestroyed && typeof editor?.commands?.focus === 'function') {
          try {
            editor.commands.focus();
            const view = editor.view;
            if (view && view.state) {
              const coords = view.coordsAtPos(view.state.selection.head);
              const scrollContainers = document.querySelectorAll('.kgv-scroll');
              if (coords) {
                scrollContainers.forEach((scrollContainer) => {
                  const container = scrollContainer as HTMLElement;
                  if (container.scrollHeight > container.clientHeight) {
                    const containerRect = container.getBoundingClientRect();
                    const caretY = coords.top - containerRect.top + container.scrollTop;
                    const targetScroll = caretY - (containerRect.height / 2);
                    container.scrollTo({ top: targetScroll, behavior: 'smooth' });
                  }
                });
              }
            }
          } catch (err) {
            console.warn('Restore scroll failed:', err);
          }
        }
      }
    }, 100);
  }, [editorInstance]);

  const handleExitFocusOrPreview = useCallback(() => {
    setIsFocusMode(false);
    setIsPreviewMode(false);
    restoreScroll();
  }, [restoreScroll]);

  const handleToggleTypewriterMode = useCallback(() => {
    setTypewriterMode(prev => {
      const next = !prev;
      saveAppSettings({ typewriterMode: next });
      return next;
    });
  }, []);

  const handleToggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
      const next = !prev;
      setIsPreviewMode(false);
      setBlockViewOpen(false);
      restoreScroll();
      return next;
    });
  }, [restoreScroll]);

  const handleTogglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => {
      const next = !prev;
      setIsFocusMode(false);
      setBlockViewOpen(false);
      restoreScroll();
      return next;
    });
  }, [restoreScroll]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedProjRef = useRef<string>('');

  const t: Dict = useMemo(() => getDict(lang), [lang]);

  const theme: ThemeColors = useMemo(() => {
    if (themeMode === 'custom' && customTheme) return deriveCustomTheme(customTheme);
    const customMatch = customThemes.find(c => c.id === themeMode);
    if (customMatch) return deriveCustomTheme(customMatch);
    const key = (themeMode || 'light').toLowerCase();
    return THEMES[key] || THEMES.light;
  }, [themeMode, customTheme, customThemes]);




  const availableFonts = useMemo(() => {
    const fonts = [...BUILTIN_FONTS];
    customFonts.forEach((cf) => {
      const fam = cf.family || cf.name;
      if (fam && !fonts.some((f) => f.family === fam)) {
        fonts.unshift({ family: fam, label: `${fam} (${t.customFontSuffix || 'Tùy chỉnh'})` });
      }
    });
    injectedGoogleFonts.forEach((fam) => {
      if (fam && !fonts.some((f) => f.family === fam)) {
        fonts.unshift({ family: fam, label: `${fam} (Google)` });
      }
    });
    return fonts;
  }, [customFonts, injectedGoogleFonts, t]);

  const commandActions: CommandItem[] = useMemo(() => {
    const cmdT = {
      insertTable: { en: 'Insert Rich Table', vi: 'Tạo bảng biểu (Right Panel)', fr: 'Insérer un tableau', de: 'Erweiterte Tabelle einfügen', it: 'Inserisci Tabella Ricca', es: 'Insertar tabla rica', ko: '표 삽입', zh: '插入富表格', ja: 'リッチテーブルを挿入' },
      insertTableDesc: { en: 'Open table creation panel', vi: 'Mở thanh tạo bảng ma trận', fr: 'Ouvrir le panneau de création de tableau', de: 'Panel zur Tabellenerstellung öffnen', it: 'Apri il pannello di creazione della tabella', es: 'Abrir el panel de creación de tablas', ko: '표 생성 패널 열기', zh: '打开表格创建面板', ja: 'テーブル作成パネルを開く' },
      deleteTable: { en: 'Delete Table', vi: 'Xóa bảng hiện tại', fr: 'Supprimer le tableau', de: 'Tabelle löschen', it: 'Elimina Tabella', es: 'Eliminar tabla', ko: '표 삭제', zh: '删除表格', ja: 'テーブルを削除' },
      deleteTableDesc: { en: 'Delete currently focused table', vi: 'Xóa toàn bộ bảng biểu đang được con trỏ tập trung', fr: 'Supprimer le tableau sélectionné', de: 'Aktuell fokussierte Tabelle löschen', it: 'Elimina la tabella attualmente a fuoco', es: 'Eliminar la tabla actualmente enfocada', ko: '현재 포커스된 표 삭제', zh: '删除当前聚焦的表格', ja: '現在フォーカスされているテーブルを削除' },
      foldAll: { en: 'Fold All Headings', vi: 'Gập tất cả khối đề mục', fr: 'Plier tous les titres', de: 'Alle Überschriften einklappen', it: 'Riduci tutte le intestazioni', es: 'Plegar todos los encabezados', ko: '모든 제목 접기', zh: '折叠所有标题', ja: 'すべての見出しを折りたたむ' },
      foldAllDesc: { en: 'Collapse all heading sections', vi: 'Thu gọn tất cả khối nội dung', fr: 'Réduire toutes les sections de titre', de: 'Alle Überschriftenabschnitte einklappen', it: 'Riduci tutte le sezioni di intestazione', es: 'Contraer todas las secciones de encabezado', ko: '모든 제목 섹션 축소', zh: '折叠所有标题部分', ja: 'すべての見出しセクションを折りたたむ' },
      unfoldAll: { en: 'Unfold All Headings', vi: 'Mở tất cả khối đề mục', fr: 'Déplier tous les titres', de: 'Alle Überschriften aufklappen', it: 'Espandi tutte le intestazioni', es: 'Desplegar todos los encabezados', ko: '모든 제목 펼치기', zh: '展开所有标题', ja: 'すべての見出しを展開' },
      unfoldAllDesc: { en: 'Expand all collapsed heading sections', vi: 'Mở rộng lại tất cả khối đề mục', fr: 'Développer toutes les sections de titre', de: 'Alle eingeklappten Überschriftenabschnitte erweitern', it: 'Espandi tutte le sezioni di intestazione ridotte', es: 'Expandir todas las secciones de encabezado contraídas', ko: '축소된 모든 제목 섹션 확장', zh: '展开所有折叠的标题部分', ja: '折りたたまれたすべての見出しセクションを展開' },
      focusMode: { en: 'Toggle Focus Mode', vi: 'Chế độ tập trung (Focus Mode)', fr: 'Mode focus', de: 'Fokus-Modus umschalten', it: 'Attiva/Disattiva Modalità Focus', es: 'Alternar modo enfoque', ko: '집중 모드 전환', zh: '切换专注模式', ja: '集中モードの切り替え' },
      focusModeDesc: { en: 'Hide all UI panels for distraction-free writing', vi: 'Ẩn tất cả thanh công cụ', fr: 'Masquer tous les panneaux', de: 'Alle UI-Panels für ablenkungsfreies Schreiben ausblenden', it: 'Nascondi tutti i pannelli UI', es: 'Ocultar todos los paneles', ko: '방해 없는 글쓰기를 위해 모든 UI 패널 숨기기', zh: '隐藏所有UI面板以进行无干扰写作', ja: '気を散らさない書き込みのためにすべてのUIパネルを非表示にする' },
      pageNumbering: { en: 'Toggle Page Numbering', vi: 'Bật/Tắt đánh số trang', fr: 'Numérotation des pages', de: 'Seitennummerierung', it: 'Numerazione Pagine', es: 'Numeración de páginas', ko: '페이지 번호 매기기', zh: '切换页码', ja: 'ページ番号の切り替え' },
      pageNumberingDesc: { en: 'Toggle dynamic page numbering in print and preview', vi: 'Bật hoặc tắt bộ đánh số trang động CSS Paged Media', fr: 'Basculer la numérotation', de: 'Dynamische Seitennummerierung', it: 'Alterna la numerazione', es: 'Alternar numeración', ko: '동적 페이지 번호 매기기 전환', zh: '在打印和预览中切换动态页码', ja: '印刷とプレビューでの動的ページ番号付けの切り替え' },
      previewMode: { en: 'Toggle Preview Mode', vi: 'Chế độ xem trước (Preview Mode)', fr: 'Mode aperçu', de: 'Vorschau-Modus umschalten', it: 'Attiva/Disattiva Modalità Anteprima', es: 'Alternar modo vista previa', ko: '미리보기 모드 전환', zh: '切换预览模式', ja: 'プレビューモードの切り替え' },
      previewModeDesc: { en: 'Preview document layout cleanly', vi: 'Xem trước giao diện trang hoàn chỉnh', fr: 'Aperçu du document', de: 'Dokumentlayout sauber in der Vorschau anzeigen', it: 'Anteprima layout del documento', es: 'Vista previa del diseño', ko: '문서 레이아웃 미리보기', zh: '干净地预览文档布局', ja: 'ドキュメントレイアウトをきれいにプレビュー' },
      typewriterMode: { en: 'Toggle Typewriter Scroll', vi: 'Cuộn kiểu máy đánh chữ (Typewriter Mode)', fr: 'Défilement machine à écrire', de: 'Schreibmaschinen-Scrollen umschalten', it: 'Attiva/Disattiva Scorrimento Macchina da Scrivere', es: 'Alternar desplazamiento de máquina de escribir', ko: '타자기 스크롤 전환', zh: '切换打字机滚动', ja: 'タイプライタースクロールの切り替え' },
      typewriterModeDesc: { en: 'Keep active cursor line centered', vi: 'Giữ dòng đang viết luôn nằm ở trung tâm màn hình', fr: 'Garder la ligne active centrée', de: 'Aktive Cursorzeile zentriert halten', it: 'Mantieni la riga del cursore attiva centrata', es: 'Mantener la línea del cursor centrada', ko: '활성 커서 줄을 가운데로 유지', zh: '保持活动光标行居中', ja: 'アクティブなカーソル行を中央に保つ' },
      blockView: { en: 'Block Organizer Studio', vi: 'Trình sắp xếp khối (Block View Studio)', fr: 'Studio d\'organisation de blocs', de: 'Block-Organizer-Studio', it: 'Studio Organizzatore di Blocchi', es: 'Estudio organizador de bloques', ko: '블록 구성 스튜디오', zh: '块组织器工作室', ja: 'ブロックオーガナイザースタジオ' },
      blockViewDesc: { en: 'Drag & drop reorder document blocks', vi: 'Kéo rê sắp xếp, tách, ghép và chuyển đổi các khối văn bản', fr: 'Réorganiser les blocs par glisser-déposer', de: 'Dokumentblöcke per Drag & Drop neu anordnen', it: 'Riordina i blocchi del documento con il trascinamento', es: 'Reorganizar bloques de documentos', ko: '드래그 앤 드롭으로 문서 블록 재정렬', zh: '拖放重新排序文档块', ja: 'ドラッグアンドドロップでドキュメントブロックを並べ替える' },
      flashcardStudio: { en: 'Flashcard Learning Studio', vi: 'Xưởng Flashcards học tập', fr: 'Studio d\'apprentissage par cartes', de: 'Flashcard-Lernstudio', it: 'Studio di Apprendimento con Flashcard', es: 'Estudio de tarjetas de estudio', ko: '플래시카드 학습 스튜디오', zh: '抽认卡学习工作室', ja: 'フラッシュカード学習スタジオ' },
      flashcardStudioDesc: { en: 'Generate flashcards for active document', vi: 'Tạo thẻ ghi nhớ từ tài liệu và ôn tập thông minh', fr: 'Générer des cartes mémoire', de: 'Lernkarten für das aktive Dokument erstellen', it: 'Genera flashcard per il documento attivo', es: 'Generar tarjetas de estudio', ko: '활성 문서에 대한 플래시카드 생성', zh: '为活动文档生成抽认卡', ja: 'アクティブなドキュメントのフラッシュカードを生成する' },
      splitDiffStudio: { en: 'Split Revision Studio', vi: 'So sánh phiên bản (Split Diff Studio)', fr: 'Studio de révision fractionnée', de: 'Studio für geteilte Revisionen', it: 'Studio di Revisione Divisa', es: 'Estudio de revisión dividida', ko: '분할 리비전 스튜디오', zh: '拆分修订工作室', ja: '分割リビジョンスタジオ' },
      splitDiffStudioDesc: { en: 'Side-by-side revision diff compare', vi: 'So sánh song song nội dung hiện tại với lịch sử sao lưu', fr: 'Comparaison des révisions côte à côte', de: 'Direkter Vergleich von Revisionsunterschieden', it: 'Confronto delle differenze di revisione affiancato', es: 'Comparación de revisiones en paralelo', ko: '나란히 리비전 차이 비교', zh: '并排修订差异比较', ja: '並列リビジョン差分比較' },
      addFootnote: { en: 'Add Footnote', vi: 'Thêm chú thích chân trang (Add Footnote)', fr: 'Ajouter une note de bas de page', de: 'Fußnote hinzufügen', it: 'Aggiungi Nota a Piè di Pagina', es: 'Agregar nota al pie', ko: '각주 추가', zh: '添加脚注', ja: '脚注を追加' },
      addFootnoteDesc: { en: 'Insert footnote marker at current position', vi: 'Tạo đánh số chú thích và quản lý nội dung chân trang', fr: 'Insérer un marqueur de note de bas de page', de: 'Fußnotenmarkierung an der aktuellen Position einfügen', it: 'Inserisci marcatore di nota a piè di pagina', es: 'Insertar marcador de nota al pie', ko: '현재 위치에 각주 마커 삽입', zh: '在当前位置插入脚注标记', ja: '現在の位置に脚注マーカーを挿入する' },
      addCitation: { en: 'Add Citation', vi: 'Trích dẫn tài liệu (Add Citation)', fr: 'Ajouter une citation', de: 'Zitat hinzufügen', it: 'Aggiungi Citazione', es: 'Agregar cita', ko: '인용 추가', zh: '添加引用', ja: '引用を追加' },
      addCitationDesc: { en: 'Insert citation reference in text', vi: 'Thêm nguồn tham khảo chuẩn APA, MLA, Chicago', fr: 'Insérer une référence de citation', de: 'Zitierverweis im Text einfügen', it: 'Inserisci riferimento di citazione nel testo', es: 'Insertar referencia de cita', ko: '텍스트에 인용 참조 삽입', zh: '在文本中插入引用参考', ja: 'テキストに引用参照を挿入する' },
      exportOdt: { en: 'Export PDF', vi: 'Xuất tài liệu PDF (Export PDF)', fr: 'Exporter en PDF', de: 'PDF exportieren', it: 'Esporta PDF', es: 'Exportar PDF', ko: 'PDF 내보내기', zh: '导出PDF', ja: 'PDFをエクスポート' },
      exportOdtDesc: { en: 'Download formatted PDF document', vi: 'Xuất file PDF chất lượng cao có canh lề chuẩn trang', fr: 'Télécharger le document PDF formaté', de: 'Formatiertes PDF-Dokument herunterladen', it: 'Scarica il documento PDF formattato', es: 'Descargar documento PDF formateado', ko: '형식이 지정된 PDF 문서 다운로드', zh: '下载格式化的PDF文档', ja: 'フォーマットされたPDFドキュメントをダウンロードする' },
      exportMd: { en: 'Export Markdown', vi: 'Xuất file Markdown (.md)', fr: 'Exporter en Markdown', de: 'Markdown exportieren', it: 'Esporta Markdown', es: 'Exportar Markdown', ko: '마크다운 내보내기', zh: '导出Markdown', ja: 'Markdownをエクスポート' },
      exportMdDesc: { en: 'Download .md raw text file', vi: 'Xuất nội dung sang định dạng Markdown chuẩn', fr: 'Télécharger le fichier texte brut .md', de: 'Unbearbeitete .md-Textdatei herunterladen', it: 'Scarica file di testo grezzo .md', es: 'Descargar archivo .md', ko: '.md 원시 텍스트 파일 다운로드', zh: '下载 .md 纯文本文件', ja: '.md テキストファイルをダウンロードする' },
      backupJson: { en: 'Backup JSON', vi: 'Sao lưu dữ liệu JSON (Backup JSON)', fr: 'Sauvegarder JSON', de: 'JSON sichern', it: 'Backup JSON', es: 'Copia de sicurezza JSON', ko: 'JSON 백업', zh: '备份JSON', ja: 'JSONをバックアップ' },
      backupJsonDesc: { en: 'Backup entire workspace database to JSON', vi: 'Tạo bản sao lưu đầy đủ dự án và cài đặt', fr: 'Sauvegarder toute la base de données', de: 'Gesamte Workspace-Datenbank als JSON sichern', it: 'Esegui il backup dell\'intero database', es: 'Hacer una copia de seguridad', ko: '전체 작업 공간 데이터베이스를 JSON으로 백업', zh: '将整个工作区数据库备份到JSON', ja: 'ワークスペースデータベース全体をJSONにバックアップする' },
      syncGithub: { en: 'Sync GitHub Cloud', vi: 'Đồng bộ GitHub Cloud', fr: 'Synchroniser GitHub Cloud', de: 'GitHub Cloud synchronisieren', it: 'Sincronizza GitHub Cloud', es: 'Sincronizar GitHub Cloud', ko: 'GitHub Cloud 동기화', zh: '同步GitHub云', ja: 'GitHub Cloudを同期' },
      syncGithubDesc: { en: 'Sync workspace with GitHub account', vi: 'Lưu trữ và khôi phục dữ liệu qua kho GitHub Gist', fr: 'Synchroniser l\'espace de travail avec le compte GitHub', de: 'Arbeitsbereich mit GitHub-Konto synchronisieren', it: 'Sincronizza l\'area di lavoro con l\'account GitHub', es: 'Sincronizar el espacio de trabajo con la cuenta de GitHub', ko: 'GitHub 계정과 작업 공간 동기화', zh: '与GitHub帐户同步工作区', ja: 'GitHubアカウントとワークスペースを同期する' },
    };
    
    const getT = (key: keyof typeof cmdT) => (cmdT[key] as Record<string, string>)[lang] || cmdT[key].en;

    return [
    {
      id: 'toggle-rhythm',
      label: 'Toggle Rhythm View',
      category: 'View & Layout',
      icon: <Activity size={16} />,
      description: 'Analyze sentence length and cadence visually.',
      perform: () => {
        setCreativeOptions(prev => ({ ...prev, rhythmEnabled: !prev.rhythmEnabled }));
        setCmdOpen(false);
      }
    },
    {
      id: 'isolate-dialogues',
      label: 'Isolate Dialogues',
      category: 'View & Layout',
      icon: <Type size={16} />,
      description: 'Fade out non-dialogue text for editing.',
      perform: () => {
        setCreativeOptions(prev => ({ ...prev, dialogueEnabled: !prev.dialogueEnabled }));
        setCmdOpen(false);
      }
    },

    {
      id: 'insert-table',
      label: getT('insertTable'),
      category: 'Actions & Tools',
      icon: <Table size={16} />,
      shortcut: 'Alt+T',
      description: getT('insertTableDesc'),
      perform: () => {
        setRightPanelTab('table');
        setRightOpen(true);
      },
    },
    {
      id: 'delete-table',
      label: getT('deleteTable'),
      category: 'Actions & Tools',
      icon: <Trash2 size={16} />,
      description: getT('deleteTableDesc'),
      perform: () => window.dispatchEvent(new CustomEvent('kgv-delete-table')),
    },
    {
      id: 'fold-all-headings',
      label: getT('foldAll'),
      category: 'View & Layout',
      icon: <FoldVertical size={16} />,
      shortcut: 'Ctrl+Shift+[',
      description: getT('foldAllDesc'),
      perform: () => window.dispatchEvent(new CustomEvent('kgv-fold-all-headings')),
    },
    {
      id: 'unfold-all-headings',
      label: getT('unfoldAll'),
      category: 'View & Layout',
      icon: <UnfoldVertical size={16} />,
      shortcut: 'Ctrl+Shift+]',
      description: getT('unfoldAllDesc'),
      perform: () => window.dispatchEvent(new CustomEvent('kgv-unfold-all-headings')),
    },
    {
      id: 'toggle-focus-mode',
      label: getT('focusMode'),
      category: 'View & Layout',
      icon: <Maximize2 size={16} />,
      shortcut: 'F11',
      description: getT('focusModeDesc'),
      perform: () => setIsFocusMode(prev => !prev),
    },
    {
      id: 'toggle-page-numbering',
      label: getT('pageNumbering'),
      category: 'View & Layout',
      icon: <FileText size={16} />,
      shortcut: 'Alt + P',
      description: getT('pageNumberingDesc'),
      perform: () => {
        setFormatState(prev => {
          const current = prev.pageNumbering || {
            enabled: false,
            position: 'bottom-center',
            style: 'arabic',
            skipTitlePage: true,
          };
          return {
            ...prev,
            pageNumbering: {
              ...current,
              enabled: !current.enabled,
            }
          };
        });
      },
    },
    {
      id: 'toggle-preview-mode',
      label: getT('previewMode'),
      category: 'View & Layout',
      icon: <Eye size={16} />,
      description: getT('previewModeDesc'),
      perform: () => setIsPreviewMode(prev => !prev),
    },
    {
      id: 'typewriter-mode',
      label: getT('typewriterMode'),
      category: 'View & Layout',
      icon: <Terminal size={16} />,
      description: getT('typewriterModeDesc'),
      perform: () => setTypewriterMode(prev => !prev),
    },
    {
      id: 'block-view',
      label: getT('blockView'),
      category: 'View & Layout',
      icon: <LayoutList size={16} />,
      description: getT('blockViewDesc'),
      perform: () => setBlockViewOpen(true),
    },
    {
      id: 'flashcard-studio',
      label: getT('flashcardStudio'),
      category: 'View & Layout',
      icon: <Brain size={16} />,
      description: getT('flashcardStudioDesc'),
      perform: () => setViewMode('flashcard'),
    },
    {
      id: 'split-diff-studio',
      label: getT('splitDiffStudio'),
      category: 'View & Layout',
      icon: <GitCompare size={16} />,
      description: getT('splitDiffStudioDesc'),
      perform: () => setIsSplitRevisionOpen(true),
    },
    {
      id: 'add-footnote',
      label: getT('addFootnote'),
      category: 'Actions & Tools',
      icon: <FileText size={16} />,
      description: getT('addFootnoteDesc'),
      perform: () => handleInsertNewFootnote(),
    },
    {
      id: 'insert-citation',
      label: getT('addCitation'),
      category: 'Actions & Tools',
      icon: <Sparkles size={16} />,
      description: getT('addCitationDesc'),
      perform: () => {
        setLeftSidebarMainTab('citations');
        setSidebarOpen(true);
      },
    },
    {
      id: 'export-odt',
      label: getT('exportOdt'),
      category: 'System & Export',
      icon: <FileText size={16} />,
      description: getT('exportOdtDesc'),
      perform: () => {
        if (activePage) exportToOdt(activePage.title || 'Untitled', safeActiveContent);
      },
    },
    {
      id: 'export-markdown',
      label: getT('exportMd'),
      category: 'System & Export',
      icon: <FileText size={16} />,
      description: getT('exportMdDesc'),
      perform: () => {
        if (activePage) exportToMarkdownFile(activePage.title || 'Untitled', safeActiveContent);
      },
    },
    {
      id: 'backup-json',
      label: getT('backupJson'),
      category: 'System & Export',
      icon: <FileText size={16} />,
      description: getT('backupJsonDesc'),
      perform: () => exportToJsonBackup(),
    },
    {
      id: 'sync-github',
      label: getT('syncGithub'),
      category: 'System & Export',
      icon: <Settings size={16} />,
      description: getT('syncGithubDesc'),
      perform: () => setGithubModalOpen(true),
    },
  ];
  }, [lang, activePage, docFont, handleInsertNewFootnote, t]);
  // Sync document body styles with the current active theme
  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
    document.documentElement.style.setProperty('--bg-color', theme.bg);
  }, [theme.bg, theme.text]);

  // Sync print page format to the browser print engine
  useEffect(() => {
    let style = document.getElementById('kgv-print-page-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'kgv-print-page-style';
      document.head.appendChild(style);
    }
    const sizeMap: Record<string, string> = {
      'A4': 'A4',
      'Letter': 'letter',
      'Legal': 'legal',
      'A5': 'A5',
      'Tabloid': 'tabloid',
      'pageless': 'auto'
    };
    const paper = sizeMap[pageFormat.paperSize] || 'auto';
    const orient = pageFormat.orientation === 'landscape' ? 'landscape' : 'portrait';
    style.innerHTML = `@media print { @page { size: ${paper} ${orient}; margin: 0; } }`;
  }, [pageFormat.paperSize, pageFormat.orientation]);

  // Persist App Settings / Session state to IndexedDB (appSettings)
  useEffect(() => {
    if (loading) return;
    saveAppSettings({
      activeProjectId,
      activePageId,
      currentTheme: themeMode,
      fontFamily: docFont,
      fontSize,
      lineHeight: formatState.lineH,
      pageFormat,
      isLeftPanelOpen: sidebarOpen,
      isRightPanelOpen: rightOpen,
      isFocusMode,
      isPreviewMode,
      readerStyle,
      language: lang,
    });
  }, [activeProjectId, activePageId, themeMode, docFont, fontSize, formatState.lineH, pageFormat, sidebarOpen, rightOpen, isFocusMode, isPreviewMode,
      readerStyle, lang, loading]);

  // Load state, projects, and appSettings from IndexedDB / LocalStorage
  useEffect(() => {
    const savedMode = loadThemeMode();
    setThemeMode(savedMode);
    
    const cts = loadCustomThemes();
    if (cts.length > 0) {
      setCustomThemes(cts);
    }
    
    if (savedMode === 'custom' || cts.some(c => c.id === savedMode)) {
      const activeCt = cts.find(c => c.id === savedMode) || cts[0];
      if (activeCt) setCustomTheme(activeCt);
    }
    setDocFont(loadFont());
    setUiFont(loadUiFont());
    setLang(loadLang());
    setFontSize(loadFontSize());
    setApiKey(loadApiKey());
    reinjectSavedFonts();
    const cfs = loadCustomFonts();
    if (cfs.length > 0) {
      setCustomFonts(cfs);
      setCustomFont(cfs[cfs.length - 1]);
      cfs.forEach((font) => {
        applyCustomFont(font).catch(() => {});
      });
    }

    (async () => {
      let dbProjects: Project[] = [];
      let settings;
      try {
        [dbProjects, settings] = await Promise.all([
          getAllProjectsFromDB(),
          getAppSettings(),
        ]);
      } catch (err) {
        console.warn('Error loading from Dexie:', err);
      }

      const dict = getDict(loadLang());

      if (settings) {
        if (settings.currentTheme) setThemeMode(settings.currentTheme as ThemeMode);
        if (settings.fontFamily) { setDocFont(settings.fontFamily); LS.set('kgv-font', settings.fontFamily); }
        if (settings.fontSize) { setFontSize(settings.fontSize); LS.set('kgv-font-size', String(settings.fontSize)); }
        if (settings.lineHeight) { setFormatState(prev => ({ ...prev, lineH: settings.lineHeight! })); }
        if (settings.pageFormat) { setPageFormat(settings.pageFormat); }
        if (settings.isFocusMode !== undefined) setIsFocusMode(settings.isFocusMode);
        if (settings.isPreviewMode !== undefined) setIsPreviewMode(settings.isPreviewMode);
        if (settings.readerStyle !== undefined) setReaderStyle(settings.readerStyle);
        if (settings.typewriterMode !== undefined) setTypewriterMode(settings.typewriterMode);
        if (settings.language) {
          setLang(settings.language as Lang);
          LS.set('kgv-lang', settings.language);
        }
      }

      if (!dbProjects || dbProjects.length === 0) {
        // Migration or initialize initial Project
        const localDocs = LS.getJSON<Document[]>('kgv-docs') || [];
        const localFolders = LS.getJSON<Folder[]>('kgv-folders') || [];

        const initialPages: Page[] = localDocs.map((d) => ({
          id: d.id,
          title: d.title || 'Untitled Document',
          content: d.content || '',
          isDraft: false,
          createdAt: new Date(d.created_at || Date.now()).toISOString(),
          lastModified: new Date(d.updated_at || Date.now()).toISOString(),
          folderId: d.folder_id || undefined,
        }));

        if (initialPages.length === 0) {
          initialPages.push({
            id: WELCOME_ID,
            title: dict.welcomeTitle || 'Untitled Document',
            content: dict.welcomeContent || '',
            isDraft: false,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          });
        }

        const initialProj: Project = {
          id: 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          title: initialPages[0]?.title || 'Untitled Document',
          pages: initialPages,
          drafts: [],
          folders: localFolders,
          bin: [],
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };

        await saveProjectToDB(initialProj);
        dbProjects = [initialProj];
      }

      setProjects(dbProjects);

      const targetProjId = settings?.activeProjectId || LS.get('kgv-active-project-id');
      const targetProj = dbProjects.find((p) => p.id === targetProjId) || dbProjects[0];
      setActiveProjectId(targetProj.id);
      
      const targetPageId = settings?.activePageId || targetProj.pages[0]?.id || targetProj.drafts[0]?.id || '';
      setActivePageId(targetPageId);

      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    function handleDocFont(e: Event) { handleSelectDocFont((e as CustomEvent).detail as string); }
    function handleFontSize(e: Event) {
      const s = (e as CustomEvent).detail as number;
      setFontSize(s); LS.set('kgv-font-size', String(s));
    }
    window.addEventListener('kgv-docfont', handleDocFont);
    window.addEventListener('kgv-fontsize', handleFontSize);
    return () => {
      window.removeEventListener('kgv-docfont', handleDocFont);
      window.removeEventListener('kgv-fontsize', handleFontSize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Asynchronous auto-focus cursor handler on mount or project/page switch
  useEffect(() => {
    if (editorInstance) {
      requestAnimationFrame(() => {
        const editor = editorInstance as unknown as { commands?: { focus?: () => void } };
        if (!editor?.isDestroyed && typeof editor?.commands?.focus === 'function') {
          try {
            editor?.commands?.focus();
          } catch {
            /* ignore */
          }
        }
      });
    }
  }, [activePageId, activeProjectId, editorInstance]);

  const { wordCount, charCount, readMin } = useMemo(() => {
    const raw = safeActiveContent;
    if (!raw) return { wordCount: 0, charCount: 0, readMin: 0 };
    const text = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, charCount: chars, readMin: mins };
  }, [activePage?.content]);

  // Save isolated project to IndexedDB (offline-first with 3.5s strict debounce & structural dirty-checking)
  const scheduleSaveProject = useCallback((projToSave: Project) => {
    setSaving(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const jsonStr = JSON.stringify(projToSave);
        if (jsonStr === lastSavedProjRef.current) {
          setSaving(false);
          return;
        }
        await saveProjectToDB(projToSave);
        lastSavedProjRef.current = jsonStr;
        if (!isOnline) {
          console.log('Offline Mode: Cloud sync frozen. Saved locally to Dexie.');
        } else {
          console.log('Online Mode: Background cloud sync executed.');
        }
      } catch (err) {
        console.error('Failed saving project to IndexedDB:', err);
      } finally {
        setSaving(false);
      }
    }, 3500);
  }, [isOnline]);

  // Update active page content or title in active project state & trigger auto-save for active project only
  const updateActivePage = useCallback((patch: Partial<Page>) => {
    if (!activeProjectId) return;
    setProjects((prevProjects) => {
      return prevProjects.map((proj) => {
        if (proj.id !== activeProjectId) return proj;

        const now = new Date().toISOString();
        let pageFound = false;

        const updatedPages = (proj.pages || []).map((p) => {
          if (p.id === activePageId) { pageFound = true; return { ...p, ...patch, lastModified: now }; }
          return p;
        });

        const updatedDrafts = (proj.drafts || []).map((p) => {
          if (p.id === activePageId) { pageFound = true; return { ...p, ...patch, lastModified: now }; }
          return p;
        });

        if (!pageFound) {
          // If the page doesn't exist (e.g. was just deleted), do not update anything.
          return proj;
        }

        let updatedTitle = proj.title;
        if (patch.title !== undefined) {
          // Sync project title if editing the first page
          if (updatedPages[0]?.id === activePageId || updatedDrafts[0]?.id === activePageId) {
            updatedTitle = patch.title;
          }
        }

        const updatedProj: Project = {
          ...proj,
          title: updatedTitle,
          pages: updatedPages,
          drafts: updatedDrafts,
          lastModified: now,
        };

        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });
  }, [activeProjectId, activePageId, scheduleSaveProject]);

  const handleOpenGithubCloudSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const activeProj = projects.find(p => p.id === activeProjectId);
    if (activeProj) {
      const jsonStr = JSON.stringify(activeProj);
      if (jsonStr !== lastSavedProjRef.current) {
        setSaving(true);
        try {
          await saveProjectToDB(activeProj);
          lastSavedProjRef.current = jsonStr;
        } finally {
          setSaving(false);
        }
      }
    }
    setGithubModalOpen(true);
  }, [projects, activeProjectId]);

  const handleContentChange = useCallback((html: string) => {
    updateActivePage({ content: html });
  }, [updateActivePage]);

  // Project Switcher handler
  const handleSelectProject = useCallback((projectId: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setActiveProjectId(projectId);
    LS.set('kgv-active-project-id', projectId);
    
    const targetProj = projects.find((p) => p.id === projectId);
    if (targetProj) {
      const firstPage = targetProj.pages?.[0] || targetProj.drafts?.[0];
      if (firstPage) {
        setActivePageId(firstPage.id);
      } else {
        setActivePageId('');
      }
    }
  }, [projects]);

  // Create New Document / Project
  const handleCreateNewProject = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const newProjId = 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const defaultPage: Page = {
      id: 'page-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: 'Untitled Document',
      content: '',
      isDraft: false,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    const newProject: Project = {
      id: newProjId,
      title: 'Untitled Document',
      pages: [defaultPage],
      drafts: [],
      folders: [],
      bin: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    await saveProjectToDB(newProject);

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProjId);
    setActivePageId(defaultPage.id);
    LS.set('kgv-active-project-id', newProjId);
        if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const handleRenameProject = useCallback((projectId: string, newTitle: string) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        const updated: Project = { ...proj, title: newTitle, lastModified: new Date().toISOString() };
        scheduleSaveProject(updated);
        return updated;
      });
    });
  }, [scheduleSaveProject]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    await deleteProjectFromDB(projectId);
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== projectId);
      if (remaining.length === 0) {
        const defaultPage: Page = {
          id: 'page-' + Date.now(),
          title: 'Untitled Document',
          content: '',
          isDraft: false,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };
        const freshProj: Project = {
          id: 'proj-' + Date.now(),
          title: 'Untitled Document',
          pages: [defaultPage],
          drafts: [],
          folders: [],
          bin: [],
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };
        saveProjectToDB(freshProj);
        setActiveProjectId(freshProj.id);
        setActivePageId(defaultPage.id);
        return [freshProj];
      }
      if (projectId === activeProjectId) {
        const nextProj = remaining[0];
        setActiveProjectId(nextProj.id);
        setActivePageId(nextProj.pages?.[0]?.id || nextProj.drafts?.[0]?.id || '');
        LS.set('kgv-active-project-id', nextProj.id);
      }
      return remaining;
    });
  }, [activeProjectId]);

  // Page Operations inside active project
  const handleCommitDraft = useCallback(() => {
    if (!activeProject || !activePage || !activePage.originalPageId) return;

    if (!window.confirm("Are you sure you want to merge this draft's content into the original document? This will overwrite the original document's content.")) return;

    // Find original page
    const originalPage = (activeProject.pages || []).find(p => p.id === activePage.originalPageId) ||
                         (activeProject.drafts || []).find(p => p.id === activePage.originalPageId);

    if (!originalPage) {
      alert("Original page not found.");
      return;
    }

    setProjects(prev => prev.map(proj => {
      if (proj.id !== activeProjectId) return proj;

      const updatedPages = (proj.pages || []).map(p => {
        if (p.id === activePage.originalPageId) {
          return { ...p, content: activePage.content, lastModified: new Date().toISOString() };
        }
        return p;
      });
      
      const updatedDrafts = (proj.drafts || []).map(p => {
        if (p.id === activePage.originalPageId) {
          return { ...p, content: activePage.content, lastModified: new Date().toISOString() };
        }
        return p;
      });

      const updatedProj = { ...proj, pages: updatedPages, drafts: updatedDrafts };
      scheduleSaveProject(updatedProj);
      return updatedProj;
    }));

    alert("Draft successfully committed to original document!");
  }, [activeProject, activePage, activeProjectId, scheduleSaveProject]);

  const addPage = useCallback((isDraft = false, folderId?: string) => {
    let title = isDraft ? 'Untitled Draft' : 'Untitled Document';
    let content = '';
    let originalPageId: string | undefined = undefined;

    if (isDraft && activePage && !activePage.isDraft) {
      title = `${activePage.title} (Draft)`;
      content = activePage.content;
      originalPageId = activePage.id;
    }

    const newPage: Page = {
      id: 'page-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title,
      content,
      isDraft, folderId, originalPageId,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== activeProjectId) return proj;
        const updatedProj: Project = {
          ...proj,
          pages: isDraft ? proj.pages : [newPage, ...(proj.pages || [])],
          drafts: isDraft ? [newPage, ...(proj.drafts || [])] : proj.drafts,
          lastModified: new Date().toISOString(),
        };
        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });

    setActivePageId(newPage.id);
  }, [activeProjectId, scheduleSaveProject, activePage]);

  const deletePage = useCallback((pageId: string) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== activeProjectId) return proj;

        const targetPage = [...(proj.pages || []), ...(proj.drafts || [])].find((p) => p.id === pageId);
        const remainingPages = (proj.pages || []).filter((p) => p.id !== pageId);
        const remainingDrafts = (proj.drafts || []).filter((p) => p.id !== pageId);
        const updatedBin = targetPage ? [targetPage, ...(proj.bin || [])] : (proj.bin || []);

        const updatedProj: Project = {
          ...proj,
          pages: remainingPages,
          drafts: remainingDrafts,
          bin: updatedBin,
          lastModified: new Date().toISOString(),
        };

        if (activePageId === pageId) {
          const nextActive = remainingPages[0] || remainingDrafts[0];
          if (nextActive) {
            setActivePageId(nextActive.id);
          } else {
            const fallback: Page = {
              id: 'page-' + Date.now(),
              title: 'Untitled Document',
              content: '',
              isDraft: false,
              createdAt: new Date().toISOString(),
              lastModified: new Date().toISOString(),
            };
            updatedProj.pages = [fallback];
            setActivePageId(fallback.id);
          }
        }

        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });
  }, [activeProjectId, activePageId, scheduleSaveProject]);

  const renamePage = useCallback((pageId: string, newName: string) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== activeProjectId) return proj;
        const updatedProj: Project = {
          ...proj,
          pages: (proj.pages || []).map((p) => p.id === pageId ? { ...p, title: newName, lastModified: new Date().toISOString() } : p),
          drafts: (proj.drafts || []).map((p) => p.id === pageId ? { ...p, title: newName, lastModified: new Date().toISOString() } : p),
          lastModified: new Date().toISOString(),
        };
        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });
  }, [activeProjectId, scheduleSaveProject]);

  const restorePage = useCallback((pageId: string) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== activeProjectId) return proj;
        const target = (proj.bin || []).find((p) => p.id === pageId);
        if (!target) return proj;
        const remainingBin = (proj.bin || []).filter((p) => p.id !== pageId);
        const updatedProj: Project = {
          ...proj,
          bin: remainingBin,
          pages: target.isDraft ? proj.pages : [target, ...(proj.pages || [])],
          drafts: target.isDraft ? [target, ...(proj.drafts || [])] : proj.drafts,
          lastModified: new Date().toISOString(),
        };
        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });
  }, [activeProjectId, scheduleSaveProject]);

  const permanentDeletePage = useCallback((pageId: string) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== activeProjectId) return proj;
        const updatedProj: Project = {
          ...proj,
          bin: (proj.bin || []).filter((p) => p.id !== pageId),
          lastModified: new Date().toISOString(),
        };
        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });
  }, [activeProjectId, scheduleSaveProject]);

  const emptyAllTrash = useCallback(async () => {
    try {
      // 1. Permanent delete all projects marked as deleted (isDeleted: true) from DB
      const allProjs = await getAllProjectsFromDB();
      const trashedProjIds = allProjs.filter(p => p.isDeleted).map(p => p.id);
      for (const id of trashedProjIds) {
        await deleteProjectFromDB(id);
      }

      // 2. Permanent delete all folders marked as deleted (isDeleted: true) from DB
      const allFlds = await getAllFoldersFromDB();
      const trashedFldIds = allFlds.filter(f => f.isDeleted).map(f => f.id);
      for (const id of trashedFldIds) {
        await db.folders.delete(id);
      }

      // 3. Clear the page-level 'bin' array of ALL active projects (remaining non-deleted projects)
      const remainingProjs = allProjs.filter(p => !p.isDeleted);
      for (const proj of remainingProjs) {
        const updatedProj: Project = {
          ...proj,
          bin: [],
          lastModified: new Date().toISOString(),
        };
        await saveProjectToDB(updatedProj);
      }

      // 4. Update the projects list state in App
      const finalProjs = await getAllProjectsFromDB();
      setProjects(finalProjs);

      // 5. If the current active project was deleted, handle switching project
      if (activeProjectId && trashedProjIds.includes(activeProjectId)) {
        const nonDeleted = finalProjs.filter(p => !p.isDeleted);
        if (nonDeleted.length > 0) {
          setActiveProjectId(nonDeleted[0].id);
          setActivePageId(nonDeleted[0].pages?.[0]?.id || nonDeleted[0].drafts?.[0]?.id || '');
          LS.set('kgv-active-project-id', nonDeleted[0].id);
        } else {
          // Create default
          const defaultPage: Page = {
            id: 'page-' + Date.now(),
            title: 'Untitled Document',
            content: '',
            isDraft: false,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          };
          const freshProj: Project = {
            id: 'proj-' + Date.now(),
            title: 'Untitled Document',
            pages: [defaultPage],
            drafts: [],
            folders: [],
            bin: [],
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          };
          await saveProjectToDB(freshProj);
          setActiveProjectId(freshProj.id);
          setActivePageId(defaultPage.id);
          setProjects([freshProj]);
        }
      }
    } catch (err) {
      console.error('Error emptying all trash:', err);
    }
  }, [activeProjectId]);

  // Folder Operations inside active project
  const addFolder = useCallback((parentId: string | null = null) => {
    const newFolder: Folder = {
      id: 'folder-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: t.newFolderName || 'New Folder',
      parentId,
      created_at: Date.now(),
    };

    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== activeProjectId) return proj;
        const updatedProj: Project = {
          ...proj,
          folders: [newFolder, ...(proj.folders || [])],
          lastModified: new Date().toISOString(),
        };
        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });
  }, [activeProjectId, t, scheduleSaveProject]);

  const deleteFolder = useCallback((folderId: string) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== activeProjectId) return proj;
        const updatedProj: Project = {
          ...proj,
          folders: (proj.folders || []).filter((f) => f.id !== folderId && f.parentId !== folderId),
          pages: (proj.pages || []).map((p) => p.folderId === folderId ? { ...p, folderId: undefined } : p),
          drafts: (proj.drafts || []).map((p) => p.folderId === folderId ? { ...p, folderId: undefined } : p),
          lastModified: new Date().toISOString(),
        };
        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });
  }, [activeProjectId, scheduleSaveProject]);

  const renameFolder = useCallback((folderId: string, name: string) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== activeProjectId) return proj;
        const updatedProj: Project = {
          ...proj,
          folders: (proj.folders || []).map((f) => f.id === folderId ? { ...f, name } : f),
          lastModified: new Date().toISOString(),
        };
        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });
  }, [activeProjectId, scheduleSaveProject]);

  const movePageToFolder = useCallback((pageId: string, folderId: string | undefined) => {
    setProjects((prev) => {
      return prev.map((proj) => {
        if (proj.id !== activeProjectId) return proj;
        const updatedProj: Project = {
          ...proj,
          pages: (proj.pages || []).map((p) => p.id === pageId ? { ...p, folderId } : p),
          drafts: (proj.drafts || []).map((p) => p.id === pageId ? { ...p, folderId } : p),
          lastModified: new Date().toISOString(),
        };
        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });
  }, [activeProjectId, scheduleSaveProject]);

  const handleSelectTheme = useCallback((mode: ThemeMode) => { setThemeMode(mode); LS.set('kgv-theme', mode); }, []);
  
  const handleDeleteCustomTheme = useCallback((themeId: string) => {
    setCustomThemes(prev => {
      const next = prev.filter(c => c.id !== themeId);
      LS.setJSON('kgv-custom-themes', next);
      return next;
    });
    // Auto switch if deleting active theme
    if (themeMode === themeId) {
      setThemeMode('light');
      LS.set('kgv-theme', 'light');
    }
  }, [themeMode]);

  const handleSaveCustomTheme = useCallback((themeConf: CustomTheme, overwrite: boolean) => {
    setCustomThemes(prev => {
      let next = [...prev];
      if (overwrite) {
        next = next.map(c => c.id === themeConf.id ? themeConf : c);
      } else {
        next.push(themeConf);
      }
      LS.setJSON('kgv-custom-themes', next);
      return next;
    });
    setCustomTheme(themeConf);
    setThemeMode(themeConf.id);
    LS.set('kgv-theme', themeConf.id);
  }, []);

  const handlePreviewTheme = useCallback((themeConf: CustomTheme | null) => {
    setCustomTheme(themeConf);
    if (themeConf) {
      setThemeMode('custom');
    } else {
      // Revert to saved active theme when preview ends
      const savedMode = LS.get('kgv-theme') || 'light';
      setThemeMode(savedMode);
      const cts = LS.getJSON<CustomTheme[]>('kgv-custom-themes') || [];
      if (cts.some(c => c.id === savedMode)) {
        setCustomTheme(cts.find(c => c.id === savedMode) || null);
      } else {
        setCustomTheme(null);
      }
    }
  }, []);
  const handleSelectDocFont = useCallback((family: string) => { injectGoogleFont(family); 
    setDocFont(family);
    LS.set('kgv-font', family);
    setFormatState(prev => ({ ...prev, fontFam: family }));
  }, []);
  const handleSelectHeadingFont = useCallback((family: string) => { injectGoogleFont(family); 
    setHeadingFont(family);
    LS.set('kgv-heading-font', family);
    setFormatState(prev => ({ ...prev, headingFontFam: family }));
  }, []);
  const handleSelectMonoFont = useCallback((family: string) => { injectGoogleFont(family); 
    setMonoFont(family);
    LS.set('kgv-mono-font', family);
    setFormatState(prev => ({ ...prev, monoFontFam: family }));
  }, []);
  const handleSelectUiFont = useCallback((family: string) => { injectGoogleFont(family);  setUiFont(family); LS.set('kgv-ui-font', family); }, []);
  const handleSelectLang = useCallback((l: Lang) => {
    setLang(l);
    LS.set('kgv-lang', l);
    saveAppSettings({ language: l });
  }, []);

  const handleUploadFont = useCallback(async (file: File) => {
    try {
      if (!file) return;
      const rawName = file.name.replace(/\.(ttf|otf|woff2?)$/i, '');
      const family = rawName.trim() || 'CustomFont';

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => reject(new Error('Cannot read font file'));
        reader.readAsDataURL(file);
      });

      if (!dataUrl) {
        throw new Error('Data URL is empty');
      }

      const cf: CustomFont = {
        id: 'font-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        family,
        name: family,
        fileName: file.name,
        dataUrl,
      };

      await applyCustomFont(cf);

      setCustomFonts((prev) => {
        const filtered = prev.filter((f) => (f.family || f.name) !== family);
        const next = [...filtered, cf];
        LS.setJSON('kgv-custom-fonts', next);
        return next;
      });

      setCustomFont(cf);
      LS.setJSON('kgv-custom-font', cf);

      setDocFont(family);
      LS.set('kgv-font', family);
      setFormatState((prev) => ({ ...prev, fontFam: family }));

      window.dispatchEvent(new CustomEvent('kgv-docfont', { detail: family }));
      window.dispatchEvent(new CustomEvent('kgv-apply-font-selection', { detail: family }));
    } catch (err) {
      console.error('Upload custom font error:', err);
      alert('Không thể tải font tùy chỉnh. Vui lòng thử tệp font khác (.ttf, .otf, .woff, .woff2).');
    }
  }, []);

  const handleRemoveCustomFont = useCallback((idOrFamily?: string) => {
    setCustomFonts((prev) => {
      const next = prev.filter((f) => f.id !== idOrFamily && f.family !== idOrFamily && f.name !== idOrFamily);
      LS.setJSON('kgv-custom-fonts', next);
      const last = next[next.length - 1] || null;
      setCustomFont(last);
      if (last) {
        LS.setJSON('kgv-custom-font', last);
      } else {
        try { localStorage.removeItem('kgv-custom-font'); } catch { /* ignore */ }
      }
      return next;
    });

    if (idOrFamily) {
      const cleanTarget = idOrFamily.replace(/[^a-zA-Z0-9_-]/g, '_');
      const el = document.getElementById(`kgv-custom-font-style-${cleanTarget}`);
      if (el) el.remove();
    }

    if (!idOrFamily || docFont === idOrFamily) {
      setDocFont('Merriweather');
      LS.set('kgv-font', 'Merriweather');
      setFormatState((prev) => ({ ...prev, fontFam: 'Merriweather', headingFontFam: 'Merriweather' }));
    }
  }, [docFont]);

  const handleImportFile = useCallback(async (file: File) => {
    try {
      const { title, htmlContent } = await importFile(file);
      const newProjId = 'proj-' + Date.now();
      const newPageId = 'page-' + Date.now();
      const newPage: Page = {
        id: newPageId,
        title: title || 'Imported Document',
        content: htmlContent,
        isDraft: false,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      const newProject: Project = {
        id: newProjId,
        title: title || 'Imported Document',
        pages: [newPage],
        drafts: [],
        folders: [],
        bin: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      await saveProjectToDB(newProject);
      setProjects((prev) => [newProject, ...prev]);
      setActiveProjectId(newProjId);
      setActivePageId(newPageId);
      LS.set('kgv-active-project-id', newProjId);
          } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import file.');
    }
  }, []);

  const handlePrint = useCallback(() => {
    const existing = document.getElementById('kgv-print-style');
    if (existing) existing.remove();

    const paperSize = pageFormat.paperSize;
    const orientation = pageFormat.orientation || 'portrait';

    let pageSizeCss = 'A4 portrait';
    if (paperSize === 'Letter') pageSizeCss = `8.5in 11in ${orientation}`;
    else if (paperSize === 'Legal') pageSizeCss = `8.5in 14in ${orientation}`;
    else if (paperSize === 'A5') pageSizeCss = `148mm 210mm ${orientation}`;
    else if (paperSize === 'Tabloid') pageSizeCss = `11in 17in ${orientation}`;
    else if (paperSize === 'A4') pageSizeCss = `210mm 297mm ${orientation}`;
    else if (paperSize === 'pageless') pageSizeCss = `8.5in 11in ${orientation}`;

    // CSS Paged Media Page Numbering generation
    const pageNumConfig = formatState.pageNumbering;
    let pageCounterCss = '';
    if (pageNumConfig?.enabled) {
      const pos = pageNumConfig.position || 'bottom-center';
      let pageSlot = '@bottom-center';
      if (pos === 'bottom-right') pageSlot = '@bottom-right';
      else if (pos === 'top-right') pageSlot = '@top-right';

      let counterContent = 'counter(page)';
      if (pageNumConfig.style === 'page-of-total') {
        counterContent = `'Trang ' counter(page) ' / ' counter(pages)`;
      } else if (pageNumConfig.style === 'roman') {
        counterContent = 'counter(page, lower-roman)';
      }

      const marginBoxRule = `
        ${pageSlot} {
          content: ${counterContent};
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 9pt;
          color: #777777;
          font-weight: normal;
        }
      `;

      let firstPageRule = '';
      if (pageNumConfig.skipTitlePage) {
        firstPageRule = `
          @page :first {
            ${pageSlot} {
              content: none !important;
            }
          }
        `;
      }

      pageCounterCss = `
        @page {
          ${marginBoxRule}
        }
        ${firstPageRule}
      `;
    }

    const style = document.createElement('style');
    style.id = 'kgv-print-style';
    style.textContent = `
      @media print {
        @page {
          size: ${pageSizeCss};
          margin: 1.5cm !important;
        }
        ${pageCounterCss}
        
        body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        header, nav, aside, footer,
        .no-print,
        button,
        input,
        select,
        textarea,
        [class*="sidebar"],
        [class*="RightPanel"],
        [class*="Toolbar"],
        [class*="ribbon"],
        .left-sidebar-container,
        .right-sidebar-container,
        .top-nav-container,
        .floating-buttons-container,
        .zoom-controls,
        .format-ribbon,
        .fixed, .absolute.top-4.right-4, .absolute.bottom-4 {
          display: none !important;
        }

        #root, 
        .app-container, 
        main,
        div[style*="zoom"] {
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          zoom: 1 !important;
          transform: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .kgv-adaptive-paper {
          position: relative !important;
          display: block !important;
          margin: 0 auto !important;
          padding-left: 96px !important;
          padding-right: 96px !important;
          padding-top: 144px !important;
          padding-bottom: 144px !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          background: #ffffff !important;
          color: #000000 !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          page-break-inside: auto !important;
        }

        .kgv-adaptive-paper .no-print {
          display: none !important;
        }

        .print-header-footer {
          display: flex !important;
          position: absolute !important;
          color: #555555 !important;
          opacity: 1 !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
      window.print();
    }, 150);
  }, [pageFormat, formatState.pageNumbering]);

  const handleExportOdt = useCallback(() => {
    exportToOdt(activePage?.title || 'Document', safeActiveContent);
  }, [activePage, pageFormat, formatState]);

  const handleExportHtml = useCallback(() => {
    exportToHtmlFile(activePage?.title || 'Document', safeActiveContent, formatState, theme);
  }, [activePage]);

  const handleExportMd = useCallback(() => {
    exportToMarkdownFile(activePage?.title || 'Document', safeActiveContent);
  }, [activePage]);

  const handleExportJsonBackupAll = useCallback(() => {
    exportToJsonBackup(projects);
  }, [projects]);

  const handleSaveApiKey = useCallback((key: string) => { setApiKey(key); saveApiKey(key); }, []);

  const handleApplyFontToSelection = useCallback((family: string) => {
    injectGoogleFont(family);
    window.dispatchEvent(new CustomEvent('kgv-apply-font-selection', { detail: family }));
  }, []);

  
  
  

  const handleExportJson = useCallback(() => {
    const docsExport: Document[] = allPagesInActiveProj.map((p) => ({ id: p.id, title: p.title, content: p.content, folder_id: p.folderId || null }));
    exportJson(activeProject?.folders || [], docsExport);
  }, [allPagesInActiveProj, activeProject]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStartX.current;
    const dy = endY - touchStartY.current;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (isPreviewMode) {
        const currentIndex = allPagesInActiveProj.findIndex(p => p.id === activePageId);
        if (dx > 0 && currentIndex > 0) { 
          setActivePageId(allPagesInActiveProj[currentIndex - 1].id);
        } else if (dx < 0 && currentIndex !== -1 && currentIndex < allPagesInActiveProj.length - 1) { 
          setActivePageId(allPagesInActiveProj[currentIndex + 1].id);
        }
      } else {
        if (dx > 0) {
          if (rightOpen) setRightOpen(false);
          else if (touchStartX.current < 40) setSidebarOpen(true);
        } else {
          if (sidebarOpen) setSidebarOpen(false);
          else if (window.innerWidth - touchStartX.current < 40) setRightOpen(true);
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: theme.bg, color: theme.muted, fontFamily: `'${uiFont}', sans-serif` }}>
        <p className="text-sm">{t.loading}</p>
      </div>
    );
  }

  if (!isWorkspaceActive) {
    return (
      <>
        <WelcomeScreen
          theme={theme}
          themeMode={themeMode}
          onSelectTheme={handleSelectTheme}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          uiFont={uiFont}
          lang={lang}
          onChangeLang={handleSelectLang}
          onEmptyAllTrash={emptyAllTrash}
          refreshTrigger={refreshTrigger}
          onOpenGithubCloudSave={handleOpenGithubCloudSave}
          onOpenProject={(projectId, pageId) => {
            handleSelectProject(projectId);
            if (pageId) setActivePageId(pageId);
            setSidebarOpen(false);
            setRightOpen(false);
            setIsWorkspaceActive(true);
          }}
          onReloadProjects={async () => {
            const projs = await getAllProjectsFromDB();
            setProjects(projs);
          }}
          onImport={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.md,.docx';
            input.onchange = async (e: Event) => {
              const target = e.target as HTMLInputElement;
              const file = target.files?.[0];
              if (file) {
                await handleImportFile(file);
                setSidebarOpen(false);
                setRightOpen(false);
                setIsWorkspaceActive(true);
              }
            };
            input.click();
          }}
          onExportAll={() => {
            exportToJsonBackup(projects);
          }}
        />
              
      <GithubCloudSaveModal
          isOpen={githubModalOpen}
          onClose={() => setGithubModalOpen(false)}
          lang={lang}
          onChangeLang={handleSelectLang}
          uiFont={uiFont}
          theme={theme}
          onDataRestored={async () => {
            const projs = await getAllProjectsFromDB();
            setProjects(projs);
            if (projs.length > 0) {
              if (!projs.find(p => p.id === activeProjectId)) {
                setActiveProjectId(projs[0].id);
                setActivePageId(projs[0].pages[0]?.id || '');
              }
            }
            setRefreshTrigger(prev => prev + 1);
          }}
        />
        
        <ThemeStudioModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          theme={theme}
          themeMode={themeMode}
          onSelectTheme={handleSelectTheme}
          uiFont={uiFont}
          lang={lang}
          customThemes={customThemes}
          onSaveCustomTheme={handleSaveCustomTheme}
          onDeleteCustomTheme={handleDeleteCustomTheme}
          onPreviewTheme={handlePreviewTheme}
        />
        
        <CommandPaletteModal
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          theme={theme}
          lang={lang}
          uiFont={uiFont}
          commands={commandActions}
        />
      </>
    );
  }

  const legacyDocsExport: Document[] = allPagesInActiveProj.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    updated_at: p.lastModified,
    folder_id: p.folderId || null,
  }));

  return (
    <div
      className="h-full w-full flex overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        background: theme.bg,
        color: theme.text,
        fontFamily: `'${uiFont}', sans-serif`,
        transition: 'background 300ms, color 300ms',
        ...viewportAppStyle
      }}
    >
      {/* Mobile/Tablet backdrop for sidebar */}
      {sidebarOpen && !isFocusMode && !isPreviewMode && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left Panel with fluid width, smooth slide transitions & adaptive graphic scaling */}
      <div
        className={`
          fixed md:relative top-0 left-0 h-full z-40 flex-shrink-0
          transition-all duration-300 ease-in-out transform shadow-2xl md:shadow-none kgv-adaptive-panel kgv-hardware-accelerated
          ${sidebarOpen && !isFocusMode && !isPreviewMode ? 'translate-x-0 opacity-100 w-[85vw] sm:w-[320px]' : '-translate-x-full opacity-0 w-0 pointer-events-none'}
        `}
      >
        <LeftPanel
          codexEntities={codexEntities}
          onUpdateCodexEntities={handleUpdateCodexEntities}
          onEditorialHighlight={setEditorialHighlight}
          editor={editorInstance}
          projects={projects}
          activeProjectId={activeProjectId}
          activePageId={activePageId}
          activePage={activePage}
          leftSidebarMainTab={leftSidebarMainTab}
          onLeftSidebarMainTabChange={setLeftSidebarMainTab}
          citationSources={citationSources}
          onUpdateCitationSources={setCitationSources}
          citationStyle={citationStyle}
          onUpdateCitationStyle={setCitationStyle}
          onInsertCitationMarker={handleInsertCitationMarker}
          onUpdateFootnoteContent={handleUpdateFootnoteContent}
          onInsertNewFootnote={handleInsertNewFootnote}
          onDeleteFootnote={handleDeleteFootnote}
          onScrollToEditorMarker={handleScrollToEditorMarker}
          activeFootnoteHighlight={activeFootnoteHighlight}
          onClearFootnoteHighlight={() => setActiveFootnoteHighlight(null)}
          docFont={docFont}
          onGoHome={() => {
            setIsWorkspaceActive(false);
            if (window.history.state?.workspace) {
              window.history.back();
            }
          }}
          theme={theme}
          themeMode={themeMode}
          onSelectTheme={handleSelectTheme}
          uiFont={uiFont}
          lang={lang}
          onChangeLang={handleSelectLang}
          t={t}
          sidebarOpen={sidebarOpen}
          onSelectProject={handleSelectProject}
          onNewProject={handleCreateNewProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          onSelectPage={(id: string) => { setActivePageId(id); if (window.innerWidth < 768) setSidebarOpen(false); }}
          onNewPage={addPage}
          onDeletePage={deletePage}
          onRenamePage={renamePage}
          onCreateFolder={addFolder}
          onRenameFolder={renameFolder}
          onDeleteFolder={deleteFolder}
          onMovePageToFolder={movePageToFolder}
          onRestorePage={restorePage}
          onPermanentDelete={permanentDeletePage}
          onEmptyBin={emptyAllTrash}
          onCloseSidebar={() => setSidebarOpen(false)}
          onOpenGithubCloudSave={handleOpenGithubCloudSave}
          onImportFile={handleImportFile}
          onReloadProjects={async () => {
            const projs = await getAllProjectsFromDB();
            setProjects(projs);
          }}
        />
      </div>

      {/* Main Workspace Area with fluid flex expansion & smooth resize transition */}
      <main className="flex-1 min-w-0 h-full overflow-hidden flex flex-col transition-all duration-300 ease-in-out relative">
        
        {/* Floating Panel Toggles */}
        {!isFocusMode && !isPreviewMode && (
          <>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute top-4 left-4 z-50 p-2 rounded-lg transition-all hover:opacity-80 active:scale-95 shadow-sm"
                style={{
                  backgroundColor: theme.surface,
                  color: theme.text,
                  border: `1px solid ${theme.border}`
                }}
                title={t.openSidebar || 'Open Sidebar'}
              >
                <PanelLeft size={18} />
              </button>
            )}

            <div className={`absolute top-4 z-50 hidden lg:flex items-center p-1 rounded-xl border shadow-xs gap-0.5 transition-all duration-300 ${sidebarOpen ? 'left-4' : 'left-16'}`} style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
              <button
                onClick={() => { setViewMode('normal'); setBlockViewOpen(false); }}
                className="p-2 rounded-lg transition-all flex items-center justify-center"
                style={{
                  backgroundColor: viewMode === 'normal' && !blockViewOpen ? (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
                  color: viewMode === 'normal' && !blockViewOpen ? theme.text : theme.textMuted
                }}
                title={t.normalView || 'Normal View'}
              >
                <FileText size={15} />
              </button>

              <button
                onClick={() => { setViewMode('flashcard'); setBlockViewOpen(false); setIsFocusMode(false); setIsPreviewMode(false); }}
                className="p-2 rounded-lg transition-all flex items-center justify-center"
                style={{
                  backgroundColor: viewMode === 'flashcard' ? (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
                  color: viewMode === 'flashcard' ? theme.text : theme.textMuted
                }}
                title={t.flashcardMode || 'Flashcard Mode'}
              >
                <Brain size={15} />
              </button>
              <div className="w-px h-4 mx-1 opacity-20" style={{ backgroundColor: theme.textMuted }} />
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                style={{ color: theme.textMuted }}
                onMouseEnter={e => e.currentTarget.style.color = theme.text}
                onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
                title={lang === 'vi' ? 'Command Palette (Ctrl + K)' : 'Command Palette (Ctrl + K)'}
              >
                <Terminal size={15} />
              </button>
            </div>
            <div className={`absolute top-4 z-50 flex items-center gap-2 pr-2 transition-all duration-300 ${isSplitView ? "right-16 md:right-[544px] lg:right-[604px] xl:right-[644px]" : "right-16"}`}>
              <WordCountDropdown
                wordCount={wordCount}
                charCount={charCount}
                readMin={readMin}
                theme={theme}
                uiFont={uiFont}
                lang={lang}
                direction="down"
              />
              <button
                onClick={handleToggleFocusMode}
                className="p-1.5 rounded transition-all hover:opacity-80 active:scale-95"
                style={{
                  color: isFocusMode ? theme.accent : theme.text,
                }}
                title={isFocusMode ? (t.exitFocus || 'Exit Focus') : (t.focus || 'Focus Mode (DND)')}
              >
                <Hourglass size={16} />
              </button>
              <button
                onClick={handleTogglePreviewMode}
                className="p-1.5 rounded transition-all hover:opacity-80 active:scale-95"
                style={{
                  color: isPreviewMode ? theme.accent : theme.text,
                }}
                title={t.previewMode || 'Preview Mode'}
              >
                <Coffee size={16} />
              </button>
              <button
                onClick={() => {
                  setBlockViewOpen(prev => !prev);
                  setIsFocusMode(false);
                  setIsPreviewMode(false);
                }}
                className="p-1.5 rounded transition-all hover:opacity-80 active:scale-95"
                style={{
                  color: blockViewOpen ? theme.accent : theme.text,
                }}
                title={t.blockView || 'Block View Organizer'}
              >
                <LayoutList size={16} />
              </button>
              <button
                onClick={handleToggleTypewriterMode}
                className="p-1.5 rounded transition-all hover:opacity-80 active:scale-95"
                style={{
                  color: typewriterMode ? theme.accent : theme.text,
                }}
                title={t.typewriterMode || 'Typewriter Scroll'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14h16M7 18h10M12 14v4M9 10v4M15 10v4M6 10v4M18 10v4M4 8h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8zM8 4h8v4H8z"/>
                </svg>
              </button>
              <button
                onClick={() => {
                  setIsSplitView(prev => !prev);
                  if (!isSplitView) {
                    setIsFocusMode(false);
                    setIsPreviewMode(false);
                  }
                }}
                className="p-1.5 rounded transition-all hover:opacity-80 active:scale-95 flex items-center justify-center"
                style={{
                  backgroundColor: isSplitView ? theme.accentLight : 'transparent',
                  color: isSplitView ? theme.accent : theme.text,
                  border: isSplitView ? `1px solid ${theme.accent}` : '1px solid transparent',
                }}
                title={t.toggleSplitView || 'Toggle Split Screen: Reference & Compare'}
              >
                <Columns size={16} />
              </button>
              <button
                onClick={() => setIsSplitRevisionOpen(true)}
                className="p-1.5 rounded transition-all hover:opacity-80 active:scale-95 flex items-center justify-center"
                style={{ color: theme.text }}
                title={t.splitRevisionStudio || 'Split Revision Studio'}
              >
                <GitCompare size={16} />
              </button>
            </div>

            <button
              onClick={() => {
                setRightOpen(prev => !prev);
              }}
              className={`absolute top-4 z-50 p-2 rounded-lg transition-all hover:opacity-80 active:scale-95 shadow-sm duration-300 ${isSplitView ? "right-4 md:right-[496px] lg:right-[556px] xl:right-[596px]" : "right-4"}`}
              style={{
                backgroundColor: rightOpen ? theme.accentLight : theme.surface,
                color: rightOpen ? theme.accent : theme.text,
                border: `1px solid ${rightOpen ? theme.accent : theme.border}`
              }}
              title={t.settings || 'Toggle Settings'}
            >
              <Settings size={18} />
            </button>
          </>
        )}

        {!isFocusMode && !isPreviewMode && editorInstance && (
          <Toolbar
            editor={(activeBlockEditor || editorInstance) as TiptapEditorType}
            theme={theme}
            uiFont={uiFont}
            t={t}
            lang={lang}
            selectedFont={formatState.fontFam || docFont}
            selectedSize={formatState.fontSize || fontSize}
            availableFonts={availableFonts}
            onFontChange={(fam) => {
              const currentEditor = (activeBlockEditor || editorInstance) as TiptapEditorType;
              currentEditor?.chain().focus().setFontFamily(fam).run();
            }}
            onSizeChange={(size) => {
              handleFormatChange({ fontSize: size });
            }}
            onFontAssign={(role, fontName) => {
              if (role === 'body') handleSelectDocFont(fontName);
              else if (role === 'heading') handleSelectHeadingFont(fontName);
              else if (role === 'mono') handleSelectMonoFont(fontName);
              else if (role === 'ui') handleSelectUiFont(fontName);
            }}
            onUndo={() => ((activeBlockEditor || editorInstance) as TiptapEditorType)?.chain().focus().undo().run()}
            onRedo={() => ((activeBlockEditor || editorInstance) as TiptapEditorType)?.chain().focus().redo().run()}
            canUndo={Boolean(!((activeBlockEditor || editorInstance)?.isDestroyed) && ((activeBlockEditor || editorInstance) as unknown as { can: () => { undo: () => boolean, redo: () => boolean } })?.can?.()?.undo?.())}
            canRedo={Boolean(!((activeBlockEditor || editorInstance)?.isDestroyed) && ((activeBlockEditor || editorInstance) as unknown as { can: () => { undo: () => boolean, redo: () => boolean } })?.can?.()?.redo?.())}
            zoomPercent={zoomPercent}
            zoomInput={zoomInput}
            onZoomIn={() => setZoomPercent(prev => Math.min(250, prev + 10))}
            onZoomOut={() => setZoomPercent(prev => Math.max(50, prev - 10))}
            onZoomInputChange={(val) => {
              setZoomInput(val);
              const num = parseInt(val, 10);
              if (!isNaN(num) && num >= 50 && num <= 250 && val.length >= 2) {
                setZoomPercent(num);
              }
            }}
            onZoomInputBlur={commitZoomInput}
            bodyFont={docFont}
            headingFont={headingFont}
            uiFontRole={uiFont}
            apiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
          />
        )}

        {/* Flashcard Mode vs Split Screen Mode vs Standard Editor Mode */}
        {viewMode === 'flashcard' ? (
          <FlashcardStudio
            theme={theme}
            uiFont={uiFont}
            lang={lang}
            activePage={activePage || null}
            onClose={() => setViewMode('normal')}
          />
        ) : isSplitView ? (
          <div className="flex-1 flex flex-col md:flex-row w-full h-[calc(100%-60px)] overflow-hidden">
            {/* Left Column: Main Editor */}
            <div className="flex-1 h-full overflow-y-auto kgv-scroll flex flex-col items-center p-4 md:p-6 border-r" style={{ borderColor: theme.borderFaint }}>
              <div className="w-full max-w-3xl">
                <Editor
                  lang={lang}
          creativeOptions={creativeOptions}
          codexEntities={codexEntities}
          editorialHighlight={editorialHighlight}
          key={activePage?.id || 'empty'}
                  theme={theme}
                  docFont={docFont}
                  headingFont={headingFont}
                  monoFont={monoFont}
                  fontSize={fontSize}
                  formatState={formatState}
                  onEditorReady={setEditorInstance}
                  t={t}
                  content={safeActiveContent}
                  onContentChange={handleContentChange}
                  isFocusMode={false}
                  onToggleFocusMode={handleToggleFocusMode}
                  isPreviewMode={false}
                  onTogglePreviewMode={handleTogglePreviewMode}
                  typewriterMode={typewriterMode}
                />
              </div>
            </div>

            {/* Right Column: Reference & Document Compare Panel */}
            <div className="w-full md:w-[480px] lg:w-[540px] xl:w-[580px] h-full shrink-0 flex flex-col shadow-lg">
              <ReferenceComparePanel
                theme={theme}
                uiFont={uiFont}
                docFont={docFont}
                monoFont={monoFont}
                lang={lang}
                activePage={activePage || null}
                activeProject={projects.find(p => p.id === activeProjectId) || null}
                onInsertQuoteToEditor={handleInsertQuoteToEditor}
                onClose={() => setIsSplitView(false)}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex w-full h-[calc(100%-60px)] overflow-hidden">
            {/* Floating Paper Sheet Container & Dynamic Page Format Wrapper with momentum scroll & GPU locking */}
            <div className={`flex-1 overflow-y-auto kgv-scroll kgv-momentum-scroll kgv-hardware-accelerated transition-all duration-300 ease-in-out flex flex-col items-center pb-36 px-3 sm:px-6 relative ${
              (isFocusMode || isPreviewMode) 
                ? 'pt-12 sm:pt-16 md:pt-20' 
                : 'pt-2 sm:pt-3 md:pt-4'
            }`}>
              <div className="w-full flex flex-col items-center transition-all duration-200" style={{ zoom: zoomPercent / 100 }}>
              {(() => {
                const isPreviewOrFocus = isPreviewMode || isFocusMode;
                const isPageless = pageFormat.paperSize === 'pageless';
                const paperWidth = pageFormat.orientation === 'landscape'
                  ? (PAPER_SIZES_PX[pageFormat.paperSize]?.h || 1123)
                  : (PAPER_SIZES_PX[pageFormat.paperSize]?.w || 794);
                const paperHeight = pageFormat.orientation === 'landscape'
                  ? (PAPER_SIZES_PX[pageFormat.paperSize]?.w || 794)
                  : (PAPER_SIZES_PX[pageFormat.paperSize]?.h || 1123);
                const autoFitScale = containerWidth < paperWidth ? (containerWidth / paperWidth) : 1;
                const marginPx = 72 * 4 / 3; // 96px

                return (
                  <>
                    <div
                      className={`flex-1 flex flex-col w-full relative transition-all duration-300 ease-in-out kgv-hardware-accelerated h-full max-w-3xl px-4 md:px-6 pt-2 pb-24 md:pt-4 md:pb-32 ${blockViewOpen ? "flex" : "hidden"}`}
                      style={{ backgroundColor: 'transparent' }}
                    >
                      {editorInstance && blockViewOpen && (
                        <BlockOrganizerPanel 
                          editor={editorInstance as TiptapEditorType}
                          onClose={() => setBlockViewOpen(false)}
                          theme={theme}
                          lang={lang}
                          uiFont={uiFont}
                          docFont={docFont}
                          headingFont={headingFont}
                          fontSize={fontSize}
                          formatState={formatState}
                          setActiveBlockEditor={setActiveBlockEditor}
                        />
                      )}
                    </div>

                    <div 
                      className={`w-full flex-col items-center transition-all duration-300 relative ${blockViewOpen ? "hidden" : "flex"}`}
                      style={!isPreviewOrFocus && !isPageless ? { width: `${paperWidth}px`, zoom: autoFitScale } : {}}
                    >
                      <div className={!isPreviewOrFocus && !isPageless ? "flex flex-col items-center w-full no-print" : "w-full"}>
                        <div
                          className={
                            isPreviewOrFocus
                              ? "w-full max-w-[640px] md:max-w-[700px] lg:max-w-3xl mt-2 sm:mt-4 mb-20 rounded-2xl md:rounded-3xl p-5 sm:p-8 md:p-12 border shadow-2xl relative transition-all duration-300 kgv-hardware-accelerated kgv-adaptive-paper mx-auto"
                              : isPageless
                                ? "flex-1 flex flex-col w-full relative transition-all duration-300 ease-in-out kgv-hardware-accelerated max-w-4xl px-4 sm:px-8 md:px-16 pt-6 sm:pt-12 pb-24 md:pt-16 md:pb-32 mx-auto"
                                : "paper-page relative rounded-lg shadow-md transition-all duration-200 border"
                          }
                          style={
                            isPreviewOrFocus
                              ? { backgroundColor: theme.surface || '#ffffff', borderColor: theme.border, color: theme.text }
                              : isPageless
                                ? { maxWidth: `${formatState.maxW || 800}px`, backgroundColor: 'transparent', color: theme.text }
                                : {
                                    '--page-surface': theme.surface || '#ffffff',
                                    width: `${paperWidth}px`,
                                    minHeight: `${paperHeight}px`,
                                    backgroundColor: theme.surface || '#ffffff',
                                    borderColor: theme.border || 'rgba(0,0,0,0.06)',
                                    paddingLeft: `${marginPx}px`,
                                    paddingRight: `${marginPx}px`,
                                    paddingTop: `${marginPx}px`,
                                    paddingBottom: `${marginPx}px`,
                                    boxSizing: 'border-box',
                                    position: 'relative',
                                    backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent calc(${paperHeight}px - 32px), ${theme.bg} calc(${paperHeight}px - 32px), ${theme.bg} ${paperHeight}px)`,
                                  }
                          }
                        >


                          <div className={!isPreviewOrFocus && !isPageless ? "w-full h-full relative" : "w-full relative"} style={!isPreviewOrFocus && !isPageless ? { color: theme.text } : {}}>
                            <Editor
                  lang={lang}
                              key={activePage?.id || 'empty'}
                              theme={theme}
                              docFont={docFont}
                              headingFont={headingFont}
                              monoFont={monoFont}
                              fontSize={fontSize}
                              formatState={formatState}
                              onEditorReady={setEditorInstance}
                              t={t}
                              content={safeActiveContent}
                              onContentChange={handleContentChange}
                              isFocusMode={isFocusMode}
                              onToggleFocusMode={handleToggleFocusMode}
                              isPreviewMode={isPreviewMode}
                              onTogglePreviewMode={handleTogglePreviewMode}
                              typewriterMode={typewriterMode}
                              creativeOptions={creativeOptions}
                              codexEntities={codexEntities}
                              editorialHighlight={editorialHighlight}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Right Panel with fluid width & smooth slide transitions */}
      {rightOpen && !isFocusMode && !isPreviewMode && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setRightOpen(false)} />
      )}
      
      
      <div 
        className={`
          fixed md:relative top-0 right-0 h-full z-40 flex-shrink-0
          transition-all duration-300 ease-in-out transform shadow-2xl md:shadow-none kgv-adaptive-panel kgv-hardware-accelerated
          ${rightOpen && !isFocusMode && !isPreviewMode ? 'translate-x-0 opacity-100 w-[85vw] sm:w-[300px]' : 'translate-x-full opacity-0 w-0 pointer-events-none'}
        `}
      >
        <RightPanel
          key={activeProjectId}
          panel={rightPanelTab}
          onSectionChange={setRightPanelTab}
          activePage={activePage || null}
          onRestore={(content, title) => {
            updateActivePage({ content, title, lastModified: new Date().toISOString() });
            if (activeProjectId) {
              renamePage(activePageId, title);
            }
          }}
          editor={(activeBlockEditor || editorInstance) as TiptapEditorType}
          formatState={formatState}
          onFormatChange={handleFormatChange}
          pageFormat={pageFormat}
          onPageFormatChange={setPageFormat}
          theme={theme}
          themeMode={themeMode}
          customTheme={customTheme}
          docFont={docFont}
          bodyFont={docFont}
          headingFont={headingFont}
          monoFont={monoFont}
          uiFont={uiFont}
          customFont={customFont}
          customFonts={customFonts}
          lang={lang}
          onChangeLang={handleSelectLang}
          t={t}
          wordCount={wordCount}
          charCount={charCount}
          onSelectTheme={handleSelectTheme}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onSelectDocFont={handleSelectDocFont}
          onSelectHeadingFont={handleSelectHeadingFont}
          onSelectMonoFont={handleSelectMonoFont}
          onSelectUiFont={handleSelectUiFont}
          onFontAssign={(role, fontName) => {
            if (role === 'body') handleSelectDocFont(fontName);
            else if (role === 'heading') handleSelectHeadingFont(fontName);
            else if (role === 'mono') handleSelectMonoFont(fontName);
            else if (role === 'ui') handleSelectUiFont(fontName);
          }}
          onSelectLang={handleSelectLang}
          onUploadFont={handleUploadFont}
          onRemoveCustomFont={handleRemoveCustomFont}
          onOpenFontExplorer={() => setFontExplorerOpen(true)}
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
          onExportJson={handleExportJson}
          onImportFile={handleImportFile}
          onPrint={handlePrint}
          onExportOdt={handleExportOdt}
          onExportHtml={handleExportHtml}
          onExportMd={handleExportMd}
          onExportJsonBackup={handleExportJsonBackupAll}
          folders={activeProject?.folders || []}
          docs={legacyDocsExport}
          onClose={() => setRightOpen(false)}
          onUpdateFootnoteContent={handleUpdateFootnoteContent}
          onInsertNewFootnote={handleInsertNewFootnote}
          onDeleteFootnote={handleDeleteFootnote}
          onScrollToEditorMarker={handleScrollToEditorMarker}
          activeFootnoteHighlight={activeFootnoteHighlight}
          onClearFootnoteHighlight={() => setActiveFootnoteHighlight(null)}
        />
      </div>

      {fontExplorerOpen && (
        <GoogleFontsPanel onSaveApiKey={handleSaveApiKey}
          theme={theme} uiFont={uiFont} t={t} apiKey={apiKey}
          editor={editorInstance}
          onClose={() => setFontExplorerOpen(false)}
          onApplyToSelection={handleApplyFontToSelection}
          onApplyToUi={handleSelectUiFont}
          onApplyToDoc={handleSelectDocFont}
          onAssignRole={(role, fontName) => {
            if (role === 'body') handleSelectDocFont(fontName);
            else if (role === 'heading') handleSelectHeadingFont(fontName);
            else if (role === 'ui') handleSelectUiFont(fontName);
          }}
          bodyFont={docFont}
          headingFont={headingFont}
          uiFontRole={uiFont}
        />
      )}

      {exportToast && (
        <div className="fixed top-20 right-4 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in fade-in slide-in-from-right-4"
             style={{
               background: theme.isDark ? '#1e1e24' : '#ffffff',
               borderColor: theme.border,
               color: theme.text,
               fontFamily: uiFont,
               fontSize: '0.85rem'
             }}>
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.accent, borderTopColor: 'transparent' }} />
          <span>{exportToast}</span>
        </div>
      )}
      {networkToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border"
             style={{
               background: networkToast.type === 'offline' ? (theme.isDark ? '#3d1d1d' : '#fef2f2') : (theme.isDark ? '#143823' : '#f0fdf4'),
               borderColor: networkToast.type === 'offline' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
               color: theme.text,
               fontFamily: uiFont,
               fontSize: '0.85rem'
             }}>
          <div className={`w-2.5 h-2.5 rounded-full ${networkToast.type === 'offline' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <span>{networkToast.message}</span>
          {networkToast.type === 'offline' && (
            <button
              onClick={() => {
                const title = activePage?.title || 'document';
                const text = (safeActiveContent).replace(/<[^>]*>/g, '');
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title.replace(/[\\/:*?"<>|]/g, '')}-offline-backup.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              title="Download text backup (.txt)"
              style={{
                background: theme.accent, color: theme.isDark ? theme.bg : '#fff', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              ↓ Backup .txt
            </button>
          )}
          <button onClick={() => setNetworkToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, padding: 2, color: theme.text }}>×</button>
        </div>
      )}



      {!sidebarOpen && (
        <div 
          className="fixed left-5 z-20 text-xs pointer-events-none" 
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))', color: theme.faint }}
        >
          {saving ? (t.saving || 'Saving...') : (t.saved || 'Saved')}
        </div>
      )}


      {(isFocusMode || isPreviewMode) && (
        <div 
          style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 999999 }}
          className="flex items-center gap-2 pointer-events-auto select-none max-w-[calc(100vw-24px)]"
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full shadow-2xl border backdrop-blur-md"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
              fontFamily: uiFont,
            }}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0" style={{ background: theme.bg, borderColor: theme.border }}>
              {isPreviewMode ? <Eye size={13} style={{ color: theme.text, opacity: 0.7 }} /> : <Maximize2 size={13} style={{ color: theme.text, opacity: 0.7 }} />}
              <span>{isFocusMode ? (t.focusMode || 'Focus Mode') : (t.previewMode || 'Preview Mode')}</span>
              {isPreviewMode && (
                <button
                  type="button"
                  onClick={() => {
                    const next = readerStyle === 'zen' ? 'classic' : 'zen';
                    setReaderStyle(next);
                    saveAppSettings({ readerStyle: next });
                  }}
                  className="ml-0.5 px-2 py-0.5 rounded-full transition-colors text-[10px] uppercase font-bold"
                  style={{ backgroundColor: `${theme.accent}22`, color: theme.accent, border: `1px solid ${theme.accent}44` }}
                >
                  {readerStyle === 'zen' ? (t.zenStyle || 'Zen') : (t.classicStyle || 'Classic')}
                </button>
              )}
              <span className="opacity-40 ml-1">·</span>
              <span className="font-mono font-semibold" style={{ color: theme.textMuted }}>{wordCount.toLocaleString()} {t.words || 'words'}</span>
            </div>

            <div className="w-px h-3.5 shrink-0 mx-0.5" style={{ backgroundColor: theme.border }} />

            <ZoomIn size={14} className="shrink-0" style={{ color: theme.text, opacity: 0.5 }} />
            
            <button
              type="button"
              onClick={() => setZoomPercent(prev => Math.max(50, prev - 10))}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-80 active:scale-95 transition-all cursor-pointer shrink-0"
              style={{ color: theme.text, opacity: 0.8 }}
              title="Thu nhỏ (-10%)"
              aria-label="Zoom Out"
            >
              <Minus size={13} />
            </button>

            <div className="flex items-center px-0.5">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={zoomInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setZoomInput(val);
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= 50 && num <= 250 && val.length >= 2) {
                    setZoomPercent(num);
                  }
                }}
                onBlur={commitZoomInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitZoomInput();
                  }
                }}
                className="w-8 text-center text-xs font-bold bg-transparent outline-none cursor-text"
                style={{ color: theme.text }}
                title="Tỉ lệ phóng to/thu nhỏ (50% - 250%)"
              />
              <span className="text-xs font-semibold -ml-0.5" style={{ color: theme.text, opacity: 0.7 }}>%</span>
            </div>

            <button
              type="button"
              onClick={() => setZoomPercent(prev => Math.min(250, prev + 10))}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-80 active:scale-95 transition-all cursor-pointer shrink-0"
              style={{ color: theme.text, opacity: 0.8 }}
              title="Phóng to (+10%)"
              aria-label="Zoom In"
            >
              <Plus size={13} />
            </button>

            {zoomPercent !== 100 && (
              <button
                type="button"
                onClick={() => setZoomPercent(100)}
                className="ml-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer shrink-0"
                style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
                title="Đặt lại 100%"
              >
                100%
              </button>
            )}

            <div className="w-px h-3.5 shrink-0 mx-0.5" style={{ backgroundColor: theme.border }} />

            <button
              type="button"
              onClick={handleExitFocusOrPreview}
              className="px-2.5 py-1 text-xs font-semibold rounded-full hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
              style={{ color: theme.accent }}
              title={isFocusMode ? (t.exitFocusMode || "Exit Focus Mode") : (t.exitPreviewMode || "Exit Preview")}
              aria-label="Exit Mode"
            >
              <X size={13} style={{ color: theme.accent }} />
              <span>{(t.exit || 'Exit')}</span>
            </button>
          </div>
        </div>
      )}

      {/* GitHub Cloud Save Modal */}
      <GithubCloudSaveModal
        isOpen={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        lang={lang}
          onChangeLang={handleSelectLang}
        uiFont={uiFont}
        theme={theme}
        onDataRestored={async () => {
          const projs = await getAllProjectsFromDB();
          setProjects(projs);
          if (projs.length > 0) {
            if (!projs.find(p => p.id === activeProjectId)) {
              setActiveProjectId(projs[0].id);
              setActivePageId(projs[0].pages[0]?.id || '');
            }
          }
          setRefreshTrigger(prev => prev + 1);
        }}
      />
      {/* Smart Link Hover Preview Card */}
      <LinkHoverPreview
        theme={theme}
        uiFont={uiFont}
        lang={lang}
        onEditLink={(element, currentUrl) => {
          const newUrl = window.prompt(lang === 'vi' ? 'Chỉnh sửa URL:' : 'Edit URL:', currentUrl);
          if (newUrl !== null && newUrl.trim()) {
            element.setAttribute('href', newUrl.trim());
            if (activePage) {
              const updatedContent = document.querySelector('.kgv-editor')?.innerHTML;
              if (updatedContent) handleContentChange(updatedContent);
            }
          }
        }}
        onRemoveLink={(element) => {
          const parent = element.parentNode;
          while (element.firstChild) {
            parent?.insertBefore(element.firstChild, element);
          }
          parent?.removeChild(element);
          if (activePage) {
            const updatedContent = document.querySelector('.kgv-editor')?.innerHTML;
            if (updatedContent) handleContentChange(updatedContent);
          }
        }}
      />

      {/* Split Revision Studio Modal */}
      <SplitRevisionStudio
        isOpen={isSplitRevisionOpen}
        onClose={() => setIsSplitRevisionOpen(false)}
        activePage={activePage}
        theme={theme}
        lang={lang}
        uiFont={uiFont}
        docFont={docFont}
        onUpdateContent={(newContent) => {
          if (activePage) {
            handleContentChange(newContent);
          }
        }}
      />

      {isPreviewMode && readerStyle === "zen" && activePage && (
        <ZenReader
          content={activePage.content || ""}
          title={activePage.title || ""}
          theme={theme}
          docFont={docFont}
          zoomPercent={zoomPercent}
          onClose={() => setIsPreviewMode(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      )}

      {/* Universal Command Palette Modal */}
      <ThemeStudioModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        theme={theme}
        themeMode={themeMode}
        onSelectTheme={handleSelectTheme}
        uiFont={uiFont}
        lang={lang}
        customThemes={customThemes}
        onSaveCustomTheme={handleSaveCustomTheme}
        onDeleteCustomTheme={handleDeleteCustomTheme}
        onPreviewTheme={handlePreviewTheme}
      />
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        theme={theme}
        lang={lang}
        uiFont={uiFont}
        commands={commandActions}
      />
    </div>
  );
}
