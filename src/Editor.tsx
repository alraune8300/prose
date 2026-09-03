import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { NodeSelection } from 'prosemirror-state';
import './Editor.css';
import {
  getEditorExtensions,
  globalCodexEntities,
  setGlobalCodexEntities,
  CodexEntity,
} from './editorExtensions';
import { editorialPluginKey, rhythmPluginKey, dialoguePluginKey } from './CreativeExtensions';
import { FloatingToolbar } from './FloatingToolbar';
import { setupMentionHover } from './HoverPreview';
import { toggleHeadingFold, foldAllHeadingsInDoc, unfoldAllHeadingsInDoc } from './CollapsibleHeadingsExtension';
import { convertTableToList, convertListToTable, getActiveTableInfo } from './tableUtils';
import { handleSmartEditorPaste, copySelectionAs } from './clipboardEngine';
import type { ThemeColors, FormatState } from './types';
import type { Dict } from './i18n';
import { executeSearchReplace, executeSearchNav } from './searchReplaceFix';
import { searchHighlightKey } from './SearchHighlightExtension';

type Props = {
  theme: ThemeColors;
  docFont: string;
  headingFont?: string;
  monoFont?: string;
  fontSize: number;
  formatState: FormatState;
  onEditorReady?: (editor: import('@tiptap/react').Editor) => void;
  t: Dict;
  content: string;
  onContentChange: (html: string) => void;
  isFocusMode?: boolean;
  lang?: string;
  codexEntities?: CodexEntity[];
  editorialHighlight?: string[];
  creativeOptions?: { rhythmEnabled: boolean; dialogueEnabled: boolean; lang: string };
  onToggleFocusMode?: () => void;
  isPreviewMode?: boolean;
  onTogglePreviewMode?: () => void;
  typewriterMode?: boolean;
};

function Editor({
  lang, theme, docFont, headingFont, monoFont, fontSize, formatState, onEditorReady, t, content, onContentChange,
  isFocusMode = false,
  isPreviewMode = false,
  typewriterMode = false,
  codexEntities = [],
  editorialHighlight,
  creativeOptions,
}: Props) {
  

  const lastEmittedContentRef = useRef(content || '');
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacksRef = useRef({ onContentChange, onEditorReady, typewriterMode });
  
  const handleTypewriterScroll = (editor: import("@tiptap/react").Editor) => {
    if (!callbacksRef.current.typewriterMode) return;
    // Optimize by checking if we actually need to scroll
    if (editor._typewriterRaf) cancelAnimationFrame(editor._typewriterRaf);
    
    editor._typewriterRaf = requestAnimationFrame(() => {
      try {
        const view = editor.view;
        const state = editor.state;
        if (!state.selection.empty) return; // Skip if text is selected
        
        const coords = view.coordsAtPos(state.selection.head);
        const scrollContainer = document.querySelector(".kgv-scroll");
        if (coords && scrollContainer) {
          const containerHeight = scrollContainer.clientHeight;
          
          // Fallback to bounding rect if offsetTop is not reliable for absolute positioning, 
          // but in our layout kgv-scroll is relative/absolute.
          const topOffset = scrollContainer.getBoundingClientRect().top;
          
          const caretY = coords.top - topOffset + scrollContainer.scrollTop;
          const targetScroll = caretY - (containerHeight / 2);
          
          // Only scroll if the difference is significant (> 10px) to save CPU and battery
          if (Math.abs(scrollContainer.scrollTop - Math.max(0, targetScroll)) > 10) {
            scrollContainer.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
          }
        }
      } catch (e) {
        console.warn('Typewriter scroll calculation failed:', e);
      }
    });
  };
  useEffect(() => { callbacksRef.current = { onContentChange, onEditorReady, typewriterMode }; }, [onContentChange, onEditorReady, typewriterMode]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        callbacksRef.current.onContentChange(lastEmittedContentRef.current);
      }
    };
  }, []);

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: content || '',
    autofocus: 'end',
    onCreate: ({ editor }) => {
      if (callbacksRef.current.onEditorReady) callbacksRef.current.onEditorReady(editor);
      requestAnimationFrame(() => {
        if (editor && !editor.isDestroyed) {
          editor?.commands?.focus('end');
        }
      });
    },
    onSelectionUpdate: ({ editor }) => {
      if (callbacksRef.current.onEditorReady) callbacksRef.current.onEditorReady(editor);
      handleTypewriterScroll(editor);

      const inTable = editor.isActive('table');
      if (inTable) {
        window.dispatchEvent(new CustomEvent('kgv-table-active-change', { detail: { inTable: true } }));
      }
    },
    onTransaction: ({ editor, transaction }) => {
      const inTable = editor.isActive('table');
      if (inTable) {
        window.dispatchEvent(new CustomEvent('kgv-table-active-change', { detail: { inTable: true } }));
      }
      
      // Keep scroll coordinates locked when selections change from external formatting commands
      // Only apply this logic if the document hasn't changed (e.g., purely a selection change like Ctrl+A)
      // or if it's explicitly flagged, to avoid layout thrashing (synchronous reflows) on every single keystroke.
      if (transaction.selectionSet && !transaction.docChanged && !callbacksRef.current.typewriterMode) {
        const scrollContainer = document.querySelector('.kgv-scroll');
        if (scrollContainer) {
          const prevScroll = scrollContainer.scrollTop;
          requestAnimationFrame(() => {
            // Restore scroll position to prevent dramatic jumps on selection / Select All
            if (scrollContainer && Math.abs(scrollContainer.scrollTop - prevScroll) > 15) {
              scrollContainer.scrollTop = prevScroll;
            }
          });
        }
      }
    },
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedContentRef.current = html;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      callbacksRef.current.onContentChange(html);
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedContentRef.current = html;
      
      handleTypewriterScroll(editor);

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        callbacksRef.current.onContentChange(html);
      }, 400);
    },

    editorProps: {
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement | null;
        const clickedInTable = !!target?.closest('table');
        if (!clickedInTable) {
          window.dispatchEvent(new CustomEvent('kgv-table-active-change', { detail: { inTable: false, userClickedOutside: true } }));
        }
        return false;
      },
      
      handleTextInput: (view, from, to, text) => {
        const state = window.__formatState;
        if (!state) return false;
        
        // Intercept /table shortcut
        if (text === ' ' || text === 'e') {
          const before = view.state.doc.textBetween(Math.max(0, from - 6), from);
          if (before === '/table' || (text === ' ' && before.endsWith('/table'))) {
            const tr = view.state.tr;
            tr.delete(from - 6, from);
            view.dispatch(tr);
            window.dispatchEvent(new CustomEvent('kgv-open-table-picker'));
            return true;
          }
        }

        // Double space for period
        if (state.doubleSpacePeriod !== false && text === ' ' && from >= 1) {
          const prevChar = view.state.doc.textBetween(from - 1, from);
          if (prevChar === ' ') {
            const charBeforeThat = from >= 2 ? view.state.doc.textBetween(from - 2, from - 1) : '';
            if (charBeforeThat !== ' ' && charBeforeThat !== '.') {
              const tr = view.state.tr; tr.insertText('. ', from - 1, to); view.dispatch(tr);
              return true;
            }
          }
        }

        // Intercept Heading shortcuts
        if (state.toggleHeadings === false && text === ' ') {
          const before = view.state.doc.textBetween(Math.max(0, from - 4), from);
          if (before.match(/(?:^|\n)(#{1,3})$/)) {
            const tr = view.state.tr; tr.insertText(' ', from, to); view.dispatch(tr);
            return true;
          }
        }

        // Intercept other markdown shortcuts
        if (state.markdownShortcuts === false) {
          if (text === ' ') {
            const before = view.state.doc.textBetween(Math.max(0, from - 4), from);
            if (before.match(/(?:^|\n)([*>+-]|\d+\.)$/)) {
              const tr = view.state.tr; tr.insertText(' ', from, to); view.dispatch(tr);
              return true;
            }
          }
          if (text === '-' && from >= 2 && view.state.doc.textBetween(from - 2, from) === '--') {
            const tr = view.state.tr; tr.insertText('-', from, to); view.dispatch(tr);
            return true;
          }
          if (text === '`' && from >= 2 && view.state.doc.textBetween(from - 2, from) === '``') {
            const tr = view.state.tr; tr.insertText('`', from, to); view.dispatch(tr);
            return true;
          }
        }

        return false;
      },
      handleScrollToSelection: (view) => {
        // Prevent ProseMirror auto-scrolling when formatting or making selections via Select All
        // if the active element is not the editor's text area (e.g., toolbar button clicks)
        if (document.activeElement && !view.dom.contains(document.activeElement)) {
          return true; // block default scrolling behavior
        }
        return false;
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        if (target && target.tagName === 'HR') {
          try {
            const nodePos = view.posAtDOM(target, 0);
            const tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, nodePos));
            view.dispatch(tr);
            return true;
          } catch {
            // fallback
            try {
              const tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos));
              view.dispatch(tr);
              return true;
            } catch {
              // ignore
            }
          }
        }
        
        const mark = target.closest('mark[data-hl-id]');
        if (mark) {
          const id = mark.getAttribute('data-hl-id');
          window.dispatchEvent(new CustomEvent('kgv-jump-to-highlight-panel', { detail: id }));
          return false;
        }

        const footnoteTarget = target.closest('.kgv-footnote-marker, sup.footnote-ref');
        if (footnoteTarget) {
          const fnId = footnoteTarget.getAttribute('data-footnote-id') || footnoteTarget.textContent?.replace(/[^\w\d]/g, '');
          if (fnId) {
            window.dispatchEvent(new CustomEvent('kgv-footnote-clicked', { detail: { id: fnId } }));
            return true;
          }
        }

        // Also check if text at click pos matches [^n]
        try {
          const doc = view.state.doc;
          const $pos = doc.resolve(pos);
          const parentText = $pos.parent.textContent;
          const offset = $pos.parentOffset;
          const matchRegex = /\[\^([^\]]+)\]/g;
          let m;
          while ((m = matchRegex.exec(parentText)) !== null) {
            const start = m.index;
            const end = start + m[0].length;
            if (offset >= start && offset <= end) {
              window.dispatchEvent(new CustomEvent('kgv-footnote-clicked', { detail: { id: m[1] } }));
              break;
            }
          }
        } catch {
          // ignore
        }

        return false;
      },
      attributes: {
        class: 'kgv-editor kgv-caret text-left direction-ltr pointer-events-auto user-select-text',
        style: `color: ${theme.text}; caret-color: ${theme.text}; line-height: 1.7; --kgv-fold-badge-bg: ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}; --kgv-fold-badge-hover: ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}; --kgv-fold-badge-color: ${theme.textMuted}; --kgv-fold-badge-border: ${theme.border};`,
        'data-placeholder': t.startWriting,
        'data-lang': lang || 'vi',
        dir: 'ltr',
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
      },
      handlePaste: (_view, event) => {
        if (editor && !editor.isDestroyed) {
          const handled = handleSmartEditorPaste(editor, event);
          if (handled) return true;
        }
        return false;
      },
      handleDOMEvents: {
        copy: (_view, event) => {
          if (!editor || editor.isDestroyed) return false;
          // If copying while table is active, format clean table clipboard data (HTML + TSV plain text)
          if (editor.isActive('table') && !editor.state.selection.empty) {
            try {
              const tableInfo = getActiveTableInfo(editor);
              if (tableInfo) {
                const selectedHtml = editor.getHTML();
                const selectedText = editor.state.doc.textBetween(
                  editor.state.selection.from,
                  editor.state.selection.to,
                  '\t',
                  '\n'
                );
                if (event.clipboardData && (selectedHtml || selectedText)) {
                  event.clipboardData.setData('text/html', selectedHtml);
                  event.clipboardData.setData('text/plain', selectedText);
                  event.preventDefault();
                  return true;
                }
              }
            } catch {
              // fallback to standard copy
            }
          }
          return false;
        },
      },
      handleKeyDown: (_view, event) => {
        // Ctrl+Shift+C / Cmd+Shift+C: Copy as raw Markdown
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'C' || event.key === 'c')) {
          event.preventDefault();
          if (editor && !editor.isDestroyed) {
            copySelectionAs(editor, 'markdown').then((res) => {
              if (res.success) {
                window.dispatchEvent(
                  new CustomEvent('kgv-toast-notify', {
                    detail: { message: `Đã sao chép ${res.charCount} ký tự dưới dạng Markdown!` },
                  })
                );
              }
            });
          }
          return true;
        }

        if (event.key === 'Tab') {
          event.preventDefault();
          if (editor && !editor.isDestroyed) {
            const cmds = editor.commands as Record<string, (...args: unknown[]) => boolean>;
            if (event.shiftKey) {
              if (!cmds.liftListItem('listItem')) {
                cmds.outdent?.();
              }
            } else {
              if (!cmds.sinkListItem('listItem')) {
                cmds.indent?.();
              }
            }
          }
          return true;
        }
        return false;
      },
    },
  });
  useEffect(() => {
    if (editor && !editor.isDestroyed && creativeOptions) {
      editor.view.dispatch(editor.state.tr.setMeta(rhythmPluginKey, { enabled: creativeOptions.rhythmEnabled, lang: creativeOptions.lang }));
      editor.view.dispatch(editor.state.tr.setMeta(dialoguePluginKey, { enabled: creativeOptions.dialogueEnabled }));
    }
  }, [creativeOptions, editor]);


  useEffect(() => {
    let tippyInstance: { destroy: () => void } | null = null;
    if (editor && editor.view.dom.parentElement) {
      tippyInstance = setupMentionHover(editor.view.dom.parentElement, () => globalCodexEntities);
    }
    return () => {
      if (tippyInstance) tippyInstance.destroy();
    };
  }, [editor]);

  useEffect(() => {
    setGlobalCodexEntities(codexEntities || []);
  }, [codexEntities]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.view.dispatch(editor.state.tr.setMeta(editorialPluginKey, { highlightWords: editorialHighlight }));
    }
  }, [editorialHighlight, editor]);


  useEffect(() => {
    const handleToggleFold = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (editor && !editor.isDestroyed && customEvent.detail) {
        toggleHeadingFold(editor.view, customEvent.detail.pos, customEvent.detail.text || '');
      }
    };
    const handleFoldAll = () => {
      if (editor && !editor.isDestroyed) {
        foldAllHeadingsInDoc(editor.view);
      }
    };
    const handleUnfoldAll = () => {
      if (editor && !editor.isDestroyed) {
        unfoldAllHeadingsInDoc(editor.view);
      }
    };
    const handleInsertTableGrid = (e: Event) => {
      const { rows, cols, withHeader, styleType, alignment } = (e as CustomEvent).detail || {};
      if (editor && !editor.isDestroyed && rows && cols) {
        editor.chain().focus().insertTable({
          rows,
          cols,
          withHeaderRow: withHeader !== undefined ? withHeader : true,
        }).run();

        if (styleType || alignment) {
          setTimeout(() => {
            const tableEl = document.querySelector('.kgv-editor table:last-of-type') as HTMLElement;
            if (tableEl) {
              if (styleType) tableEl.setAttribute('data-table-style', styleType);
              if (alignment) tableEl.setAttribute('data-align', alignment);
            }
          }, 50);
        }
      }
    };
    const handleDeleteTable = () => {
      if (editor && !editor.isDestroyed && editor.isActive('table')) {
        editor.chain().focus().deleteTable().run();
      }
    };
    const handleConvertTableToList = () => {
      if (editor && !editor.isDestroyed) {
        convertTableToList(editor);
      }
    };
    const handleConvertListToTable = () => {
      if (editor && !editor.isDestroyed) {
        convertListToTable(editor);
      }
    };

    window.addEventListener('kgv-toggle-heading-fold', handleToggleFold);
    window.addEventListener('kgv-fold-all-headings', handleFoldAll);
    window.addEventListener('kgv-unfold-all-headings', handleUnfoldAll);
    window.addEventListener('kgv-insert-table-grid', handleInsertTableGrid);
    window.addEventListener('kgv-delete-table', handleDeleteTable);
    window.addEventListener('kgv-convert-table-to-list', handleConvertTableToList);
    window.addEventListener('kgv-convert-list-to-table', handleConvertListToTable);

    return () => {
      window.removeEventListener('kgv-toggle-heading-fold', handleToggleFold);
      window.removeEventListener('kgv-fold-all-headings', handleFoldAll);
      window.removeEventListener('kgv-unfold-all-headings', handleUnfoldAll);
      window.removeEventListener('kgv-insert-table-grid', handleInsertTableGrid);
      window.removeEventListener('kgv-delete-table', handleDeleteTable);
      window.removeEventListener('kgv-convert-table-to-list', handleConvertTableToList);
      window.removeEventListener('kgv-convert-list-to-table', handleConvertListToTable);
    };
  }, [editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isPreviewMode);
    }
  }, [editor, isPreviewMode]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && content !== lastEmittedContentRef.current && editor.getHTML() !== content) {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      const newContent = content || '';
      editor?.commands?.setContent(newContent, { emitUpdate: false });
      lastEmittedContentRef.current = content || '';
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    const activeFontSize = formatState?.fontSize || fontSize || 16;
    const activeLineHeightVal = (isPreviewMode || isFocusMode) ? 1.8 : (formatState?.lineH || 1.7);
    const absLineHeight = Math.round(activeFontSize * activeLineHeightVal);

    editor.setOptions({
      editorProps: {
        attributes: {
          class: 'kgv-editor kgv-caret text-left direction-ltr pointer-events-auto user-select-text',
          style: `color: ${theme.text}; caret-color: ${theme.text}; font-size: ${activeFontSize}px; line-height: ${absLineHeight}px; min-height: 100%;`,
          'data-placeholder': t.startWriting,
          dir: 'ltr',
          autocorrect: 'off',
          autocapitalize: 'off',
          spellcheck: 'false',
        },
      },
    });
  }, [editor, theme.text, t.startWriting, isPreviewMode, isFocusMode, formatState, fontSize]);

  useEffect(() => {
    function handleDocFont(e: Event) {
      editor?.chain().focus().setFontFamily((e as CustomEvent).detail as string).run();
    }
    window.addEventListener('kgv-docfont', handleDocFont);
    return () => window.removeEventListener('kgv-docfont', handleDocFont);
  }, [editor]);



  useEffect(() => {
    function handleFontSelection(e: Event) {
      editor?.chain().focus().setFontFamily((e as CustomEvent).detail as string).run();
    }
    window.addEventListener('kgv-apply-font-selection', handleFontSelection);
    return () => window.removeEventListener('kgv-apply-font-selection', handleFontSelection);
  }, [editor]);

  useEffect(() => {
    function handleFontSize(e: Event) {
      editor?.chain().focus().setFontSize(String((e as CustomEvent).detail as number)).run();
    }
    window.addEventListener('kgv-fontsize', handleFontSize);
    return () => window.removeEventListener('kgv-fontsize', handleFontSize);
  }, [editor]);

  useEffect(() => {
    function handleSearchReplace(e: Event) {
      if (!editor) return;
      const detail = (e as CustomEvent).detail;
      executeSearchReplace(editor, detail);
    }
    
    function handleSearchNav(e: Event) {
      if (!editor) return;
      const detail = (e as CustomEvent).detail;
      executeSearchNav(editor, detail);
    }
    
    function handleSearchQuery(e: Event) {
      if (!editor) return;
      const detail = (e as CustomEvent).detail;
      const { find, matchCase, wholeWord, regex } = detail;
      editor.commands.command(({ tr, dispatch }) => {
        if (dispatch) dispatch(tr.setMeta(searchHighlightKey, { searchTerm: find, matchCase, wholeWord, regex }));
        return true;
      });
    }
    function handleInsertLink(e: Event) {
      if (!editor) return;
      const { url, text } = (e as CustomEvent).detail || {};
      if (!url) return;
      if (editor.state.selection.empty && text) {
        editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    }

    function handleRemoveLink() {
      if (!editor) return;
      editor.chain().focus().unsetLink().run();
    }

    function handleInsertFootnote(e: Event) {
      if (!editor) return;
      const { id } = (e as CustomEvent).detail || {};
      const fnNum = id || '1';
      editor.chain().focus().insertContent(`<sup class="kgv-footnote-marker" data-footnote-id="${fnNum}">[^${fnNum}]</sup>&nbsp;`).run();
    }

    function handleInsertQuote(e: Event) {
      if (!editor) return;
      const { text, source } = (e as CustomEvent).detail || {};
      if (!text) return;
      const sourceCitation = source ? `<p style="text-align: right; font-size: 0.9em; opacity: 0.85;">— <em>${source}</em></p>` : '';
      editor.chain().focus().insertContent(`<blockquote><p>${text}</p>${sourceCitation}</blockquote><p></p>`).run();
    }

    function handleInsertImage(e: Event) {
      if (!editor) return;
      const { src, alt, caption } = (e as CustomEvent).detail || {};
      if (!src) return;
      editor.chain().focus().setImage({ src, alt: alt || caption || 'Image' }).run();
    }

    function handleScrollToEditorFootnote(e: Event) {
      if (!editor) return;
      const { id } = (e as CustomEvent).detail || {};
      if (!id) return;
      
      // Find element containing [^id] in the editor DOM
      requestAnimationFrame(() => {
        const editorEl = document.querySelector('.kgv-editor');
        if (!editorEl) return;
        const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent && node.textContent.includes(`[^${id}]`)) {
            const parent = node.parentElement;
            if (parent) {
              parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
              parent.classList.add('active-highlight');
              setTimeout(() => {
                parent.classList.remove('active-highlight');
              }, 2500);
              break;
            }
          }
        }
      });
    }

    function handleCopyAs(e: Event) {
      if (!editor || editor.isDestroyed) return;
      const format = ((e as CustomEvent).detail?.format || 'rich') as 'rich' | 'markdown' | 'plain';
      copySelectionAs(editor, format).then((res) => {
        if (res.success) {
          window.dispatchEvent(
            new CustomEvent('kgv-toast-notify', {
              detail: { message: `Đã sao chép ${res.charCount} ký tự (${res.format})!` },
            })
          );
        }
      });
    }

    function handleInsertFormatted(e: Event) {
      if (!editor || editor.isDestroyed) return;
      const { html, text } = (e as CustomEvent).detail || {};
      if (html) {
        editor.chain().focus().insertContent(html).run();
      } else if (text) {
        editor.chain().focus().insertContent(text).run();
      }
    }

    window.addEventListener('kgv-copy-as', handleCopyAs);
    window.addEventListener('kgv-insert-formatted', handleInsertFormatted);
    window.addEventListener('kgv-search-query', handleSearchQuery);
    window.addEventListener('kgv-insert-link', handleInsertLink);
    window.addEventListener('kgv-remove-link', handleRemoveLink);
    window.addEventListener('kgv-insert-footnote', handleInsertFootnote);
    window.addEventListener('kgv-insert-quote', handleInsertQuote);
    window.addEventListener('kgv-insert-image', handleInsertImage);
    window.addEventListener('kgv-scroll-to-editor-footnote', handleScrollToEditorFootnote);

    window.addEventListener('kgv-search-replace', handleSearchReplace);
    window.addEventListener('kgv-search-nav', handleSearchNav);
    return () => {
      window.removeEventListener('kgv-copy-as', handleCopyAs);
      window.removeEventListener('kgv-insert-formatted', handleInsertFormatted);
      window.removeEventListener('kgv-search-replace', handleSearchReplace);
      window.removeEventListener('kgv-search-nav', handleSearchNav);
      window.removeEventListener('kgv-search-query', handleSearchQuery);
      window.removeEventListener('kgv-insert-link', handleInsertLink);
      window.removeEventListener('kgv-remove-link', handleRemoveLink);
      window.removeEventListener('kgv-insert-footnote', handleInsertFootnote);
      window.removeEventListener('kgv-insert-quote', handleInsertQuote);
      window.removeEventListener('kgv-insert-image', handleInsertImage);
      window.removeEventListener('kgv-scroll-to-editor-footnote', handleScrollToEditorFootnote);
    };
  }, [editor]);


  
  if (!editor) return null;

  const isPaginated = !isPreviewMode && !isFocusMode;
  const currentBodyFont = formatState?.fontFam || docFont || 'Merriweather';
  const currentHeadingFont = formatState?.headingFontFam || headingFont || 'Playfair Display';
  const currentMonoFont = formatState?.monoFontFam || monoFont || 'JetBrains Mono';

  

  if (isPaginated) {
    const activeFontSize = formatState?.fontSize || fontSize || 16;
    const activeLineHeightVal = formatState?.lineH || 1.7;
    const absLineHeight = Math.round(activeFontSize * activeLineHeightVal);

    return (
      <div 
        className="w-full h-full relative pointer-events-auto" 
        style={{ 
          color: theme.text,
          fontFamily: `'${currentBodyFont}', Georgia, serif`,
          fontSize: `${activeFontSize}px`,
          lineHeight: `${absLineHeight}px`,
          ['--kgv-body-font' as string]: `'${currentBodyFont}', Georgia, serif`,
          ['--kgv-heading-font' as string]: `'${currentHeadingFont}', serif`,
          ['--kgv-mono-font' as string]: `'${currentMonoFont}', monospace`,
        } as React.CSSProperties}
      >
        <FloatingToolbar editor={editor} theme={theme} />
          <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Central Editor Container */}
      <div
        className="flex-1 overflow-y-auto kgv-scroll transition-all duration-300 ease-in-out relative flex justify-center cursor-text"
        style={{ overscrollBehaviorY: 'none' }}
        onClick={(e) => {
          if (!isPreviewMode && editor && !editor.isDestroyed) {
            const target = e.target as HTMLElement;
            if (!target.closest('button') && !target.closest('a') && !target.closest('input')) {
              // If user clicks exactly on the scroll wrapper (outside the text), focus at end
              if (e.target === e.currentTarget || target.classList.contains('ProseMirror-wrapper')) {
                editor?.commands?.focus('end');
              } else if (!editor.isFocused) {
                editor?.commands?.focus();
              }
            }
          }
        }}
      >
        <div
          className={`relative w-full mx-auto transition-all duration-300 ease-in-out ${
            (isPreviewMode || isFocusMode)
              ? 'px-4 sm:px-8 md:px-12 pt-6 pb-20 tracking-normal'
              : 'px-4 sm:px-6 md:px-8 pt-6 pb-24'
          }`}
          style={Object.assign({
            paddingTop: typewriterMode ? '45vh' : undefined,
            paddingBottom: typewriterMode ? '50vh' : undefined,
          }, {
            fontFamily: `'${currentBodyFont}', Georgia, serif`,
            fontSize: `${formatState?.fontSize || fontSize}px`,
            lineHeight: `${Math.round((formatState?.fontSize || fontSize || 16) * ((isPreviewMode || isFocusMode) ? 1.8 : (formatState?.lineH || 1.7)))}px`,
            ['--kgv-body-font']: `'${currentBodyFont}', Georgia, serif`,
            ['--kgv-heading-font']: `'${currentHeadingFont}', serif`,
            ['--kgv-mono-font']: `'${currentMonoFont}', monospace`,
          } as React.CSSProperties)}>



          <FloatingToolbar editor={editor} theme={theme} />
          <EditorContent editor={editor} />
        </div>
      </div>

    </div>
  );
}

export default React.memo(Editor);


