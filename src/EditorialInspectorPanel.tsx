import React, { useState, useEffect } from 'react';
import { t } from './i18n';
import type { Lang } from './i18n';
import type { ThemeColors } from './types';
import { Activity, Type, Filter, Zap } from 'lucide-react';
import { computeProximityMatrix } from './nlp';

export function EditorialInspectorPanel({
  theme,
  editor,
  lang,
  onHighlightWord
}: {
  theme: ThemeColors,
  editor: any,
  lang: string,
  onHighlightWord: (words: {word: string, severity: 'low'|'high'}[] | null) => void
}) {
  const [data, setData] = useState<{frequencies: Map<string, number>, distances: any[]}|null>(null);
  const [activeWord, setActiveWord] = useState<string | null>(null);

  const analyze = () => {
    if (!editor) return;
    const text = editor.getText();
    const result = computeProximityMatrix(text, lang);
    setData(result);
  };

  useEffect(() => {
    analyze();
  }, [editor?.getText(), lang]);

  const handleWordClick = (word: string) => {
    if (activeWord === word) {
      setActiveWord(null);
      onHighlightWord(null);
    } else {
      setActiveWord(word);
      const severityMap = new Map();
      data?.distances.filter(d => d.word === word).forEach(d => severityMap.set(d.word, d.severity));
      // Fallback severity to 'low' if no proximity issue but clicked
      onHighlightWord([{ word, severity: severityMap.get(word) || 'low' }]);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-sm tracking-widest uppercase opacity-70">{t(lang as Lang, 'editorialInspector')}</div>
        <button onClick={analyze} className="opacity-50 hover:opacity-100"><Zap size={14} /></button>
      </div>

      <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-2 mb-4 text-xs opacity-70">
        {t(lang as Lang, 'language')}: <span className="font-bold ml-1 uppercase">{lang}</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {!data ? (
           <div className="text-sm opacity-50 text-center mt-4">{t(lang as Lang, 'loading')}</div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">{t(lang as Lang, 'repetitionHotspots')}</div>
            
            {Array.from(data.frequencies.entries())
              .sort((a, b) => b[1] - a[1])
              .filter(a => a[1] > 1)
              .map(([word, freq]) => {
                 const hasHighSeverity = data.distances.some(d => d.word === word && d.severity === 'high');
                 return (
                   <button 
                     key={word}
                     onClick={() => handleWordClick(word)}
                     className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${activeWord === word ? 'bg-amber-500/10 border-amber-500/50' : 'border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10'}`}
                   >
                      <div className="flex items-center gap-2">
                         <span className={`font-semibold ${hasHighSeverity ? 'text-rose-500' : ''}`}>{word}</span>
                         {hasHighSeverity && <Activity size={12} className="text-rose-500" />}
                      </div>
                      <span className="text-xs font-mono opacity-60 bg-black/5 dark:bg-white/5 px-1.5 rounded">{freq}</span>
                   </button>
                 );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
