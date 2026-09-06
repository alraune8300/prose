import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Accordion } from './components/Accordion';
import type { ThemeColors, CustomFont } from './types';
import { t } from './i18n';
import { Search } from 'lucide-react';
import { fetchGoogleFonts, injectGoogleFont, GoogleFontItem } from './googleFontsApi';

const DEFAULT_SERIF = ['Lora', 'Playfair Display', 'Merriweather', 'EB Garamond', 'Libre Baskerville', 'Crimson Pro', 'Fraunces', 'DM Serif Display', 'Georgia', 'Times New Roman'];
const DEFAULT_SANS = ['Source Sans 3', 'Libre Franklin', 'DM Sans', 'Work Sans', 'Outfit', 'Helvetica', 'Verdana', 'Bebas Neue', 'Lexend', 'Inter'];
const DEFAULT_MONO = ['JetBrains Mono', 'Space Mono', 'Courier Prime', 'Courier New'];

function MinimalFontSelect({ label, value, options, onChange, theme, uiFont }: { label: string, value: string, options: string[], onChange: (v: string) => void, theme: ThemeColors, uiFont: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setOpen(!open); setSearch(''); }}>
        <span style={{ fontFamily: uiFont, fontSize: '0.65rem', letterSpacing: '0.05em', color: theme.text, textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: `'${value}', serif`, fontSize: '0.75rem', color: theme.text, textTransform: 'uppercase' }}>
            {value}
          </span>
          <span style={{ fontSize: '0.6rem', color: theme.text, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ▲
          </span>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <input
              autoFocus
              type="text"
              placeholder="Search fonts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '4px 0',
                borderRadius: 0, border: 'none', borderBottom: `1px solid ${theme.border}`,
                background: 'transparent', color: theme.text,
                fontFamily: (uiFont || 'inherit'), fontSize: '0.9rem', outline: 'none',
                paddingRight: '24px'
              }}
              onClick={e => e.stopPropagation()}
            />
            <Search size={18} style={{ position: 'absolute', right: 0, color: theme.text, pointerEvents: 'none' }} />
          </div>
          <div className="kgv-scroll" style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', 
            maxHeight: 160, overflowY: 'auto',
            paddingRight: 4
          }}>
            {filtered.length > 0 ? filtered.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.text,
                  fontFamily: `'${opt}', serif`,
                  fontSize: '0.85rem',
                  padding: '4px 0',
                  cursor: 'pointer',
                  textAlign: 'right',
                  opacity: value === opt ? 1 : 0.7,
                  width: '100%',
                }}
              >
                {opt}
              </button>
            )) : (
              <div style={{ fontSize: '0.7rem', color: theme.textMuted, width: '100%', textAlign: 'right', padding: '4px 0' }}>No fonts found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SubAccordion({ title, children, theme, uiFont, defaultOpen = false }: { title: string, children: React.ReactNode, theme: ThemeColors, uiFont: string, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', background: 'transparent', border: 'none', color: theme.text,
        fontFamily: uiFont, fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
        padding: '6px 0'
      }}>
        <span>{title}</span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: '0.6rem' }}>▲</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 8, paddingBottom: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface FontsPanelProps {
  c: ThemeColors;
  uiFont: string;
  lang: string;
  bodyFont: string;
  headingFont: string;
  uiFont2: string;
  onFontAssign: (role: 'body' | 'heading' | 'ui' | 'mono', fontName: string) => void;
  availableFontNames: string[];
  customFonts: CustomFont[];
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onFontUpload: (file: File) => void;
  onFontDelete: (id: string) => void;
}

export function FontsPanel({ c, uiFont, lang, bodyFont, headingFont, uiFont2, onFontAssign, availableFontNames, customFonts, apiKey, onSaveApiKey, onFontUpload, onFontDelete }: FontsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gFonts, setGFonts] = useState<GoogleFontItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (apiKey) {
      fetchGoogleFonts(apiKey).then(fonts => {
        setGFonts(fonts);
      }).catch(err => {
        console.error('Error fetching Google Fonts', err);
      });
    }
  }, [apiKey]);

  const allAvailable = useMemo(() => {
    const defaultAvailable = availableFontNames.concat(customFonts.map(f => f.name || f.family));
    if (gFonts.length > 0) {
      return [...new Set([...defaultAvailable, ...gFonts.map(f => f.family)])].sort();
    }
    return [...new Set([...defaultAvailable, ...DEFAULT_SERIF, ...DEFAULT_SANS, ...DEFAULT_MONO])].sort();
  }, [availableFontNames, customFonts, gFonts]);

  const { allFonts, serifFonts, sansFonts, monoFonts } = useMemo(() => {
    let all: string[] = [];
    let serif: string[] = [];
    let sans: string[] = [];
    let mono: string[] = [];

    if (gFonts.length > 0) {
      all = gFonts.map(f => f.family);
      serif = gFonts.filter(f => f.category === 'serif' || f.category === 'display').map(f => f.family);
      sans = gFonts.filter(f => f.category === 'sans-serif').map(f => f.family);
      mono = gFonts.filter(f => f.category === 'monospace').map(f => f.family);
    } else {
      all = [...new Set([...DEFAULT_SERIF, ...DEFAULT_SANS, ...DEFAULT_MONO])].sort();
      serif = DEFAULT_SERIF;
      sans = DEFAULT_SANS;
      mono = DEFAULT_MONO;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter(f => f.toLowerCase().includes(q));
      serif = serif.filter(f => f.toLowerCase().includes(q));
      sans = sans.filter(f => f.toLowerCase().includes(q));
      mono = mono.filter(f => f.toLowerCase().includes(q));
    }

    // Return ALL fonts for the virtual list, limit removed entirely
    return {
      allFonts: all,
      serifFonts: serif,
      sansFonts: sans,
      monoFonts: mono
    };
  }, [gFonts, search]);

  const handleFontClick = (fontName: string) => {
    injectGoogleFont(fontName);
    window.dispatchEvent(new CustomEvent('kgv-apply-font-selection', { detail: fontName }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 8px 16px 8px' }}>
      
      <Accordion title={t(lang, 'fontRoles') || 'Font Roles'} uiFont={uiFont} c={c}>
        <div style={{ paddingTop: 8 }}>
          <MinimalFontSelect label={t(lang, 'bodyFont') || 'BODY'} value={bodyFont} options={allAvailable} onChange={v => { injectGoogleFont(v); onFontAssign('body', v); }} theme={c} uiFont={uiFont} />
          <MinimalFontSelect label={t(lang, 'headingFont') || 'HEADING'} value={headingFont} options={allAvailable} onChange={v => { injectGoogleFont(v); onFontAssign('heading', v); }} theme={c} uiFont={uiFont} />
          <MinimalFontSelect label={t(lang, 'uiFontRole') || 'UI'} value={uiFont2} options={allAvailable} onChange={v => { injectGoogleFont(v); onFontAssign('ui', v); }} theme={c} uiFont={uiFont} />
        </div>
      </Accordion>

      <Accordion title={t(lang, 'googleFonts') || 'Google Fonts'} uiFont={uiFont} c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: uiFont, fontSize: '0.65rem', letterSpacing: '0.05em', color: c.text, textTransform: 'uppercase' }}>
              GOOGLE FONT API
            </span>
            <input 
              type="text" 
              value={apiKey} 
              onChange={e => onSaveApiKey(e.target.value)} 
              style={{ 
                background: c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                border: 'none', borderRadius: 4, padding: '8px 10px', 
                fontFamily: uiFont, fontSize: '0.75rem', color: c.text, outline: 'none' 
              }} 
            />
          </div>

          <div style={{ paddingTop: 8 }}>
            <SubAccordion title={t(lang, 'fontCatalog') || 'Font Catalog'} theme={c} uiFont={uiFont}>
              <div style={{ width: '100%', paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder={t(lang, 'search') || 'Search fonts...'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', borderBottom: `1px solid ${c.border}`, borderRadius: 0, padding: '4px 0', 
                      fontFamily: (uiFont || 'inherit'), fontSize: '0.9rem', color: c.text, outline: 'none',
                      width: '100%', boxSizing: 'border-box', paddingRight: '24px'
                    }} 
                  />
                  <Search size={18} style={{ position: 'absolute', right: 0, color: c.text, pointerEvents: 'none' }} />
                </div>

                <SubAccordion title={t(lang, 'all') || 'All'} theme={c} uiFont={uiFont}>
                  <div className="kgv-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxHeight: 180, overflowY: 'auto' }}>
                    {allFonts.map(f => (
                      <button key={f} onClick={() => handleFontClick(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: `'${f}', serif`, fontSize: '0.85rem', color: c.text, padding: '4px 0' }}>{f}</button>
                    ))}
                    {allFonts.length === 0 && <span style={{ color: c.textMuted, fontSize: '0.7rem', fontFamily: uiFont }}>{t(lang, 'noFontsFound') || 'No fonts found'}</span>}
                  </div>
                </SubAccordion>
                
                <SubAccordion title={t(lang, 'sansSerif') || 'SANS - SERIF'} theme={c} uiFont={uiFont}>
                  <div className="kgv-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxHeight: 180, overflowY: 'auto' }}>
                    {sansFonts.map(f => (
                      <button key={f} onClick={() => handleFontClick(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: `'${f}', sans-serif`, fontSize: '0.85rem', color: c.text, padding: '4px 0' }}>{f}</button>
                    ))}
                  </div>
                </SubAccordion>
                
                <SubAccordion title={t(lang, 'serif') || 'SERIF'} theme={c} uiFont={uiFont}>
                  <div className="kgv-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxHeight: 180, overflowY: 'auto' }}>
                    {serifFonts.map(f => (
                      <button key={f} onClick={() => handleFontClick(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: `'${f}', serif`, fontSize: '0.85rem', color: c.text, padding: '4px 0' }}>{f}</button>
                    ))}
                  </div>
                </SubAccordion>
                
                <SubAccordion title={t(lang, 'monospace') || 'MONOSPACE'} theme={c} uiFont={uiFont}>
                  <div className="kgv-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxHeight: 180, overflowY: 'auto' }}>
                    {monoFonts.map(f => (
                      <button key={f} onClick={() => handleFontClick(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: `'${f}', monospace`, fontSize: '0.85rem', color: c.text, padding: '4px 0' }}>{f}</button>
                    ))}
                  </div>
                </SubAccordion>

              </div>
            </SubAccordion>
          </div>
        </div>
      </Accordion>

      <Accordion title={t(lang, 'customFonts') || 'Custom Fonts'} uiFont={uiFont} c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
          <button onClick={() => fileInputRef.current?.click()} style={{
            width: '100%', padding: '10px 0', border: 'none', borderRadius: 4,
            background: c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            color: c.text, fontFamily: uiFont, fontSize: '0.75rem', letterSpacing: '0.05em', cursor: 'pointer',
            textAlign: 'center'
          }}>
            {t(lang, 'uploadBtn') || t(lang, 'upload') || 'UPLOAD'}
          </button>
          <input
            ref={fileInputRef} type="file" accept=".ttf,.otf,.woff,.woff2"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) onFontUpload(f);
              if (e.target) e.target.value = '';
            }}
          />
          {customFonts.map(font => {
            const fontName = font.name || font.family || 'CustomFont';
            const fontId = font.id || font.family || font.name || fontName;
            return (
              <div key={fontId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: `'${fontName}', sans-serif`, fontSize: '0.85rem', color: c.text }}>{fontName}</span>
                <button onClick={() => onFontDelete(fontId)} style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer' }}>✕</button>
              </div>
            );
          })}
        </div>
      </Accordion>

    </div>
  );
}
