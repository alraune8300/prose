import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Brain, Trash2, Edit3, RotateCcw, Download, Upload, Settings, 
  Play, Check, X, Sparkles, FileText
} from 'lucide-react';
import type { Page, ThemeColors } from './types';
import type { Lang } from './i18n';
import { t } from './i18n';
import type { Flashcard, FlashcardSettings } from './flashcardTypes';
import { DEFAULT_FLASHCARD_SETTINGS } from './flashcardTypes';
import { CustomSelect } from './CustomSelect';

interface FlashcardStudioProps {
  theme: ThemeColors;
  uiFont: string;
  lang: Lang;
  activePage: Page | null;
  onClose?: () => void;
}

export default function FlashcardStudio({
  theme,
  uiFont,
  lang,
  activePage,
  onClose,
}: FlashcardStudioProps) {
  const [activeTab, setActiveTab] = useState<'desk' | 'decks' | 'study'>('desk');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [settings, setSettings] = useState<FlashcardSettings>(DEFAULT_FLASHCARD_SETTINGS);
  
  // Editor State
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [isFlipped3D, setIsFlipped3D] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  
  // Study Overlay State
  const [isStudying, setIsStudying] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentStudyIndex, setCurrentStudyIndex] = useState(0);
  const [isStudyCardFlipped, setIsStudyCardFlipped] = useState(false);
  
  // Settings Drawer
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load cards from localStorage
  const storageKey = `kgv_flashcards_${activePage?.id || 'global'}`;
  const settingsKey = `kgv_flashcard_settings`;

  useEffect(() => {
    try {
      const savedCards = localStorage.getItem(storageKey);
      if (savedCards) {
        setCards(JSON.parse(savedCards));
      } else {
        // Sample starter card if empty
        const starter: Flashcard = {
          id: 'starter-1',
          pageId: activePage?.id,
          front: 'What is Spaced Repetition?',
          back: 'An evidence-based learning technique that incorporates increasing intervals of time between subsequent review of previously learned material.',
          tags: ['Core', 'Study'],
          box: 0,
          dueDate: Date.now(),
          reviewsCount: 0,
          createdAt: Date.now(),
        };
        setCards([starter]);
      }

      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (e) {
      console.error('Failed to load flashcards', e);
    }
  }, [storageKey, activePage?.id]);

  const saveCardsToStorage = (newCards: Flashcard[]) => {
    setCards(newCards);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newCards));
    } catch (e) {
      console.error('Failed to save flashcards', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Parse HTML content into blocks for the Left Column
  const blocks = useMemo(() => {
    if (!activePage?.content) return [];
    const div = document.createElement('div');
    div.innerHTML = activePage.content;
    const blockElements = div.querySelectorAll('p, h1, h2, h3, h4, li, blockquote');
    const list: { id: string; type: string; text: string }[] = [];
    blockElements.forEach((el, idx) => {
      const text = el.textContent?.trim() || '';
      if (text.length > 0) {
        list.push({
          id: `block-${idx}`,
          type: el.tagName.toLowerCase(),
          text,
        });
      }
    });
    if (list.length === 0 && activePage.content.trim()) {
      list.push({ id: 'block-0', type: 'p', text: activePage.content.replace(/<[^>]*>/g, '').trim() });
    }
    return list;
  }, [activePage?.content]);

  // Quick Convert block -> front & back
  const handleQuickConvert = (blockText: string, type: string) => {
    if (type.startsWith('h')) {
      setFrontText(blockText);
      setBackText('');
    } else {
      // Split sentence or set as back if front exists
      if (!frontText) {
        const parts = blockText.split('.');
        if (parts.length > 1) {
          setFrontText(parts[0] + '.');
          setBackText(parts.slice(1).join('.').trim());
        } else {
          setFrontText(blockText);
        }
      } else {
        setBackText(blockText);
      }
    }
    showToast('Block loaded into Card Editor!');
  };

  // Cloze deletion shortcut Ctrl+Shift+C
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const selectedStr = selection.toString();
        const clozeSyntax = `{{c1::${selectedStr}}}`;
        // Insert into active input or state
        if (document.activeElement?.id === 'card-front-input') {
          setFrontText(prev => prev + clozeSyntax);
        } else {
          setBackText(prev => prev + clozeSyntax);
        }
        showToast('Created Cloze Deletion: ' + clozeSyntax);
      }
    }
    // Ctrl + Enter to save card
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveCard();
    }
  }, [frontText, backText, editingCardId]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSaveCard = () => {
    if (!frontText.trim() || !backText.trim()) {
      showToast('Please fill in both Front and Back of the card.');
      return;
    }

    if (editingCardId) {
      const updated = cards.map(c => c.id === editingCardId ? {
        ...c,
        front: frontText,
        back: backText,
      } : c);
      saveCardsToStorage(updated);
      showToast('Card updated successfully!');
      setEditingCardId(null);
    } else {
      const newCard: Flashcard = {
        id: `card-${Date.now()}`,
        pageId: activePage?.id,
        front: frontText,
        back: backText,
        tags: [activePage?.title || 'General'],
        box: 0,
        dueDate: Date.now(),
        reviewsCount: 0,
        createdAt: Date.now(),
      };
      saveCardsToStorage([newCard, ...cards]);
      showToast('New flashcard created & saved!');
    }
    setFrontText('');
    setBackText('');
    setIsFlipped3D(false);
  };

  const handleEditCard = (card: Flashcard) => {
    setEditingCardId(card.id);
    setFrontText(card.front);
    setBackText(card.back);
    setActiveTab('desk');
  };

  const handleDeleteCard = (id: string) => {
    saveCardsToStorage(cards.filter(c => c.id !== id));
    showToast('Card deleted.');
  };

  // Start Review Session
  const startReviewSession = () => {
    const dueCards = cards.filter(c => c.dueDate <= Date.now() || c.box === 0);
    const queue = dueCards.length > 0 ? dueCards : [...cards];
    if (queue.length === 0) {
      showToast('No flashcards available to review!');
      return;
    }
    if (settings.order === 'shuffle') {
      queue.sort(() => Math.random() - 0.5);
    }
    setStudyQueue(queue);
    setCurrentStudyIndex(0);
    setIsStudyCardFlipped(false);
    setIsStudying(true);
    setStudyTimer(0);
  };

  // SRS Rating handler
  const handleRateCard = (rating: 1 | 2 | 3) => {
    const currentCard = studyQueue[currentStudyIndex];
    if (!currentCard) return;

    let nextBox = currentCard.box;
    let intervalDays = 1;
    if (rating === 1) { // Again (Forgot)
      nextBox = 0;
      intervalDays = 0.01; // 10 mins
    } else if (rating === 2) { // Good (Remembered)
      nextBox = Math.min(5, currentCard.box + 1);
      intervalDays = 3;
    } else if (rating === 3) { // Easy
      nextBox = Math.min(5, currentCard.box + 2);
      intervalDays = 7;
    }

    const nextDueDate = Date.now() + intervalDays * 24 * 60 * 60 * 1000;
    const updatedCards = cards.map(c => c.id === currentCard.id ? {
      ...c,
      box: nextBox,
      dueDate: nextDueDate,
      reviewsCount: c.reviewsCount + 1,
      lastReviewed: Date.now(),
    } : c);

    saveCardsToStorage(updatedCards);

    if (currentStudyIndex + 1 < studyQueue.length) {
      setCurrentStudyIndex(prev => prev + 1);
      setIsStudyCardFlipped(false);
    } else {
      setIsStudying(false);
      showToast('Review session completed! Great job 🎉');
    }
  };

  // Export & Import
  const exportToCSV = () => {
    const header = 'Front,Back,Tags,Box,DueDate\n';
    const rows = cards.map(c => `"${c.front.replace(/"/g, '""')}",""${c.back.replace(/"/g, '""')}","${(c.tags || []).join(';')}",${c.box},${c.dueDate}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards_${activePage?.title || 'deck'}_${Date.now()}.csv`;
    a.click();
    showToast('Exported flashcards to Anki CSV format.');
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ cards, settings }, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `flashcards_backup_${Date.now()}.json`;
    a.click();
    showToast('Exported backup JSON.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (parsed.cards) {
            saveCardsToStorage(parsed.cards);
            showToast(`Imported ${parsed.cards.length} cards successfully!`);
          }
        } else {
          // Basic CSV parser
          const lines = content.split('\n');
          const imported: Flashcard[] = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(',');
            if (parts.length >= 2) {
              imported.push({
                id: `imported-${Date.now()}-${i}`,
                front: parts[0].replace(/^"|"$/g, ''),
                back: parts[1].replace(/^"|"$/g, ''),
                tags: ['Imported'],
                box: 0,
                dueDate: Date.now(),
                reviewsCount: 0,
                createdAt: Date.now(),
              });
            }
          }
          if (imported.length > 0) {
            saveCardsToStorage([...imported, ...cards]);
            showToast(`Imported ${imported.length} cards from CSV!`);
          }
        }
      } catch {
        showToast('Failed to parse imported file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="absolute inset-0 z-50 flex flex-col backdrop-blur-xl animate-in fade-in duration-200 overflow-hidden"
      style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: `'${uiFont}', sans-serif` }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium text-white flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150" style={{ backgroundColor: theme.accent }}>
          <Sparkles size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl shadow-xs" style={{ backgroundColor: theme.accentLight, color: theme.accent }}>
            <Brain size={22} />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">{t(lang, 'flashcardStudioAndSRS') || 'Flashcard Studio & Spaced Repetition'}</h1>
            <p className="text-xs opacity-70">{t(lang, 'flashcardStudioDesc') || 'Transform document blocks into smart 3D SRS flashcards'}</p>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl border shadow-xs" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <button
            onClick={() => setActiveTab('desk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'desk' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'}`}
            style={{ backgroundColor: activeTab === 'desk' ? theme.accent : 'transparent', color: activeTab === 'desk' ? '#fff' : theme.text }}
            title={t(lang, 'studyMode')}
          >
            <FileText size={15} />
            <span className="hidden sm:inline">{t(lang, 'studyMode')}</span>
          </button>
          <button
            onClick={() => setActiveTab('decks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'decks' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'}`}
            style={{ backgroundColor: activeTab === 'decks' ? theme.accent : 'transparent', color: activeTab === 'decks' ? '#fff' : theme.text }}
            title={t(lang, 'deckManager')}
          >
            <Brain size={15} />
            <span className="hidden sm:inline">{t(lang, 'deckManager')} ({cards.length})</span>
          </button>
          <button
            onClick={startReviewSession}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: theme.accentLight, color: theme.accent }}
            title={t(lang, 'flashcardMode')}
          >
            <Play size={13} className="fill-current" />
            <span className="hidden sm:inline">{t(lang, 'flashcardMode')} ({cards.filter(c => c.dueDate <= Date.now() || c.box === 0).length})</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettingsDrawer(true)}
            className="p-2 rounded-xl border transition-all hover:opacity-80 active:scale-95"
            style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            title="SRS Settings"
          >
            <Settings size={18} style={{ color: theme.text }} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl border transition-all hover:opacity-80 active:scale-95"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
              title="Close Studio"
            >
              <X size={18} style={{ color: theme.text }} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'desk' && (
          <div className="flex-1 flex flex-col md:flex-row h-full">
            {/* Left Column: Block Content List */}
            <div className="w-full md:w-5/12 lg:w-4/12 h-full flex flex-col border-r p-5 overflow-y-auto" style={{ borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(25, 25, 32, 0.5)' : 'rgba(255, 255, 255, 0.5)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                  <FileText size={14} />
                  <span>{t(lang, 'documentBlocks')} ({blocks.length})</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full border" style={{ borderColor: theme.border }}>
                  {activePage?.title || t(lang, 'newDocTitle')}
                </span>
              </div>

              <div className="space-y-3">
                {blocks.length === 0 ? (
                  <div className="text-center py-12 opacity-60 text-xs">
                    {t(lang, 'noBlocksFoundFlashcard')}
                  </div>
                ) : (
                  blocks.map((b) => (
                    <div 
                      key={b.id}
                      className="p-3.5 rounded-xl border transition-all hover:shadow-md group relative flex flex-col gap-2"
                      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.accentLight, color: theme.accent }}>
                          {b.type}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleQuickConvert(b.text, b.type)}
                            className="px-2 py-1 rounded text-[11px] font-medium transition-colors text-white"
                            style={{ backgroundColor: theme.accent }}
                            title="Quick Convert to Card Front/Back"
                          >
                            {t(lang, 'quickConvertBtn')}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: theme.text }}>
                        {b.text}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t" style={{ borderColor: theme.borderFaint }}>
                        <button
                          onClick={() => { setFrontText(b.text); showToast('Set as Front!'); }}
                          className="text-[10px] font-medium px-2 py-1 rounded border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ borderColor: theme.border }}
                        >
                          [{t(lang, 'setAsFront')}]
                        </button>
                        <button
                          onClick={() => { setBackText(b.text); showToast('Set as Back!'); }}
                          className="text-[10px] font-medium px-2 py-1 rounded border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ borderColor: theme.border }}
                        >
                          [{t(lang, 'setAsBack')}]
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Live 3D Card Editor */}
            <div className="flex-1 h-full flex flex-col p-6 overflow-y-auto items-center justify-center">
              <div className="w-full max-w-xl flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">
                      {editingCardId ? t(lang, 'editFlashcard') : t(lang, 'create3DFlashcard')}
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border" style={{ borderColor: theme.border, color: theme.accent }}>
                      {t(lang, 'clozeHint')}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsFlipped3D(!isFlipped3D)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:opacity-80 active:scale-95 shadow-xs"
                    style={{ borderColor: theme.border, backgroundColor: theme.surface }}
                  >
                    <RotateCcw size={13} />
                    <span>{t(lang, 'flip3DView')} ({isFlipped3D ? t(lang, 'backFace') : t(lang, 'frontFace')})</span>
                  </button>
                </div>

                {/* 3D Flippable Card Container */}
                <div className="w-full h-72 perspective-1000 relative">
                  <div 
                    className={`w-full h-full relative transition-transform duration-500 transform-style-3d shadow-xl rounded-2xl border ${isFlipped3D ? 'rotate-y-180' : ''}`}
                    style={{ borderColor: theme.border, backgroundColor: theme.surface }}
                  >
                    {/* Front Face */}
                    <div className="absolute inset-0 p-6 backface-hidden flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.borderFaint }}>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: theme.accent }}>{t(lang, 'frontFace')}</span>
                        <span className="text-[11px] opacity-50">{t(lang, 'tabToFlip')}</span>
                      </div>
                      <textarea
                        id="card-front-input"
                        value={frontText}
                        onChange={(e) => setFrontText(e.target.value)}
                        placeholder={t(lang, 'questionPlaceholder')}
                        className="flex-1 w-full bg-transparent resize-none outline-none text-sm pt-3 leading-relaxed"
                        style={{ color: theme.text }}
                      />
                      <div className="text-[10px] opacity-40 text-right">{t(lang, 'pressTabToFlip')}</div>
                    </div>

                    {/* Back Face */}
                    <div className="absolute inset-0 p-6 backface-hidden rotate-y-180 flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.borderFaint }}>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: theme.accent }}>{t(lang, 'backFace')}</span>
                        <span className="text-[11px] opacity-50">{t(lang, 'tabToFlip')}</span>
                      </div>
                      <textarea
                        value={backText}
                        onChange={(e) => setBackText(e.target.value)}
                        placeholder={t(lang, 'answerPlaceholder')}
                        className="flex-1 w-full bg-transparent resize-none outline-none text-sm pt-3 leading-relaxed"
                        style={{ color: theme.text }}
                      />
                      <div className="text-[10px] opacity-40 text-right">{t(lang, 'supportsCloze')}</div>
                    </div>
                  </div>
                </div>

                {/* Save & Actions */}
                <div className="flex items-center justify-between gap-3">
                  {editingCardId && (
                    <button
                      onClick={() => { setEditingCardId(null); setFrontText(''); setBackText(''); }}
                      className="px-4 py-2 rounded-xl border text-xs font-medium transition-all hover:opacity-80"
                      style={{ borderColor: theme.border }}
                    >
                      {t(lang, 'cancelEdit')}
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={handleSaveCard}
                      className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
                      style={{ backgroundColor: theme.accent }}
                    >
                      <Check size={14} />
                      <span>{editingCardId ? t(lang, 'updateCard') : t(lang, 'saveCard')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deck Manager View */}
        {activeTab === 'decks' && (
          <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{t(lang, 'deckManager')}</h2>
                <p className="text-xs opacity-70">{t(lang, 'deckManager')} ({cards.length} {t(lang, 'totalCards')})</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all hover:opacity-80 shadow-xs" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                  <Upload size={14} />
                  <span>{t(lang, 'importCsvJson')}</span>
                  <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all hover:opacity-80 shadow-xs"
                  style={{ borderColor: theme.border, backgroundColor: theme.surface }}
                >
                  <Download size={14} />
                  <span>{t(lang, 'exportAnkiCsv')}</span>
                </button>
                <button
                  onClick={exportToJson}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-all hover:opacity-90"
                  style={{ backgroundColor: theme.accent }}
                >
                  <Download size={14} />
                  <span>{t(lang, 'backupJson')}</span>
                </button>
              </div>
            </div>

            {/* Cards Grid / Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((c) => (
                <div 
                  key={c.id}
                  className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between gap-4 relative group"
                  style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ borderColor: theme.border, color: theme.accent }}>
                      Box {c.box} • Reviews: {c.reviewsCount}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditCard(c)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10" title="Edit Card">
                        <Edit3 size={14} style={{ color: theme.text }} />
                      </button>
                      <button onClick={() => handleDeleteCard(c.id)} className="p-1 rounded hover:bg-red-500/10 text-red-500" title="Delete Card">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold line-clamp-2" style={{ color: theme.text }}>
                      Q: {c.front}
                    </div>
                    <div className="text-xs opacity-70 line-clamp-2 border-t pt-2" style={{ borderColor: theme.borderFaint }}>
                      A: {c.back}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] opacity-60 pt-2 border-t" style={{ borderColor: theme.borderFaint }}>
                    <span>{t(lang, 'due')}: {new Date(c.dueDate).toLocaleDateString()}</span>
                    <span>{c.tags?.[0] || 'General'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Study & Review Fullscreen Overlay */}
      {isStudying && studyQueue.length > 0 && (
        <div className="absolute inset-0 z-[200] backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-200" style={{ backgroundColor: theme.isDark ? 'rgba(12, 12, 16, 0.95)' : 'rgba(240, 243, 246, 0.95)' }}>
          {/* Top Progress & Close */}
          <div className="absolute top-6 left-8 right-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                {t(lang, 'cardProgress')} {currentStudyIndex + 1} {t(lang, 'ofTotal')} {studyQueue.length}
              </span>
              <div className="w-48 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div 
                  className="h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStudyIndex + 1) / studyQueue.length) * 100}%`, backgroundColor: theme.accent }}
                />
              </div>
            </div>
            <button
              onClick={() => setIsStudying(false)}
              className="p-2 rounded-xl border transition-all hover:opacity-80"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Central 3D Review Card */}
          <div className="w-full max-w-xl h-96 perspective-1000 my-auto cursor-pointer" onClick={() => setIsStudyCardFlipped(!isStudyCardFlipped)}>
            <div 
              className={`w-full h-full relative transition-transform duration-500 transform-style-3d shadow-2xl rounded-3xl border ${isStudyCardFlipped ? 'rotate-y-180' : ''}`}
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              {/* Front */}
              <div className="absolute inset-0 p-8 backface-hidden flex flex-col justify-between items-center text-center">
                <span className="text-xs font-bold uppercase tracking-widest opacity-50" style={{ color: theme.accent }}>{t(lang, 'frontFace')}</span>
                <div className="text-xl font-medium leading-relaxed my-auto" style={{ color: theme.text }}>
                  {studyQueue[currentStudyIndex]?.front}
                </div>
                <span className="text-xs opacity-40">{t(lang, 'revealAnswer')}</span>
              </div>

              {/* Back */}
              <div className="absolute inset-0 p-8 backface-hidden rotate-y-180 flex flex-col justify-between items-center text-center">
                <span className="text-xs font-bold uppercase tracking-widest opacity-50" style={{ color: theme.accent }}>{t(lang, 'backFace')}</span>
                <div className="text-lg font-normal leading-relaxed my-auto" style={{ color: theme.text }}>
                  {studyQueue[currentStudyIndex]?.back}
                </div>
                <span className="text-xs opacity-40">{t(lang, 'rateRecall')}</span>
              </div>
            </div>
          </div>

          {/* SRS Rating Action Buttons */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => handleRateCard(1)}
              className="px-6 py-3 rounded-2xl border text-xs font-semibold shadow-md transition-all hover:bg-red-500/10 hover:border-red-500 text-red-500 active:scale-95 flex flex-col items-center gap-1"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <span className="text-sm font-bold">[1] {t(lang, 'forgotRecall')}</span>
              <span className="text-[10px] opacity-70">10 mins</span>
            </button>
            <button
              onClick={() => handleRateCard(2)}
              className="px-6 py-3 rounded-2xl border text-xs font-semibold shadow-md transition-all hover:bg-blue-500/10 hover:border-blue-500 text-blue-500 active:scale-95 flex flex-col items-center gap-1"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <span className="text-sm font-bold">[2] {t(lang, 'rememberRecall')}</span>
              <span className="text-[10px] opacity-70">3 days</span>
            </button>
            <button
              onClick={() => handleRateCard(3)}
              className="px-6 py-3 rounded-2xl border text-xs font-semibold shadow-md transition-all hover:bg-emerald-500/10 hover:border-emerald-500 text-emerald-500 active:scale-95 flex flex-col items-center gap-1"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <span className="text-sm font-bold">[3] {t(lang, 'easyRecall')}</span>
              <span className="text-[10px] opacity-70">7 days</span>
            </button>
          </div>
        </div>
      )}

      {/* Settings Drawer Modal */}
      {showSettingsDrawer && (
        <div className="absolute inset-0 z-[250] bg-black/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-sm h-full flex flex-col p-5 shadow-2xl border-l animate-in slide-in-from-right duration-200" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.borderFaint }}>
              <div className="flex items-center gap-2">
                <Settings size={15} style={{ color: theme.accent }} />
                <h3 className="text-xs font-semibold uppercase tracking-wider opacity-80">{t(lang, 'srsSettings')}</h3>
              </div>
              <button 
                onClick={() => setShowSettingsDrawer(false)} 
                className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: theme.textMuted }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-5">
              {/* New Cards / Day */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium opacity-70">{t(lang, 'newCardsPerDay')}</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.newCardsPerDay} 
                    onChange={(e) => setSettings({ ...settings, newCardsPerDay: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 rounded-lg border text-xs bg-transparent outline-none transition-colors focus:ring-1"
                    style={{ borderColor: theme.border, color: theme.text }}
                  />
                </div>
              </div>

              {/* Pacing Mode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium opacity-70">{t(lang, 'pacingMode')}</label>
                <CustomSelect
                  value={settings.pacing}
                  onChange={(val) => setSettings({ ...settings, pacing: val as 'relaxed' | 'standard' | 'intensive' })}
                  options={[
                    { value: 'relaxed', label: t(lang, 'relaxedCards') },
                    { value: 'standard', label: t(lang, 'standardCards') },
                    { value: 'intensive', label: t(lang, 'intensiveCards') },
                  ]}
                  theme={theme}
                  buttonClassName="w-full px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors"
                  buttonStyle={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
                />
              </div>

              {/* Card Order */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium opacity-70">{t(lang, 'cardOrder')}</label>
                <CustomSelect
                  value={settings.order}
                  onChange={(val) => setSettings({ ...settings, order: val as 'sequential' | 'shuffle' })}
                  options={[
                    { value: 'sequential', label: t(lang, 'sequential') },
                    { value: 'shuffle', label: t(lang, 'shuffleOrder') },
                  ]}
                  theme={theme}
                  buttonClassName="w-full px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors"
                  buttonStyle={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
                />
              </div>

              {/* Data Management */}
              <div className="pt-4 border-t space-y-2.5" style={{ borderColor: theme.borderFaint }}>
                <label className="text-[11px] font-medium text-red-500 opacity-90">{t(lang, 'dataManagement')}</label>
                <button
                  onClick={() => {
                    if (window.confirm(t(lang, 'resetSRSConfirm'))) {
                      localStorage.removeItem(storageKey);
                      setCards([]);
                      showToast(t(lang, 'progressResetToast'));
                      setShowSettingsDrawer(false);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-red-500/30 text-red-500 text-[11px] font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>{t(lang, 'resetProgress')}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: theme.borderFaint }}>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors hover:opacity-80"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                {t(lang, 'cancelEdit')}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem(settingsKey, JSON.stringify(settings));
                  setShowSettingsDrawer(false);
                  showToast(t(lang, 'settingsSavedToast'));
                }}
                className="px-4 py-1.5 rounded-lg text-[11px] font-medium text-white shadow-xs transition-transform active:scale-95"
                style={{ backgroundColor: theme.accent }}
              >
                {t(lang, 'saveCard')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
