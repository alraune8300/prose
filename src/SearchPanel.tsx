import React, { useState, useEffect } from 'react';
import { Search, RotateCw, X } from 'lucide-react';
import { Accordion } from './components/Accordion';
import { Lang, t } from './i18n';

interface SearchPanelProps {
 
 
  c: Record<string, string>;
  uiFont: string;
  lang: Lang;
}

export default function SearchPanel({ c, uiFont, lang, }: SearchPanelProps) {
  const [findText, setFindText] = useState('');
  const [activeSearchText, setActiveSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('kgv-search-query', { detail: { find: activeSearchText, matchCase, wholeWord, regex } }));
  }, [activeSearchText, matchCase, wholeWord, regex]);

  useEffect(() => {
    function handleCount(e: Event) {
      setResultsCount((e as CustomEvent).detail);
    }
    window.addEventListener('kgv-search-results-count', handleCount);
    return () => window.removeEventListener('kgv-search-results-count', handleCount);
  }, []);

  const SectionLabel = ({ label }: { label: string }) => (
    <div style={{
      fontFamily: uiFont, fontSize: '0.6rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.12em',
      color: c.textMuted, marginBottom: 8, marginTop: 4,
    }}>
      {label}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Search size={16} color={c.textMuted} />
          <span style={{ fontFamily: uiFont, fontSize: '0.9rem', color: c.text }}>{t(lang, 'find')}</span>
          <span style={{ fontFamily: uiFont, fontSize: '0.75rem', color: c.textMuted, marginLeft: 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px', textAlign: 'right' }}>
            {findText ? (resultsCount > 0 ? (resultsCount === 1 ? t(lang, 'resultCount').replace('{count}', '1') : t(lang, 'resultsCount').replace('{count}', String(resultsCount))) : t(lang, 'noResults')) : ''}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={findText}
            onChange={e => {
              setFindText(e.target.value);
              if (e.target.value === '') setActiveSearchText('');
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setActiveSearchText(findText);
              }
            }}
            style={{
              width: '100%',
              padding: '8px 64px 8px 12px',
              borderRadius: 8,
              border: `1px solid ${c.borderFaint}`,
              background: 'transparent',
              color: c.text,
              fontFamily: uiFont,
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 2 }}>
            {findText && (
              <>
                <button
                  onClick={() => {
                    if (activeSearchText !== findText) setActiveSearchText(findText);
                    setTimeout(() => window.dispatchEvent(new CustomEvent('kgv-search-nav', { detail: { direction: 'prev', find: findText, matchCase, wholeWord, regex } })), 10);
                  }}
                  style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', padding: 2, display: 'flex' }}
                  title={t(lang, 'previousMatch')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                </button>
                <button
                  onClick={() => {
                    if (activeSearchText !== findText) setActiveSearchText(findText);
                    setTimeout(() => window.dispatchEvent(new CustomEvent('kgv-search-nav', { detail: { direction: 'next', find: findText, matchCase, wholeWord, regex } })), 10);
                  }}
                  style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', padding: 2, display: 'flex' }}
                  title={t(lang, 'nextMatch')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
              </>
            )}
            {findText && (
              <button
                onClick={() => { setFindText(''); setActiveSearchText(''); }}
                style={{
                  background: 'none', border: 'none', color: c.textMuted,
                  cursor: 'pointer', padding: '4px 2px', display: 'flex', marginLeft: 2
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <RotateCw size={16} color={c.textMuted} />
          <span style={{ fontFamily: uiFont, fontSize: '0.9rem', color: c.text }}>{t(lang, 'replace')}</span>
        </div>
        <input
          type="text"
          value={replaceText}
          onChange={e => setReplaceText(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${c.borderFaint}`,
            background: 'transparent',
            color: c.text,
            fontFamily: uiFont,
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 4px' }}>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('kgv-search-replace', { detail: { find: findText, replace: replaceText, matchCase, wholeWord, regex, all: false } }));
          }}
          style={{
            flex: 1, padding: '8px 4px', borderRadius: 10,
            background: c.surface, border: `1px solid ${c.borderFaint}`,
            color: c.textMuted, fontFamily: uiFont, fontSize: '0.8rem',
            cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.25
          }}
        >
          {t(lang, 'replace')}
        </button>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('kgv-search-replace', { detail: { find: findText, replace: replaceText, matchCase, wholeWord, regex, all: true } }));
          }}
          style={{
            flex: 1, padding: '8px 4px', borderRadius: 10,
            background: c.surface, border: `1px solid ${c.borderFaint}`,
            color: c.textMuted, fontFamily: uiFont, fontSize: '0.8rem',
            cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.25
          }}
        >
          {t(lang, 'replaceAll')}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 4px', marginTop: 8 }}>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('kgv-search-replace', { detail: { find: findText, replace: '', matchCase, wholeWord, regex, all: false, isDelete: true } }));
          }}
          style={{
            flex: 1, padding: '8px 4px', borderRadius: 10,
            background: '#ef444420', border: `1px solid #ef444450`,
            color: '#ef4444', fontFamily: uiFont, fontSize: '0.8rem',
            cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.25
          }}
        >
          {t(lang, 'delete')}
        </button>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('kgv-search-replace', { detail: { find: findText, replace: '', matchCase, wholeWord, regex, all: true, isDelete: true } }));
          }}
          style={{
            flex: 1, padding: '8px 4px', borderRadius: 10,
            background: '#ef444420', border: `1px solid #ef444450`,
            color: '#ef4444', fontFamily: uiFont, fontSize: '0.8rem',
            cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.25
          }}
        >
          {t(lang, 'deleteAll')}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
<Accordion title={t(lang, 'searchOptions')} uiFont={uiFont} c={c} defaultOpen>
<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontFamily: uiFont, fontSize: '0.82rem', color: c.textMuted, flex: 1, paddingRight: 10, textAlign: 'left', lineHeight: 1.35 }}>{t(lang, 'matchCase')}</span>
            <div style={{
              width: 44, height: 24, borderRadius: 12, flexShrink: 0,
              background: matchCase ? c.accent : 'transparent',
              border: `1px solid ${matchCase ? c.accent : c.borderFaint}`,
              position: 'relative', transition: 'all 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: matchCase ? 22 : 2,
                width: 18, height: 18, borderRadius: '50%',
                background: matchCase ? '#fff' : c.textMuted,
                transition: 'all 0.2s',
              }} />
            </div>
            <input type="checkbox" checked={matchCase} onChange={e => setMatchCase(e.target.checked)} style={{ display: 'none' }} />
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontFamily: uiFont, fontSize: '0.82rem', color: c.textMuted, flex: 1, paddingRight: 10, textAlign: 'left', lineHeight: 1.35 }}>{t(lang, 'wholeWordsOnly')}</span>
            <div style={{
              width: 44, height: 24, borderRadius: 12, flexShrink: 0,
              background: wholeWord ? c.accent : 'transparent',
              border: `1px solid ${wholeWord ? c.accent : c.borderFaint}`,
              position: 'relative', transition: 'all 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: wholeWord ? 22 : 2,
                width: 18, height: 18, borderRadius: '50%',
                background: wholeWord ? '#fff' : c.textMuted,
                transition: 'all 0.2s',
              }} />
            </div>
            <input type="checkbox" checked={wholeWord} onChange={e => setWholeWord(e.target.checked)} style={{ display: 'none' }} />
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontFamily: uiFont, fontSize: '0.82rem', color: c.textMuted, flex: 1, paddingRight: 10, textAlign: 'left', lineHeight: 1.35 }}>{t(lang, 'useRegex')}</span>
            <div style={{
              width: 44, height: 24, borderRadius: 12, flexShrink: 0,
              background: regex ? c.accent : 'transparent',
              border: `1px solid ${regex ? c.accent : c.borderFaint}`,
              position: 'relative', transition: 'all 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: regex ? 22 : 2,
                width: 18, height: 18, borderRadius: '50%',
                background: regex ? '#fff' : c.textMuted,
                transition: 'all 0.2s',
              }} />
            </div>
            <input type="checkbox" checked={regex} onChange={e => setRegex(e.target.checked)} style={{ display: 'none' }} />
          </label>
        </div>
</Accordion>
</div>
    </div>
  );
}
