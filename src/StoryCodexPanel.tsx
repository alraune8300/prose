import React, { useState, useEffect } from 'react';
import { t } from './i18n';
import type { Lang } from './i18n';
import type { CodexEntity, ThemeColors } from './types';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';

export function StoryCodexPanel({
  editor,
  theme,
  lang,
  entities,
  onUpdate
}: {
  theme: ThemeColors,
  lang: string,
  entities: CodexEntity[],
  onUpdate: (entities: CodexEntity[]) => void,
  editor?: any
}) {
  const [filter, setFilter] = useState('');
  const [frequencies, setFrequencies] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!editor) return;
    const text = editor.getText().toLowerCase();
    const freqs: Record<string, number> = {};
    entities.forEach(e => {
      let count = text.split(e.name.toLowerCase()).length - 1;
      e.aliases.forEach(a => {
        count += text.split(a.toLowerCase()).length - 1;
      });
      freqs[e.id] = count;
    });
    setFrequencies(freqs);
  }, [editor?.getText(), entities]);
  const [activeTab, setActiveTab] = useState<'Character' | 'Location' | 'Lore'>('Character');
  
  const [isEditing, setIsEditing] = useState<CodexEntity | null>(null);

  const handleSave = (entity: CodexEntity) => {
    if (entities.find(e => e.id === entity.id)) {
      onUpdate(entities.map(e => e.id === entity.id ? entity : e));
    } else {
      onUpdate([...entities, entity]);
    }
    setIsEditing(null);
  };

  const filtered = entities.filter(e => 
    e.type === activeTab && 
    (e.name.toLowerCase().includes(filter.toLowerCase()) || e.aliases.some(a => a.toLowerCase().includes(filter.toLowerCase())))
  );

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-sm tracking-widest uppercase opacity-70">{t(lang as Lang, 'storyCodex')}</div>
        <button 
          onClick={() => setIsEditing({ id: Date.now().toString(), name: '', aliases: [], type: 'Character', traits: '', bio: '' })}
          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 mb-4 gap-1">
        {['Character', 'Location', 'Lore'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)}
            style={{ background: activeTab === tab ? theme.surface : 'transparent', color: activeTab === tab ? theme.text : theme.textMuted, boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }} className={`flex-1 text-[10px] uppercase font-bold py-1.5 rounded-md transition-colors ${activeTab !== tab ? 'opacity-60 hover:opacity-100' : ''}`}
          >
            {t(lang as Lang, tab.toLowerCase() as any)}
          </button>
        ))}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 text-sm">
           <input 
             className="w-full px-3 py-2 rounded-lg border outline-none bg-transparent"
             style={{ borderColor: theme.border }}
             placeholder="Name (e.g. John Doe)"
             value={isEditing.name}
             onChange={e => setIsEditing({...isEditing, name: e.target.value})}
           />
           <input 
             className="w-full px-3 py-2 rounded-lg border outline-none bg-transparent"
             style={{ borderColor: theme.border }}
             placeholder="Aliases (comma separated)"
             value={isEditing.aliases.join(', ')}
             onChange={e => setIsEditing({...isEditing, aliases: e.target.value.split(',').map(s=>s.trim()).filter(s=>s)})}
           />
           <select 
             className="w-full px-3 py-2 rounded-lg border outline-none bg-transparent"
             style={{ borderColor: theme.border }}
             value={isEditing.type}
             onChange={e => setIsEditing({...isEditing, type: e.target.value as any})}
           >
             <option value="Character">Character</option>
             <option value="Location">Location</option>
             <option value="Lore">Lore / Event</option>
           </select>
           <textarea 
             className="w-full px-3 py-2 rounded-lg border outline-none bg-transparent resize-none h-20"
             style={{ borderColor: theme.border }}
             placeholder="Key Traits (Age, Role, Appearance...)"
             value={isEditing.traits}
             onChange={e => setIsEditing({...isEditing, traits: e.target.value})}
           />
           <textarea 
             className="w-full px-3 py-2 rounded-lg border outline-none bg-transparent resize-none flex-1 min-h-[100px]"
             style={{ borderColor: theme.border }}
             placeholder="Bio & Backstory..."
             value={isEditing.bio}
             onChange={e => setIsEditing({...isEditing, bio: e.target.value})}
           />
           <div className="flex gap-2">
             <button onClick={() => setIsEditing(null)} className="flex-1 py-2 rounded-lg bg-black/5 dark:bg-white/5 font-semibold">Cancel</button>
             <button onClick={() => handleSave(isEditing)} className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">Save</button>
           </div>
        </div>
      ) : (
        <>
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input 
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border outline-none bg-transparent text-sm"
              style={{ borderColor: theme.border }}
              placeholder={t(lang as Lang, 'searchEntities')}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
             {filtered.map(entity => (
               <div key={entity.id} className="p-3 border rounded-xl" style={{ borderColor: theme.border }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{entity.name} <span className="text-[10px] ml-1 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{frequencies[entity.id] || 0}</span></span>
                    <div className="flex gap-1 opacity-50">
                      <button onClick={() => setIsEditing(entity)}><Edit2 size={14} /></button>
                      <button onClick={() => onUpdate(entities.filter(e => e.id !== entity.id))}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold uppercase opacity-50 mb-2">{entity.type}</div>
                  <div className="text-xs opacity-80 line-clamp-2">{entity.traits}</div>
               </div>
             ))}
             {filtered.length === 0 && <div className="text-sm opacity-50 text-center mt-4">{t(lang as Lang, 'noEntitiesFound')}</div>}
          </div>
        </>
      )}
    </div>
  );
}
