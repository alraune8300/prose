import React, { useState, useEffect } from 'react';
import { Search, RotateCw, X } from 'lucide-react';
import { Lang, t } from './i18n';

interface SearchPanelProps {
  headingFont: string;
  onClose: () => void;
  c: Record<string, string>;
  uiFont: string;
  lang: Lang;
}

import { ArrowLeft, PanelRightClose } from 'lucide-react';

export default function SearchPanel({ c, uiFont, lang, headingFont, onClose }: SearchPanelProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);


  useEffect(() => {
    window.dispatchEvent(new CustomEvent('kgv-search-query', { detail: { find: findText, matchCase, wholeWord, regex } }));
  }, [findText, matchCase, wholeWord, regex]);

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
      color: c.textFaint, marginBottom: 8, marginTop: 4,
    }}>
      {label}
    </div>
  );

  return (
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.accent, cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={20} />
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.accent, cursor: 'pointer', padding: 0 }}>
          <PanelRightClose size={20} />
        </button>
      </div>
      <h2 style={{ fontFamily: uiFont, fontSize: '1.5rem', fontWeight: 600, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>
        Find and replace
      </h2>

      <div style={{ padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Search size={16} color={c.textFaint} />
          <span style={{ fontFamily: uiFont, fontSize: '0.9rem', color: c.text }}>Find</span>
          <span style={{ fontFamily: uiFont, fontSize: '0.75rem', color: c.textFaint, marginLeft: 'auto' }}>{findText ? (resultsCount > 0 ? `${resultsCount} result${resultsCount > 1 ? 's' : ''}` : 'No results') : ''}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={findText}
            onChange={e => setFindText(e.target.value)}
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
                  onClick={() => window.dispatchEvent(new CustomEvent('kgv-search-nav', { detail: { direction: 'prev', find: findText, matchCase, wholeWord, regex } }))}
                  style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', padding: 2, display: 'flex' }}
                  title="Previous match"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('kgv-search-nav', { detail: { direction: 'next', find: findText, matchCase, wholeWord, regex } }))}
                  style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', padding: 2, display: 'flex' }}
                  title="Next match"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
              </>
            )}
            {findText && (
              <button
                onClick={() => setFindText('')}
                style={{
                  background: 'none', border: 'none', color: c.textFaint,
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
          <RotateCw size={16} color={c.textFaint} />
          <span style={{ fontFamily: uiFont, fontSize: '0.9rem', color: c.text }}>Replace</span>
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
            flex: 1, padding: '10px 0', borderRadius: 12,
            background: c.surface, border: `1px solid ${c.borderFaint}`,
            color: c.textMuted, fontFamily: uiFont, fontSize: '0.9rem',
            cursor: 'pointer', fontWeight: 500,
          }}
        >
          Replace
        </button>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('kgv-search-replace', { detail: { find: findText, replace: replaceText, matchCase, wholeWord, regex, all: true } }));
          }}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 12,
            background: c.surface, border: `1px solid ${c.borderFaint}`,
            color: c.textMuted, fontFamily: uiFont, fontSize: '0.9rem',
            cursor: 'pointer', fontWeight: 500,
          }}
        >
          Replace all
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <SectionLabel label="Options" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontFamily: uiFont, fontSize: '0.9rem', color: c.textMuted }}>Match case</span>
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: matchCase ? c.accent : 'transparent',
              border: `1px solid ${matchCase ? c.accent : c.borderFaint}`,
              position: 'relative', transition: 'all 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: matchCase ? 22 : 2,
                width: 18, height: 18, borderRadius: '50%',
                background: matchCase ? '#fff' : c.textFaint,
                transition: 'all 0.2s',
              }} />
            </div>
            <input type="checkbox" checked={matchCase} onChange={e => setMatchCase(e.target.checked)} style={{ display: 'none' }} />
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontFamily: uiFont, fontSize: '0.9rem', color: c.textMuted }}>Whole words only</span>
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: wholeWord ? c.accent : 'transparent',
              border: `1px solid ${wholeWord ? c.accent : c.borderFaint}`,
              position: 'relative', transition: 'all 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: wholeWord ? 22 : 2,
                width: 18, height: 18, borderRadius: '50%',
                background: wholeWord ? '#fff' : c.textFaint,
                transition: 'all 0.2s',
              }} />
            </div>
            <input type="checkbox" checked={wholeWord} onChange={e => setWholeWord(e.target.checked)} style={{ display: 'none' }} />
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontFamily: uiFont, fontSize: '0.9rem', color: c.textMuted }}>Use regular expressions</span>
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: regex ? c.accent : 'transparent',
              border: `1px solid ${regex ? c.accent : c.borderFaint}`,
              position: 'relative', transition: 'all 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: regex ? 22 : 2,
                width: 18, height: 18, borderRadius: '50%',
                background: regex ? '#fff' : c.textFaint,
                transition: 'all 0.2s',
              }} />
            </div>
            <input type="checkbox" checked={regex} onChange={e => setRegex(e.target.checked)} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
    </div>
  );
}
