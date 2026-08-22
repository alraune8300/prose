import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, Upload, Trash2, X, Maximize2, Copy, 
  ArrowRight, Search, Palette, Link2, 
  ZoomIn, ZoomOut, RotateCcw, Sparkles
} from 'lucide-react';
import type { ThemeColors } from './types';
import type { Lang } from './i18n';
import type { Dict } from './i18n';
import { 
  MoodboardItem, 
  getAllMoodboardItemsFromDB, 
  saveMoodboardItemToDB, 
  deleteMoodboardItemFromDB 
} from './db';

interface MoodboardDrawerProps {
  theme: ThemeColors;
  uiFont: string;
  docFont: string;
  lang: Lang;
  t: Dict;
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  onInsertImageToEditor: (imageUrl: string, title?: string) => void;
  showToast: (msg: string) => void;
}

// Sample default inspiration moodboard items if empty
const DEFAULT_INSPIRATION: Array<{ title: string; url: string; palette: string[] }> = [
  {
    title: 'Vintage Writing Desk',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80',
    palette: ['#4a3728', '#8b5a2b', '#d2b48c', '#f5f0eb'],
  },
  {
    title: 'Misty Forest Morning',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    palette: ['#1c2826', '#2d4739', '#5c8065', '#9ab89e'],
  },
  {
    title: 'Classic Library Archive',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=80',
    palette: ['#2c1810', '#63372c', '#a76d47', '#dfb892'],
  },
];

export default function MoodboardDrawer({
  theme,
  uiFont,
  lang,
  t,
  isOpen,
  onClose,
  projectId,
  onInsertImageToEditor,
  showToast,
}: MoodboardDrawerProps) {
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedLightboxItem, setSelectedLightboxItem] = useState<MoodboardItem | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(100);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [urlTitleValue, setUrlTitleValue] = useState('');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Load items from IndexedDB
  const loadItems = async () => {
    setIsLoading(true);
    try {
      const dbItems = await getAllMoodboardItemsFromDB(projectId);
      if (dbItems.length === 0) {
        // Seed initial items if empty
        const initialItems: MoodboardItem[] = DEFAULT_INSPIRATION.map((item, idx) => ({
          id: `seed_${Date.now()}_${idx}`,
          projectId,
          title: item.title,
          dataUrl: item.url,
          palette: item.palette,
          createdAt: new Date().toISOString(),
        }));
        for (const it of initialItems) {
          await saveMoodboardItemToDB(it);
        }
        setItems(initialItems);
      } else {
        setItems(dbItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      console.warn('Error loading moodboard items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, projectId]);

  // Extract simple dominant color palette from image dataURL / image
  const extractSimplePalette = (imgSrc: string): Promise<string[]> => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(['#333333', '#666666', '#999999', '#cccccc']);
            ctx.drawImage(img, 0, 0, 40, 40);
            const data = ctx.getImageData(0, 0, 40, 40).data;
            const colors: string[] = [];
            const step = Math.floor(data.length / 16);
            for (let i = 0; i < data.length && colors.length < 4; i += step) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
              if (!colors.includes(hex)) colors.push(hex);
            }
            resolve(colors.length > 0 ? colors : ['#2c3e50', '#7f8c8d', '#bdc3c7', '#ecf0f1']);
          } catch {
            resolve(['#2c3e50', '#7f8c8d', '#bdc3c7', '#ecf0f1']);
          }
        };
        img.onerror = () => resolve(['#333333', '#666666', '#999999']);
        img.src = imgSrc;
      } catch {
        resolve(['#333333', '#666666', '#999999']);
      }
    });
  };

  // Handle file uploads
  const handleFilesUpload = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast(lang === 'vi' ? 'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP, GIF, SVG)' : 'Please select valid image files.');
      return;
    }

    for (const file of validFiles) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        const palette = await extractSimplePalette(dataUrl);
        const newItem: MoodboardItem = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          projectId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          dataUrl,
          palette,
          createdAt: new Date().toISOString(),
        };

        await saveMoodboardItemToDB(newItem);
        setItems(prev => [newItem, ...prev]);
        showToast(lang === 'vi' ? `Đã thêm ảnh: ${newItem.title}` : `Added image: ${newItem.title}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL Add
  const handleAddUrlImage = async () => {
    const url = urlInputValue.trim();
    if (!url) return;
    const title = urlTitleValue.trim() || 'Visual Reference';
    const palette = await extractSimplePalette(url);
    const newItem: MoodboardItem = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      title,
      dataUrl: url,
      palette,
      createdAt: new Date().toISOString(),
    };

    await saveMoodboardItemToDB(newItem);
    setItems(prev => [newItem, ...prev]);
    setUrlInputValue('');
    setUrlTitleValue('');
    setShowUrlInput(false);
    showToast(lang === 'vi' ? 'Đã thêm ảnh từ liên kết!' : 'Added image from URL!');
  };

  // Delete item
  const handleDeleteItem = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await deleteMoodboardItemFromDB(id);
    setItems(prev => prev.filter(it => it.id !== id));
    if (selectedLightboxItem?.id === id) {
      setSelectedLightboxItem(null);
    }
    showToast(lang === 'vi' ? 'Đã xóa ảnh khỏi moodboard' : 'Removed image from moodboard');
  };

  // Copy Markdown
  const handleCopyMarkdown = (item: MoodboardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const md = `![${item.title}](${item.dataUrl})`;
    navigator.clipboard.writeText(md);
    showToast(t.imageCopied || 'Markdown copied to clipboard!');
  };

  // Insert to Editor
  const handleInsertToDraft = (item: MoodboardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onInsertImageToEditor(item.dataUrl, item.title);
    showToast(t.imageInserted || 'Image inserted into document!');
  };

  // Copy hex color
  const handleCopyColor = (hex: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
    showToast(`${hex} copied!`);
  };

  // Save renamed title
  const handleSaveRename = async (id: string) => {
    if (!editingTitleValue.trim()) {
      setEditingTitleId(null);
      return;
    }
    const item = items.find(it => it.id === id);
    if (item) {
      const updated = { ...item, title: editingTitleValue.trim() };
      await saveMoodboardItemToDB(updated);
      setItems(prev => prev.map(it => it.id === id ? updated : it));
    }
    setEditingTitleId(null);
  };

  // Drag-and-drop listener on the window while drawer is open
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      // Only process paste if not focused on an input/textarea
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const imageFiles = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          e.preventDefault();
          handleFilesUpload(imageFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const filteredItems = items.filter(it => 
    it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    it.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // All distinct color swatches extracted from active moodboard
  const allColorSwatches = Array.from(
    new Set(items.flatMap(it => it.palette || []))
  ).slice(0, 14);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay on mobile/smaller screens */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity duration-300 md:hidden"
        onClick={onClose}
      />

      {/* Slide-out Drawer from left */}
      <aside
        ref={drawerRef}
        className="fixed top-0 left-0 bottom-0 z-50 w-full sm:w-[400px] md:w-[420px] lg:w-[460px] h-full flex flex-col shadow-2xl border-r transition-transform duration-300 ease-out select-none"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text,
          fontFamily: `'${uiFont}', sans-serif`,
        }}
      >
        {/* Drawer Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: theme.borderFaint, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
        >
          <div className="flex items-center gap-2.5">
            <div 
              className="p-1.5 rounded-lg flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: theme.accent }}
            >
              <ImageIcon size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm leading-none">
                  {t.mediaDrawer || 'Visual Media & Moodboard'}
                </h2>
                <span 
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: theme.accentLight, color: theme.accent }}
                >
                  {items.length}
                </span>
              </div>
              <p className="text-[11px] opacity-60 mt-0.5 leading-none">
                {lang === 'vi' ? 'Kéo thả ảnh vào trang viết hoặc lưu palette' : 'Drag images to editor or explore palettes'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ color: theme.textMuted }}
            title={t.close || 'Close'}
          >
            <X size={17} />
          </button>
        </div>

        {/* Quick Actions & Search Bar */}
        <div className="px-4 pt-3 pb-2 flex flex-col gap-2 shrink-0 border-b" style={{ borderColor: theme.borderFaint }}>
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                placeholder={lang === 'vi' ? 'Tìm ảnh theo tên...' : 'Search media by title...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none bg-transparent transition-all focus:border-blue-500"
                style={{ borderColor: theme.borderFaint, color: theme.text }}
              />
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-xs hover:opacity-90 active:scale-95 transition-all shrink-0"
              style={{ backgroundColor: theme.accent }}
              title={t.uploadImages || 'Upload Images'}
            >
              <Upload size={13} />
              <span className="hidden sm:inline">{lang === 'vi' ? 'Tải ảnh' : 'Upload'}</span>
            </button>

            {/* Add URL Button */}
            <button
              type="button"
              onClick={() => setShowUrlInput(v => !v)}
              className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
              style={{ borderColor: theme.borderFaint, color: theme.text }}
              title={t.pasteImageUrl || 'Add by Image URL'}
            >
              <Link2 size={15} />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Collapsible Add Image URL input */}
          {showUrlInput && (
            <div className="p-2.5 rounded-xl border flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200" style={{ borderColor: theme.borderFaint, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <input
                type="text"
                placeholder={lang === 'vi' ? 'Dán link hình ảnh (https://...)' : 'Paste image URL (https://...)'}
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                className="w-full px-2.5 py-1 text-xs rounded border outline-none bg-transparent"
                style={{ borderColor: theme.borderFaint, color: theme.text }}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={lang === 'vi' ? 'Tiêu đề ảnh (tùy chọn)' : 'Image title (optional)'}
                  value={urlTitleValue}
                  onChange={(e) => setUrlTitleValue(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded border outline-none bg-transparent"
                  style={{ borderColor: theme.borderFaint, color: theme.text }}
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  disabled={!urlInputValue.trim()}
                  className="px-3 py-1 rounded text-xs font-medium text-white disabled:opacity-40 transition-all"
                  style={{ backgroundColor: theme.accent }}
                >
                  {t.add || 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* Color Palette Swatches Bar */}
          {allColorSwatches.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-70">
                <Palette size={12} style={{ color: theme.accent }} />
                <span>{t.colorPalette || 'Palette'}</span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] py-0.5 kgv-scroll">
                {allColorSwatches.map((hex, idx) => (
                  <button
                    key={`${hex}_${idx}`}
                    type="button"
                    onClick={(e) => handleCopyColor(hex, e)}
                    className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20 shrink-0 transition-transform hover:scale-125 relative group"
                    style={{ backgroundColor: hex }}
                    title={`Click to copy: ${hex}`}
                  >
                    {copiedColor === hex && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-[8px]">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drag & Drop Upload Zone / Grid Area */}
        <div
          className={`flex-1 overflow-y-auto p-3 kgv-scroll flex flex-col relative ${
            isDraggingOver ? 'ring-2 ring-blue-500/50 ring-inset bg-blue-500/5' : ''
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFilesUpload(e.dataTransfer.files);
            }
          }}
        >
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 text-xs gap-2">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>{t.loading || 'Loading moodboard...'}</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed my-auto" style={{ borderColor: theme.borderFaint }}>
              <div className="p-3 rounded-full bg-black/5 dark:bg-white/5 mb-3" style={{ color: theme.accent }}>
                <ImageIcon size={28} />
              </div>
              <h3 className="font-semibold text-xs mb-1">{t.noMediaLoaded || 'No media items yet'}</h3>
              <p className="text-[11px] opacity-60 max-w-xs mb-4">
                {t.noMediaDesc || 'Drag & drop image files from your computer or paste from clipboard (Ctrl+V) to build your visual moodboard.'}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white shadow-xs"
                style={{ backgroundColor: theme.accent }}
              >
                {t.uploadImages || 'Upload Images'}
              </button>
            </div>
          ) : (
            /* 2-Column Mosaic Grid */
            <div className="grid grid-cols-2 gap-2.5 auto-rows-max pb-12">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', `\n![${item.title}](${item.dataUrl})\n`);
                    e.dataTransfer.setData('text/uri-list', item.dataUrl);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => {
                    setSelectedLightboxItem(item);
                    setLightboxZoom(100);
                  }}
                  className="group relative flex flex-col rounded-xl overflow-hidden border shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer select-none"
                  style={{
                    borderColor: theme.borderFaint,
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Thumbnail Image */}
                  <div className="relative w-full aspect-4/3 overflow-hidden bg-black/5 dark:bg-white/5">
                    <img
                      src={item.dataUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Floating Hover Action Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedLightboxItem(item); }}
                          className="p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                          title={lang === 'vi' ? 'Xem phóng to' : 'Lightbox View'}
                        >
                          <Maximize2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="p-1 rounded bg-black/60 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                          title={t.deleteImage || 'Delete'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Quick Insert / Copy Buttons */}
                      <div className="flex items-center gap-1.5 w-full">
                        <button
                          type="button"
                          onClick={(e) => handleInsertToDraft(item, e)}
                          className="flex-1 py-1 px-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium flex items-center justify-center gap-1 transition-all shadow-xs"
                          title={t.insertImageToEditor || 'Insert into Editor'}
                        >
                          <ArrowRight size={10} />
                          <span>{lang === 'vi' ? 'Chèn bài' : 'Insert'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopyMarkdown(item, e)}
                          className="p-1 rounded bg-black/60 text-white hover:bg-black/80 text-[10px]"
                          title={t.copyMarkdownImage || 'Copy Markdown'}
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Meta: Title & Palettes */}
                  <div className="p-2 flex flex-col gap-1">
                    {editingTitleId === item.id ? (
                      <input
                        type="text"
                        value={editingTitleValue}
                        onChange={(e) => setEditingTitleValue(e.target.value)}
                        onBlur={() => handleSaveRename(item.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(item.id); }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-[11px] font-semibold bg-transparent border-b outline-none px-0.5"
                        style={{ borderColor: theme.accent, color: theme.text }}
                      />
                    ) : (
                      <div 
                        className="text-[11px] font-medium truncate opacity-85 hover:opacity-100"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(item.id);
                          setEditingTitleValue(item.title);
                        }}
                        title={`${item.title} (Double click to rename)`}
                      >
                        {item.title}
                      </div>
                    )}

                    {/* Color Swatch Dots */}
                    {item.palette && item.palette.length > 0 && (
                      <div className="flex items-center gap-1">
                        {item.palette.slice(0, 4).map((c, i) => (
                          <div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Bottom Footer helper */}
        <div 
          className="px-4 py-2 border-t text-[11px] flex items-center justify-between opacity-65 shrink-0"
          style={{ borderColor: theme.borderFaint }}
        >
          <span className="truncate">
            {lang === 'vi' ? 'Mẹo: Kéo ảnh trực tiếp vào bài viết để chèn' : 'Tip: Drag any image card into the document to insert'}
          </span>
          <Sparkles size={13} style={{ color: theme.accent }} />
        </div>
      </aside>

      {/* Quick Lightbox Modal */}
      {selectedLightboxItem && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setSelectedLightboxItem(null)}
        >
          {/* Lightbox Header Bar */}
          <div 
            className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-blue-400" />
              <span className="font-semibold text-sm drop-shadow">{selectedLightboxItem.title}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-black/50 backdrop-blur-sm rounded-lg p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setLightboxZoom(z => Math.max(50, z - 25))}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="px-2 text-xs font-mono">{lightboxZoom}%</span>
                <button
                  type="button"
                  onClick={() => setLightboxZoom(z => Math.min(300, z + 25))}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxZoom(100)}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors text-white opacity-75 hover:opacity-100"
                  title="Reset 100%"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              {/* Insert to Editor */}
              <button
                type="button"
                onClick={() => {
                  onInsertImageToEditor(selectedLightboxItem.dataUrl, selectedLightboxItem.title);
                  showToast(t.imageInserted || 'Image inserted into document!');
                  setSelectedLightboxItem(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-md transition-all"
              >
                <ArrowRight size={13} />
                <span>{lang === 'vi' ? 'Chèn vào văn bản' : 'Insert to Editor'}</span>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setSelectedLightboxItem(null)}
                className="p-1.5 rounded-lg bg-black/50 hover:bg-white/20 text-white transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Centered Image with smooth scale */}
          <div 
            className="relative max-w-4xl max-h-[80vh] flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedLightboxItem.dataUrl}
              alt={selectedLightboxItem.title}
              style={{ transform: `scale(${lightboxZoom / 100})`, transition: 'transform 0.2s ease' }}
              className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Bottom Palette Swatches in Lightbox */}
          {selectedLightboxItem.palette && selectedLightboxItem.palette.length > 0 && (
            <div 
              className="absolute bottom-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/15"
              onClick={(e) => e.stopPropagation()}
            >
              <Palette size={13} className="text-amber-400" />
              <span className="text-xs text-white/75">{lang === 'vi' ? 'Bảng màu:' : 'Palette:'}</span>
              <div className="flex items-center gap-1.5">
                {selectedLightboxItem.palette.map((hex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => handleCopyColor(hex, e)}
                    className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-125"
                    style={{ backgroundColor: hex }}
                    title={`Copy ${hex}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
