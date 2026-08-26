import React, { useState } from 'react';
import { LucideIconRenderer } from './LucideIconRenderer';
import { Search } from 'lucide-react';

const COMMON_ICONS = [
  'FileText', 'File', 'Folder', 'Book', 'Bookmark', 'Star', 'Heart', 'Sparkles', 
  'Lightbulb', 'Zap', 'Target', 'CheckSquare', 'List', 'Code', 'Terminal', 'Image', 
  'Video', 'Music', 'Headphones', 'Mic', 'Camera', 'Calendar', 'Clock', 'Map', 
  'Globe', 'Home', 'Building', 'Briefcase', 'Coffee', 'Cloud', 'Sun', 'Moon', 
  'Umbrella', 'Flag', 'Bell', 'Lock', 'Unlock', 'Key', 'Shield', 'User', 'Users', 
  'MessageCircle', 'Send', 'Mail', 'Phone', 'Settings', 'Tool', 'Activity', 'PenTool', 'Edit3'
];

interface Props {
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export function NotionIconPicker({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filteredIcons = COMMON_ICONS.filter(icon => 
    icon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col">
      <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <Search size={14} className="text-gray-400" />
        <input 
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search icons..." 
          className="w-full bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200"
        />
      </div>
      <div className="p-2 max-h-64 overflow-y-auto grid grid-cols-6 gap-1">
        {filteredIcons.map(icon => (
          <button
            key={icon}
            onClick={() => {
              onSelect(icon);
              onClose();
            }}
            className="p-2 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            title={icon}
          >
            <LucideIconRenderer name={icon} size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}
