
import React, { useState, useEffect } from 'react';
import { PanelRightClose, Info } from 'lucide-react';
import { Lang, LANG_LABELS, LANG_FLAGS } from './i18n';
import nspell from 'nspell';

interface SpellcheckPanelProps {
  c: Record<string, string>;
  uiFont: string;
  headingFont: string;
  lang: Lang;
  onClose: () => void;
}

const loadedCheckers: Record<string, any> = {};

export default function SpellcheckPanel({ c, uiFont, headingFont, lang, onClose }: SpellcheckPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [spellLang, setSpellLang] = useState<Lang>(lang);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeError, setActiveError] = useState<{word: string, from: number, to: number, suggestions: string[]} | null>(null);

  useEffect(() => {
    function handleErrorEvent(e: Event) {
      setActiveError((e as CustomEvent).detail);
    }
    window.addEventListener('kgv-spellcheck-error', handleErrorEvent);
    return () => window.removeEventListener('kgv-spellcheck-error', handleErrorEvent);
  }, []);

  useEffect(() => {
    if (!enabled) {
      window.dispatchEvent(new CustomEvent('kgv-spellcheck', { detail: { enabled: false } }));
      return;
    }

    if (spellLang === 'ja' || spellLang === 'zh') {
      setError(true);
      return;
    }

    if (loadedCheckers[spellLang]) {
      window.dispatchEvent(new CustomEvent('kgv-spellcheck', { detail: { enabled: true, checker: loadedCheckers[spellLang] } }));
      return;
    }

    const fetchDict = async () => {
      setLoading(true);
      setError(false);
      try {
        let pkgName = `dictionary-${spellLang}`;
        if (spellLang === 'en') pkgName = 'dictionary-en'; // ensures compatibility
        const affRes = await fetch(`https://cdn.jsdelivr.net/npm/${pkgName}/index.aff`);
        const dicRes = await fetch(`https://cdn.jsdelivr.net/npm/${pkgName}/index.dic`);
        
        if (!affRes.ok || !dicRes.ok) {
           throw new Error('Dictionary not found');
        }

        const aff = await affRes.text();
        const dic = await dicRes.text();
        const checker = nspell(aff, dic);
        loadedCheckers[spellLang] = checker;
        
        window.dispatchEvent(new CustomEvent('kgv-spellcheck', { detail: { enabled: true, checker } }));
      } catch (err) {
        console.error(err);
        setError(true);
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDict();
  }, [enabled, spellLang]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.accent, cursor: 'pointer', padding: 0 }}>
          <PanelRightClose size={20} />
        </button>
      </div>
      <h2 style={{ fontFamily: `'${headingFont}', serif`, fontSize: '2rem', fontWeight: 500, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>
        Spell check
      </h2>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: uiFont, fontSize: '1rem', color: c.text }}>Check spelling</span>
          <Info size={14} color={c.textMuted} />
        </div>
        <div style={{
          width: 44, height: 24, borderRadius: 12,
          background: enabled ? c.accent : 'transparent',
          border: `1px solid ${enabled ? c.accent : c.borderFaint}`,
          position: 'relative', transition: 'all 0.2s', cursor: 'pointer'
        }} onClick={() => setEnabled(!enabled)}>
          <div style={{
            position: 'absolute', top: 2, left: enabled ? 22 : 2,
            width: 18, height: 18, borderRadius: '50%',
            background: enabled ? '#fff' : c.textFaint,
            transition: 'all 0.2s',
          }} />
        </div>
      </div>
      
      {enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontFamily: uiFont, fontSize: '0.85rem', color: c.textMuted }}>Language</label>
          <div style={{ position: 'relative' }}>
            <select 
              value={spellLang} 
              onChange={(e) => setSpellLang(e.target.value as Lang)}
              style={{ 
                width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.borderFaint}`,
                background: 'transparent', color: c.text, fontFamily: uiFont, fontSize: '0.9rem',
                outline: 'none', cursor: 'pointer', appearance: 'none'
              }}
            >
              {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
                <option key={l} value={l} style={{ color: '#000' }}>{LANG_FLAGS[l]} {LANG_LABELS[l]}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: c.textMuted }}>
              ▼
            </div>
          </div>
        </div>
      )}
      
      {loading && (
        <span style={{ fontFamily: uiFont, fontSize: '0.85rem', color: c.textMuted }}>
          Loading dictionary...
        </span>
      )}
      
      {error && (
        <span style={{ fontFamily: uiFont, fontSize: '0.85rem', color: '#ef4444' }}>
          {(spellLang === 'ja' || spellLang === 'zh') 
            ? 'Spellcheck is not supported for this language.' 
            : 'Dictionary not available.'}
        </span>
      )}


      {enabled && activeError && (
        <div style={{ marginTop: 16, background: c.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 16, borderRadius: 12, border: `1px solid ${c.borderFaint}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span style={{ fontFamily: uiFont, fontSize: '0.8rem', color: c.textMuted }}>Misspelled word:</span>
              <div style={{ fontFamily: `'${headingFont}', serif`, fontSize: '1.2rem', color: '#ef4444', textDecoration: 'underline wavy red', textUnderlineOffset: 3, marginTop: 4 }}>
                {activeError.word}
              </div>
            </div>
            <button
              onClick={() => setActiveError(null)}
              style={{ background: 'transparent', border: `1px solid ${c.borderFaint}`, borderRadius: 6, padding: '4px 10px', color: c.text, fontFamily: uiFont, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Ignore
            </button>
          </div>
          <span style={{ fontFamily: uiFont, fontSize: '0.8rem', color: c.textMuted, display: 'block', marginBottom: 8 }}>Suggestions:</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeError.suggestions.length > 0 ? activeError.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('kgv-spellcheck-replace', { detail: { from: activeError.from, to: activeError.to, word: s } }));
                  setActiveError(null);
                }}
                style={{
                  padding: '8px 12px', textAlign: 'left', background: 'transparent',
                  border: `1px solid ${c.borderFaint}`, color: c.text, fontSize: '0.9rem', cursor: 'pointer', borderRadius: 6, fontFamily: uiFont,
                  transition: 'background 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {s}
              </button>
            )) : (
              <div style={{ padding: '8px 12px', fontSize: '0.85rem', color: c.textFaint, fontStyle: 'italic', fontFamily: uiFont }}>
                No suggestions found in dictionary
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
