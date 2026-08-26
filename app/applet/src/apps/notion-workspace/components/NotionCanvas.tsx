import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { NotionPage } from '../types';
import { ThemeColors } from '../../../types';
import { LucideIconRenderer } from './LucideIconRenderer';
import { NotionIconPicker } from './NotionIconPicker';
import { NotionCoverPicker } from './NotionCoverPicker';
import { NotionDragHandle } from '../../../NotionDragHandle';
import { ChevronDown, Plus, X, Image as ImageIcon, Smile, Trash2 } from 'lucide-react';
import { getNotionI18n } from '../i18n';
import { Lang } from '../../../i18n';

import { Callout } from '../extensions/Callout';
import { ToggleList } from '../extensions/ToggleList';
import { SlashCommandMenu } from './SlashCommandMenu';
import { NotionBubbleMenu } from './NotionBubbleMenu';

interface Props {
  page: NotionPage;
  theme?: ThemeColors;
  docFont?: string;
  lang?: Lang;
  sidebarOpen?: boolean;
  onChange: (updates: Partial<NotionPage>) => void;
}

export function NotionCanvas({
  page,
  theme,
  docFont,
  lang = 'en',
  sidebarOpen,
  onChange
}: Props) {
  const [properties, setProperties] = useState<Record<string, any>>(page.properties || {});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const saveTimeout = useRef<any>(null);

  const t = getNotionI18n(lang);

  const [slashState, setSlashState] = useState<{
    show: boolean;
    query: string;
    x: number;
    y: number;
    range: any;
  }>({ show: false, query: '', x: 0, y: 0, range: null });

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlock,
      Highlight,
      Link.configure({ openOnClick: false }),
      Callout,
      ToggleList,
      Placeholder.configure({
        placeholder: t.slashPrompt
      })
    ],
    content: (() => {
      try {
        if (typeof page.content === 'string' && (page.content.startsWith('{') || page.content.startsWith('['))) {
          return JSON.parse(page.content);
        }
      } catch (e) {}
      return page.content || '';
    })(),
    onUpdate: ({ editor }) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        onChange({ content: JSON.stringify(editor.getJSON()) });
      }, 400);

      // Slash command detection
      const { selection } = editor.state;
      const { $head } = selection;
      const parent = $head.parent;
      if (parent.type.name === 'paragraph') {
        const textBefore = parent.textBetween(0, $head.parentOffset);
        const match = textBefore.match(/(^\s*)\/([a-zA-Z0-9-]*)$/);
        if (match) {
          const query = match[2];
          const coords = editor.view.coordsAtPos($head.pos);
          const range = { from: $head.pos - query.length - 1, to: $head.pos };
          setSlashState({ show: true, query, x: coords.left, y: coords.bottom, range });
          return;
        }
      }
      setSlashState((s) => (s.show ? { ...s, show: false } : s));
    },
    onSelectionUpdate: ({ editor }) => {
      const { selection } = editor.state;
      const { $head } = selection;
      const parent = $head.parent;
      if (parent && parent.type.name === 'paragraph') {
        const textBefore = parent.textBetween(0, $head.parentOffset);
        const match = textBefore.match(/(^\s*)\/([a-zA-Z0-9-]*)$/);
        if (match) {
          const query = match[2];
          const coords = editor.view.coordsAtPos($head.pos);
          const range = { from: $head.pos - query.length - 1, to: $head.pos };
          setSlashState({ show: true, query, x: coords.left, y: coords.bottom, range });
          return;
        }
      }
      setSlashState((s) => (s.show ? { ...s, show: false } : s));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-full min-h-[50vh]'
      }
    }
  }, [page.id]);

  useEffect(() => {
    setProperties(page.properties || {});
  }, [page.properties]);

  const updateProp = (key: string, value: any) => {
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

  const currentCover = page.cover || page.coverUrl || null;

  return (
    <div
      className="w-full max-w-4xl mx-auto px-6 sm:px-12 md:px-20 pt-8 pb-32"
      style={{ fontFamily: docFont || 'inherit' }}
    >
      {/* Cover Image Banner */}
      {currentCover && (
        <div
          className="w-full h-56 sm:h-64 relative group -mt-8 mb-8 -mx-6 sm:-mx-12 md:-mx-20 rounded-b-2xl overflow-hidden border-b shadow-sm"
          style={{
            backgroundColor: 'var(--bg-secondary, #f3f4f6)',
            borderColor: 'var(--border-subtle, #e5e7eb)'
          }}
        >
          <img src={currentCover} className="w-full h-full object-cover" alt="Cover" />

          {/* Hover Controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              className="text-xs px-3 py-1.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-1.5 cursor-pointer border"
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                color: 'var(--text-primary, #111827)',
                borderColor: 'var(--border-subtle, #e5e7eb)'
              }}
              onClick={() => setShowCoverPicker(true)}
            >
              <ImageIcon size={13} />
              <span>{t.changeCover}</span>
            </button>

            <button
              className="text-xs px-3 py-1.5 rounded-xl font-medium shadow-md transition-all flex items-center gap-1.5 text-red-600 dark:text-red-400 cursor-pointer border hover:bg-red-50 dark:hover:bg-red-950/40"
              style={{
                backgroundColor: 'var(--bg-surface, #ffffff)',
                borderColor: 'var(--border-subtle, #e5e7eb)'
              }}
              onClick={() => onChange({ cover: null, coverUrl: null })}
            >
              <Trash2 size={13} />
              <span>{t.removeCover}</span>
            </button>
          </div>

          {/* Anchored Cover Picker Pop-up */}
          {showCoverPicker && (
            <div className="absolute bottom-12 right-3 z-50">
              <NotionCoverPicker
                currentCover={currentCover}
                onSelect={(url) => {
                  onChange({ cover: url, coverUrl: url });
                  setShowCoverPicker(false);
                }}
                onRemove={() => {
                  onChange({ cover: null, coverUrl: null });
                  setShowCoverPicker(false);
                }}
                onClose={() => setShowCoverPicker(false)}
                lang={lang}
              />
            </div>
          )}
        </div>
      )}

      {/* Page Actions Bar (Add Icon / Add Cover) */}
      <div className="relative">
        <div
          className="flex items-center gap-2 text-xs opacity-70 hover:opacity-100 transition-opacity mb-4"
          style={{ color: 'var(--text-muted, #6b7280)' }}
        >
          {!page.icon && (
            <button
              onClick={() => onChange({ icon: 'FileText' })}
              className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Smile size={14} />
              <span>{t.addIcon}</span>
            </button>
          )}

          {!currentCover && (
            <button
              onClick={() => setShowCoverPicker(true)}
              className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon size={14} />
              <span>{t.addCover}</span>
            </button>
          )}
        </div>

        {/* Floating Cover Picker if no cover currently */}
        {!currentCover && showCoverPicker && (
          <div className="absolute top-8 left-0 z-50">
            <NotionCoverPicker
              currentCover={null}
              onSelect={(url) => {
                onChange({ cover: url, coverUrl: url });
                setShowCoverPicker(false);
              }}
              onClose={() => setShowCoverPicker(false)}
              lang={lang}
            />
          </div>
        )}
      </div>

      {/* Page Icon */}
      {page.icon && (
        <div className="relative w-fit mb-4">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors border"
            onClick={() => setShowIconPicker(!showIconPicker)}
            style={{
              color: 'var(--text-primary, #111827)',
              borderColor: 'var(--border-subtle, #e5e7eb)'
            }}
            title={t.addIcon}
          >
            <LucideIconRenderer name={page.icon} size={36} strokeWidth={1.5} />
          </div>

          {showIconPicker && (
            <div className="absolute top-full left-0 z-50 mt-1">
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
      <input
        value={page.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder={t.untitled}
        className="w-full text-3xl sm:text-4xl md:text-5xl font-bold bg-transparent outline-none mb-6 tracking-tight placeholder:opacity-40"
        style={{ color: 'var(--text-primary, #111827)' }}
      />

      {/* Properties Grid */}
      <div
        className="flex flex-col gap-2 mb-8 border-b pb-5"
        style={{ borderColor: 'var(--border-subtle, #e5e7eb)' }}
      >
        {Object.entries(properties).map(([key, value]) => (
          <div key={key} className="flex items-center gap-3 group text-xs">
            <span
              className="w-28 shrink-0 flex items-center gap-1.5 font-medium"
              style={{ color: 'var(--text-muted, #6b7280)' }}
            >
              {key === 'Status' || key === 'status' ? (
                <LucideIconRenderer name="CheckSquare" size={14} />
              ) : key === 'Tags' || key === 'tags' ? (
                <LucideIconRenderer name="Tag" size={14} />
              ) : key === 'Date' || key === 'date' ? (
                <LucideIconRenderer name="Calendar" size={14} />
              ) : (
                <LucideIconRenderer name="AlignLeft" size={14} />
              )}
              <span>{key}</span>
            </span>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {key === 'Status' || key === 'status' ? (
                <select
                  value={value || 'Not Started'}
                  onChange={(e) => updateProp(key, e.target.value)}
                  className="text-xs px-2.5 py-1 rounded-xl border outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    borderColor: 'var(--border-subtle, #e5e7eb)',
                    color: 'var(--text-primary, #111827)'
                  }}
                >
                  <option value="Not Started">{t.notStarted}</option>
                  <option value="In Progress">{t.inProgress}</option>
                  <option value="Done">{t.done}</option>
                </select>
              ) : key === 'Tags' || key === 'tags' ? (
                <div className="flex items-center gap-1 flex-wrap flex-1">
                  {Array.isArray(value)
                    ? value.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded-lg border font-medium"
                          style={{
                            backgroundColor: 'var(--bg-secondary, #f3f4f6)',
                            borderColor: 'var(--border-subtle, #e5e7eb)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {tag}
                        </span>
                      ))
                    : typeof value === 'string' && value
                    ? value.split(',').map((tag) => (
                        <span
                          key={tag.trim()}
                          className="text-[11px] px-2 py-0.5 rounded-lg border font-medium"
                          style={{
                            backgroundColor: 'var(--bg-secondary, #f3f4f6)',
                            borderColor: 'var(--border-subtle, #e5e7eb)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {tag.trim()}
                        </span>
                      ))
                    : null}
                  <input
                    className="bg-transparent outline-none text-xs flex-1 min-w-[120px]"
                    placeholder="Add tag..."
                    value={Array.isArray(value) ? value.join(', ') : value || ''}
                    onChange={(e) => updateProp(key, e.target.value)}
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
              ) : (
                <input
                  value={value || ''}
                  onChange={(e) => updateProp(key, e.target.value)}
                  className="bg-transparent outline-none flex-1 text-xs rounded-xl px-2.5 py-1"
                  placeholder="Empty"
                  style={{ color: 'var(--text-primary)' }}
                />
              )}

              <button
                onClick={() => removeProp(key)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-all cursor-pointer"
                title={t.delete}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Add Property Button */}
        <div className="flex items-center gap-4 mt-1">
          <button
            onClick={() => {
              const name = prompt(t.addProperty + ':');
              if (name && !properties[name]) updateProp(name, '');
            }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl opacity-70 hover:opacity-100 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: 'var(--text-muted, #6b7280)' }}
          >
            <Plus size={13} />
            <span>{t.addProperty}</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="w-full relative notion-editor-wrapper">
        <NotionDragHandle
          editor={editor}
          theme={theme}
          lang={lang}
          sidebarOpen={sidebarOpen}
        />
        <EditorContent editor={editor} />
        {editor && <NotionBubbleMenu editor={editor} />}
        {slashState.show && editor && (
          <SlashCommandMenu
            editor={editor}
            query={slashState.query}
            x={slashState.x}
            y={slashState.y}
            range={slashState.range}
            onClose={() => setSlashState((s) => ({ ...s, show: false }))}
          />
        )}
      </div>
    </div>
  );
}
