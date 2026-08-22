import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { fetchGoogleFonts, GoogleFontItem, injectGoogleFont } from './googleFontsApi';
import type { ThemeColors } from './types';
import type { Theme } from './theme';
import { t, Lang } from './i18n';
import { CustomSelect } from './CustomSelect';

const FONT_CATEGORIES = [
  {
    category: 'SANS-SERIF',
    fonts: [
      'Inter', 'Roboto', 'Montserrat', 'Helvetica', 'Open Sans', 'Lato',
      'Abel', 'Acme', 'Alata', 'Alegreya Sans', 'Arimo', 'Assistant', 'Barlow',
      'Cabin', 'Catamaran', 'Chivo', 'Comfortaa', 'DM Sans', 'Dosis', 'Encode Sans',
      'Exo 2', 'Fira Sans', 'Fjalla One', 'Heebo', 'Hind', 'IBM Plex Sans',
      'Josefin Sans', 'Kanit', 'Karla', 'Libre Franklin', 'Manrope', 'Mukta',
      'Mulish', 'Noto Sans', 'Nunito', 'Nunito Sans', 'Oswald', 'Outfit',
      'Oxanium', 'Poppins', 'PT Sans', 'Questrial', 'Quicksand', 'Raleway',
      'Rubik', 'Source Sans 3', 'Titillium Web', 'Ubuntu', 'Varela Round',
      'Work Sans', 'Yantramanav', 'Zilla Slab'
    ]
  },
  {
    category: 'SERIF',
    fonts: [
      'Lora', 'EB Garamond', 'Playfair Display', 'Merriweather', 'Georgia',
      'Abril Fatface', 'Alegreya', 'Alice', 'Amiri', 'Arvo', 'Bitter',
      'Bodoni Moda', 'Cinzel', 'Cormorant', 'Cormorant Garamond', 'Crete Round',
      'Domine', 'Faustina', 'Fenix', 'Frank Ruhl Libre', 'Fraunces', 'GFS Didot',
      'Gelasio', 'Gentium Book Plus', 'Gilda Display', 'Gravitas One', 'Headland One',
      'Imbue', 'Josefin Slab', 'Judson', 'Kameron', 'Libre Baskerville', 'Lustria',
      'Martel', 'Neuton', 'Noticia Text', 'Noto Serif', 'Old Standard TT',
      'Podkova', 'Poly', 'PT Serif', 'Quattrocento', 'Roboto Slab', 'Rokkitt',
      'Rufina', 'Slabo 27px', 'Source Serif 4', 'Spectral', 'Tinos', 'Ultra', 'Unna'
    ]
  },
  {
    category: 'MONOSPACE',
    fonts: [
      'JetBrains Mono', 'Fira Code', 'Source Code Pro',
      'Anonymous Pro', 'Azeret Mono', 'B612 Mono', 'Courier Prime', 'DM Mono',
      'Fira Mono', 'Fragment Mono', 'IBM Plex Mono', 'Inconsolata', 'Jura',
      'Nanum Gothic Coding', 'Noto Sans Mono', 'Overpass Mono', 'PT Mono',
      'Roboto Mono', 'Share Tech Mono', 'Space Mono', 'Ubuntu Mono', 'Xanh Mono'
    ]
  }
];



function loadGoogleFont(name: string) {
  injectGoogleFont(name);
}

interface TiptapEditorType {
  chain: () => {
    focus: () => {
      setFontFamily: (family: string) => { run: () => void };
    };
  };
}

interface GoogleFontsPanelProps {
  onSelect?: (fontName: string) => void;
  c?: Theme | Record<string, unknown>;
  theme?: ThemeColors | Record<string, unknown>;
  uiFont?: string;
  lang?: Lang;
  t?: unknown;
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
  onClose?: () => void;
  onApplyToSelection?: (family: string) => void;
  onApplyToUi?: (family: string) => void;
  onApplyToDoc?: (family: string) => void;
  editor?: TiptapEditorType | null;
  onAssignRole?: (role: 'body' | 'heading' | 'ui', fontName: string) => void;
  bodyFont?: string;
  headingFont?: string;
  uiFontRole?: string;
}


function FontRow({
  name, isLoaded, isSelected, isFav, c, uiFont, preview, lang, handleApplyToSelection, handleLoad, toggleFav
}: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  name: string; isLoaded: boolean; isSelected: boolean; isFav: boolean; c: any; uiFont: string; preview: string; lang: Lang;
  handleApplyToSelection: (name: string, e?: React.MouseEvent) => void; handleLoad: (name: string) => void; toggleFav: (name: string, e: React.MouseEvent) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isLoaded) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        handleLoad(name);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isLoaded, name, handleLoad]);

  return (
    <div
      ref={ref}
      onClick={() => handleApplyToSelection(name)}
      style={{
        padding: '6px 8px',
        cursor: 'pointer',
        background: isSelected ? c.accentLight : 'transparent',
        borderRadius: 6,
        borderBottom: `1px solid ${c.borderFaint}`,
        transition: 'background 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        boxSizing: 'border-box',
      }}
      onMouseOver={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
      }}
      onMouseOut={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{
          fontFamily: isLoaded ? `'${name}', serif` : uiFont,
          fontSize: '0.88rem',
          color: isSelected ? c.accent : c.text,
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
        }}>
          {preview || name}
        </div>
        <div style={{
          fontFamily: uiFont, fontSize: '0.66rem',
          color: isSelected ? c.accentMid : c.textFaint,
          marginTop: 1,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span>{name}</span>
          {isSelected && <span style={{ fontSize: '0.6rem', background: c.accent, color: '#fff', padding: '0 4px', borderRadius: 3 }}>{t(lang, 'selectedFontBadge')}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3, flexShrink: 0, alignItems: 'center' }}>
        <button
          type="button"
          onClick={(e) => toggleFav(name, e)}
          title={isFav ? t(lang, 'removeFromFavorites') : t(lang, 'addToFavorites')}
          style={{
            padding: '3px 6px', borderRadius: 4,
            border: `1px solid ${isFav ? '#f59e0b' : c.border}`,
            background: isFav ? (c.isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7') : 'transparent',
            color: isFav ? '#f59e0b' : c.textFaint,
            fontSize: '0.75rem', cursor: 'pointer',
          }}
        >
          {isFav ? '★' : '☆'}
        </button>
        <button
          type="button"
          onClick={(e) => handleApplyToSelection(name, e)}
          title={t(lang, 'applyFontToSelection')}
          style={{
            padding: '3px 7px', borderRadius: 4,
            border: `1px solid ${isSelected ? c.accent : c.border}`,
            background: isSelected ? c.accent : 'transparent',
            color: isSelected ? (c.isDark ? c.bg : '#ffffff') : c.accent,
            fontFamily: uiFont,
            fontSize: '0.68rem', fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {t(lang, 'applyFont')}
        </button>
      </div>
    </div>
  );
}

export default function GoogleFontsPanel(props: GoogleFontsPanelProps & { hideRoles?: boolean }) {
  const {
    onSelect,
    uiFont = 'Inter',
    lang = 'vi',
    onClose,
    onApplyToSelection,
    onApplyToUi,
    onApplyToDoc,
    editor,
    onAssignRole,
    bodyFont = 'Merriweather',
    headingFont = 'Playfair Display',
    uiFontRole = 'Inter',
    hideRoles,
  } = props;

  const rawTheme = (props.c || props.theme) as Record<string, unknown> | undefined;
  const c = {
    bg: (rawTheme?.bg || '#ffffff') as string,
    text: (rawTheme?.text || '#111827') as string,
    accent: (rawTheme?.accent || '#2563eb') as string,
    accentLight: (rawTheme?.accentLight || rawTheme?.accentSoft || '#dbeafe') as string,
    accentMid: (rawTheme?.accentMid || rawTheme?.accent || '#60a5fa') as string,
    border: (rawTheme?.border || '#e5e7eb') as string,
    borderFaint: (rawTheme?.borderFaint || '#f3f4f6') as string,
    isDark: Boolean(rawTheme?.isDark ?? false),
    surface: (rawTheme?.surface || '#ffffff') as string,
    textMuted: (rawTheme?.textMuted || rawTheme?.muted || '#4b5563') as string,
    textFaint: (rawTheme?.textFaint || rawTheme?.faint || '#9ca3af') as string,
  };

  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState('The quick brown fox jumps over the lazy dog');
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'roles'>('catalog');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [apiFonts, setApiFonts] = useState<GoogleFontItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [apiError, setApiError] = useState('');
  const [localApiKey, setLocalApiKey] = useState(() => props.apiKey || localStorage.getItem('kgv-gfonts-api-key') || '');
  const [showApiKeySettings, setShowApiKeySettings] = useState(() => !props.apiKey && !localStorage.getItem('kgv-gfonts-api-key'));
  const [showKeyPassword, setShowKeyPassword] = useState(false);

  const activeKey = props.apiKey || localApiKey;

  useEffect(() => {
    if (activeKey) {
      setIsFetching(true);
      setApiError('');
      fetchGoogleFonts(activeKey).then(fonts => {
        if (fonts && fonts.length > 0) {
          setApiFonts(fonts);
        }
      }).catch(err => {
        setApiError(err.message || 'Không thể tải danh sách phông chữ Google Fonts.');
      }).finally(() => setIsFetching(false));
    }
  }, [activeKey]);

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('kgv-fav-fonts') || '[]'));
    } catch {
      return new Set();
    }
  });

  const toggleFav = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      localStorage.setItem('kgv-fav-fonts', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleLoad = (name: string) => {
    loadGoogleFont(name);
    setLoaded((prev) => new Set([...prev, name]));
  };

  const handleApplyToSelection = (name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleLoad(name);
    setSelected(name);
    if (editor && typeof editor.chain === 'function') {
      editor.chain().focus().setFontFamily(name).run();
    } else if (onApplyToSelection) {
      onApplyToSelection(name);
    } else {
      window.dispatchEvent(new CustomEvent('kgv-apply-font-selection', { detail: name }));
    }
    if (onSelect) onSelect(name);
  };

  const handleAssignRole = (role: 'body' | 'heading' | 'ui', name: string) => {
    handleLoad(name);
    if (onAssignRole) {
      onAssignRole(role, name);
    }
    document.documentElement.style.setProperty(`--kgv-${role}-font`, name);
    if (role === 'ui' && onApplyToUi) onApplyToUi(name);
    if (role === 'body' && onApplyToDoc) onApplyToDoc(name);
  };

  const handleSaveKey = () => {
    const trimmed = localApiKey.trim();
    if (trimmed) {
      localStorage.setItem('kgv-gfonts-api-key', trimmed);
      if (props.onSaveApiKey) {
        props.onSaveApiKey(trimmed);
      }
      setShowApiKeySettings(false);
      setIsFetching(true);
      setApiError('');
      fetchGoogleFonts(trimmed).then(fonts => {
        if (fonts && fonts.length > 0) setApiFonts(fonts);
      }).catch(err => {
        setApiError(err.message || 'Lỗi khi kích hoạt API Key');
      }).finally(() => setIsFetching(false));
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('kgv-gfonts-api-key');
    setLocalApiKey('');
    setApiFonts([]);
    setApiError('');
    if (props.onSaveApiKey) {
      props.onSaveApiKey('');
    }
    setShowApiKeySettings(true);
  };

  let displayCategories = FONT_CATEGORIES;
  if (apiFonts.length > 0) {
    const cats: Record<string, string[]> = {};
    apiFonts.forEach(f => {
      const cName = (f.category || 'other').toUpperCase();
      if (!cats[cName]) cats[cName] = [];
      cats[cName].push(f.family);
    });
    displayCategories = Object.keys(cats).map(k => ({ category: k, fonts: cats[k] }));
  }

  // Prepend favorites if any
  if (favorites.size > 0) {
    displayCategories = [
      { category: 'FAVORITES', fonts: Array.from(favorites) },
      ...displayCategories
    ];
  }

  // Filter categories by category filter and search
  const filteredCategories = displayCategories
    .filter(cat => selectedCategoryFilter === 'ALL' || cat.category === selectedCategoryFilter)
    .map(cat => ({
      category: cat.category,
      fonts: cat.fonts.filter(f => f.toLowerCase().includes(search.toLowerCase()))
    }))
    .filter(cat => cat.fonts.length > 0);

  const totalLoadedCount = apiFonts.length > 0 ? apiFonts.length : FONT_CATEGORIES.reduce((acc, c) => acc + c.fonts.length, 0);

  const panelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. Top Navigation Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 3, background: c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 8 }}>
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          style={{
            flex: 1, padding: '7px 8px', borderRadius: 6, border: 'none',
            background: activeTab === 'catalog' ? c.accent : 'transparent',
            color: activeTab === 'catalog' ? (c.isDark ? c.bg : '#ffffff') : c.textMuted,
            fontFamily: uiFont, fontSize: '0.78rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {t(lang, 'fontCatalog')}
        </button>
        {!hideRoles && (
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            style={{
              flex: 1, padding: '7px 8px', borderRadius: 6, border: 'none',
              background: activeTab === 'roles' ? c.accent : 'transparent',
              color: activeTab === 'roles' ? (c.isDark ? c.bg : '#ffffff') : c.textMuted,
              fontFamily: uiFont, fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t(lang, 'fontRolesAndVars')}
          </button>
        )}
      </div>

      {/* 2. API KEY MANAGEMENT CARD (Clean, responsive, full-width with easy-to-click buttons) */}
      <div
        style={{
          border: `1px solid ${activeKey ? (c.isDark ? 'rgba(37,99,235,0.3)' : '#bfdbfe') : c.border}`,
          background: activeKey ? (c.isDark ? 'rgba(37,99,235,0.08)' : '#eff6ff') : (c.isDark ? 'rgba(255,255,255,0.03)' : '#fafafa'),
          borderRadius: 8,
          padding: '10px 12px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <Key size={15} color={activeKey ? (c.isDark ? '#93c5fd' : '#2563eb') : c.textMuted} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Google Fonts API
              </div>
              <div style={{ fontSize: '0.68rem', color: activeKey ? (c.isDark ? '#93c5fd' : '#2563eb') : c.textMuted }}>
                {activeKey ? (isFetching ? t(lang, 'loadingLibrary') : t(lang, 'connectedFontsCount').replace('{count}', String(totalLoadedCount))) : t(lang, 'basicMode')}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowApiKeySettings(v => !v)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: `1px solid ${c.border}`,
              background: c.surface,
              color: c.textMuted,
              fontFamily: uiFont,
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {showApiKeySettings ? t(lang, 'closeConfig') : (activeKey ? t(lang, 'editKey') : t(lang, 'activateApi'))}
          </button>
        </div>

        {/* Expandable API Key Config Box */}
        {showApiKeySettings && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${c.borderFaint}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.72rem', color: c.textMuted, lineHeight: 1.4 }}>
              {t(lang, 'apiKeyHelp')}
            </div>

            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showKeyPassword ? 'text' : 'password'}
                placeholder={t(lang, 'apiKeyPlaceholder')}
                value={localApiKey}
                onChange={e => setLocalApiKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 10px',
                  borderRadius: 6,
                  border: `1px solid ${c.border}`,
                  background: c.surface,
                  color: c.text,
                  fontFamily: uiFont,
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowKeyPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: c.textFaint,
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={showKeyPassword ? 'Ẩn' : 'Hiện'}
              >
                {showKeyPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Action Buttons Row */}
            <div style={{ display: 'flex', gap: 6, width: '100%' }}>
              <button
                type="button"
                onClick={handleSaveKey}
                disabled={!localApiKey.trim() || isFetching}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: !localApiKey.trim() ? (c.isDark ? '#374151' : '#d1d5db') : c.accent,
                  color: !localApiKey.trim() ? (c.isDark ? '#9ca3af' : '#6b7280') : '#ffffff',
                  cursor: !localApiKey.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: uiFont,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 0.15s',
                }}
              >
                {isFetching ? t(lang, 'activating') : t(lang, 'saveAndActivate')}
              </button>

              {activeKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: `1px solid ${c.border}`,
                    background: c.surface,
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontFamily: uiFont,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                  title={t(lang, 'clearKey')}
                >
                  {t(lang, 'clearKey')}
                </button>
              )}
            </div>

            {apiError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#ef4444', background: c.isDark ? 'rgba(239,68,68,0.1)' : '#fee2e2', padding: '6px 8px', borderRadius: 4, lineHeight: 1.3 }}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                <span>{apiError}</span>
              </div>
            )}

            <div style={{ fontSize: '0.68rem', color: c.textFaint, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t(lang, 'freeFromGoogle')}</span>
              <a
                href="https://developers.google.com/fonts/docs/developer_api"
                target="_blank"
                rel="noreferrer"
                style={{ color: c.accent, textDecoration: 'underline' }}
              >
                {t(lang, 'getFreeKey')}
              </a>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'roles' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '2px 0' }}>
          <div style={{ fontSize: '0.75rem', color: c.textMuted, lineHeight: 1.4 }}>
            {t(lang, 'fontRolesDesc')}
          </div>

          {[
            { role: 'body' as const, label: t(lang, 'bodyFontRole'), current: bodyFont },
            { role: 'heading' as const, label: t(lang, 'headingFontRole'), current: headingFont },
            { role: 'ui' as const, label: t(lang, 'uiFontRole'), current: uiFontRole },
          ].map(({ role, label, current }) => (
            <div key={role} style={{ background: c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 10, borderRadius: 8, border: `1px solid ${c.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: '0.72rem', fontFamily: `'${current}', serif`, color: c.accent, fontWeight: 600 }}>{current}</span>
              </div>
              <CustomSelect
                value={current}
                onChange={(val) => handleAssignRole(role, val)}
                theme={c}
                groups={displayCategories.map(cat => ({
                  label: cat.category,
                  options: cat.fonts.map(fontName => ({ value: fontName, label: fontName, fontFamily: `'${fontName}', serif` }))
                }))}
                buttonStyle={{
                  width: '100%', padding: '6px 8px', borderRadius: 6,
                  border: `1px solid ${c.border}`, background: c.surface,
                  color: c.text, fontFamily: uiFont, fontSize: '0.8rem', cursor: 'pointer', outline: 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
                renderButtonContent={(opt) => (
                  <>
                    <span>{opt?.label || current}</span>
                    <svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' style={{ fill: c.textMuted }}>
                      <path d='M0 0l5 6 5-6z'/>
                    </svg>
                  </>
                )}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* 3. Search & Preview Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder={t(lang, 'searchFontsPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '7px 28px 7px 10px',
                  fontFamily: uiFont, fontSize: '0.78rem',
                  border: `1px solid ${c.border}`,
                  borderRadius: 6, background: c.surface,
                  color: c.text, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: c.textFaint, cursor: 'pointer', padding: 2
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder={t(lang, 'previewTextPlaceholder')}
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px',
                fontFamily: uiFont, fontSize: '0.74rem',
                border: `1px solid ${c.borderFaint}`,
                borderRadius: 6, background: 'transparent',
                color: c.textMuted, outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {/* Quick Category Chips */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
              {['ALL', 'SANS-SERIF', 'SERIF', 'MONOSPACE', ...(favorites.size > 0 ? ['FAVORITES'] : [])].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 12,
                    border: `1px solid ${selectedCategoryFilter === cat ? c.accent : c.borderFaint}`,
                    background: selectedCategoryFilter === cat ? c.accentLight : 'transparent',
                    color: selectedCategoryFilter === cat ? c.accent : c.textMuted,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {cat === 'FAVORITES' ? `★ ${t(lang, 'favorites')}` : cat}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Font List */}
          <div
            style={{
              maxHeight: 340,
              overflowY: 'auto',
              border: `1px solid ${c.borderFaint}`,
              borderRadius: 8,
              padding: 4,
              boxSizing: 'border-box',
            }}
          >
            {filteredCategories.map(cat => (
              <div key={cat.category} style={{ marginBottom: 10 }}>
                <div style={{
                  fontFamily: uiFont, fontSize: '0.68rem', fontWeight: 700,
                  color: c.accent, padding: '5px 8px', letterSpacing: '0.06em',
                  background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderRadius: 4, marginBottom: 4,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>[{cat.category === 'FAVORITES' ? t(lang, 'favorites').toUpperCase() : cat.category}]</span>
                  <span style={{ fontSize: '0.65rem', color: c.textFaint, fontWeight: 'normal' }}>{cat.fonts.length}</span>
                </div>

                {cat.fonts.map(name => (
                  <FontRow
                    key={name}
                    name={name}
                    isLoaded={loaded.has(name)}
                    isSelected={selected === name}
                    isFav={favorites.has(name)}
                    c={c}
                    uiFont={uiFont}
                    preview={preview}
                    lang={lang}
                    handleApplyToSelection={handleApplyToSelection}
                    handleLoad={handleLoad}
                    toggleFav={toggleFav}
                  />
                ))}
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div style={{ padding: '20px 10px', fontFamily: uiFont, fontSize: '0.78rem', color: c.textFaint, textAlign: 'center' }}>
                {t(lang, 'noMatchingFonts')} "{search}"
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-xl shadow-2xl p-5 flex flex-col max-h-[85vh] overflow-hidden"
          style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.text, fontFamily: uiFont }}
        >
          <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: `1px solid ${c.borderFaint}` }}>
            <h3 className="font-semibold text-sm uppercase tracking-wider">{t(lang, 'googleFontsEngine')}</h3>
            <button
              onClick={onClose}
              className="px-2 py-1 rounded-md text-sm hover:opacity-75 transition-opacity"
              style={{ color: c.textFaint, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {panelContent}
          </div>
        </div>
      </div>
    );
  }

  return panelContent;
}

