import React, { useState, useEffect } from 'react';
import { Lang, t } from './i18n';
import { Accordion } from './components/Accordion';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface SearchPanelProps {
  c: Record<string, string>;
  uiFont: string;
  lang: Lang;
}


function ToggleSwitch({ label, value, onChange, theme, uiFont }: { label: string, value: boolean, onChange: (v: boolean) => void, theme: Record<string, string>, uiFont?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontFamily: (uiFont || 'inherit'), fontSize: '0.65rem', letterSpacing: '0.05em', color: theme.text, textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => onChange(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: (uiFont || 'inherit'), fontSize: '0.6rem',
            color: value ? theme.text : theme.textMuted,
            fontWeight: value ? 600 : 400,
            textTransform: 'uppercase', padding: 0
          }}
        >
          ON
        </button>
        <button
          onClick={() => onChange(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: (uiFont || 'inherit'), fontSize: '0.6rem',
            color: !value ? theme.text : theme.textMuted,
            fontWeight: !value ? 600 : 400,
            textTransform: 'uppercase', padding: 0
          }}
        >
          OFF
        </button>
      </div>
    </div>
  );
}

export default function SearchPanel({ c, uiFont, lang }: SearchPanelProps) {
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

  const dispatchAction = (replaceWith: string, all: boolean, isDelete: boolean) => {
    window.dispatchEvent(new CustomEvent('kgv-search-replace', { detail: { find: findText, replace: replaceWith, matchCase, wholeWord, regex, all, isDelete } }));
  };

  const btnStyle = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: (uiFont || 'inherit'), fontSize: '0.65rem', color: c.text,
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    padding: '4px 0'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 8px 16px 8px' }}>
      <Accordion title={t(lang, 'searchAndReplace') || 'FIND & REPLACE'} uiFont={uiFont} c={c}>
        <div style={{ paddingTop: 8, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder={t(lang, 'find') || 'Find...'}
                value={findText}
                onChange={e => {
                  setFindText(e.target.value);
                  setActiveSearchText(e.target.value);
                }}
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${c.border}`,
                  borderRadius: 0,
                  padding: '4px 0', 
                  fontFamily: (uiFont || 'inherit'), 
                  fontSize: '0.9rem', 
                  color: c.text, 
                  outline: 'none',
                  width: '100%', 
                  boxSizing: 'border-box', 
                  paddingRight: findText ? '60px' : '24px'
                }} 
              />
              {!findText && <Search size={16} style={{ position: 'absolute', right: 0, color: c.text, pointerEvents: 'none' }} />}
              {findText && (
                <div style={{ position: 'absolute', right: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '0.7rem', color: c.textMuted, fontFamily: uiFont, marginRight: 2 }}>{resultsCount}</span>
                  <button
                    onClick={() => {
                      if (activeSearchText !== findText) setActiveSearchText(findText);
                      setTimeout(() => window.dispatchEvent(new CustomEvent('kgv-search-nav', { detail: { direction: 'prev', find: findText, matchCase, wholeWord, regex } })), 10);
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: c.textMuted, display: 'flex' }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (activeSearchText !== findText) setActiveSearchText(findText);
                      setTimeout(() => window.dispatchEvent(new CustomEvent('kgv-search-nav', { detail: { direction: 'next', find: findText, matchCase, wholeWord, regex } })), 10);
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: c.textMuted, display: 'flex' }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder={t(lang, 'replace') || 'Replace with...'}
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${c.border}`,
                  borderRadius: 0,
                  padding: '4px 0', 
                  fontFamily: (uiFont || 'inherit'), 
                  fontSize: '0.9rem', 
                  color: c.text, 
                  outline: 'none',
                  width: '100%', boxSizing: 'border-box'
                }} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginTop: 8, padding: '0 8px' }}>
            <button style={{...btnStyle, textAlign: 'center'}} onClick={() => dispatchAction(replaceText, false, false)}>
              {t(lang, 'replace') || 'REPLACE'}
            </button>
            <button style={{...btnStyle, textAlign: 'center'}} onClick={() => dispatchAction(replaceText, true, false)}>
              {t(lang, 'replaceAll') || 'REPLACE ALL'}
            </button>
            <button style={{...btnStyle, textAlign: 'center'}} onClick={() => dispatchAction('', false, true)}>
              {t(lang, 'delete') || 'DELETE'}
            </button>
            <button style={{...btnStyle, textAlign: 'center'}} onClick={() => dispatchAction('', true, true)}>
              {t(lang, 'deleteAll') || 'DELETE ALL'}
            </button>
          </div>

        </div>
      </Accordion>

      <Accordion title={t(lang, 'searchOptions') || 'OPTIONS'} uiFont={uiFont} c={c}>
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
          <ToggleSwitch uiFont={uiFont} label={t(lang, 'matchCase') || 'MATCHCASE'} value={matchCase} onChange={setMatchCase} theme={c} />
          <ToggleSwitch uiFont={uiFont} label={t(lang, 'wholeWordsOnly') || 'WHOLE WORDS ONLY'} value={wholeWord} onChange={setWholeWord} theme={c} />
          <ToggleSwitch uiFont={uiFont} label={t(lang, 'useRegex') || 'USE REGULAR EXPRESSIONS'} value={regex} onChange={setRegex} theme={c} />
        </div>
      </Accordion>
    </div>
  );
}
