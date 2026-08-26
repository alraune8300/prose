import React, { useState } from 'react';
import { ThemeColors } from '../../../types';
import { Search, X } from 'lucide-react';

interface NotionEmojiPickerProps {
  currentEmoji: string;
  theme: ThemeColors;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES: { name: string; emojis: string[] } = {
  name: 'Popular',
  emojis: [
    '👋', '📝', '📄', '🚀', '💡', '🔥', '⭐', '✨', '🎯', '📌', 
    '📅', '📁', '📊', '🎨', '💻', '☕', '🌟', '⚡', '🛠️', '📖',
    '🧠', '🔍', '🏷️', '✅', '💬', '🏆', '🎉', '🌱', '☀️', '🌙',
    '🔒', '💎', '🔑', '🧭', '🔮', '🧸', '📦', '💌', '🎓', '🏖️'
  ]
};

export const NotionEmojiPicker: React.FC<NotionEmojiPickerProps> = ({
  currentEmoji,
  theme,
  onSelect,
  onClose
}) => {
  const [search, setSearch] = useState('');

  const filteredEmojis = EMOJI_CATEGORIES.emojis.filter((e) => e.includes(search));

  return (
    <div
      className="absolute top-full left-0 mt-2 w-72 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 border"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b" style={{ borderColor: theme.borderFaint }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
          Chọn Biểu tượng
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:opacity-75 transition-opacity"
          style={{ color: theme.textMuted }}
        >
          <X size={14} />
        </button>
      </div>

      <div
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-3 border text-xs"
        style={{
          backgroundColor: theme.panel,
          borderColor: theme.borderFaint,
          color: theme.text
        }}
      >
        <Search size={14} style={{ color: theme.textMuted }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm biểu tượng..."
          className="bg-transparent outline-none w-full"
          style={{ color: theme.text }}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 kgv-scroll">
        {filteredEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className={`w-9 h-9 flex items-center justify-center text-xl rounded-lg transition-all hover:scale-110 ${
              emoji === currentEmoji ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              backgroundColor: emoji === currentEmoji ? theme.accentLight : 'transparent'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.panel)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = emoji === currentEmoji ? theme.accentLight : 'transparent')
            }
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
