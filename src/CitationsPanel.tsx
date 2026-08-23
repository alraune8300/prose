import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Copy, Check, Download, Upload, Search, FileText, ExternalLink } from 'lucide-react';
import type { ThemeColors } from './types';
import { Lang, t } from './i18n';
import { CitationSource, CitationStyle, parseBibtex, exportToBibtex, formatBibliographyEntry } from './citationsEngine';
import { CustomSelect } from './CustomSelect';

interface CitationsPanelProps {
  theme: ThemeColors;
  uiFont: string;
  lang: Lang;
  sources: CitationSource[];
  onUpdateSources: (sources: CitationSource[]) => void;
  currentStyle: CitationStyle;
  onChangeStyle: (style: CitationStyle) => void;
  onInsertCitationMarker?: (citeKey: string) => void;
}

export default function CitationsPanel({
  theme,
  uiFont,
  lang,
  sources,
  onUpdateSources,
  currentStyle,
  onChangeStyle,
  onInsertCitationMarker,
}: CitationsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form state for manual add
  const [formAuthor, setFormAuthor] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formJournal, setFormJournal] = useState('');
  const [formDoi, setFormDoi] = useState('');
  const [bibtexInput, setBibtexInput] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'import'>('library');

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const authorLast = formAuthor.split(' ').slice(-1)[0] || 'author';
    const cleanKey = authorLast.toLowerCase().replace(/[^a-z]/g, '') + (formYear || '2026');

    const newSource: CitationSource = {
      id: 'cit_' + Math.random().toString(36).substring(2, 9),
      key: cleanKey,
      type: 'article',
      author: formAuthor || 'Unknown',
      title: formTitle,
      year: formYear || '2026',
      journal: formJournal,
      doi: formDoi,
    };

    onUpdateSources([...sources, newSource]);
    setFormAuthor('');
    setFormTitle('');
    setFormYear('');
    setFormJournal('');
    setFormDoi('');
    setShowAddModal(false);
  };

  const handleImportBibtexText = () => {
    if (!bibtexInput.trim()) return;
    const parsed = parseBibtex(bibtexInput);
    if (parsed.length > 0) {
      onUpdateSources([...sources, ...parsed]);
      setBibtexInput('');
      setShowAddModal(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseBibtex(content);
        if (parsed.length > 0) {
          onUpdateSources([...sources, ...parsed]);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExportBibtex = () => {
    const bib = exportToBibtex(sources);
    const blob = new Blob([bib], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'references.bib';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    onUpdateSources(sources.filter(s => s.id !== id));
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(`[@${key}]`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const filtered = sources.filter(s =>
    !searchQuery.trim() ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full select-none" style={{ fontFamily: uiFont }}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-2" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <BookOpen size={16} className="shrink-0" style={{ color: theme.accent }} />
          <span className="font-semibold text-sm truncate" style={{ color: theme.text }}>
            {t(lang, 'citationDesk') || 'Citation Desk'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0" style={{ backgroundColor: theme.accentLight, color: theme.accent }}>
            {sources.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            style={{ backgroundColor: theme.accent, color: '#ffffff' }}
            title={t(lang, 'addSource') || 'Add Source'}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">{t(lang, 'add') || 'Add'}</span>
          </button>
          <button
            onClick={handleExportBibtex}
            className="p-1.5 rounded-lg border transition-colors cursor-pointer"
            style={{ borderColor: theme.border, color: theme.textMuted }}
            title={t(lang, 'exportBibtex') || 'Export .bib'}
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Style Selector & Search */}
      <div className="p-3 border-b space-y-2.5" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: theme.textMuted }}>{t(lang, 'citationStyle') || 'Citation Style:'}</span>
          <CustomSelect
            value={currentStyle}
            onChange={(val) => onChangeStyle(val as CitationStyle)}
            theme={theme}
            options={[
              { value: 'apa', label: 'APA 7th Edition' },
              { value: 'mla', label: 'MLA 9th Edition' },
              { value: 'chicago', label: 'Chicago Manual' },
              { value: 'ieee', label: 'IEEE Standard' },
              { value: 'harvard', label: 'Harvard Reference' },
              { value: 'vancouver', label: 'Vancouver System' },
              { value: 'springer', label: 'Springer / Nature' },
              { value: 'acm', label: 'ACM Standard' }
            ]}
            buttonClassName="px-2.5 py-1 rounded-lg border text-xs font-medium outline-none cursor-pointer flex items-center justify-between gap-2 shadow-xs transition-all"
            buttonStyle={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, minWidth: '130px' }}
          />
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5" style={{ color: theme.textFaint }} />
          <input
            type="text"
            placeholder={t(lang, 'searchLibrary') || 'Search library...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none"
            style={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }}
          />
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2" style={{ color: theme.textFaint }}>
            <FileText size={32} className="mx-auto opacity-40" />
            <p className="text-xs font-medium">
              {searchQuery ? (t(lang, 'noSourcesFound') || 'No sources found') : (t(lang, 'emptyLibrary') || 'Empty library. Add a source or import BibTeX.')}
            </p>
          </div>
        ) : (
          filtered.map((s, index) => {
            const formattedRef = formatBibliographyEntry(s, currentStyle, index + 1);
            return (
              <div
                key={s.id}
                className="p-3 rounded-xl border transition-all hover:shadow-xs space-y-2 group"
                style={{ borderColor: theme.border, backgroundColor: theme.surface }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: theme.accentLight, color: theme.accent }}>
                        @{s.key}
                      </span>
                      <span className="text-[10px] opacity-70 uppercase font-mono" style={{ color: theme.textMuted }}>{s.type}</span>
                    </div>
                    <p className="text-xs font-semibold leading-snug" style={{ color: theme.text }}>
                      {s.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyKey(s.key)}
                      className="p-1 rounded-md border transition-colors cursor-pointer"
                      style={{ borderColor: theme.border, color: copiedKey === s.key ? '#10b981' : theme.textMuted }}
                      title={t(lang, 'copyCitationCode') || 'Copy citation code'}
                    >
                      {copiedKey === s.key ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                    {onInsertCitationMarker && (
                      <button
                        onClick={() => onInsertCitationMarker(s.key)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white transition-colors cursor-pointer"
                        style={{ backgroundColor: theme.accent }}
                        title={t(lang, 'insertIntoEditor') || 'Insert into editor'}
                      >
                        + Insert
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1 rounded-md border hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                      style={{ borderColor: theme.border, color: theme.textFaint }}
                      title={t(lang, 'delete') || 'Delete'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] leading-relaxed italic opacity-85" style={{ color: theme.textMuted }}>
                  {formattedRef}
                </div>

                {s.doi && (
                  <div className="flex items-center gap-1 text-[10px] font-mono pt-1 border-t" style={{ borderColor: theme.borderFaint, color: theme.accent }}>
                    <ExternalLink size={11} />
                    <a href={`https://doi.org/${s.doi}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                      DOI: {s.doi}
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Import Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <BookOpen size={18} style={{ color: theme.accent }} />
                <h3 className="font-semibold text-sm" style={{ color: theme.text }}>
                  {t(lang, 'addReferenceSource') || 'Add Reference Source'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs px-2 py-1 rounded-lg border cursor-pointer"
                style={{ borderColor: theme.border, color: theme.textMuted }}
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex rounded-lg p-1 border text-xs font-medium" style={{ borderColor: theme.border, backgroundColor: theme.background }}>
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'library' ? 'shadow-xs font-semibold' : ''}`}
                style={{ backgroundColor: activeTab === 'library' ? theme.surface : 'transparent', color: activeTab === 'library' ? theme.accent : theme.textMuted }}
              >
                {t(lang, 'manualEntry') || 'Manual Entry'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'import' ? 'shadow-xs font-semibold' : ''}`}
                style={{ backgroundColor: activeTab === 'import' ? theme.surface : 'transparent', color: activeTab === 'import' ? theme.accent : theme.textMuted }}
              >
                {t(lang, 'bibtexFile') || 'BibTeX / File'}
              </button>
            </div>

            {activeTab === 'library' ? (
              <form onSubmit={handleAddManual} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>
                    {t(lang, 'authorPrompt') || 'Author (e.g. John Doe)'}
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none"
                    style={{ borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: theme.text }}
                    placeholder="Smith, A. & Johnson, B."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>
                    {t(lang, 'titlePrompt') || 'Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none"
                    style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
                    placeholder="Advanced Research Methodologies..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>
                      {t(lang, 'yearPrompt') || 'Year'}
                    </label>
                    <input
                      type="text"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none"
                      style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
                      placeholder="2026"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>
                      {t(lang, 'journalPrompt') || 'Journal / Publisher'}
                    </label>
                    <input
                      type="text"
                      value={formJournal}
                      onChange={(e) => setFormJournal(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none"
                      style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
                      placeholder="Nature / ACM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>
                    {t(lang, 'doiOptional') || 'DOI (optional)'}
                  </label>
                  <input
                    type="text"
                    value={formDoi}
                    onChange={(e) => setFormDoi(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none font-mono"
                    style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
                    placeholder="10.1038/s41586-021-00000-x"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer"
                    style={{ borderColor: theme.border, color: theme.textMuted }}
                  >
                    {t(lang, 'cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-medium text-white shadow-xs cursor-pointer"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {t(lang, 'addToLibrary') || 'Add to Library'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>
                    {t(lang, 'uploadBibFile') || 'Upload .bib File'}
                  </label>
                  <label
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-blue-500"
                    style={{ borderColor: theme.border, backgroundColor: theme.background }}
                  >
                    <Upload size={20} style={{ color: theme.accent }} className="mb-1" />
                    <span className="text-xs font-medium" style={{ color: theme.text }}>
                      {t(lang, 'chooseBibFile') || 'Choose .bib file'}
                    </span>
                    <input type="file" accept=".bib" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t" style={{ borderColor: theme.border }}></div>
                  <span className="flex-shrink mx-4 text-[10px] uppercase font-mono" style={{ color: theme.textFaint }}>{t(lang, 'orPasteBibtex') || 'or paste bibtex'}</span>
                  <div className="flex-grow border-t" style={{ borderColor: theme.border }}></div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>
                    {t(lang, 'bibtexContent') || 'BibTeX Content'}
                  </label>
                  <textarea
                    rows={5}
                    value={bibtexInput}
                    onChange={(e) => setBibtexInput(e.target.value)}
                    placeholder={`@article{smith2026,\n  author = {Smith, J.},\n  title = {AI Research},\n  year = {2026}\n}`}
                    className="w-full p-2.5 rounded-lg border text-xs font-mono outline-none resize-none"
                    style={{ borderColor: theme.border, backgroundColor: theme.background, color: theme.text }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer"
                    style={{ borderColor: theme.border, color: theme.textMuted }}
                  >
                    {t(lang, 'cancel') || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleImportBibtexText}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium text-white shadow-xs cursor-pointer"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {t(lang, 'importBibtex') || 'Import BibTeX'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
