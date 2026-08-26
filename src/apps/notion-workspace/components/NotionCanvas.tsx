import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { FloatingMenu, BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { DatabaseExtension } from "../extensions/DatabaseBlock";
import { ToggleList } from "../extensions/ToggleList";
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { NotionPage } from '../../../types';
import { ThemeColors } from '../../../theme';
import { LucideIconRenderer } from './LucideIconRenderer';
import { NotionIconPicker } from './NotionIconPicker';
import { NotionDragHandle } from '../../../NotionDragHandle';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { NotionCoverPicker } from './NotionCoverPicker';
import { Plus, X, Heading1, Heading2, Heading3, CheckSquare, ChevronRight, Quote, Table, Columns3, Bold, Italic, Strikethrough, Lock, Unlock, Minimize2, Maximize2 } from 'lucide-react';
import { getNotionI18n } from '../i18n';
import { Lang } from '../../../i18n';

interface Props {
  page: NotionPage;
  theme: ThemeColors;
  docFont?: string;
  lang?: Lang;
  sidebarOpen?: boolean;
  onChange: (updates: Partial<NotionPage>) => void;
  onSetDocFont?: (font: string) => void;
  onOpenGoogleFonts?: () => void;
}

export function NotionCanvas({ page, theme, docFont = 'Inter', lang = 'en', onChange }: Props) {
  const [properties, setProperties] = useState<Record<string, string>>(page.properties || {});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = getNotionI18n(lang);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          codeBlock: false,
          code: false,
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Typography,
        ToggleList,
        DatabaseExtension,
        Placeholder.configure({
          placeholder: t.pressSlash,
          emptyEditorClass: 'is-editor-empty',
        })
      ],
      content: page.content || '<p></p>',
      onUpdate: ({ editor: currentEditor }) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
          onChange({ content: currentEditor.getHTML() });
        }, 300);
      },
      editorProps: {
        attributes: {
          class: 'notion-editor-content prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-full min-h-[50vh] cursor-text'
        }
      }
    },
    [page.id]
  );

  useEffect(() => {
    setProperties(page.properties || {});
  }, [page.properties]);

  useEffect(() => {
    if (editor && page.content !== undefined) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== page.content && page.content !== '') {
        editor.commands.setContent(page.content);
      }
    }
  }, [page.id, editor]);

  const updateProp = (key: string, value: string) => {
    const next = { ...properties, [key]: value };
    setProperties(next);
    onChange({ properties: next });
  };

  const removeProp = (key: string) => {
    const next = { ...properties };
    delete next[key];
    setProperties(next);
    onChange({ properties: next });
  };

  const executeCommand = (command: () => void) => {
    if (editor) {
      const { state } = editor;
      const { $anchor } = state.selection;

      // If the command was triggered from the slash menu, remove the slash
      if ($anchor.parent.textContent === '/') {
        editor.chain().deleteRange({ from: $anchor.pos - 1, to: $anchor.pos }).run();
      }

      command();
      editor.view.focus();
    }
  };

  const [fullWidth, setFullWidth] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [addingProperty, setAddingProperty] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  useEffect(() => {
    if (editor) editor.setEditable(!isLocked);
  }, [isLocked, editor]);

  const getFontFamily = () => {
    if (docFont) return `"${docFont}", sans-serif`;
    return 'var(--kgv-ui-font, var(--font-sans, sans-serif))';
  };

  return (
    <div
      className="w-full h-full flex flex-col notion-page-canvas overflow-y-auto kgv-scroll"
      style={{ fontFamily: getFontFamily() }}
    >
      {/* Cover Engine */}
      {page.coverUrl && (
        <div
          className="w-full h-48 sm:h-64 relative group shrink-0 overflow-hidden select-none"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {page.coverUrl.startsWith('linear-gradient') || page.coverUrl.startsWith('radial-gradient') || page.coverUrl.startsWith('conic-gradient') ? (
            <div className="w-full h-full" style={{ background: page.coverUrl }} />
          ) : (
            <img
              src={page.coverUrl}
              className="w-full h-full object-cover"
              alt="Page Cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to a clean gradient if URL fails to load
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }
              }}
            />
          )}
          {!isLocked && (
            <div className="absolute bottom-3 right-4 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 sm:opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCoverPicker(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl shadow-lg border bg-black/75 hover:bg-black/90 text-white transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <LucideIconRenderer name="Image" size={13} />
                <span>{t.changeCover || 'Change cover'}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ coverUrl: '' });
                }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl shadow-lg border bg-black/75 hover:bg-red-600/90 text-white/90 hover:text-white transition-all flex items-center gap-1 cursor-pointer backdrop-blur-xs"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                title={t.removeCover || 'Remove cover'}
              >
                <LucideIconRenderer name="Trash2" size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cover Picker Modal */}
      {showCoverPicker && (
        <NotionCoverPicker
          theme={theme}
          lang={lang}
          currentCover={page.coverUrl}
          onSelect={(url) => {
            onChange({ coverUrl: url || '' });
            setShowCoverPicker(false);
          }}
          onClose={() => setShowCoverPicker(false)}
        />
      )}

      <div
        className={`w-full mx-auto px-6 sm:px-12 pb-32 ${
          fullWidth ? 'max-w-none px-8 sm:px-16' : 'max-w-3xl'
        } ${!page.coverUrl ? 'pt-6 sm:pt-10' : 'pt-3 sm:pt-4'}`}
      >
        {/* Page Header Action Bar */}
        <div
          className="flex items-center justify-end gap-1.5 mb-3 text-xs font-medium relative z-30"
          style={{ color: 'var(--text-muted)' }}
        >
          {!page.coverUrl && !isLocked && (
            <button
              onClick={() => setShowCoverPicker(true)}
              className="px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer text-blue-500 font-medium"
              title={t.addCover || 'Add Cover'}
            >
              <LucideIconRenderer name="Image" size={13} />
              <span>{t.addCover || 'Add Cover'}</span>
            </button>
          )}

          <button
            onClick={() => setFullWidth(!fullWidth)}
            className="px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            title={fullWidth ? t.centerWidth : t.fullWidth}
          >
            {fullWidth ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{fullWidth ? t.centerWidth : t.fullWidth}</span>
          </button>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className="px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            title={isLocked ? t.unlockPage : t.lockPage}
          >
            {isLocked ? <Unlock size={13} /> : <Lock size={13} />}
            <span>{isLocked ? t.unlockPage : t.lockPage}</span>
          </button>
        </div>

        {/* Actions (Add Icon / Add Cover) */}
        {!isLocked && (!page.icon || !page.coverUrl) && (
          <div
            className="flex items-center gap-2 text-xs sm:text-sm transition-opacity my-2 font-medium select-none relative z-20"
            style={{ color: 'var(--text-muted)' }}
          >
            {!page.icon && (
              <button
                onClick={() => onChange({ icon: 'FileText' })}
                className="px-2.5 py-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-blue-500 cursor-pointer flex items-center gap-1.5"
              >
                <LucideIconRenderer name="Smile" size={14} />
                <span>{t.addIcon}</span>
              </button>
            )}
            {!page.coverUrl && (
              <button
                onClick={() => setShowCoverPicker(true)}
                className="px-2.5 py-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-blue-500 cursor-pointer flex items-center gap-1.5"
              >
                <LucideIconRenderer name="Image" size={14} />
                <span>{t.addCover}</span>
              </button>
            )}
          </div>
        )}

        {/* Icon & Title Group */}
        <div className="relative z-10">
          {/* Icon */}
          {page.icon && (
            <div className={`relative w-fit mb-3 ${page.coverUrl ? '-mt-12 sm:-mt-16 z-20' : ''}`}>
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl cursor-pointer group hover:scale-105 transition-all shadow-md border"
                onClick={() => !isLocked && setShowIconPicker(!showIconPicker)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <LucideIconRenderer name={page.icon} size={36} strokeWidth={1.5} />
              </div>
              {showIconPicker && !isLocked && (
                <div className="absolute top-full left-0 z-50 mt-2">
                  <NotionIconPicker
                    onSelect={(icon) => {
                      onChange({ icon });
                      setShowIconPicker(false);
                    }}
                    onClose={() => setShowIconPicker(false)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <textarea
            value={page.title || ''}
            onChange={(e) => {
              onChange({ title: e.target.value });
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder={t.untitled}
            disabled={isLocked}
            rows={1}
            className="w-full text-3xl sm:text-4xl font-bold bg-transparent outline-none mb-6 resize-none overflow-hidden"
            style={{ color: 'var(--text-primary)', minHeight: '1.2em' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>

        {/* Properties Grid */}
        <div
          className="flex flex-col gap-2 mb-8 border-b pb-6 select-none"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {Object.entries(properties).map(([key, value]) => (
            <div key={key} className="flex items-start gap-4 group min-h-[28px] py-1">
              <span
                className="w-36 shrink-0 flex items-center gap-1.5 text-xs font-medium pt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {key === 'Status' ? (
                  <LucideIconRenderer name="CheckSquare" size={14} />
                ) : key === 'Tags' ? (
                  <LucideIconRenderer name="Tag" size={14} />
                ) : (
                  <LucideIconRenderer name="AlignLeft" size={14} />
                )}
                {key}
              </span>
              <div className="flex items-center gap-2 flex-1">
                {key === 'Status' ? (
                  <select
                    value={value}
                    onChange={(e) => updateProp(key, e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border outline-none cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="Not Started">{t.notStarted}</option>
                    <option value="In Progress">{t.inProgress}</option>
                    <option value="Done">{t.done}</option>
                  </select>
                ) : key === 'Tags' ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {value
                      ? value
                          .split(',')
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-full border font-medium"
                              style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--text-primary)'
                              }}
                            >
                              {tag}
                            </span>
                          ))
                      : null}
                    <input
                      className="bg-transparent outline-none text-xs flex-1 min-w-[100px]"
                      placeholder="Add tags..."
                      value={value}
                      onChange={(e) => updateProp(key, e.target.value)}
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                ) : (
                  <input
                    value={value}
                    onChange={(e) => updateProp(key, e.target.value)}
                    className="bg-transparent outline-none flex-1 text-xs sm:text-sm rounded-lg px-2 py-1"
                    placeholder="Empty"
                    style={{ color: 'var(--text-primary)' }}
                  />
                )}
                <button
                  onClick={() => removeProp(key)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all cursor-pointer"
                  title={t.delete}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Add Property Button */}
          <div className="flex items-center gap-4 mt-2">
            {addingProperty ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder={t.propertyName}
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (newPropName.trim() && !properties[newPropName.trim()]) {
                        updateProp(newPropName.trim(), '');
                      }
                      setAddingProperty(false);
                      setNewPropName('');
                    } else if (e.key === 'Escape') {
                      setAddingProperty(false);
                      setNewPropName('');
                    }
                  }}
                  onBlur={() => {
                    setAddingProperty(false);
                    setNewPropName('');
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg outline-none border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingProperty(true)}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                <Plus size={14} /> {t.addProperty}
              </button>
            )}
          </div>
        </div>

        {/* Editor Content */}
        <div className="w-full relative notion-editor-wrapper">
          <ErrorBoundary>
            <NotionDragHandle editor={editor} theme={theme} />
            <EditorContent editor={editor} />

            {/* Slash Commands Floating Menu */}
            {editor && (
              <FloatingMenu
                editor={editor}
                shouldShow={({ state }) => {
                  if (!state || !state.selection) return false;
                  const { selection } = state;
                  const { $anchor, empty } = selection as any;
                  if (!empty || !$anchor || $anchor.depth < 1) return false;
                  return $anchor.parent?.textContent === '/';
                }}
              >
                <div
                  className="flex flex-col w-72 max-h-[60vh] overflow-y-auto rounded-2xl shadow-2xl border p-1.5 select-none"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                >
                  <div
                    className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.basicBlocks}
                  </div>
                  <button
                    onClick={() => executeCommand(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Heading1 size={17} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{t.heading1}</span>
                      <span className="text-[10px] opacity-60">Big section heading</span>
                    </div>
                  </button>
                  <button
                    onClick={() => executeCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Heading2 size={17} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{t.heading2}</span>
                      <span className="text-[10px] opacity-60">Medium section heading</span>
                    </div>
                  </button>
                  <button
                    onClick={() => executeCommand(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Heading3 size={17} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{t.heading3}</span>
                      <span className="text-[10px] opacity-60">Small section heading</span>
                    </div>
                  </button>
                  <button
                    onClick={() => executeCommand(() => editor.chain().focus().toggleTaskList().run())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <CheckSquare size={17} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{t.todoList}</span>
                      <span className="text-[10px] opacity-60">Track tasks</span>
                    </div>
                  </button>
                  <button
                    onClick={() => executeCommand(() => editor.chain().focus().toggleBulletList().run())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <LucideIconRenderer
                      name="List"
                      size={17}
                      strokeWidth={1.5}
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{t.bulletedList}</span>
                      <span className="text-[10px] opacity-60">Simple bullet list</span>
                    </div>
                  </button>
                  <button
                    onClick={() => executeCommand(() => editor.chain().focus().toggleOrderedList().run())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <LucideIconRenderer
                      name="ListOrdered"
                      size={17}
                      strokeWidth={1.5}
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{t.numberedList}</span>
                      <span className="text-[10px] opacity-60">Numbered sequence</span>
                    </div>
                  </button>
                  <button
                    onClick={() => executeCommand(() => editor.chain().focus().toggleToggleList().run())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <ChevronRight size={17} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{t.toggleList}</span>
                      <span className="text-[10px] opacity-60">Collapsible list</span>
                    </div>
                  </button>

                  <div
                    className="px-3 py-1.5 mt-2 text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.advanced}
                  </div>
                  <button
                    onClick={() => executeCommand(() => editor.chain().focus().toggleBlockquote().run())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Quote size={17} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{t.quote}</span>
                      <span className="text-[10px] opacity-60">Capture a quote</span>
                    </div>
                  </button>

                  <div
                    className="px-3 py-1.5 mt-2 text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.database}
                  </div>
                  <button
                    onClick={() => executeCommand(() => editor.chain().focus().setDatabase('table').run())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Table size={17} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{t.tableView}</span>
                      <span className="text-[10px] opacity-60">Data in customizable table</span>
                    </div>
                  </button>
                  <button
                    onClick={() => executeCommand(() => editor.chain().focus().setDatabase('board').run())}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Columns3 size={17} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{t.boardView}</span>
                      <span className="text-[10px] opacity-60">Kanban cards board</span>
                    </div>
                  </button>
                </div>
              </FloatingMenu>
            )}

            {/* Inline Selection Bubble Menu */}
            {editor && !isLocked && (
              <BubbleMenu
                editor={editor}
                className="flex items-center gap-1 p-1 rounded-2xl shadow-2xl border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                    editor.isActive('bold') ? 'bg-black/10 dark:bg-white/10 font-bold' : ''
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold size={14} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                    editor.isActive('italic') ? 'bg-black/10 dark:bg-white/10' : ''
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic size={14} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                    editor.isActive('strike') ? 'bg-black/10 dark:bg-white/10' : ''
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough size={14} strokeWidth={2.5} />
                </button>
              </BubbleMenu>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
