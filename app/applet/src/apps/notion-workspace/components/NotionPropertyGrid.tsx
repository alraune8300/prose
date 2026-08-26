import React, { useState } from 'react';
import { ThemeColors } from '../../../types';
import { NotionPage } from '../types';
import {
  Tag,
  CircleDot,
  Calendar,
  Plus,
  Trash2,
  Check,
  Type,
  Hash,
  Globe,
  ChevronDown
} from 'lucide-react';

interface NotionPropertyGridProps {
  page: NotionPage;
  theme: ThemeColors;
  onUpdateProperty: (key: string, value: any) => void;
  onRemoveProperty: (key: string) => void;
}

const STATUS_OPTIONS = [
  { label: 'Not Started', colorBg: '#f1f5f9', colorText: '#475569', darkBg: '#334155', darkText: '#cbd5e1' },
  { label: 'To Do', colorBg: '#fee2e2', colorText: '#991b1b', darkBg: '#7f1d1d', darkText: '#fecaca' },
  { label: 'In Progress', colorBg: '#fef3c7', colorText: '#92400e', darkBg: '#78350f', darkText: '#fde68a' },
  { label: 'Done', colorBg: '#dcfce7', colorText: '#166534', darkBg: '#14532d', darkText: '#bbf7d0' },
  { label: 'Archived', colorBg: '#f3e8ff', colorText: '#6b21a8', darkBg: '#581c87', darkText: '#e9d5ff' }
];

export const NotionPropertyGrid: React.FC<NotionPropertyGridProps> = ({
  page,
  theme,
  onUpdateProperty,
  onRemoveProperty
}) => {
  const [isAddingProp, setIsAddingProp] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState<'text' | 'number' | 'url'>('text');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const properties = page.properties || {};

  const handleAddCustomProp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;
    const key = newPropName.trim();
    onUpdateProperty(key, '');
    setNewPropName('');
    setIsAddingProp(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const currentTags = Array.isArray(properties.tags) ? properties.tags : [];
      if (!currentTags.includes(tagInput.trim())) {
        onUpdateProperty('tags', [...currentTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = Array.isArray(properties.tags) ? properties.tags : [];
    onUpdateProperty(
      'tags',
      currentTags.filter((t) => t !== tagToRemove)
    );
  };

  const currentStatus = properties.status || 'Not Started';
  const statusConfig = STATUS_OPTIONS.find((s) => s.label === currentStatus) || STATUS_OPTIONS[0];

  return (
    <div className="w-full flex flex-col gap-1.5 mb-8 pb-4 border-b" style={{ borderColor: theme.borderFaint }}>
      {/* 1. Status Property */}
      <div className="flex items-center gap-2 group py-1">
        <div
          className="w-28 shrink-0 flex items-center gap-1.5 text-xs font-medium"
          style={{ color: theme.textMuted }}
        >
          <CircleDot size={14} style={{ color: theme.textFaint }} />
          <span>Status</span>
        </div>
        <div className="relative flex-1">
          <button
            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium transition-opacity hover:opacity-85"
            style={{
              backgroundColor: theme.isDark ? statusConfig.darkBg : statusConfig.colorBg,
              color: theme.isDark ? statusConfig.darkText : statusConfig.colorText
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.isDark ? statusConfig.darkText : statusConfig.colorText }} />
            <span>{currentStatus}</span>
            <ChevronDown size={11} className="opacity-60 ml-0.5" />
          </button>

          {isStatusMenuOpen && (
            <div
              className="absolute top-full left-0 mt-1 w-44 rounded-lg shadow-xl py-1 z-40 border animate-in fade-in"
              style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    onUpdateProperty('status', opt.label);
                    setIsStatusMenuOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-left transition-colors"
                  style={{ color: theme.text }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.panel)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-medium"
                    style={{
                      backgroundColor: theme.isDark ? opt.darkBg : opt.colorBg,
                      color: theme.isDark ? opt.darkText : opt.colorText
                    }}
                  >
                    {opt.label}
                  </span>
                  {currentStatus === opt.label && <Check size={13} style={{ color: theme.accent }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Tags Property */}
      <div className="flex items-center gap-2 group py-1">
        <div
          className="w-28 shrink-0 flex items-center gap-1.5 text-xs font-medium"
          style={{ color: theme.textMuted }}
        >
          <Tag size={14} style={{ color: theme.textFaint }} />
          <span>Tags</span>
        </div>
        <div className="flex-1 flex flex-wrap items-center gap-1.5">
          {(Array.isArray(properties.tags) ? properties.tags : []).map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all"
              style={{
                backgroundColor: theme.panel,
                color: theme.text,
                border: `1px solid ${theme.borderFaint}`
              }}
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:opacity-75 text-[10px] ml-0.5 opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="+ Add tag (Enter)"
            className="text-xs bg-transparent outline-none py-0.5 px-1.5 rounded transition-colors placeholder:opacity-50"
            style={{
              color: theme.text
            }}
          />
        </div>
      </div>

      {/* 3. Date Property */}
      <div className="flex items-center gap-2 group py-1">
        <div
          className="w-28 shrink-0 flex items-center gap-1.5 text-xs font-medium"
          style={{ color: theme.textMuted }}
        >
          <Calendar size={14} style={{ color: theme.textFaint }} />
          <span>Date</span>
        </div>
        <div className="flex-1">
          <input
            type="date"
            value={properties.date || ''}
            onChange={(e) => onUpdateProperty('date', e.target.value)}
            className="text-xs bg-transparent outline-none px-2 py-1 rounded cursor-pointer transition-colors"
            style={{
              color: theme.text,
              backgroundColor: theme.panel
            }}
          />
        </div>
      </div>

      {/* 4. Custom Key-Value Properties */}
      {Object.entries(properties)
        .filter(([k]) => !['status', 'tags', 'date'].includes(k))
        .map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 group py-1">
            <div
              className="w-28 shrink-0 flex items-center gap-1.5 text-xs font-medium truncate"
              style={{ color: theme.textMuted }}
              title={key}
            >
              <Type size={14} style={{ color: theme.textFaint }} />
              <span className="truncate">{key}</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={String(val || '')}
                onChange={(e) => onUpdateProperty(key, e.target.value)}
                placeholder="Empty"
                className="flex-1 text-xs bg-transparent outline-none px-2 py-1 rounded transition-colors"
                style={{
                  color: theme.text,
                  backgroundColor: theme.panel
                }}
              />
              <button
                onClick={() => onRemoveProperty(key)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:opacity-80 transition-opacity"
                style={{ color: theme.textMuted }}
                title="Xoá thuộc tính"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

      {/* 5. Add Property Button */}
      <div className="pt-2">
        {isAddingProp ? (
          <form onSubmit={handleAddCustomProp} className="flex items-center gap-2 max-w-sm mt-1 animate-in fade-in">
            <input
              type="text"
              value={newPropName}
              onChange={(e) => setNewPropName(e.target.value)}
              placeholder="Tên thuộc tính..."
              className="flex-1 text-xs px-2.5 py-1 rounded-md border outline-none"
              style={{
                backgroundColor: theme.panel,
                borderColor: theme.border,
                color: theme.text
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!newPropName.trim()}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: theme.accent, color: '#ffffff' }}
            >
              Thêm
            </button>
            <button
              type="button"
              onClick={() => setIsAddingProp(false)}
              className="text-xs px-2 py-1 rounded-md"
              style={{ color: theme.textMuted }}
            >
              Hủy
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingProp(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-dashed transition-all hover:opacity-80"
            style={{
              borderColor: theme.border,
              color: theme.textMuted,
              backgroundColor: 'transparent'
            }}
          >
            <Plus size={13} />
            <span>+ Add a property</span>
          </button>
        )}
      </div>
    </div>
  );
};
