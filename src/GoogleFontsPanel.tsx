import React, { useState, useEffect, useRef } from 'react';
import { fetchGoogleFonts, GoogleFontItem } from './googleFontsApi';
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

const loadedFonts = new Set<string>();

function loadGoogleFont(name: string) {
  if (loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const fontSlug = name.toLowerCase().replace(/\s+/g, '-');
  const id = `gf-${fontSlug}`;
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    @font-face {
      font-family: '${name}';
      src: url('/fonts/${fontSlug}.woff2') format('woff2'),
           url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:ital,wght@0,400;0,700;1,400&display=swap');
      font-display: swap;
    }
  `;
  document.head.appendChild(style);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:ital,wght@0,400;0,700;1,400&display=swap`;
  document.head.appendChild(link);
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
  onAssignRole?: (role: 'body' | 'heading' | 'ui' | 'mono', fontName: string) => void;
  bodyFont?: string;
  headingFont?: string;
  uiFontRole?: string;
  monoFont?: string;
}


function FontItem({ name, isSelected, handleApplyToSelection, handleLoad, toggleFav, isFav, c, preview }: any) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        handleLoad(name);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [name]);

  return (
    <div
      ref={ref}
      onClick={() => handleApplyToSelection(name)}
      onMouseEnter={() => handleLoad(name)}
      style={{
        padding: '8px 10px',
        cursor: 'pointer',
        background: isSelected ? c.accentLight : 'transparent',
        borderRadius: 6,
        borderBottom: `1px solid ${c.borderFaint}`,
        transition: 'background 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onMouseOver={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
      }}
      onMouseOut={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: c.text }}>{name}</span>
          {isSelected && <span style={{ fontSize: '0.65rem', background: c.accent, color: '#fff', padding: '1px 4px', borderRadius: 4 }}>Applied</span>}
        </div>
        <div style={{
          fontFamily: isVisible ? `'${name}', sans-serif` : 'sans-serif',
          fontSize: '1.2rem',
          color: c.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {preview || name}
        </div>
      </div>
      <button
        onClick={(e) => toggleFav(name, e)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, color: isFav ? '#f59e0b' : c.textFaint,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
    </div>
  );
}

export default function GoogleFontsPanel(props: GoogleFontsPanelProps & { hideRoles?: boolean }) {
  const {
    onSelect,
    uiFont = 'Inter',
    lang = 'en',
    onClose,
    onApplyToSelection,
    onApplyToUi,
    onApplyToDoc,
    editor,
    onAssignRole,
    bodyFont = 'Merriweather',
    headingFont = 'Playfair Display',
    uiFontRole = 'Inter',
    monoFont = 'JetBrains Mono',
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
  const [apiFonts, setApiFonts] = useState<GoogleFontItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [apiError, setApiError] = useState('');
  const [localApiKey, setLocalApiKey] = useState('');
  
  useEffect(() => {
    if (props.apiKey) {
      setIsFetching(true);
      setApiError('');
      fetchGoogleFonts(props.apiKey).then(fonts => {
        if (fonts && fonts.length > 0) setApiFonts(fonts);
      }).catch(err => {
        setApiError(err.message || 'Failed to fetch fonts');
      }).finally(() => setIsFetching(false));
    }
  }, [props.apiKey]);
  
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem('kgv-fav-fonts') || '[]')));

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

  const handleAssignRole = (role: 'body' | 'heading' | 'ui' | 'mono', name: string) => {
    handleLoad(name);
    if (onAssignRole) {
      onAssignRole(role, name);
    }
    document.documentElement.style.setProperty(`--kgv-${role}-font`, name);
    if (role === 'ui' && onApplyToUi) onApplyToUi(name);
    if (role === 'body' && onApplyToDoc) onApplyToDoc(name);
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
  if (favorites.size > 0 && search === '') {
     displayCategories = [
       { category: 'FAVORITES', fonts: Array.from(favorites) },
       ...FONT_CATEGORIES
     ];
  }

  const filteredCategories = displayCategories.map(cat => ({
    category: cat.category,
    fonts: cat.fonts.filter(f => f.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.fonts.length > 0);

  const panelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: 3, background: c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 8 }}>
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          style={{
            flex: 1, padding: '6px 8px', borderRadius: 6, border: 'none',
            background: activeTab === 'catalog' ? c.accent : 'transparent',
            color: activeTab === 'catalog' ? (c.isDark ? c.bg : '#ffffff') : c.textMuted,
            fontFamily: uiFont, fontSize: '0.75rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {t(lang, 'fontCatalog')}
        </button>
        {!hideRoles && <button
          type="button"
          onClick={() => setActiveTab('roles')}
          style={{
            flex: 1, padding: '6px 8px', borderRadius: 6, border: 'none',
            background: activeTab === 'roles' ? c.accent : 'transparent',
            color: activeTab === 'roles' ? (c.isDark ? c.bg : '#ffffff') : c.textMuted,
            fontFamily: uiFont, fontSize: '0.75rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {t(lang, 'fontRolesAndVars')}
        </button>}
      </div>

      {activeTab === 'roles' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
          <div style={{ fontSize: '0.78rem', color: c.textMuted, marginBottom: 4 }}>
            {t(lang, 'fontRolesDesc')}
          </div>
          
          {[
            { role: 'body' as const, label: t(lang, 'bodyFontRole'), current: bodyFont },
            { role: 'heading' as const, label: t(lang, 'headingFontRole'), current: headingFont },
            { role: 'ui' as const, label: t(lang, 'uiFontRole'), current: uiFontRole },
            { role: 'mono' as const, label: t(lang, 'monoFontRole'), current: monoFont },
          ].map(({ role, label, current }) => (
            <div key={role} style={{ background: c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 10, borderRadius: 8, border: `1px solid ${c.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: '0.75rem', fontFamily: `'${current}', serif`, color: c.accent }}>{current}</span>
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
          {!props.apiKey && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="password"
                  placeholder="Enter Google Fonts API Key for full library..."
                  value={localApiKey}
                  onChange={e => setLocalApiKey(e.target.value)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 6,
                    border: `1px solid ${c.border}`, background: c.surface,
                    color: c.text, fontFamily: uiFont, fontSize: '0.85rem', outline: 'none'
                  }}
                />
                <button
                  onClick={() => {
                    if (localApiKey) {
                      localStorage.setItem('kgv-gfonts-api-key', localApiKey);
                      if (props.onSaveApiKey) {
                        props.onSaveApiKey(localApiKey);
                      } else {
                        window.location.reload();
                      }
                    }
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: 6, border: 'none',
                    background: c.accent, color: '#fff', cursor: 'pointer',
                    fontFamily: uiFont, fontSize: '0.85rem', fontWeight: 600
                  }}
                >
                  Apply
                </button>
              </div>
              <div style={{ fontSize: '0.7rem', color: c.textFaint }}>
                Without an API key, you only see ~60 default fonts.
              </div>
            </div>
          )}
          {isFetching && (
            <div style={{ fontSize: '0.75rem', color: c.accent, marginBottom: 8, textAlign: 'center' }}>
              Fetching full font library...
            </div>
          )}
          {apiError && (
            <div style={{ fontSize: '0.75rem', color: 'rgb(239, 68, 68)', marginBottom: 8, textAlign: 'center' }}>
              {apiError}
            </div>
          )}
          {!isFetching && !apiError && props.apiKey && apiFonts.length > 0 && (
            <div style={{ fontSize: '0.7rem', color: c.accent, marginBottom: 8, textAlign: 'center' }}>
              ✓ Connected ({apiFonts.length} fonts loaded)
            </div>
          )}
          <input
            type="text"
            placeholder={t(lang, 'searchFontsPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '6px 10px',
              fontFamily: uiFont, fontSize: '0.78rem',
              border: `1px solid ${c.border}`,
              borderRadius: 6, background: 'transparent',
              color: c.text, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="text"
            placeholder={t(lang, 'previewTextPlaceholder')}
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
            style={{
              width: '100%', padding: '5px 10px',
              fontFamily: uiFont, fontSize: '0.75rem',
              border: `1px solid ${c.borderFaint}`,
              borderRadius: 6, background: 'transparent',
              color: c.textMuted, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            maxHeight: 340, overflowY: 'auto',
            border: `1px solid ${c.borderFaint}`,
            borderRadius: 8, padding: 4,
          }}>
            {filteredCategories.map(cat => (
              <div key={cat.category} style={{ marginBottom: 12 }}>
                <div style={{
                  fontFamily: uiFont, fontSize: '0.68rem', fontWeight: 700,
                  color: c.accent, padding: '6px 8px', letterSpacing: '0.08em',
                  background: c.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderRadius: 4, marginBottom: 4
                }}>
                  [{cat.category}]
                </div>
                {cat.fonts.map(name => {
                  const isLoaded = loaded.has(name);
                  const isSelected = selected === name;
                  return (
                    <div
                      key={name}
                      onClick={() => handleApplyToSelection(name)}
                      onMouseEnter={() => handleLoad(name)}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        background: isSelected ? c.accentLight : 'transparent',
                        borderRadius: 6,
                        borderBottom: `1px solid ${c.borderFaint}`,
                        transition: 'background 0.1s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                      }}
                    >
                      <div style={{ flex: 1, overflow: 'hidden', paddingRight: 8 }}>
                        <div style={{
                          fontFamily: isLoaded ? `'${name}', serif` : uiFont,
                          fontSize: '0.9rem',
                          color: isSelected ? c.accent : c.text,
                          lineHeight: 1.4,
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}>
                          {preview || name}
                        </div>
                        <div style={{
                          fontFamily: uiFont, fontSize: '0.65rem',
                          color: isSelected ? c.accentMid : c.textFaint,
                          marginTop: 1,
                        }}>
                          {name}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => toggleFav(name, e)}
                          title={favorites.has(name) ? "Remove favorite" : "Add to favorites"}
                          style={{
                            padding: '3px 6px', borderRadius: 5,
                            border: `1px solid ${favorites.has(name) ? c.accent : c.border}`,
                            background: favorites.has(name) ? c.accentLight : 'transparent',
                            color: favorites.has(name) ? c.accent : c.textMuted,
                            fontSize: '0.75rem', cursor: 'pointer',
                          }}
                        >
                          {favorites.has(name) ? '★' : '☆'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleApplyToSelection(name, e)}
                          title="Apply font to selected text boundary"
                          style={{
                            padding: '3px 8px', borderRadius: 5,
                            border: `1px solid ${c.border}`,
                            background: 'transparent',
                            color: c.accent, fontFamily: uiFont,
                            fontSize: '0.68rem', fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = c.accent; e.currentTarget.style.color = c.isDark ? c.bg : '#ffffff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.accent; }}
                        >
                          ✦ {t(lang, 'selectFont')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <div style={{ padding: '16px 10px', fontFamily: uiFont, fontSize: '0.78rem', color: c.textFaint, textAlign: 'center' }}>
                No fonts found matching "{search}"
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
