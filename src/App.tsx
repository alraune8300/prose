import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  THEMES, deriveCustomTheme, WELCOME_ID,
  BUILTIN_FONTS,
} from './theme';
import { getDict, type Dict } from './i18n';
import { exportTxt, exportJson } from './exportUtils';
import { importFile, exportToPdf, exportToDocx, exportToHtmlFile, exportToMarkdownFile, exportToJsonBackup } from './fileHandlers';
import { saveApiKey, loadApiKey, injectGoogleFont, reinjectSavedFonts } from './googleFontsApi';
import { Minimize2, X, Plus, Minus, ZoomIn, Eye, Maximize2, PanelLeft, Settings } from 'lucide-react';
import { type Editor as TiptapEditorType } from '@tiptap/react';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import WordCountDropdown from './WordCountDropdown';
import GoogleFontsPanel from './GoogleFontsPanel';
import Editor from './Editor';
import Toolbar from './Toolbar';
import WelcomeScreen from './WelcomeScreen';
import GithubCloudSaveModal from './GithubCloudSaveModal';
import type { Document, Folder, ThemeColors, ThemeMode, CustomTheme, CustomFont, Lang, Project, Page, FormatState, PageFormat } from './types';
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
function loadCustomTheme(): CustomTheme | null {
  const p = LS.getJSON<CustomTheme>('kgv-custom-theme');
  return p && p.bg && p.text ? { bg: p.bg, text: p.text, accent: p.accent || '#2563EB' } : null;
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

  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [customTheme, setCustomTheme] = useState<CustomTheme | null>(null);
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
  const [showRibbon, setShowRibbon] = useState(() => LS.get('kgv-show-ribbon') !== 'false');

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<string>('settings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [zoomInput, setZoomInput] = useState<string>('100');
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

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
  
  const [formatState, setFormatState] = useState<FormatState>({
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
  });

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

  const [mobileRibbonStyle, setMobileRibbonStyle] = useState<React.CSSProperties>({});

  // 2. STICKY TOOLBAR ENGINE: Position Format Ribbon dynamically on mobile Viewport
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateToolbarPosition = () => {
      if (window.innerWidth < 768) {
        setMobileRibbonStyle({
          position: 'fixed',
          top: `${viewport.offsetTop}px`,
          left: `${viewport.offsetLeft}px`,
          width: `${viewport.width}px`,
          zIndex: 40,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'none',
        });
      } else {
        setMobileRibbonStyle({});
      }
    };

    viewport.addEventListener('resize', updateToolbarPosition);
    viewport.addEventListener('scroll', updateToolbarPosition);
    window.addEventListener('resize', updateToolbarPosition);

    updateToolbarPosition();

    return () => {
      viewport.removeEventListener('resize', updateToolbarPosition);
      viewport.removeEventListener('scroll', updateToolbarPosition);
      window.removeEventListener('resize', updateToolbarPosition);
    };
  }, [showRibbon]);

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
      restoreScroll();
      return next;
    });
  }, [restoreScroll]);

  const handleTogglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => {
      const next = !prev;
      setIsFocusMode(false);
      restoreScroll();
      return next;
    });
  }, [restoreScroll]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedProjRef = useRef<string>('');

  const t: Dict = useMemo(() => getDict(lang), [lang]);

  const theme: ThemeColors = useMemo(() => {
    if (themeMode === 'custom' && customTheme) return deriveCustomTheme(customTheme.bg, customTheme.text, customTheme.accent);
    const key = (themeMode || 'light').toLowerCase();
    return THEMES[key] || THEMES.light;
  }, [themeMode, customTheme]);




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
      language: lang,
    });
  }, [activeProjectId, activePageId, themeMode, docFont, fontSize, formatState.lineH, pageFormat, sidebarOpen, rightOpen, isFocusMode, isPreviewMode, lang, loading]);

  // Load state, projects, and appSettings from IndexedDB / LocalStorage
  useEffect(() => {
    const savedMode = loadThemeMode();
    setThemeMode(savedMode);
    if (savedMode === 'custom') { const ct = loadCustomTheme(); if (ct) setCustomTheme(ct); }
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
        if (settings.isLeftPanelOpen !== undefined) setSidebarOpen(settings.isLeftPanelOpen);
        if (settings.isRightPanelOpen !== undefined) setRightOpen(settings.isRightPanelOpen);
        if (settings.isFocusMode !== undefined) setIsFocusMode(settings.isFocusMode);
        if (settings.isPreviewMode !== undefined) setIsPreviewMode(settings.isPreviewMode);
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

  const { wordCount, charCount } = useMemo(() => {
    const raw = activePage?.content || '';
    if (!raw) return { wordCount: 0, charCount: 0 };
    const text = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return { wordCount: text ? text.split(/\s+/).length : 0, charCount: text.length };
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
  const handleCustomThemeChange = useCallback((c: CustomTheme) => {
    setCustomTheme(c); LS.setJSON('kgv-custom-theme', c); setThemeMode('custom'); LS.set('kgv-theme', 'custom');
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

  const handleExportPdf = useCallback(() => {
    exportToPdf(activePage?.title || 'Document', activePage?.content || '', pageFormat);
  }, [activePage, pageFormat]);

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

    const style = document.createElement('style');
    style.id = 'kgv-print-style';
    style.textContent = `
      @media print {
        @page {
          size: ${pageSizeCss};
          margin: 0 !important;
        }
        
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
  }, [pageFormat]);

  const handleExportDocx = useCallback(() => {
    exportToDocx(activePage?.title || 'Document', activePage?.content || '', pageFormat);
  }, [activePage, pageFormat]);

  const handleExportHtml = useCallback(() => {
    exportToHtmlFile(activePage?.title || 'Document', activePage?.content || '');
  }, [activePage]);

  const handleExportMd = useCallback(() => {
    exportToMarkdownFile(activePage?.title || 'Document', activePage?.content || '');
  }, [activePage]);

  const handleExportJsonBackupAll = useCallback(() => {
    exportToJsonBackup(projects);
  }, [projects]);

  const handleSaveApiKey = useCallback((key: string) => { setApiKey(key); saveApiKey(key); }, []);

  const handleApplyFontToSelection = useCallback((family: string) => {
    injectGoogleFont(family);
    window.dispatchEvent(new CustomEvent('kgv-apply-font-selection', { detail: family }));
  }, []);

  
  
  
  const handleExportTxt = useCallback(() => {
    if (!activePage) return;
    const doc: Document = { id: activePage.id, title: activePage.title, content: activePage.content };
    exportTxt(doc);
  }, [activePage]);

  const handleExportJson = useCallback(() => {
    const docsExport: Document[] = allPagesInActiveProj.map((p) => ({ id: p.id, title: p.title, content: p.content, folder_id: p.folderId || null }));
    exportJson(activeProject?.folders || [], docsExport);
  }, [allPagesInActiveProj, activeProject]);

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
          uiFont={uiFont}
          lang={lang}
          onChangeLang={handleSelectLang}
          onEmptyAllTrash={emptyAllTrash}
          refreshTrigger={refreshTrigger}
          onOpenGithubCloudSave={handleOpenGithubCloudSave}
          onOpenProject={(projectId, pageId) => {
            handleSelectProject(projectId);
            if (pageId) setActivePageId(pageId);
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
          ${sidebarOpen && !isFocusMode && !isPreviewMode ? 'translate-x-0 opacity-100 w-[260px]' : '-translate-x-full opacity-0 w-0 pointer-events-none'}
        `}
      >
        <LeftPanel
          projects={projects}
          activeProjectId={activeProjectId}
          activePageId={activePageId}
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
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="absolute top-4 z-50 p-2 rounded-lg transition-all hover:opacity-80 active:scale-95 shadow-sm backdrop-blur-md"
              style={{
                left: '16px',
                backgroundColor: sidebarOpen ? theme.accentLight : theme.surface,
                color: sidebarOpen ? theme.accent : theme.text,
                border: `1px solid ${sidebarOpen ? theme.accent : theme.border}`
              }}
              title={sidebarOpen ? (t.collapse || 'Collapse Sidebar') : (t.openSidebar || 'Open Sidebar')}
            >
              <PanelLeft size={18} />
            </button>

            <button
              onClick={() => {
                if (rightOpen && rightPanelTab === 'settings') setRightOpen(false);
                else { setRightPanelTab('settings'); setRightOpen(true); }
              }}
              className="absolute top-4 right-4 z-50 p-2 rounded-lg transition-all hover:opacity-80 active:scale-95 shadow-sm backdrop-blur-md"
              style={{
                backgroundColor: rightOpen ? theme.accentLight : theme.surface,
                color: rightOpen ? theme.accent : theme.text,
                border: `1px solid ${rightOpen ? theme.accent : theme.border}`
              }}
              title={t.settings || 'Toggle Settings'}
            >
              <Settings size={18} />
            </button>

            <WordCountDropdown wordCount={wordCount} charCount={charCount} readMin={Math.ceil(wordCount / 200)} theme={theme} uiFont={uiFont} />
          </>
        )}

        {/* Document Title Header (Editable in standard mode, stylized book header in Preview mode) */}
        {!isFocusMode && !isPreviewMode && (
          <div className="max-w-2xl mx-auto w-full px-6 md:px-8 pt-14 md:pt-16 transition-all duration-300 flex items-center justify-between">
            <input
              value={activePage?.title || ''}
              onChange={(e) => {
                updateActivePage({ title: e.target.value });
                if (activeProjectId) {
                  handleRenameProject(activeProjectId, e.target.value);
                }
              }}
              placeholder={t.titlePlaceholder}
              className="flex-1 bg-transparent outline-none border-none text-2xl md:text-3xl font-normal min-w-0"
              style={{ fontFamily: `'${docFont}', Georgia, serif`, color: theme.text }}
            />
            {activePage?.isDraft && activePage?.originalPageId && (
              <button
                onClick={handleCommitDraft}
                className="ml-4 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{ backgroundColor: theme.accent, color: theme.isDark ? theme.bg : '#fff' }}
                title="Update original document with these changes"
              >
                Commit to Original
              </button>
            )}
          </div>
        )}

        {!isFocusMode && !isPreviewMode && editorInstance && showRibbon && (
          <div 
            className="w-full border-b border-neutral-200/20 dark:border-neutral-800/20 my-2 flex items-center justify-between pl-6 pr-4 md:pr-[72px] transition-all duration-200"
            style={{
              backgroundColor: 'transparent',
              ...mobileRibbonStyle
            }}
          >
            <div className="flex-1 min-w-0">
              <Toolbar
                editor={editorInstance as TiptapEditorType}
                theme={theme}
                uiFont={uiFont}
                t={t}
                selectedFont={formatState.fontFam || docFont}
                selectedSize={formatState.fontSize || fontSize}
                availableFonts={availableFonts}
                                onFontChange={(fam) => {
                  (editorInstance as TiptapEditorType)?.chain().focus().setFontFamily(fam).run();
                }}
                onSizeChange={(delta) => {
                  const currentSz = editorInstance?.getAttributes('textStyle')?.fontSize?.replace('px', '') || formatState.fontSize;
                  const newSz = Math.max(8, Math.min(96, Number(currentSz) + delta));
                  (editorInstance as TiptapEditorType)?.chain().focus().setFontSize(String(newSz)).run();
                }}
                onSizeInput={(sz) => {
                  (editorInstance as TiptapEditorType)?.chain().focus().setFontSize(String(sz)).run();
                }}
        onOpenGithubCloudSave={handleOpenGithubCloudSave}
                isFocusMode={isFocusMode}
                onToggleFocusMode={handleToggleFocusMode}
                isPreviewMode={isPreviewMode}
                onTogglePreviewMode={handleTogglePreviewMode}
                typewriterMode={typewriterMode}
                onToggleTypewriterMode={handleToggleTypewriterMode}
                onUndo={() => (editorInstance as TiptapEditorType)?.chain().focus().undo().run()}
                onRedo={() => (editorInstance as TiptapEditorType)?.chain().focus().redo().run()}
                canUndo={Boolean(!editorInstance?.isDestroyed && (editorInstance as unknown as { can: () => { undo: () => boolean, redo: () => boolean } })?.can?.()?.undo?.())}
                canRedo={Boolean(!editorInstance?.isDestroyed && (editorInstance as unknown as { can: () => { undo: () => boolean, redo: () => boolean } })?.can?.()?.redo?.())}
                zoomPercent={zoomPercent}
                zoomInput={zoomInput}
                onZoomIn={() => setZoomPercent(prev => Math.min(250, prev + 10))}
                onZoomOut={() => setZoomPercent(prev => Math.max(50, prev - 10))}
                onZoomReset={() => setZoomPercent(100)}
                onZoomInputChange={(val) => {
                  setZoomInput(val);
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= 50 && num <= 250 && val.length >= 2) {
                    setZoomPercent(num);
                  }
                }}
                onZoomInputBlur={commitZoomInput}
              />
            </div>
            <button
              type="button"
              onClick={() => { setShowRibbon(false); LS.set('kgv-show-ribbon', 'false'); }}
              title="Hide Format Ribbon"
              aria-label="Hide Format Ribbon"
              className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-2 cursor-pointer shrink-0"
              style={{ color: theme.muted }}
            >
              <Minimize2 size={15} />
            </button>
          </div>
        )}

        {!isFocusMode && !isPreviewMode && !showRibbon && (
          <div className="flex items-center justify-between px-6 pt-2 select-none">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm backdrop-blur-md"
              style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, fontFamily: uiFont }}
            >
              <ZoomIn size={13} className="opacity-70 mr-0.5" />
              <button
                type="button"
                onClick={() => setZoomPercent(prev => Math.max(50, prev - 10))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Thu nhỏ (-10%)"
              >
                <Minus size={12} />
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
                  className="w-7 text-center text-xs font-semibold bg-transparent outline-none cursor-text"
                />
                <span className="text-xs font-semibold opacity-70 -ml-0.5">%</span>
              </div>
              <button
                type="button"
                onClick={() => setZoomPercent(prev => Math.min(250, prev + 10))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Phóng to (+10%)"
              >
                <Plus size={12} />
              </button>
              {zoomPercent !== 100 && (
                <button
                  type="button"
                  onClick={() => setZoomPercent(100)}
                  className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 hover:opacity-80 active:scale-95 transition-all cursor-pointer"
                  title="Đặt lại 100%"
                >
                  100%
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setShowRibbon(true); LS.set('kgv-show-ribbon', 'true'); }}
              className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
              style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }}
            >
              <span>{(t.showFormatRibbon || 'Show Format Ribbon')}</span>
            </button>
          </div>
        )}

        {/* Floating Paper Sheet Container & Dynamic Page Format Wrapper with momentum scroll & GPU locking */}
        <div className={`flex-1 overflow-y-auto kgv-scroll kgv-momentum-scroll kgv-hardware-accelerated transition-all duration-300 ease-in-out flex flex-col items-center pb-36 px-3 sm:px-6 ${
          (isFocusMode || isPreviewMode) 
            ? 'pt-12 sm:pt-16 md:pt-20' 
            : (showRibbon ? 'pt-20 md:pt-5' : 'pt-3 sm:pt-4 md:pt-5')
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

            if (isPreviewOrFocus) {
              return (
                <div
                  className="w-full max-w-[640px] md:max-w-[700px] lg:max-w-3xl mt-2 sm:mt-4 mb-20 rounded-2xl md:rounded-3xl p-5 sm:p-8 md:p-12 border shadow-2xl relative transition-all duration-300 kgv-hardware-accelerated kgv-adaptive-paper mx-auto"
                  style={{
                    backgroundColor: theme.surface || '#ffffff',
                    borderColor: theme.border,
                    color: theme.text,
                  }}
                >
                  {/* Title Header in Preview / Focus card */}
                  <div className="text-center mb-6 pt-2">
                    <h1
                      className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight"
                      style={{ fontFamily: `'${docFont}', Georgia, serif`, color: theme.text }}
                    >
                      {activePage?.title || 'Untitled Document'}
                    </h1>
                    <div className="w-12 h-0.5 mx-auto mt-3 rounded opacity-30" style={{ backgroundColor: theme.text }} />
                  </div>

                  <Editor
                    key={activePage?.id || 'empty'}
                    theme={theme}
                    docFont={docFont}
                    fontSize={fontSize}
                    formatState={formatState}
                    onEditorReady={setEditorInstance}
                    t={t}
                    content={activePage?.content || ''}
                    onContentChange={handleContentChange}
                    isFocusMode={isFocusMode}
                    onToggleFocusMode={handleToggleFocusMode}
                    isPreviewMode={isPreviewMode}
                    onTogglePreviewMode={handleTogglePreviewMode}
                    typewriterMode={typewriterMode}
                  />
                </div>
              );
            }

            if (isPageless) {
              return (
                <div
                  className="flex-1 flex flex-col w-full relative transition-all duration-300 ease-in-out kgv-hardware-accelerated max-w-4xl px-8 md:px-16 pt-12 pb-24 md:pt-16 md:pb-32"
                  style={{
                    maxWidth: `${formatState.maxW || 800}px`,
                    backgroundColor: 'transparent',
                    color: theme.text,
                  }}
                >
                  <Editor
                    key={activePage?.id || 'empty'}
                    theme={theme}
                    docFont={docFont}
                    fontSize={fontSize}
                    formatState={formatState}
                    onEditorReady={setEditorInstance}
                    t={t}
                    content={activePage?.content || ''}
                    onContentChange={handleContentChange}
                    isFocusMode={isFocusMode}
                    onToggleFocusMode={handleToggleFocusMode}
                    isPreviewMode={isPreviewMode}
                    onTogglePreviewMode={handleTogglePreviewMode}
                    typewriterMode={typewriterMode}
                  />
                </div>
              );
            }

            const autoFitScale = containerWidth < paperWidth ? (containerWidth / paperWidth) : 1;
            const marginPx = 72 * 4 / 3; // 96px

            return (
              <div 
                className="document-workspace flex flex-col items-center transition-all duration-300 relative"
                style={{ 
                  width: `${paperWidth}px`, 
                  zoom: autoFitScale 
                }}
              >
                {/* On-screen continuous physical page container */}
                <div className="flex flex-col items-center w-full no-print">
                  <div
                    className="paper-page relative rounded-lg shadow-md transition-all duration-200 border"
                    style={{
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
                    } as React.CSSProperties}
                  >
                    {/* Page Header (Tên tài liệu) */}
                    <div
                      className="absolute left-0 w-full text-center flex items-center justify-center text-[10px] uppercase tracking-wider opacity-40 font-semibold pointer-events-none select-none"
                      style={{
                        top: '48px',
                        height: '36px',
                        color: theme.textMuted,
                        fontFamily: uiFont,
                      }}
                    >
                      {activePage?.title || 'Untitled Document'}
                    </div>

                    {/* Content block: Single Tiptap editor */}
                    <div className="w-full h-full relative" style={{ color: theme.text }}>
                      <Editor
                        key={activePage?.id || 'empty'}
                        theme={theme}
                        docFont={docFont}
                        headingFont={headingFont}
                        monoFont={monoFont}
                        fontSize={fontSize}
                        formatState={formatState}
                        onEditorReady={setEditorInstance}
                        t={t}
                        content={activePage?.content || ''}
                        onContentChange={handleContentChange}
                        isFocusMode={isFocusMode}
                        onToggleFocusMode={handleToggleFocusMode}
                        isPreviewMode={isPreviewMode}
                        onTogglePreviewMode={handleTogglePreviewMode}
                        typewriterMode={typewriterMode}
                      />
                    </div>
                  </div>
                </div>

                {/* Print Layout (Only shown when printing) */}
                <div className="hidden print:block w-full">
                  <div
                    className="relative bg-white text-black"
                    style={{
                      width: `${paperWidth}px`,
                      paddingLeft: `${marginPx}px`,
                      paddingRight: `${marginPx}px`,
                      paddingTop: `${marginPx}px`,
                      paddingBottom: `${marginPx}px`,
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      className="absolute left-0 w-full text-center flex items-center justify-center text-[10px] uppercase tracking-wider font-semibold"
                      style={{
                        top: '48px',
                        height: '36px',
                        color: '#555555',
                        fontFamily: uiFont,
                      }}
                    >
                      {activePage?.title || 'Untitled Document'}
                    </div>

                    <div 
                      className="ProseMirror kgv-editor text-left"
                      style={{
                        color: '#000000',
                        fontFamily: `'${formatState?.fontFam || docFont}', Georgia, serif`,
                        fontSize: `${formatState?.fontSize || fontSize || 16}px`,
                        lineHeight: `${Math.round((formatState?.fontSize || fontSize || 16) * (formatState?.lineH || 1.7))}px`,
                      }}
                      dangerouslySetInnerHTML={{ __html: activePage?.content || '<p></p>' }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
          </div>
        </div>
      </main>

      {/* Right Panel with fluid width, smooth slide transitions & backdrop-blur edge */}
      {rightOpen && !isFocusMode && !isPreviewMode && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setRightOpen(false)} />
      )}
      <div
        className={`
          fixed md:relative top-0 right-0 h-full z-40 flex-shrink-0
          transition-all duration-300 ease-in-out transform shadow-2xl md:shadow-none kgv-adaptive-panel kgv-hardware-accelerated
          ${rightOpen && !isFocusMode && !isPreviewMode ? 'translate-x-0 opacity-100 w-[300px]' : 'translate-x-full opacity-0 w-0 pointer-events-none'}
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
          editor={editorInstance}
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
          onCustomThemeChange={handleCustomThemeChange}
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
          onExportTxt={handleExportTxt}
          onExportJson={handleExportJson}
          onImportFile={handleImportFile}
          onExportPdf={handleExportPdf}
          onPrint={handlePrint}
          onExportDocx={handleExportDocx}
          onExportHtml={handleExportHtml}
          onExportMd={handleExportMd}
          onExportJsonBackup={handleExportJsonBackupAll}
          folders={activeProject?.folders || []}
          docs={legacyDocsExport}
                                                  onClose={() => setRightOpen(false)}
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
            else if (role === 'mono') handleSelectMonoFont(fontName);
            else if (role === 'ui') handleSelectUiFont(fontName);
          }}
          bodyFont={docFont}
          headingFont={headingFont}
          uiFontRole={uiFont}
          monoFont={monoFont}
        />
      )}

      {networkToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md"
             style={{
               background: networkToast.type === 'offline' ? (theme.isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(254, 226, 226, 0.95)') : (theme.isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(220, 252, 231, 0.95)'),
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
                const text = (activePage?.content || '').replace(/<[^>]*>/g, '');
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
          className="absolute left-5 z-20 text-xs pointer-events-none" 
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
              backgroundColor: 'rgba(30, 41, 59, 0.92)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              fontFamily: uiFont,
            }}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-200 text-xs font-medium border border-slate-700/50 shrink-0">
              {isPreviewMode ? <Eye size={13} className="text-slate-300" /> : <Maximize2 size={13} className="text-slate-300" />}
              <span>{isFocusMode ? (t.focusMode || 'Tập trung') : (t.preview || 'Xem trước')}</span>
            </div>

            <div className="w-px h-3.5 bg-slate-700/60 shrink-0 mx-0.5" />

            <ZoomIn size={14} className="text-slate-400 shrink-0" />
            
            <button
              type="button"
              onClick={() => setZoomPercent(prev => Math.max(50, prev - 10))}
              className="w-6 h-6 flex items-center justify-center rounded-full text-slate-300 hover:bg-slate-700/70 hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
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
                className="w-8 text-center text-xs font-bold text-white bg-transparent outline-none cursor-text"
                title="Tỉ lệ phóng to/thu nhỏ (50% - 250%)"
              />
              <span className="text-xs font-semibold text-slate-300 -ml-0.5">%</span>
            </div>

            <button
              type="button"
              onClick={() => setZoomPercent(prev => Math.min(250, prev + 10))}
              className="w-6 h-6 flex items-center justify-center rounded-full text-slate-300 hover:bg-slate-700/70 hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
              title="Phóng to (+10%)"
              aria-label="Zoom In"
            >
              <Plus size={13} />
            </button>

            {zoomPercent !== 100 && (
              <button
                type="button"
                onClick={() => setZoomPercent(100)}
                className="ml-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer shrink-0"
                title="Đặt lại 100%"
              >
                100%
              </button>
            )}

            <div className="w-px h-3.5 bg-slate-700/60 shrink-0 mx-0.5" />

            <button
              type="button"
              onClick={handleExitFocusOrPreview}
              className="px-2.5 py-1 text-xs font-semibold rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
              title={isFocusMode ? (t.exitFocusMode || "Exit Focus Mode") : (t.exitPreviewMode || "Exit Preview")}
              aria-label="Exit Mode"
            >
              <X size={13} className="text-red-400" />
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
    </div>
  );
}
