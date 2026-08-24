import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Terminal, X, CornerDownLeft, Command, Hash } from 'lucide-react';
import type { ThemeColors } from './types';
import type { Lang } from './i18n';

export interface CommandItem {
  id: string;
  label: string;
  category: 'Actions & Tools' | 'View & Layout' | 'Navigation & Search' | 'System & Export';
  icon: React.ReactNode;
  shortcut?: string;
  description: string;
  perform: () => void;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColors;
  lang: Lang;
  uiFont: string;
  commands: CommandItem[];
};

export default function CommandPaletteModal({
  isOpen,
  onClose,
  theme,
  lang = 'vi',
  uiFont,
  commands,
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const tUI = {
    placeholder: { 
      en: 'Type a command or > / / to filter...',
      vi: 'Gõ lệnh hoặc > / / để lọc...',
      fr: 'Tapez une commande ou > / / pour filtrer...',
      de: 'Einen Befehl eingeben oder > / / zum Filtern...',
      it: 'Digita un comando o > / / per filtrare...',
      es: 'Escribe un comando o > / / para filtrar...',
      ko: '명령어를 입력하거나 > / / 를 입력하여 필터링...',
      zh: '输入命令或 > / / 进行过滤...',
      ja: 'コマンドを入力するか、> / / でフィルタリング...'
    },
    filter: {
      en: 'Filter:',
      vi: 'Lọc:',
      fr: 'Filtre:',
      de: 'Filter:',
      it: 'Filtro:',
      es: 'Filtro:',
      ko: '필터:',
      zh: '过滤:',
      ja: 'フィルター:'
    },
    table: { en: 'Table', vi: 'Bảng (Table)', fr: 'Tableau', de: 'Tabelle', it: 'Tabella', es: 'Tabla', ko: '표', zh: '表格', ja: 'テーブル' },
    foldAll: { en: 'Fold All', vi: 'Gập Đề Mục', fr: 'Plier tout', de: 'Alle einklappen', it: 'Riduci tutto', es: 'Plegar todo', ko: '모두 접기', zh: '折叠全部', ja: 'すべて折りたたむ' },
    focusMode: { en: 'Focus Mode', vi: 'Chế độ tập trung', fr: 'Mode focus', de: 'Fokus-Modus', it: 'Modalità Focus', es: 'Modo enfoque', ko: '집중 모드', zh: '专注模式', ja: '集中モード' },
    splitDiff: { en: 'Split Diff', vi: 'So Sánh', fr: 'Comparer', de: 'Vergleich', it: 'Confronta', es: 'Comparar', ko: '비교', zh: '对比', ja: '比較' },
    noCommands: { 
      en: 'No commands found matching',
      vi: 'Không tìm thấy lệnh phù hợp với',
      fr: 'Aucune commande trouvée pour',
      de: 'Keine Befehle gefunden für',
      it: 'Nessun comando trovato per',
      es: 'No se encontraron comandos para',
      ko: '일치하는 명령이 없습니다',
      zh: '未找到匹配的命令',
      ja: '一致するコマンドがありません'
    },
    navigate: { en: 'Navigate', vi: 'Di chuyển', fr: 'Naviguer', de: 'Navigieren', it: 'Naviga', es: 'Navegar', ko: '이동', zh: '导航', ja: '移動' },
    select: { en: 'Select', vi: 'Chọn', fr: 'Sélectionner', de: 'Auswählen', it: 'Seleziona', es: 'Seleccionar', ko: '선택', zh: '选择', ja: '選択' }
  };

  const categoryT = {
    'Actions & Tools': { en: 'Actions & Tools', vi: 'Công cụ & Hành động', fr: 'Actions & Outils', de: 'Aktionen & Tools', it: 'Azioni e Strumenti', es: 'Acciones y Herramientas', ko: '작업 및 도구', zh: '操作与工具', ja: 'アクションとツール' },
    'View & Layout': { en: 'View & Layout', vi: 'Hiển thị & Giao diện', fr: 'Vue & Mise en page', de: 'Ansicht & Layout', it: 'Visualizzazione e Layout', es: 'Vista y Diseño', ko: '보기 및 레이아웃', zh: '视图与布局', ja: '表示とレイアウト' },
    'Navigation & Search': { en: 'Navigation & Search', vi: 'Điều hướng & Tìm kiếm', fr: 'Navigation & Recherche', de: 'Navigation & Suche', it: 'Navigazione e Ricerca', es: 'Navegación y Búsqueda', ko: '탐색 및 검색', zh: '导航与搜索', ja: 'ナビゲーションと検索' },
    'System & Export': { en: 'System & Export', vi: 'Hệ thống & Xuất file', fr: 'Système & Export', de: 'System & Export', it: 'Sistema ed Esportazione', es: 'Sistema y Exportación', ko: '시스템 및 내보내기', zh: '系统与导出', ja: 'システムとエクスポート' }
  };

  const getT = (key: keyof typeof tUI) => {
    const k = tUI[key];
    if (!k) return '';
    return (k as Record<string, string>)[lang] || k.en;
  };

  const getCatT = (cat: string) => {
    const k = categoryT[cat as keyof typeof categoryT];
    if (!k) return cat;
    return (k as Record<string, string>)[lang] || k.en;
  };

  // Check if query is in Prefix / Command-only mode
  const isCommandOnlyMode = query.startsWith('>') || query.startsWith('/');
  const cleanQuery = isCommandOnlyMode ? query.slice(1).trim().toLowerCase() : query.trim().toLowerCase();

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!cleanQuery) {
      return commands;
    }
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(cleanQuery) ||
      cmd.description.toLowerCase().includes(cleanQuery) ||
      cmd.category.toLowerCase().includes(cleanQuery) ||
      cmd.id.toLowerCase().includes(cleanQuery)
    );
  }, [commands, cleanQuery]);

  // Group commands by category for display
  const groupedCommands = useMemo(() => {
    const groups: { [key: string]: CommandItem[] } = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          const item = filteredCommands[selectedIndex];
          onClose();
          item.perform();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndexCounter = 0;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 pointer-events-auto select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[75vh] transition-all"
        style={{
          backgroundColor: theme.surface || '#18181b',
          borderColor: theme.border || '#27272a',
          color: theme.text || '#f4f4f5',
          fontFamily: `'${uiFont}', sans-serif`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div
          className="relative flex items-center px-4 py-3.5 border-b gap-3 shrink-0"
          style={{ borderColor: theme.borderFaint || theme.border }}
        >
          {isCommandOnlyMode ? (
            <Terminal size={17} style={{ color: theme.text }} className="shrink-0 opacity-80" />
          ) : (
            <Search size={17} style={{ color: theme.textMuted || theme.text }} className="shrink-0 opacity-60" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={
              lang === 'vi'
                ? 'Tìm kiếm câu lệnh, công cụ (Gõ > hoặc / để lọc nhanh)...'
                : 'Type a command or > / / to filter...'
            }
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:opacity-40"
            style={{ color: theme.text }}
          />

          {isCommandOnlyMode && (
            <span
              className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded border uppercase tracking-wider shrink-0"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: theme.text,
              }}
            >
              Command
            </span>
          )}

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md hover:bg-white/10 opacity-50 hover:opacity-100 transition-all cursor-pointer shrink-0"
              title="Xóa"
            >
              <X size={14} />
            </button>
          )}

          <kbd
            className="px-1.5 py-0.5 rounded border text-[10px] font-mono opacity-40 shrink-0"
            style={{ borderColor: theme.border }}
          >
            ESC
          </kbd>
        </div>

        {/* Categories & Filter Bar */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 border-b text-xs overflow-x-auto shrink-0 select-none"
          style={{ borderColor: theme.borderFaint || theme.border, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)' }}
        >
          <span className="text-[10px] uppercase font-mono tracking-wider opacity-40 shrink-0 pr-1">{getT('filter')}</span>
          {[
            { label: getT('table'), cmd: '> insert table' },
            { label: getT('foldAll'), cmd: '> fold all' },
            { label: getT('focusMode'), cmd: '> toggle focus' },
            { label: getT('splitDiff'), cmd: '> split diff' },
          ].map((quick, i) => {
            const isActive = query === quick.cmd;
            return (
              <button
                key={i}
                onClick={() => {
                  setQuery(isActive ? '' : quick.cmd);
                  inputRef.current?.focus();
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all hover:opacity-100 cursor-pointer shrink-0 ${isActive ? 'opacity-100 font-semibold' : 'opacity-60'}`}
                style={{
                  borderColor: isActive ? theme.text : (theme.borderFaint || theme.border),
                  backgroundColor: isActive ? (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
                  color: isActive ? theme.text : theme.text,
                }}
              >
                {quick.label}
              </button>
            );
          })}
        </div>

        {/* Command List Container */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-3">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center opacity-40 flex flex-col items-center justify-center gap-2 text-xs">
              <span>{getT('noCommands')}</span>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="space-y-1">
                {/* Category Header */}
                <div
                  className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-40"
                  style={{ color: theme.text }}
                >
                  <Hash size={10} />
                  <span>{getCatT(category)}</span>
                </div>

                {/* Items */}
                {items.map(item => {
                  const currentIndex = flatIndexCounter++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      data-selected={isSelected}
                      onClick={() => {
                        onClose();
                        item.perform();
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-100 ${isSelected ? 'shadow-sm' : ''}`}
                      style={{
                        backgroundColor: isSelected
                          ? theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.04)'
                          : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className="p-1.5 rounded-lg shrink-0 opacity-70"
                          style={{
                            backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                            color: theme.text,
                          }}
                        >
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'opacity-100' : 'opacity-85'}`}>
                            {item.label}
                          </span>
                          <span className="text-[11px] opacity-50 truncate font-normal">{item.description}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.shortcut && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono border opacity-50"
                            style={{ borderColor: theme.borderFaint || theme.border }}
                          >
                            {item.shortcut}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft size={12} className="opacity-60 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Help Bar */}
        <div
          className="px-4 py-2 border-t text-[10px] flex items-center justify-between opacity-50 font-mono select-none"
          style={{ borderColor: theme.borderFaint || theme.border, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded border">↑↓</kbd> {getT('navigate')}
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded border">↵</kbd> {getT('select')}
            </span>
          </div>
          <div className="flex items-center gap-1 font-sans font-medium">
            <Command size={11} />
            <span>Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
