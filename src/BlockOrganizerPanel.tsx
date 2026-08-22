import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X, GripVertical, Type, Heading1, Heading2, Heading3, Quote, Copy, Trash2, ArrowRightLeft } from 'lucide-react';
import { type Editor as TiptapEditorType, useEditor, EditorContent, JSONContent } from '@tiptap/react';
import type { Node as ProsemirrorNode } from 'prosemirror-model';
import { getEditorExtensions } from './Editor';
import { ThemeColors } from './types';
import { t, Lang } from './i18n';

interface BlockItem {
  id: string;
  index: number;
  type: string;
  text: string;
  offset: number;
  size: number;
  node: ProsemirrorNode;
}

interface BlockOrganizerPanelProps {
  editor: TiptapEditorType | null;
  onClose: () => void;
  theme: ThemeColors;
  lang: Lang;
  uiFont: string;
  docFont?: string;
  headingFont?: string;
  fontSize?: number;
  formatState?: Record<string, unknown>;
  setActiveBlockEditor?: (editor: TiptapEditorType | null) => void;
}

const BlockMiniEditor = ({
  block,
  theme,
  docFont,
  headingFont,
  fontSize,
  formatState,
  setActiveBlockEditor,
  onBlockContentChange,
}: {
  block: BlockItem;
  theme: ThemeColors;
  docFont?: string;
  headingFont?: string;
  fontSize?: number;
  formatState?: Record<string, unknown>;
  setActiveBlockEditor?: (editor: TiptapEditorType | null) => void;
  onBlockContentChange: (blockId: string, json: JSONContent) => void;
}) => {
  const miniEditor = useEditor({
    extensions: getEditorExtensions(),
    content: { type: 'doc', content: [block.node.toJSON()] },
    editorProps: {
      attributes: {
        class: 'kgv-block-editor outline-none w-full min-h-[22px]',
      },
    },
    onCreate: ({ editor }) => {
      onBlockContentChange(block.id, editor.getJSON());
    },
    onUpdate: ({ editor }) => {
      onBlockContentChange(block.id, editor.getJSON());
    },
    onFocus: ({ editor }) => {
      if (setActiveBlockEditor) setActiveBlockEditor(editor as TiptapEditorType);
    },
    onSelectionUpdate: ({ editor }) => {
      if (setActiveBlockEditor) setActiveBlockEditor(editor as TiptapEditorType);
    },
    onTransaction: ({ editor }) => {
      if (setActiveBlockEditor) setActiveBlockEditor(editor as TiptapEditorType);
    },
  });

  const isHeading = block.type.startsWith('heading');
  const fontFamily = isHeading ? (headingFont || docFont || 'inherit') : (docFont || 'inherit');
  const baseSize = fontSize || 16;

  return (
    <div
      onClick={() => {
        if (miniEditor && !miniEditor.isFocused) {
          miniEditor.commands.focus();
        }
      }}
      style={{
        width: '100%',
        fontFamily: fontFamily,
        fontSize: `${baseSize}px`,
        color: theme.text,
        lineHeight: typeof formatState?.lineH === 'number' ? formatState.lineH : 1.5,
        letterSpacing: typeof formatState?.letterSpacing === 'number' ? `${formatState.letterSpacing}px` : 'normal',
        wordSpacing: typeof formatState?.wordSpacing === 'number' ? `${formatState.wordSpacing}px` : 'normal',
        outline: 'none',
      }}
    >
      <EditorContent editor={miniEditor} />
    </div>
  );
};

export default function BlockOrganizerPanel({
  editor,
  onClose,
  theme,
  lang,
  uiFont,
  docFont,
  headingFont,
  fontSize,
  formatState,
  setActiveBlockEditor,
}: BlockOrganizerPanelProps) {
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const blockContentMapRef = useRef<Record<string, JSONContent[]>>({});
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  const extractBlocks = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const newBlocks: BlockItem[] = [];
    let i = 0;
    editor.state.doc.forEach((node, offset) => {
      let type = node.type.name;
      let text = node.textContent || '';
      if (type === 'heading') {
        type = `heading${node.attrs.level}`;
      }
      if (!text.trim()) text = '[Empty]';

      const blockId = `block-${i}-${offset}`;
      newBlocks.push({
        id: blockId,
        index: i,
        type,
        text,
        offset,
        size: node.nodeSize,
        node,
      });
      blockContentMapRef.current[blockId] = [node.toJSON()];
      i++;
    });
    setBlocks(newBlocks);
  }, [editor]);

  const flushToMainEditor = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const fullDocContent: JSONContent[] = [];
    for (const b of blocks) {
      const content = blockContentMapRef.current[b.id];
      if (content && Array.isArray(content) && content.length > 0) {
        fullDocContent.push(...content);
      } else if (b.node) {
        fullDocContent.push(b.node.toJSON());
      }
    }
    if (fullDocContent.length > 0) {
      isSyncingRef.current = true;
      editor.commands.setContent({ type: 'doc', content: fullDocContent });
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 80);
    }
  }, [blocks, editor]);

  const handleBlockContentChange = useCallback((blockId: string, json: JSONContent) => {
    if (json && json.content) {
      blockContentMapRef.current[blockId] = json.content;
    }
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      flushToMainEditor();
    }, 200);
  }, [flushToMainEditor]);

  useEffect(() => {
    extractBlocks();
    if (editor) {
      const handleUpdate = () => {
        if (isSyncingRef.current) return;
        extractBlocks();
      };
      editor.on('update', handleUpdate);
      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [editor, extractBlocks]);

  const handleClose = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    flushToMainEditor();
    if (setActiveBlockEditor) setActiveBlockEditor(null);
    onClose();
  }, [flushToMainEditor, onClose, setActiveBlockEditor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      flushToMainEditor();
      if (setActiveBlockEditor) setActiveBlockEditor(null);
    };
  }, [handleClose, flushToMainEditor, setActiveBlockEditor]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !editor) return;
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    if (startIndex === endIndex) return;

    flushToMainEditor();

    const state = editor.state;
    const tr = state.tr;
    const nodes: { node: ProsemirrorNode; offset: number; size: number }[] = [];
    state.doc.forEach((node, offset) => {
      nodes.push({ node, offset, size: node.nodeSize });
    });

    if (startIndex < 0 || startIndex >= nodes.length || endIndex < 0 || endIndex >= nodes.length) return;
    const fromNode = nodes[startIndex];
    const insertPos = startIndex < endIndex ? nodes[endIndex].offset + nodes[endIndex].size : nodes[endIndex].offset;
    const adjustedInsertPos = insertPos > fromNode.offset ? insertPos - fromNode.size : insertPos;

    tr.delete(fromNode.offset, fromNode.offset + fromNode.size);
    tr.insert(adjustedInsertPos, fromNode.node);
    editor.view.dispatch(tr);
  };

  const handleDuplicate = (block: BlockItem) => {
    if (!editor) return;
    flushToMainEditor();
    const tr = editor.state.tr;
    tr.insert(block.offset + block.size, block.node);
    editor.view.dispatch(tr);
    setActiveMenu(null);
  };

  const handleDelete = (block: BlockItem) => {
    if (!editor) return;
    flushToMainEditor();
    const tr = editor.state.tr;
    tr.delete(block.offset, block.offset + block.size);
    editor.view.dispatch(tr);
    setActiveMenu(null);
  };

  const handleTurnInto = (block: BlockItem, type: string) => {
    if (!editor) return;
    flushToMainEditor();
    const pos = block.offset + 1;
    const chain = editor.chain().setTextSelection(pos);

    switch (type) {
      case 'paragraph': chain.setParagraph().run(); break;
      case 'heading1': chain.toggleHeading({ level: 1 }).run(); break;
      case 'heading2': chain.toggleHeading({ level: 2 }).run(); break;
      case 'heading3': chain.toggleHeading({ level: 3 }).run(); break;
      case 'blockquote': chain.toggleBlockquote().run(); break;
    }
    setActiveMenu(null);
  };

  const getLabelForType = (type: string) => {
    switch (type) {
      case 'heading1': return 'H1';
      case 'heading2': return 'H2';
      case 'heading3': return 'H3';
      case 'blockquote': return 'Quote';
      case 'bulletList':
      case 'orderedList': return 'List';
      default: return 'Paragraph';
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '16px 8px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: uiFont, fontSize: '1.15rem', fontWeight: 600, color: theme.text }}>
            {t(lang, 'blockView') || 'Block View'}
          </span>
          <span style={{ fontFamily: uiFont, fontSize: '0.82rem', color: theme.textMuted, marginTop: '2px' }}>
            {t(lang, 'blockViewDesc') || 'Drag to reorder. Click text to edit. Format with toolbar.'}
          </span>
        </div>
        <button
          onClick={handleClose}
          style={{
            background: theme.surface,
            border: `1px solid ${theme.borderFaint}`,
            borderRadius: '8px',
            padding: '6px 12px',
            cursor: 'pointer',
            color: theme.text,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: uiFont,
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
          className="hover:opacity-80 transition-opacity"
        >
          <X size={15} /> {t(lang, 'exitBlockView') || 'Exit Block View'}
        </button>
      </div>

      <div style={{ width: '100%', paddingBottom: '120px' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="blocks-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}
              >
                {blocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                          background: snapshot.isDragging ? theme.accentLight : theme.surface,
                          border: `1px solid ${snapshot.isDragging ? theme.accent : theme.border}`,
                          borderRadius: '10px',
                          padding: '10px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          width: '100%',
                          boxSizing: 'border-box',
                          gap: '6px',
                          boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                          opacity: snapshot.isDragging ? 0.9 : 1,
                          position: 'relative',
                          transition: snapshot.isDragging ? 'none' : 'box-shadow 0.2s, border-color 0.2s',
                        }}
                        className="hover:border-opacity-80 hover:shadow-md group"
                      >
                        {/* Header bar: Grip + Type Badge + Actions */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            gap: '12px',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              {...provided.dragHandleProps}
                              style={{
                                color: theme.textMuted,
                                cursor: 'grab',
                                padding: '2px 4px',
                                background: theme.panel,
                                borderRadius: '4px',
                                border: `1px solid ${theme.borderFaint}`,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              className="hover:text-blue-500 transition-colors"
                              title="Drag to reorder"
                            >
                              <GripVertical size={13} />
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: theme.panel,
                                padding: '1px 6px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.borderFaint}`,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: uiFont,
                                  fontSize: '0.68rem',
                                  color: theme.textMuted,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  fontWeight: 600,
                                }}
                              >
                                {getLabelForType(block.type)}
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
                            <button
                              onClick={() => handleDuplicate(block)}
                              title="Duplicate Block"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: theme.textMuted,
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              className="hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-40 group-hover:opacity-100 focus:opacity-100"
                            >
                              <Copy size={13} />
                            </button>

                            <button
                              onClick={() => handleDelete(block)}
                              title="Delete Block"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: theme.textMuted,
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              className="hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-40 group-hover:opacity-100 focus:opacity-100"
                            >
                              <Trash2 size={13} />
                            </button>

                            <button
                              onClick={() => setActiveMenu(activeMenu === block.id ? null : block.id)}
                              title="Turn into / Options"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: theme.textMuted,
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              className="hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-40 group-hover:opacity-100 focus:opacity-100"
                            >
                              <ArrowRightLeft size={13} />
                            </button>

                            {activeMenu === block.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: 0,
                                  marginTop: '4px',
                                  background: theme.surface,
                                  border: `1px solid ${theme.borderFaint}`,
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                  zIndex: 50,
                                  minWidth: '160px',
                                  overflow: 'hidden',
                                  fontFamily: uiFont,
                                }}
                              >
                                <div style={{ padding: '8px', borderBottom: `1px solid ${theme.borderFaint}` }}>
                                  <div style={{ fontSize: '0.7rem', color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', paddingLeft: '8px' }}>Turn Into</div>
                                  <button onClick={() => handleTurnInto(block, 'paragraph')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: theme.text, cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }} className="hover:bg-black/5 dark:hover:bg-white/10"><Type size={14} /> Paragraph</button>
                                  <button onClick={() => handleTurnInto(block, 'heading1')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: theme.text, cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }} className="hover:bg-black/5 dark:hover:bg-white/10"><Heading1 size={14} /> Heading 1</button>
                                  <button onClick={() => handleTurnInto(block, 'heading2')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: theme.text, cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }} className="hover:bg-black/5 dark:hover:bg-white/10"><Heading2 size={14} /> Heading 2</button>
                                  <button onClick={() => handleTurnInto(block, 'heading3')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: theme.text, cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }} className="hover:bg-black/5 dark:hover:bg-white/10"><Heading3 size={14} /> Heading 3</button>
                                  <button onClick={() => handleTurnInto(block, 'blockquote')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: theme.text, cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }} className="hover:bg-black/5 dark:hover:bg-white/10"><Quote size={14} /> Quote</button>
                                </div>
                                <div style={{ padding: '8px' }}>
                                  <button onClick={() => handleDuplicate(block)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: theme.text, cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }} className="hover:bg-black/5 dark:hover:bg-white/10"><Copy size={14} /> Duplicate</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Block Content */}
                        <div style={{ width: '100%', minWidth: '160px' }}>
                          <BlockMiniEditor
                            block={block}
                            theme={theme}
                            docFont={docFont}
                            headingFont={headingFont}
                            fontSize={fontSize}
                            formatState={formatState}
                            setActiveBlockEditor={setActiveBlockEditor}
                            onBlockContentChange={handleBlockContentChange}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Click outside overlay for menu */}
      {activeMenu && (
        <div
          onClick={() => setActiveMenu(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
        />
      )}
    </div>
  );
}


