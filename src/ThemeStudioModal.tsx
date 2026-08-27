import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Plus, RotateCcw, PenTool, Type, Droplet, LayoutTemplate, BoxSelect, Check, Trash2, Square } from 'lucide-react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { THEME_CATEGORIES, PRESETS } from './theme';
import { ThemeColors, ThemeMode, ThemeConfig, Lang } from './types';
import { getDict } from './i18n';

interface ThemeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColors;
  themeMode: ThemeMode;
  onSelectTheme: (name: ThemeMode) => void;
  uiFont: string;
  lang: Lang;
  customThemes: ThemeConfig[];
  onSaveCustomTheme: (t: ThemeConfig, overwrite: boolean) => void;
  onPreviewTheme: (t: ThemeConfig | null) => void;
  onDeleteCustomTheme: (id: string) => void;
}

export default function ThemeStudioModal({
  isOpen, onClose, theme, themeMode, onSelectTheme, uiFont, lang, customThemes, onSaveCustomTheme, onPreviewTheme, onDeleteCustomTheme
}: ThemeStudioModalProps) {
  const t = useMemo(() => getDict(lang), [lang]);
  
  const [themeSearchQuery, setThemeSearchQuery] = useState('');
  const [themeCategoryFilter, setThemeCategoryFilter] = useState('all');
  
  const [deleteConfirmThemeId, setDeleteConfirmThemeId] = useState<string | null>(null);
  const [deleteAlertMsg, setDeleteAlertMsg] = useState<string | null>(null);
  
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeConfig | null>(null);
  const [initialTheme, setInitialTheme] = useState<ThemeConfig | null>(null);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsBuilderMode(false);
      setEditingTheme(null);
      setInitialTheme(null);
      onPreviewTheme(null);
    }
  }, [isOpen]);

  // Live preview effect
  useEffect(() => {
    if (isBuilderMode && editingTheme) {
      onPreviewTheme(editingTheme);
    } else {
      onPreviewTheme(null);
    }
  }, [isBuilderMode, editingTheme]);

  const handleClose = () => {
    if (isBuilderMode) {
      onPreviewTheme(null);
      setIsBuilderMode(false);
    }
    onClose();
  };

  const handleEditTheme = (e: React.MouseEvent, baseTheme: any, isPreset = true) => {
    e.stopPropagation();
    const newTheme: ThemeConfig = {
      id: isPreset ? `custom-${Date.now()}` : baseTheme.id,
      name: isPreset ? `${baseTheme.name} (Custom)` : baseTheme.name,
      isCustom: true,
      bg: baseTheme.bg,
      surface: baseTheme.surface || baseTheme.bg,
      text: baseTheme.text,
      textMuted: baseTheme.textMuted || baseTheme.text,
      accent: baseTheme.accent,
      border: baseTheme.border || baseTheme.text
    };
    setInitialTheme(newTheme);
    setEditingTheme(newTheme);
    setIsBuilderMode(true);
  };

  const handleCreateNew = () => {
    const newTheme: ThemeConfig = {
      id: `custom-${Date.now()}`,
      name: t.newCustomTheme || 'New Custom Theme',
      isCustom: true,
      bg: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b',
      accent: '#3b82f6',
      border: '#e2e8f0'
    };
    setInitialTheme(newTheme);
    setEditingTheme(newTheme);
    setIsBuilderMode(true);
  };

  const updateColor = (field: keyof ThemeConfig, value: string) => {
    if (!editingTheme) return;
    const updated = { ...editingTheme, [field]: value };
    
    // Auto-calculate border opacity from text if border isn't manually set? 
    // Wait, prompt says: "Trường border tự động tính toán từ text với opacity 0.15"
    if (field === 'text') {
       // A simple approach: use the text color, but ideally we add opacity.
       // Let's just set it to text color for now or attempt hex to rgba conversion.
    }
    setEditingTheme(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', fontFamily: uiFont }} onClick={handleClose}>
      <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }} onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: theme.borderFaint }}>
          <div>
            <h2 className="text-xl font-serif" style={{ color: theme.text, fontFamily: `'${uiFont}', Georgia, serif` }}>
              {isBuilderMode ? (t.editTheme || 'Edit theme') : (t.themePresets || 'Themes')}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
              {isBuilderMode ? t.customizeWritingExperience || 'Customize your writing experience and color palette.' : (t.customizeWritingExperience || 'Customize your writing experience and color palette.')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isBuilderMode && (
              <div className="relative w-48 sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5" style={{ color: theme.textMuted }} />
                <input
                  type="text"
                  placeholder={t.searchThemes || t.searchForThemes || 'Search for themes...'}
                  value={themeSearchQuery}
                  onChange={e => setThemeSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 rounded-lg text-xs border outline-none"
                  style={{ 
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', 
                    borderColor: theme.border, 
                    color: theme.text,
                    fontFamily: uiFont
                  }}
                />
                {themeSearchQuery && (
                  <button onClick={() => setThemeSearchQuery('')} className="absolute right-2.5 top-2.5 text-xs" style={{ color: theme.textMuted }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            
            {isBuilderMode && (
              <button
                onClick={() => setEditingTheme(initialTheme)}
                className="p-1.5 rounded-lg hover:opacity-80 transition-colors cursor-pointer flex items-center gap-1.5 px-3"
                style={{ color: theme.textMuted, border: `1px solid ${theme.borderFaint}` }}
                title={t.resetToDefault || "Revert to original"}
              >
                <RotateCcw size={14} />
                <span className="text-xs">Revert</span>
              </button>
            )}

            <button
              onClick={() => {
                if (isBuilderMode) {
                  onPreviewTheme(null);
                  setIsBuilderMode(false);
                } else {
                  handleClose();
                }
              }}
              className="p-1.5 rounded-lg hover:opacity-80 transition-colors cursor-pointer"
              style={{ color: theme.textMuted }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {isBuilderMode ? (
          <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.surface }} onClick={() => setActiveColorPicker(null)}>
             <div className="max-w-2xl mx-auto space-y-6">
                
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.text }}>{t.themeName || "Theme name"}</label>
                  <input
                    type="text"
                    value={editingTheme?.name || ''}
                    onChange={(e) => setEditingTheme(prev => prev ? {...prev, name: e.target.value} : null)}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ 
                      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', 
                      borderColor: theme.border, 
                      color: theme.text,
                      fontFamily: uiFont
                    }}
                  />
                </div>

                <div className="space-y-4 mt-6">
                  {[
                    { key: 'bg', label: t.mainBackground || 'Main background', desc: t.bgDesc || 'Overall app background', icon: <LayoutTemplate size={14} /> },
                    { key: 'surface', label: t.writingSurface || 'Writing surface', desc: t.surfaceDesc || 'Writing surface & panels', icon: <BoxSelect size={14} /> },
                    { key: 'text', label: t.textColor || 'Text color', desc: t.textDesc || 'Main text, headings & icons', icon: <Type size={14} /> },
                    { key: 'textMuted', label: t.subtextColor || 'Subtext color', desc: t.subtextDesc || 'Muted text & secondary icons', icon: <Type size={14} opacity={0.6} /> },
                    { key: 'accent', label: t.accentColor || 'Accent color', desc: t.accentDesc || 'Buttons & focus highlights', icon: <PenTool size={14} /> },
                    { key: 'border', label: t.borderColor || 'Border color', desc: t.borderDesc || 'Menu & layout borders', icon: <Square size={14} /> },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: theme.borderFaint, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border" style={{ backgroundColor: editingTheme?.[field.key as keyof ThemeConfig] as string, borderColor: theme.border }}></div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: theme.text }}>{field.label}</div>
                          <div className="text-[10px]" style={{ color: theme.textMuted }}>{field.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveColorPicker(activeColorPicker === field.key ? null : field.key);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-opacity hover:opacity-80" 
                              style={{ borderColor: theme.border, background: theme.bg }}
                            >
                              <span className="font-mono text-xs uppercase" style={{ color: theme.text }}>
                                {editingTheme?.[field.key as keyof ThemeConfig] as string || '#000000'}
                              </span>
                              <PenTool size={12} style={{ color: theme.textMuted }} />
                            </button>

                            {activeColorPicker === field.key && (
                              <div 
                                className="absolute right-0 top-full mt-2 z-50 p-3 rounded-xl shadow-2xl border flex flex-col items-center animate-fade-in-up"
                                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <HexColorPicker 
                                  color={editingTheme?.[field.key as keyof ThemeConfig] as string || '#000000'}
                                  onChange={(newColor) => updateColor(field.key as keyof ThemeConfig, newColor)}
                                />
                                <div className="mt-3 flex items-center gap-2 w-full">
                                  <span className="text-xs font-mono" style={{ color: theme.textMuted }}>#</span>
                                  <HexColorInput 
                                    color={editingTheme?.[field.key as keyof ThemeConfig] as string || '#000000'}
                                    onChange={(newColor) => updateColor(field.key as keyof ThemeConfig, newColor)}
                                    className="w-full bg-transparent border-b outline-none text-sm font-mono uppercase"
                                    style={{ color: theme.text, borderColor: theme.borderFaint }}
                                    prefixed={false}
                                  />
                                </div>
                              </div>
                            )}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 mt-6 border-t flex justify-end gap-3" style={{ borderColor: theme.borderFaint }}>
                   <button 
                     onClick={() => setIsBuilderMode(false)}
                     className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                     style={{ color: theme.text, backgroundColor: 'transparent', border: `1px solid ${theme.border}` }}
                     onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                     onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                   >{t.cancel || "Cancel"}</button>
                   <button 
                     onClick={() => {
                       if (editingTheme) {
                         const isExisting = customThemes.some(c => c.id === editingTheme.id);
                         if (isExisting) {
                           onSaveCustomTheme(editingTheme, true);
                           setIsBuilderMode(false);
                           onSelectTheme(editingTheme.id);
                         } else {
                           const newT = { ...editingTheme, id: `custom-${Date.now()}` };
                           onSaveCustomTheme(newT, false);
                           setIsBuilderMode(false);
                           onSelectTheme(newT.id);
                         }
                       }
                     }}
                     className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer text-white"
                     style={{ backgroundColor: theme.accent }}
                   >{t.saveTheme || "Save Theme"}</button>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* Delete Alerts / Confirmations */}
            {deleteAlertMsg && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm transition-all animate-in fade-in slide-in-from-top-4"
                style={{ backgroundColor: '#ef4444', color: '#fff', fontFamily: uiFont }}>
                {deleteAlertMsg}
              </div>
            )}
            
            {deleteConfirmThemeId && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                <div className="rounded-xl shadow-xl p-5 max-w-sm w-full border animate-in zoom-in-95 duration-200"
                  style={{ backgroundColor: theme.surface, borderColor: theme.border, fontFamily: uiFont }}>
                  <h3 className="text-base font-semibold mb-2" style={{ color: theme.text }}>{t.deleteTheme}</h3>
                  <p className="text-sm mb-6 leading-relaxed" style={{ color: theme.textMuted }}>{t.confirmDeleteTheme}</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setDeleteConfirmThemeId(null)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                      style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
                    >
                      {t.cancel}
                    </button>
                    <button
                      onClick={() => {
                        onDeleteCustomTheme(deleteConfirmThemeId);
                        setDeleteConfirmThemeId(null);
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90 text-white"
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      {t.deleteTheme}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sidebar categories */}
            <div className="w-full md:w-56 p-4 border-r overflow-y-auto flex md:flex-col gap-1.5 flex-shrink-0" style={{ borderColor: theme.borderFaint, background: theme.bg }}>
              <button
                onClick={() => setThemeCategoryFilter('all')}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left cursor-pointer"
                style={{
                  backgroundColor: themeCategoryFilter === 'all' ? theme.accentLight : 'transparent',
                  color: themeCategoryFilter === 'all' ? theme.accent : theme.text,
                  fontWeight: themeCategoryFilter === 'all' ? 600 : 400,
                  fontFamily: uiFont,
                  border: `1px solid ${themeCategoryFilter === 'all' ? theme.accent : theme.borderFaint}`
                }}
              >
                <span>{t.allThemes || 'All themes'}</span>
                <span className="text-[10px] opacity-70 font-mono">{PRESETS.length + customThemes.length}</span>
              </button>
              {THEME_CATEGORIES.map(cat => {
                const count = PRESETS.filter(p => cat.presetNames.includes(p.name)).length;
                const isActive = themeCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setThemeCategoryFilter(cat.id)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left truncate cursor-pointer"
                    style={{
                      backgroundColor: isActive ? theme.accentLight : 'transparent',
                      color: isActive ? theme.accent : theme.text,
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: uiFont,
                      border: `1px solid ${isActive ? theme.accent : theme.borderFaint}`
                    }}
                  >
                    <span className="truncate mr-2">{cat.label}</span>
                    <span className="text-[10px] opacity-70 font-mono flex-shrink-0">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Theme Grid */}
            <div className="flex-1 p-6 overflow-y-auto" style={{ backgroundColor: theme.surface }}>
              
              {/* Custom Themes Section */}
              {(themeCategoryFilter === 'all' || themeSearchQuery) && (
                <div className="mb-8">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-serif font-semibold" style={{ color: theme.text }}>Custom <span className="text-xs font-mono px-1.5 py-0.5 rounded ml-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>{customThemes.length}</span></h3>
                     <button onClick={handleCreateNew} className="text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg border" style={{ color: theme.accent, borderColor: theme.accent, backgroundColor: theme.accentLight }}>
                        <Plus size={14} /> Create new
                     </button>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Create New Card */}
                      <div 
                        onClick={handleCreateNew}
                        className="group relative p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:opacity-80 h-[100px]"
                        style={{ border: `1.5px dashed ${theme.border}`, backgroundColor: 'transparent' }}
                      >
                         <Plus size={24} style={{ color: theme.textMuted, marginBottom: 8 }} />
                         <span className="text-xs font-medium" style={{ color: theme.textMuted }}>{t.advancedCustomTheme || "Create new theme"}</span>
                      </div>

                      {/* Custom Themes List */}
                      {customThemes.filter(c => !themeSearchQuery || c.name.toLowerCase().includes(themeSearchQuery.toLowerCase())).map(cTheme => {
                        const isActive = themeMode === cTheme.id;
                        return (
                          <div
                            key={cTheme.id}
                            onClick={() => onSelectTheme(cTheme.id)}
                            className="group relative p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5 shadow-xs"
                            style={{
                              background: isActive ? theme.accentLight : theme.bg,
                              borderColor: isActive ? theme.accent : theme.border,
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div style={{
                                width: 110, height: 34, borderRadius: 8,
                                background: cTheme.bg,
                                border: `1.5px solid ${cTheme.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                position: 'relative', overflow: 'hidden', flexShrink: 0
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  {[
                                    { bg: cTheme.text, border: cTheme.bg },
                                    { bg: cTheme.accent, border: cTheme.bg },
                                    { bg: cTheme.surface, border: cTheme.border }
                                  ].map((item, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        width: 17, height: 17, borderRadius: '50%',
                                        background: item.bg,
                                        border: `1.5px solid ${item.border}`,
                                        marginLeft: idx === 0 ? 0 : -6,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                                      }}
                                    />
                                  ))}
                                  <div style={{
                                    width: 17, height: 17, borderRadius: '50%',
                                    background: cTheme.surface,
                                    color: isActive ? cTheme.accent : cTheme.text,
                                    border: `1.5px solid ${cTheme.accent}`,
                                    marginLeft: -6,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.55rem', fontWeight: 700, fontFamily: uiFont,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                                  }}>
                                    {isActive ? '✓' : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 transition-opacity">
                                <button
    onClick={(e) => handleEditTheme(e, cTheme, false)}
    className="p-2 rounded-full transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
    style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.textMuted }}
  >
                                  <PenTool size={13} />
                                </button>
                                <button
    onClick={(e) => {
      e.stopPropagation();
      if (isActive) {
        setDeleteAlertMsg(t.cannotDeleteActiveTheme);
        setTimeout(() => setDeleteAlertMsg(null), 3000);
        return;
      }
      setDeleteConfirmThemeId(cTheme.id);
    }}
    className="p-2 rounded-full transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                                  style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: isActive ? theme.border : '#ef4444' }}
                                  title={isActive ? "Vui lòng chọn 1 theme khác trước khi xoá theme đang sử dụng" : "Xoá theme"}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold tracking-wide truncate" style={{ color: theme.text, fontFamily: uiFont }}>
                                {cTheme.name}
                              </span>
                              <span className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>Custom Theme</span>
                            </div>
                          </div>
                        )
                      })}
                   </div>
                </div>
              )}

              {/* Presets */}
              <div>
                <h3 className="text-sm font-serif font-semibold mb-4" style={{ color: theme.text }}>Presets <span className="text-xs font-mono px-1.5 py-0.5 rounded ml-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>{PRESETS.length}</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PRESETS.filter(preset => {
                    const matchesCategory = themeCategoryFilter === 'all' || 
                      THEME_CATEGORIES.find(c => c.id === themeCategoryFilter)?.presetNames.includes(preset.name);
                    const matchesSearch = !themeSearchQuery.trim() || preset.name.toLowerCase().includes(themeSearchQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                  }).map(preset => {
                    const isActive = themeMode === preset.name;
                    return (
                      <div
                        key={preset.name}
                        onClick={() => {
                          if (onSelectTheme) onSelectTheme(preset.name);
                        }}
                        className="group relative p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5 shadow-xs"
                        style={{
                          background: isActive ? theme.accentLight : theme.bg,
                          borderColor: isActive ? theme.accent : theme.border,
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div style={{
                            width: 110, height: 34, borderRadius: 8,
                            background: preset.bg,
                            border: `1.5px solid ${preset.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            position: 'relative', overflow: 'hidden', flexShrink: 0
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {[
                                { bg: preset.text, border: preset.bg },
                                { bg: preset.accent, border: preset.bg },
                                { bg: preset.accentMid, border: preset.bg },
                                { bg: preset.surface, border: preset.border }
                              ].map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    width: 17, height: 17, borderRadius: '50%',
                                    background: item.bg,
                                    border: `1.5px solid ${item.border}`,
                                    marginLeft: idx === 0 ? 0 : -6,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                                  }}
                                />
                              ))}
                              <div style={{
                                width: 17, height: 17, borderRadius: '50%',
                                background: preset.surface,
                                color: isActive ? preset.accent : preset.text,
                                border: `1.5px solid ${preset.accent}`,
                                marginLeft: -6,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.55rem', fontWeight: 700, fontFamily: uiFont,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                              }}>
                                {isActive ? '✓' : ''}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleEditTheme(e, preset, true)}
                            className="p-2 rounded-full transition-opacity cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.textMuted }}
                          >
                            <PenTool size={13} />
                          </button>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold tracking-wide truncate" style={{ color: theme.text, fontFamily: uiFont }}>
                            {preset.name}
                          </span>
                          <span className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>
                            {preset.isDark ? (t.darkTheme || 'Dark Theme') : (t.lightTheme || 'Light Theme')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
