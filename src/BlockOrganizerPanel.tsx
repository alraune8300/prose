import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X, GripVertical, Type, Heading1, Heading2, Heading3, List, Quote, Copy, Trash2, ArrowRightLeft } from 'lucide-react';
import { type Editor as TiptapEditorType } from '@tiptap/react';
import { ThemeColors } from './types';
import { t, Lang } from './i18n';

interface BlockItem {
  id: string;
  index: number;
  type: string;
  text: string;
  offset: number;
  size: number;
  node: any;
}

interface BlockOrganizerPanelProps {
  editor: TiptapEditorType | null;
  onClose: () => void;
  theme: ThemeColors;
  lang: Lang;
  uiFont: string;
}

const BlockTextarea = ({ block, editor, theme, uiFont }: { block: BlockItem, editor: TiptapEditorType, theme: ThemeColors, uiFont: string }) => {
  const [val, setVal] = useState(block.text === '[Empty]' ? '' : block.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  useEffect(() => {
    if (document.activeElement !== textareaRef.current) {
      setVal(block.text === '[Empty]' ? '' : block.text);
    }
    setTimeout(resize, 0);
  }, [block.text, resize]);

  const handleBlur = () => {
    const currentText = block.text === '[Empty]' ? '' : block.text;
    if (val !== currentText) {
      const offset = block.offset;
      const nodeSize = block.size;
      
      editor.chain()
        .setTextSelection({ from: offset + 1, to: offset + nodeSize - 1 })
        .insertContent(val)
        .run();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setTimeout(resize, 0);
  };

  return (
    <textarea
      ref={textareaRef}
      value={val}
      onChange={(e) => {
        setVal(e.target.value);
        resize();
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="Empty block..."
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        resize: 'none',
        outline: 'none',
        fontFamily: uiFont,
        fontSize: '0.95rem',
        color: val === '' ? theme.textFaint : theme.text,
        lineHeight: 1.5,
        padding: 0,
        margin: 0,
        overflow: 'hidden',
      }}
    />
  );
};

export default function BlockOrganizerPanel({ editor, onClose, theme, lang, uiFont }: BlockOrganizerPanelProps) {
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const extractBlocks = useCallback(() => {
    if (!editor) return;
    const newBlocks: BlockItem[] = [];
    let i = 0;
    editor.state.doc.forEach((node, offset) => {
      let type = node.type.name;
      let text = node.textContent || '';
      if (type === 'heading') {
        type = `heading${node.attrs.level}`;
      }
      if (!text.trim()) text = '[Empty]';

      newBlocks.push({
        id: `block-${i}-${offset}`,
        index: i,
        type,
        text,
        offset,
        size: node.nodeSize,
        node
      });
      i++;
    });
    setBlocks(newBlocks.map((b, idx) => ({ ...b, id: `block-${idx}` })));
  }, [editor]);

  useEffect(() => {
    extractBlocks();
    if (editor) {
      editor.on('update', extractBlocks);
      return () => {
        editor.off('update', extractBlocks);
      };
    }
  }, [editor, extractBlocks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !editor) return;
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    if (startIndex === endIndex) return;

    const state = editor.state;
    const tr = state.tr;
    const nodes: any[] = [];
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
    const tr = editor.state.tr;
    tr.insert(block.offset + block.size, block.node);
    editor.view.dispatch(tr);
    setActiveMenu(null);
  };

  const handleDelete = (block: BlockItem) => {
    if (!editor) return;
    const tr = editor.state.tr;
    tr.delete(block.offset, block.offset + block.size);
    editor.view.dispatch(tr);
    setActiveMenu(null);
  };

  const handleTurnInto = (block: BlockItem, type: string) => {
    if (!editor) return;
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

  const getIconForType = (type: string, color: string) => {
    const props = { size: 14, color };
    switch (type) {
      case 'heading1': return <Heading1 {...props} />;
      case 'heading2': return <Heading2 {...props} />;
      case 'heading3': return <Heading3 {...props} />;
      case 'blockquote': return <Quote {...props} />;
      case 'bulletList':
      case 'orderedList': return <List {...props} />;
      default: return <Type {...props} />;
    }
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: uiFont, fontSize: '1.25rem', fontWeight: 600, color: theme.text }}>
            {t(lang, 'blockView') || 'Block Organizer'}
          </span>
          <span style={{ fontFamily: uiFont, fontSize: '0.85rem', color: theme.textMuted, marginTop: '4px' }}>
            Drag to reorder. Click text to edit. Change types or delete blocks.
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ 
            background: theme.surface, border: `1px solid ${theme.borderFaint}`, 
            borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', 
            color: theme.text, display: 'flex', alignItems: 'center', gap: '8px',
            fontFamily: uiFont, fontSize: '0.9rem', fontWeight: 500,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          className="hover:opacity-80 transition-opacity"
        >
          <X size={16} /> Exit Block View
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '120px' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="blocks-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
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
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 6px rgba(0,0,0,0.04)',
                          opacity: snapshot.isDragging ? 0.9 : 1,
                          position: 'relative',
                          transition: snapshot.isDragging ? 'none' : 'box-shadow 0.2s, border-color 0.2s',
                        }}
                        className="hover:border-opacity-80 hover:shadow-md group"
                      >
                        <div
                          {...provided.dragHandleProps}
                          style={{
                            color: theme.textMuted,
                            cursor: 'grab',
                            padding: '4px',
                            background: theme.panel,
                            borderRadius: '6px',
                            border: `1px solid ${theme.borderFaint}`
                          }}
                          className="hover:text-blue-500 transition-colors mt-1"
                        >
                          <GripVertical size={18} />
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '80px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ 
                              display: 'flex', alignItems: 'center', gap: '4px', 
                              background: theme.panel, padding: '2px 8px', borderRadius: '12px',
                              border: `1px solid ${theme.borderFaint}`
                            }}>
                              {getIconForType(block.type, theme.textMuted)}
                              <span style={{ fontFamily: uiFont, fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                                {getLabelForType(block.type)}
                              </span>
                            </div>
                          </div>
                          
                          <BlockTextarea block={block} editor={editor} theme={theme} uiFont={uiFont} />
                        </div>

                        {/* Action Menu Toggle & Delete */}
                        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleDelete(block)}
                            title="Delete Block"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: theme.textMuted,
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px'
                            }}
                            className="hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>

                          <button
                            onClick={() => setActiveMenu(activeMenu === block.id ? null : block.id)}
                            title="Block Options"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: theme.textMuted,
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px'
                            }}
                            className="hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <ArrowRightLeft size={16} />
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
