import React, { useState } from 'react';
import { Table, Grid, Plus, X, Minus } from 'lucide-react';
import type { ThemeColors } from './types';
import type { Lang } from './i18n';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (rows: number, cols: number) => void;
  theme: ThemeColors;
  uiFont: string;
  lang?: Lang;
};

export default function TableGridPickerModal({
  isOpen,
  onClose,
  onInsertTable,
  theme,
  uiFont,
  lang = 'vi',
}: Props) {
  const [hoveredRows, setHoveredRows] = useState(3);
  const [hoveredCols, setHoveredCols] = useState(3);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [activeTab, setActiveTab] = useState<'grid' | 'custom'>('grid');

  if (!isOpen) return null;

  const maxGrid = 10;

  const handleGridClick = () => {
    onInsertTable(hoveredRows, hoveredCols);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = Math.max(1, Math.min(50, customRows));
    const c = Math.max(1, Math.min(20, customCols));
    onInsertTable(r, c);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 pointer-events-auto select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl border p-5 transition-all"
        style={{
          backgroundColor: theme.surface || '#18181b',
          borderColor: theme.border || '#27272a',
          color: theme.text || '#f4f4f5',
          fontFamily: `'${uiFont}', sans-serif`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: theme.borderFaint || theme.border }}>
          <div className="flex items-center gap-2">
            <Table size={16} style={{ color: theme.text }} />
            <h3 className="font-semibold text-sm">
              {lang === 'vi' ? 'Tạo Bảng Tương Tác' : 'Insert Table'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 opacity-60 hover:opacity-100 transition-all cursor-pointer"
            title={lang === 'vi' ? 'Đóng' : 'Close'}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 mb-4 rounded-xl border bg-black/10" style={{ borderColor: theme.borderFaint || theme.border }}>
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'grid' ? 'shadow-xs font-semibold' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'grid' ? (theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)') : 'transparent',
              color: theme.text,
            }}
          >
            <Grid size={13} />
            <span>{lang === 'vi' ? 'Lưới Trực Quan' : 'Visual Grid'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'custom' ? 'shadow-xs font-semibold' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'custom' ? (theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)') : 'transparent',
              color: theme.text,
            }}
          >
            <Table size={13} />
            <span>{lang === 'vi' ? 'Nhập Số Lượng' : 'Custom Dimensions'}</span>
          </button>
        </div>

        {activeTab === 'grid' ? (
          <div>
            {/* Grid Size Display */}
            <div className="text-center font-mono font-semibold text-xs mb-3 opacity-80">
              {hoveredCols} {lang === 'vi' ? 'Cột' : 'Cols'} × {hoveredRows} {lang === 'vi' ? 'Hàng' : 'Rows'}
            </div>

            {/* 10x10 Grid Matrix */}
            <div
              className="grid grid-cols-10 gap-1.5 p-2 rounded-xl border mb-4"
              style={{
                backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: theme.borderFaint || theme.border,
              }}
            >
              {Array.from({ length: maxGrid }).map((_, rIdx) =>
                Array.from({ length: maxGrid }).map((_, cIdx) => {
                  const r = rIdx + 1;
                  const c = cIdx + 1;
                  const isHighlighted = r <= hoveredRows && c <= hoveredCols;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onMouseEnter={() => {
                        setHoveredRows(r);
                        setHoveredCols(c);
                      }}
                      onClick={handleGridClick}
                      className={`w-full aspect-square rounded cursor-pointer transition-all ${
                        isHighlighted
                          ? 'border scale-105 shadow-2xs'
                          : 'opacity-20 hover:opacity-50'
                      }`}
                      style={{
                        backgroundColor: isHighlighted
                          ? (theme.isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(24, 24, 27, 0.85)')
                          : 'transparent',
                        borderColor: isHighlighted
                          ? theme.text
                          : (theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
                      }}
                    />
                  );
                })
              )}
            </div>

            <div className="text-center text-[11px] opacity-50 font-mono">
              {lang === 'vi' ? 'Di chuyển chuột để chọn ô & nhấp để tạo' : 'Hover over grid to size & click to insert'}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="space-y-3">
              {/* Rows Selector */}
              <div>
                <label className="block text-xs font-medium mb-1.5 opacity-70">
                  {lang === 'vi' ? 'Số Hàng (Rows):' : 'Number of Rows:'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomRows(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-lg border hover:bg-white/10 cursor-pointer shrink-0"
                    style={{ borderColor: theme.border }}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={customRows}
                    onChange={e => setCustomRows(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-lg border outline-none font-mono text-center text-sm font-semibold"
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.5)',
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomRows(prev => Math.min(50, prev + 1))}
                    className="p-2 rounded-lg border hover:bg-white/10 cursor-pointer shrink-0"
                    style={{ borderColor: theme.border }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Columns Selector */}
              <div>
                <label className="block text-xs font-medium mb-1.5 opacity-70">
                  {lang === 'vi' ? 'Số Cột (Columns):' : 'Number of Columns:'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomCols(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-lg border hover:bg-white/10 cursor-pointer shrink-0"
                    style={{ borderColor: theme.border }}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={customCols}
                    onChange={e => setCustomCols(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-lg border outline-none font-mono text-center text-sm font-semibold"
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.5)',
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomCols(prev => Math.min(20, prev + 1))}
                    className="p-2 rounded-lg border hover:bg-white/10 cursor-pointer shrink-0"
                    style={{ borderColor: theme.border }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Box */}
            <div
              className="p-2.5 rounded-lg border text-center text-xs font-mono opacity-80"
              style={{
                borderColor: theme.borderFaint || theme.border,
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              }}
            >
              {lang === 'vi' ? 'Kích thước tạo:' : 'Creating:'} <b>{customCols}</b> × <b>{customRows}</b> ({customCols * customRows} {lang === 'vi' ? 'ô' : 'cells'})
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm hover:opacity-90 active:scale-98"
              style={{
                backgroundColor: theme.text,
                color: theme.bg,
                borderColor: theme.text,
              }}
            >
              <Plus size={14} />
              <span>{lang === 'vi' ? 'Chèn Bảng Vào Văn Bản' : 'Insert Table'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
