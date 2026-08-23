import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, Upload, Copy, Check, Split, BookOpen, 
  Search, ZoomIn, ZoomOut, ArrowRight,
  ChevronRight, X, Clipboard, Edit3, Eye, FileCode,
  RotateCcw, ExternalLink, FileUp, Sparkles, Trash2,
  Bookmark, Quote
} from 'lucide-react';
import type { ThemeColors, Page, Project } from './types';
import type { Lang } from './i18n';
import { t } from './i18n';
import { processReferenceFile } from './referenceExtractor';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { parseMarkdownToHtml, sanitizePastedHtml } from './clipboardEngine';
import { 
  saveReferenceDocumentToDB, 
  getReferenceDocumentFromDB, 
  clearReferenceDocumentFromDB 
} from './db';

interface ReferenceComparePanelProps {
  theme: ThemeColors;
  uiFont: string;
  docFont: string;
  monoFont?: string;
  lang: Lang;
  activePage: Page | null;
  activeProject: Project | null;
  onInsertQuoteToEditor: (quoteText: string, sourceTitle?: string) => void;
  onAddFootnoteCitation?: (quoteText: string, sourceTitle?: string) => void;
  onClose: () => void;
}

type ViewDisplayMode = 'live' | 'extract' | 'edit';

export default function ReferenceComparePanel({
  theme,
  uiFont,
  docFont,
  monoFont = 'JetBrains Mono',
  lang,
  activePage,
  activeProject,
  onInsertQuoteToEditor,
  onAddFootnoteCitation,
  onClose,
}: ReferenceComparePanelProps) {
  const [tab, setTab] = useState<'reference' | 'compare'>('reference');
  const [displayMode, setDisplayMode] = useState<ViewDisplayMode>(() => {
    return (localStorage.getItem('kgv_split_display_mode') as ViewDisplayMode) || 'extract';
  });
  
  // Reference content state
  const [refContent, setRefContent] = useState<string>(() => {
    return localStorage.getItem('kgv_split_ref_content') || 
      t(lang, 'splitDefaultRefContent') || 
`# Reference Document

1. Paste text from clipboard (Ctrl+V or click "Paste Text").
2. Upload PDF, DOCX, TXT, Markdown, Images to view and compare while writing.
3. Switch seamlessly between "Live View" and "Extract Text".
4. Select any text and click "Insert as Quote" to insert directly into your draft.
5. Switch to "Compare & Diff" tab to analyze similarities and differences.`;
  });

  const [refTitle, setRefTitle] = useState<string>(() => {
    return localStorage.getItem('kgv_split_ref_title') || t(lang, 'splitDefaultRefTitle') || 'Reference Document.md';
  });

  const [refType, setRefType] = useState<'text' | 'pdf' | 'docx' | 'markdown' | 'image' | 'code'>(() => {
    return (localStorage.getItem('kgv_split_ref_type') as 'text' | 'pdf' | 'docx' | 'markdown' | 'image' | 'code') || 'markdown';
  });
  const [refFile, setRefFile] = useState<File | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ size?: number; pageCount?: number }>({});
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Search & Font Zoom
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSizeOffset, setFontSizeOffset] = useState(() => {
    const saved = localStorage.getItem('kgv_split_font_offset');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [imageZoom, setImageZoom] = useState(100);
  const [selectedText, setSelectedText] = useState('');
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Paste Modal State
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteModalText, setPasteModalText] = useState('');
  const [pasteModalTitle, setPasteModalTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Notification Toast Helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Restore persistent state from IndexedDB on component mount
  useEffect(() => {
    let isMounted = true;

    async function restorePersistedRef() {
      try {
        const savedDoc = await getReferenceDocumentFromDB();
        if (!isMounted || !savedDoc) return;

        if (savedDoc.title) {
          setRefTitle(savedDoc.title);
          localStorage.setItem('kgv_split_ref_title', savedDoc.title);
        }
        if (savedDoc.type) {
          setRefType(savedDoc.type);
          localStorage.setItem('kgv_split_ref_type', savedDoc.type);
        }
        if (savedDoc.content !== undefined) {
          setRefContent(savedDoc.content);
          if (savedDoc.type !== 'pdf' && savedDoc.type !== 'image') {
            localStorage.setItem('kgv_split_ref_content', savedDoc.content);
          }
        }
        if (savedDoc.displayMode) {
          setDisplayMode(savedDoc.displayMode);
          localStorage.setItem('kgv_split_display_mode', savedDoc.displayMode);
        }
        if (savedDoc.fileMeta) {
          setFileMeta(savedDoc.fileMeta);
        }
        if (savedDoc.fontSizeOffset !== undefined) {
          setFontSizeOffset(savedDoc.fontSizeOffset);
          localStorage.setItem('kgv_split_font_offset', String(savedDoc.fontSizeOffset));
        }
        if (savedDoc.docxHtml) {
          setDocxHtml(savedDoc.docxHtml);
        }

        // Restore file object and preview blob URLs if fileBlob was preserved
        if (savedDoc.fileBlob) {
          const mime = savedDoc.mimeType || savedDoc.fileBlob.type || 'application/octet-stream';
          const reconstitutedFile = new File(
            [savedDoc.fileBlob], 
            savedDoc.fileName || savedDoc.title || 'document', 
            { type: mime }
          );
          setRefFile(reconstitutedFile);

          if (savedDoc.type === 'pdf') {
            const url = URL.createObjectURL(savedDoc.fileBlob);
            setPdfBlobUrl(url);
          } else if (savedDoc.type === 'image') {
            const url = URL.createObjectURL(savedDoc.fileBlob);
            setImageBlobUrl(url);
          }
        }
      } catch (err) {
        console.warn('Failed to restore reference document from DB:', err);
      }
    }

    restorePersistedRef();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync basic state to localStorage
  useEffect(() => {
    try {
      if (refType !== 'pdf' && refType !== 'image') {
        localStorage.setItem('kgv_split_ref_content', refContent);
      }
      localStorage.setItem('kgv_split_ref_title', refTitle);
      localStorage.setItem('kgv_split_ref_type', refType);
      localStorage.setItem('kgv_split_display_mode', displayMode);
      localStorage.setItem('kgv_split_font_offset', String(fontSizeOffset));
    } catch (e) {
      console.warn('Storage limit for ref content', e);
    }
  }, [refContent, refTitle, refType, displayMode, fontSizeOffset]);

  // Clean up Blob URLs on unmount or change
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
    };
  }, [pdfBlobUrl, imageBlobUrl]);

  // Universal file loader handler
  const handleLoadFile = async (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    try {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
      setPdfBlobUrl(null);
      setImageBlobUrl(null);
      setDocxHtml(null);
      setRefFile(file);

      const result = await processReferenceFile(file);
      setRefTitle(result.title);
      setRefType(result.fileType);
      setRefContent(result.rawText);
      setFileMeta({ size: result.fileSize, pageCount: result.pageCount });

      let targetDisplayMode: ViewDisplayMode = 'extract';

      if (result.fileType === 'pdf') {
        if (result.blobUrl) {
          setPdfBlobUrl(result.blobUrl);
        }
        targetDisplayMode = 'live';
      } else if (result.fileType === 'docx' && result.htmlContent) {
        setDocxHtml(result.htmlContent);
        targetDisplayMode = 'live';
      } else if (result.fileType === 'image' && result.blobUrl) {
        setImageBlobUrl(result.blobUrl);
        targetDisplayMode = 'live';
      } else if (result.fileType === 'markdown') {
        targetDisplayMode = 'live';
      } else {
        targetDisplayMode = 'extract';
      }

      setDisplayMode(targetDisplayMode);

      // Persist to Dexie IndexedDB
      await saveReferenceDocumentToDB({
        title: result.title,
        type: result.fileType,
        content: result.rawText,
        displayMode: targetDisplayMode,
        docxHtml: result.htmlContent || null,
        fileName: file.name,
        mimeType: file.type,
        fileBlob: file,
        fileMeta: { size: result.fileSize, pageCount: result.pageCount },
        fontSizeOffset,
      });

      showToast(`${t(lang, 'splitLoadedAndSaved') || 'Loaded & saved'}: ${file.name}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error loading file.';
      showToast(errMsg);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Clear / Delete reference file completely until user loads a new one
  const handleClearReferenceDoc = async () => {
    try {
      await clearReferenceDocumentFromDB();
      localStorage.removeItem('kgv_split_ref_content');
      localStorage.removeItem('kgv_split_ref_title');
      localStorage.removeItem('kgv_split_ref_type');
      localStorage.removeItem('kgv_split_display_mode');
    } catch (err) {
      console.warn('Error clearing reference document storage:', err);
    }

    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
    setPdfBlobUrl(null);
    setImageBlobUrl(null);
    setDocxHtml(null);
    setRefFile(null);
    setFileMeta({});
    setRefContent('');
    setRefTitle(t(lang, 'splitDefaultRefTitle') || 'Reference Document.md');
    setRefType('text');
    setDisplayMode('edit');
    showToast(t(lang, 'splitClearFileSuccess') || 'Reference document removed');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      handleLoadFile(file);
      e.target.value = '';
    }
  };

  // Direct Clipboard Paste handler (Button click)
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          const newTitle = t(lang, 'splitPastedDefaultTitle') || 'Pasted Text.txt';
          setRefContent(text);
          setRefType('text');
          setRefTitle(newTitle);
          setDisplayMode('extract');
          setRefFile(null);
          setPdfBlobUrl(null);
          setImageBlobUrl(null);
          setDocxHtml(null);
          setFileMeta({});

          await saveReferenceDocumentToDB({
            title: newTitle,
            type: 'text',
            content: text,
            displayMode: 'extract',
            fileBlob: null,
            fileName: newTitle,
            fontSizeOffset,
          });

          showToast(`${t(lang, 'splitPasteText') || 'Pasted'}: ${text.length} ${t(lang, 'characters')?.toLowerCase() || 'chars'}!`);
          return;
        }
      }
    } catch (err) {
      console.warn('Direct clipboard read restricted:', err);
    }

    // Fallback: Open paste modal
    setPasteModalText('');
    setPasteModalTitle(t(lang, 'splitPasteModalTitle') || 'Paste Reference Text');
    setShowPasteModal(true);
  };

  // Handle Global/Panel Paste Event (Ctrl+V / Cmd+V)
  const handlePanelPaste = async (e: React.ClipboardEvent) => {
    // If the event target is an active input/textarea, let standard paste happen
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && !target.classList.contains('kgv-split-auto-paste-target')) {
      return;
    }

    // Check if clipboard has files
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const file = e.clipboardData.files[0];
      handleLoadFile(file);
      return;
    }

    // Check plain text
    const pastedText = e.clipboardData.getData('text/plain');
    if (pastedText && pastedText.trim().length > 0) {
      e.preventDefault();
      const newTitle = t(lang, 'splitPastedDefaultTitle') || 'Pasted Text.txt';
      setRefContent(pastedText);
      setRefType('text');
      setRefTitle(newTitle);
      setDisplayMode('extract');
      setRefFile(null);
      setPdfBlobUrl(null);
      setImageBlobUrl(null);
      setDocxHtml(null);
      setFileMeta({});

      await saveReferenceDocumentToDB({
        title: newTitle,
        type: 'text',
        content: pastedText,
        displayMode: 'extract',
        fileBlob: null,
        fileName: newTitle,
        fontSizeOffset,
      });

      showToast(`${t(lang, 'splitPasteText') || 'Pasted'}: ${pastedText.length} ${t(lang, 'characters')?.toLowerCase() || 'chars'}!`);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLoadFile(e.dataTransfer.files[0]);
    }
  };

  // Handle text selection in reference area (Ghost Clip & Cite)
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const text = sel.toString().trim();
      if (text.length > 0) {
        setSelectedText(text);
        try {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (panelRef.current) {
            const panelRect = panelRef.current.getBoundingClientRect();
            const top = Math.max(12, rect.top - panelRect.top - 46);
            const left = Math.max(12, Math.min(panelRect.width - 270, rect.left - panelRect.left + (rect.width / 2) - 135));
            setPopoverPos({ top, left });
            return;
          }
        } catch {
          // Ignore range errors
        }
        return;
      }
    }
    setSelectedText('');
    setPopoverPos(null);
  };

  // Insert quote into main editor as blockquote with citation link/title
  const handleQuote = (textToQuote?: string) => {
    const quote = textToQuote || selectedText;
    if (quote) {
      onInsertQuoteToEditor(quote, refTitle || 'Reference');
      showToast(t(lang, 'quoteInsertedToast') || t(lang, 'splitInsertQuote') || 'Quote inserted to draft!');
      setSelectedText('');
      setPopoverPos(null);
    }
  };

  // Extract full or selected content to main editor preserving 100% Rich Text (HTML / Markdown) format
  const handleExtractRichToDraft = (textOrHtml?: string, isExplicitHtml: boolean = false) => {
    let htmlToInsert = '';
    let plainToInsert = '';

    if (textOrHtml) {
      if (isExplicitHtml) {
        htmlToInsert = sanitizePastedHtml(textOrHtml);
        const temp = document.createElement('div');
        temp.innerHTML = htmlToInsert;
        plainToInsert = temp.innerText || temp.textContent || '';
      } else if (refType === 'markdown') {
        htmlToInsert = parseMarkdownToHtml(textOrHtml);
        plainToInsert = textOrHtml;
      } else {
        htmlToInsert = textOrHtml
          .split(/\n\n+/)
          .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('');
        plainToInsert = textOrHtml;
      }
    } else {
      // Full document extraction
      if (docxHtml) {
        htmlToInsert = sanitizePastedHtml(docxHtml);
        plainToInsert = refContent;
      } else if (refType === 'markdown') {
        htmlToInsert = parseMarkdownToHtml(refContent);
        plainToInsert = refContent;
      } else {
        htmlToInsert = refContent
          .split(/\n\n+/)
          .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('');
        plainToInsert = refContent;
      }
    }

    if (htmlToInsert) {
      window.dispatchEvent(
        new CustomEvent('kgv-insert-formatted', {
          detail: { html: htmlToInsert, text: plainToInsert },
        })
      );
      showToast(lang === 'vi' ? 'Đã trích xuất giữ nguyên 100% định dạng sang bài viết!' : 'Extracted with 100% format to main draft!');
      setSelectedText('');
      setPopoverPos(null);
    }
  };

  // Drag and drop handler to drag formatted content directly to Tiptap editor
  const handleDragStartExtract = (e: React.DragEvent) => {
    const sel = window.getSelection();
    const text = sel && !sel.isCollapsed ? sel.toString().trim() : refContent;
    let html = '';
    if (docxHtml && (!sel || sel.isCollapsed)) {
      html = sanitizePastedHtml(docxHtml);
    } else if (refType === 'markdown') {
      html = parseMarkdownToHtml(text);
    } else {
      html = text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/html', html);
      e.dataTransfer.setData('text/plain', text);
      e.dataTransfer.effectAllowed = 'copy';
    }
  };

  // Insert quote as Footnote in editor with citation
  const handleAddAsFootnote = (textToQuote?: string) => {
    const quote = textToQuote || selectedText;
    if (quote) {
      if (onAddFootnoteCitation) {
        onAddFootnoteCitation(quote, refTitle || 'Reference');
      } else {
        onInsertQuoteToEditor(quote, refTitle || 'Reference');
      }
      showToast(t(lang, 'footnoteAddedToast') || 'Footnote citation added to draft!');
      setSelectedText('');
      setPopoverPos(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast(t(lang, 'copied') || 'Copied to clipboard!');
  };

  // Auto-save edited text or changes to DB
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only auto-save if not currently processing file
      if (!isProcessingFile && (refType === 'text' || refType === 'markdown' || refType === 'code')) {
        saveReferenceDocumentToDB({
          title: refTitle,
          type: refType,
          content: refContent,
          displayMode,
          docxHtml,
          fileName: refTitle,
          fileBlob: null,
          fileMeta,
          fontSizeOffset,
        });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [refContent, refTitle, refType, displayMode, docxHtml, fileMeta, fontSizeOffset, isProcessingFile]);

  // Select another page from current project
  const handleSelectProjectPage = async (p: Page) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = p.content;
    const cleanText = tmp.innerText || tmp.textContent || '';
    const newTitle = `${p.title || 'Untitled'} (Project Doc)`;
    setRefTitle(newTitle);
    setRefContent(cleanText);
    setRefType('text');
    setDisplayMode('extract');
    setRefFile(null);
    setPdfBlobUrl(null);
    setImageBlobUrl(null);
    setDocxHtml(null);
    setFileMeta({});

    await saveReferenceDocumentToDB({
      title: newTitle,
      type: 'text',
      content: cleanText,
      displayMode: 'extract',
      fileBlob: null,
      fileName: newTitle,
      fontSizeOffset,
    });

    showToast(`${t(lang, 'splitProjectDocs') || 'Project Page'}: ${p.title}`);
  };

  // Compare algorithm (Line-by-line diff between Main Editor and Reference Content)
  const getDiffLines = () => {
    const tmp = document.createElement('div');
    tmp.innerHTML = activePage?.content || '';
    const mainText = tmp.innerText || tmp.textContent || '';

    const lines1 = mainText.split('\n');
    const lines2 = refContent.split('\n');

    const maxLen = Math.max(lines1.length, lines2.length);
    const diffs: Array<{
      lineNum: number;
      left: string;
      right: string;
      status: 'same' | 'modified' | 'added' | 'removed';
    }> = [];

    for (let i = 0; i < maxLen; i++) {
      const l1 = lines1[i] !== undefined ? lines1[i] : null;
      const l2 = lines2[i] !== undefined ? lines2[i] : null;

      if (l1 === null) {
        diffs.push({ lineNum: i + 1, left: '', right: l2 || '', status: 'added' });
      } else if (l2 === null) {
        diffs.push({ lineNum: i + 1, left: l1, right: '', status: 'removed' });
      } else if (l1.trim() === l2.trim()) {
        diffs.push({ lineNum: i + 1, left: l1, right: l2, status: 'same' });
      } else {
        diffs.push({ lineNum: i + 1, left: l1, right: l2, status: 'modified' });
      }
    }

    const totalLines = diffs.length;
    const matchedLines = diffs.filter(d => d.status === 'same').length;
    const similarity = totalLines > 0 ? Math.round((matchedLines / totalLines) * 100) : 100;
    const wordCountMain = mainText.trim() ? mainText.trim().split(/\s+/).length : 0;
    const wordCountRef = refContent.trim() ? refContent.trim().split(/\s+/).length : 0;

    return { diffs, similarity, wordCountMain, wordCountRef };
  };

  const diffData = tab === 'compare' ? getDiffLines() : null;

  // Search highlighter
  const highlightSearch = (txt: string) => {
    if (!searchQuery.trim()) return txt;
    const parts = txt.split(new RegExp(`(${searchQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return parts.map((part, pIdx) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={pIdx} style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '0 2px', borderRadius: '2px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  // Render Markdown View
  const renderSimpleMarkdown = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-bold mt-4 mb-2 pb-1 border-b" style={{ borderColor: theme.borderFaint, color: theme.text }}>{highlightSearch(line.slice(2))}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-bold mt-3 mb-1" style={{ color: theme.text }}>{highlightSearch(line.slice(3))}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-semibold mt-2 mb-1" style={{ color: theme.text }}>{highlightSearch(line.slice(4))}</h3>;
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 pl-3 py-1 my-2 italic rounded-r text-sm" style={{ borderColor: theme.accent, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: theme.textMuted }}>
            {highlightSearch(line.slice(2))}
          </blockquote>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm my-0.5" style={{ color: theme.text }}>
            {highlightSearch(line.slice(2))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-sm my-0.5" style={{ color: theme.text }}>
            {highlightSearch(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm my-1 leading-relaxed" style={{ color: theme.text }}>
          {highlightSearch(line)}
        </p>
      );
    });
  };

  // Can this document be viewed in Live View?
  const hasLiveView = refType === 'pdf' || refType === 'docx' || refType === 'image' || refType === 'markdown';

  return (
    <div 
      ref={panelRef}
      onPaste={handlePanelPaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
      className="flex flex-col h-full w-full border-l relative overflow-hidden transition-all select-text outline-none"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text,
        fontFamily: uiFont,
      }}
    >
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept=".txt,.md,.markdown,.pdf,.docx,.doc,.json,.csv,.js,.ts,.tsx,.py,.html,.png,.jpg,.jpeg,.webp,.svg" 
        className="hidden" 
      />

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-all backdrop-blur-xs"
          style={{
            backgroundColor: theme.isDark ? 'rgba(20,20,22,0.92)' : 'rgba(255,255,255,0.92)',
            borderColor: theme.accent,
          }}
        >
          <FileUp size={44} className="animate-bounce mb-3" style={{ color: theme.accent }} />
          <h4 className="text-base font-bold mb-1" style={{ color: theme.text }}>
            {t(lang, 'splitDropFilesHere') || 'Drop file here'}
          </h4>
          <p className="text-xs text-center max-w-xs opacity-75" style={{ color: theme.textMuted }}>
            {t(lang, 'splitDropFilesDesc') || 'Supports PDF, Word (.docx), Markdown, TXT, Code and Images for Live View or text extraction.'}
          </p>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div 
          className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg border flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.accent,
            color: theme.text,
          }}
        >
          <Sparkles size={13} style={{ color: theme.accent }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Ghost Clip & Cite Floating Popover */}
      {selectedText && popoverPos && tab === 'reference' && displayMode !== 'edit' && (
        <div
          className="absolute z-50 flex items-center gap-1.5 p-1 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            backgroundColor: theme.isDark ? 'rgba(28, 28, 35, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: theme.accent,
            boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.3), 0 6px 12px -4px rgba(0, 0, 0, 0.15)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleQuote(selectedText)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 active:scale-95 shadow-xs shrink-0"
            style={{ backgroundColor: theme.accent }}
            title={t(lang, 'quoteToEditor') || 'Quote to Editor (Blockquote + Source)'}
          >
            <ArrowRight size={12} />
            <span>{t(lang, 'quoteToEditor') || 'Quote to Editor'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddAsFootnote(selectedText)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 shrink-0"
            style={{ borderColor: theme.border, color: theme.text }}
            title={t(lang, 'addAsFootnote') || 'Add as Footnote'}
          >
            <Bookmark size={12} style={{ color: theme.accent }} />
            <span>{t(lang, 'addAsFootnote') || 'Add as Footnote'}</span>
          </button>
          <div className="w-px h-4 mx-0.5" style={{ backgroundColor: theme.border }} />
          <button
            type="button"
            onClick={() => handleCopy(selectedText)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-xs shrink-0"
            style={{ color: theme.textMuted }}
            title={t(lang, 'copy') || 'Copy'}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      )}

      {/* Top Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b shrink-0 gap-2 select-none"
        style={{ borderColor: theme.borderFaint, backgroundColor: theme.bg }}
      >
        {/* Tab switcher: Reference vs Compare */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex items-center p-0.5 rounded-lg border text-xs" style={{ borderColor: theme.borderFaint, backgroundColor: theme.surface }}>
            <button
              onClick={() => setTab('reference')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${tab === 'reference' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'}`}
              style={{
                backgroundColor: tab === 'reference' ? theme.accentLight : 'transparent',
                color: tab === 'reference' ? theme.accent : theme.text,
              }}
            >
              <BookOpen size={13} />
              <span>{t(lang, 'splitReferenceTab') || 'Reference'}</span>
            </button>
            <button
              onClick={() => setTab('compare')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${tab === 'compare' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'}`}
              style={{
                backgroundColor: tab === 'compare' ? theme.accentLight : 'transparent',
                color: tab === 'compare' ? theme.accent : theme.text,
              }}
            >
              <Split size={13} />
              <span>{t(lang, 'splitCompareTab') || 'Compare'}</span>
            </button>
          </div>
        </div>

        {/* Action Controls: Paste, Upload, Close */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Direct Paste Button */}
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border font-medium transition-all hover:opacity-90 active:scale-95 shadow-xs"
            style={{ 
              backgroundColor: theme.accentLight,
              borderColor: theme.accentMid,
              color: theme.accent 
            }}
            title={t(lang, 'splitPastePrompt') || 'Paste text from Clipboard (Ctrl+V)'}
          >
            <Clipboard size={12} />
            <span>{t(lang, 'splitPasteText') || 'Paste'}</span>
          </button>

          {/* Upload Document Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
            style={{ borderColor: theme.borderFaint, backgroundColor: theme.surface, color: theme.text }}
            title={t(lang, 'splitUploadPrompt') || 'Upload document (.pdf, .docx, .txt, .md, images)'}
          >
            <Upload size={12} className={isProcessingFile ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{isProcessingFile ? (t(lang, 'loading') || 'Processing...') : (t(lang, 'splitUploadFile') || 'Upload')}</span>
          </button>

          {/* Close Panel Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md transition-all hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: theme.textMuted }}
            title={t(lang, 'close') || 'Close'}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Sub Header: Document Info & Mode Switcher (Live View vs Extracted Text vs Edit) */}
      <div 
        className="flex items-center justify-between px-3 py-1.5 border-b text-xs shrink-0 gap-2 flex-wrap"
        style={{ borderColor: theme.borderFaint, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
      >
        {/* Document Title & Type Badge & Clear button */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          <FileText size={13} className="shrink-0" style={{ color: theme.accent }} />
          <span className="truncate font-medium text-xs" title={refTitle} style={{ color: theme.text }}>
            {refTitle}
          </span>
          {fileMeta.pageCount && fileMeta.pageCount > 1 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded opacity-70 border shrink-0" style={{ borderColor: theme.borderFaint }}>
              {fileMeta.pageCount} {t(lang, 'pages')?.toLowerCase() || 'pages'}
            </span>
          )}
          <button
            type="button"
            onClick={handleClearReferenceDoc}
            className="p-1 rounded opacity-50 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all shrink-0 ml-1"
            title={t(lang, 'splitClearFile') || 'Clear reference document'}
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {tab === 'reference' && (
            <div className="flex items-center p-0.5 rounded border text-[11px]" style={{ borderColor: theme.borderFaint, backgroundColor: theme.surface }}>
              {/* Live View Button (if applicable) */}
              {hasLiveView && (
                <button
                  type="button"
                  onClick={() => setDisplayMode('live')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all font-medium ${displayMode === 'live' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                  style={{
                    backgroundColor: displayMode === 'live' ? theme.accentLight : 'transparent',
                    color: displayMode === 'live' ? theme.accent : theme.text,
                  }}
                  title={t(lang, 'splitLiveViewPrompt') || 'Direct Live View of file'}
                >
                  <Eye size={11} />
                  <span>{t(lang, 'splitLiveView') || 'Live View'}</span>
                </button>
              )}

              {/* Extract Text Button */}
              <button
                type="button"
                onClick={() => setDisplayMode('extract')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all font-medium ${displayMode === 'extract' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                style={{
                  backgroundColor: displayMode === 'extract' ? theme.accentLight : 'transparent',
                  color: displayMode === 'extract' ? theme.accent : theme.text,
                }}
                title={t(lang, 'splitExtractTextPrompt') || 'Extracted raw text for quotes & search'}
              >
                <FileCode size={11} />
                <span>{t(lang, 'splitExtractText') || 'Extract Text'}</span>
              </button>

              {/* Edit Scratchpad Button */}
              <button
                type="button"
                onClick={() => setDisplayMode(displayMode === 'edit' ? 'extract' : 'edit')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all font-medium ${displayMode === 'edit' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                style={{
                  backgroundColor: displayMode === 'edit' ? theme.accentLight : 'transparent',
                  color: displayMode === 'edit' ? theme.accent : theme.text,
                }}
                title={t(lang, 'splitEditScratchpadPrompt') || 'Direct edit reference content'}
              >
                <Edit3 size={11} />
                <span>{t(lang, 'splitEditScratchpad') || 'Edit'}</span>
              </button>
            </div>
          )}

          {/* Project Pages Dropdown Switcher */}
          {activeProject && activeProject.pages && activeProject.pages.length > 1 && (
            <div className="relative group shrink-0">
              <button
                type="button"
                className="text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 transition-all hover:opacity-80"
                style={{ borderColor: theme.borderFaint, color: theme.textMuted }}
              >
                <span>{t(lang, 'splitProjectDocs') || 'Project Docs'}</span>
                <ChevronRight size={11} className="rotate-90" />
              </button>
              <div 
                className="absolute right-0 top-full mt-1 hidden group-hover:block w-48 py-1 rounded-lg border shadow-xl z-50 max-h-48 overflow-y-auto"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider opacity-50">
                  {t(lang, 'splitPagesInProject') || 'Pages in Project'}
                </div>
                {activeProject.pages.map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => handleSelectProjectPage(p)}
                    className="w-full text-left px-2.5 py-1.5 text-xs truncate hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5"
                    style={{ color: theme.text }}
                  >
                    <FileText size={12} style={{ color: p.id === activePage?.id ? theme.accent : theme.textMuted }} />
                    <span className="truncate">{p.title || 'Untitled'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Selection Action Bar (when user selects text to quote/extract) */}
      {selectedText && tab === 'reference' && displayMode !== 'edit' && (
        <div 
          className="px-3 py-1.5 flex items-center justify-between gap-2 border-b animate-in fade-in slide-in-from-top-1 text-xs shrink-0 select-none flex-wrap sm:flex-nowrap"
          style={{ backgroundColor: theme.accentLight, borderColor: theme.accentMid }}
        >
          <span className="truncate text-xs font-medium flex items-center gap-1" style={{ color: theme.accent }}>
            <Quote size={13} />
            <span>{t(lang, 'ghostClipCite') || 'Ghost Clip & Cite'}: {selectedText.length} {t(lang, 'characters')?.toLowerCase() || 'chars'}</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleExtractRichToDraft(selectedText)}
              className="flex items-center gap-1 px-2.5 py-1 rounded shadow-xs font-medium transition-all hover:opacity-90 active:scale-95 text-xs text-white"
              style={{ backgroundColor: theme.accent }}
              title="Trích xuất đoạn chọn vào bài viết (giữ 100% định dạng Rich Text)"
            >
              <ArrowRight size={12} />
              <span>{lang === 'vi' ? 'Trích xuất vào bài' : 'Extract to Draft'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuote(selectedText)}
              className="flex items-center gap-1 px-2 py-1 rounded border shadow-xs font-medium transition-all hover:bg-white/40 active:scale-95 text-xs"
              style={{ borderColor: theme.accent, color: theme.accent }}
              title={t(lang, 'quoteToEditor') || 'Quote to Editor'}
            >
              <Quote size={12} />
              <span>{lang === 'vi' ? 'Trích dẫn' : 'Quote'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddAsFootnote(selectedText)}
              className="flex items-center gap-1 px-2 py-1 rounded border shadow-xs font-medium transition-all hover:bg-white/40 active:scale-95 text-xs"
              style={{ borderColor: theme.accent, color: theme.accent }}
              title={t(lang, 'addAsFootnote') || 'Add as Footnote'}
            >
              <Bookmark size={12} />
              <span>{lang === 'vi' ? 'Chú thích' : 'Footnote'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy(selectedText)}
              className="p-1 rounded border transition-all hover:bg-black/5 dark:hover:bg-white/10"
              style={{ borderColor: theme.accentMid, color: theme.accent }}
              title={t(lang, 'copy') || 'Copy'}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Reference Tab vs Compare Tab */}
      {tab === 'reference' ? (
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {/* Reference Toolbar: Search & Zoom */}
          {displayMode !== 'live' && (
            <div 
              className="flex items-center justify-between px-3 py-1.5 border-b gap-2 text-xs shrink-0"
              style={{ borderColor: theme.borderFaint }}
            >
              <div className="flex items-center gap-1 flex-1 relative">
                <Search size={12} className="absolute left-2 opacity-50" style={{ color: theme.text }} />
                <input
                  type="text"
                  placeholder={t(lang, 'splitSearchPlaceholder') || 'Search reference text...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-6 pr-2 py-0.5 text-xs rounded border outline-none bg-transparent"
                  style={{ borderColor: theme.borderFaint, color: theme.text }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="absolute right-1.5 opacity-60 hover:opacity-100">
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setFontSizeOffset(v => Math.max(-4, v - 1))}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title={t(lang, 'splitZoomOut') || 'Decrease font size'}
                >
                  <ZoomOut size={13} style={{ color: theme.textMuted }} />
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeOffset(v => Math.min(6, v + 1))}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title={t(lang, 'splitZoomIn') || 'Increase font size'}
                >
                  <ZoomIn size={13} style={{ color: theme.textMuted }} />
                </button>
              </div>
            </div>
          )}

          {/* 1. Live View Mode */}
          {displayMode === 'live' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
              {/* PDF Live View */}
              {refType === 'pdf' && (refFile || pdfBlobUrl) && (
                <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1 bg-black/5 dark:bg-white/5 border-b text-[11px]" style={{ borderColor: theme.borderFaint }}>
                    <span className="opacity-75">{t(lang, 'splitPdfViewer') || 'PDF Live Viewer'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDisplayMode('extract')}
                        className="flex items-center gap-1 hover:underline font-medium"
                        style={{ color: theme.accent }}
                      >
                        <FileCode size={11} />
                        <span>{t(lang, 'splitPdfSwitchExtract') || 'Switch to Extracted Text'}</span>
                      </button>
                      {pdfBlobUrl && (
                        <a
                          href={pdfBlobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 opacity-70 hover:opacity-100 hover:underline"
                          style={{ color: theme.text }}
                        >
                          <ExternalLink size={11} />
                          <span>{t(lang, 'splitPdfOpenTab') || 'Open in tab'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <PdfCanvasViewer 
                    file={refFile} 
                    blobUrl={pdfBlobUrl} 
                    theme={theme} 
                    lang={lang} 
                  />
                </div>
              )}

              {/* DOCX Live View */}
              {refType === 'docx' && (
                <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1 bg-black/5 dark:bg-white/5 border-b text-[11px]" style={{ borderColor: theme.borderFaint }}>
                    <span className="opacity-75">{t(lang, 'splitWordLiveView') || 'Word Document Live View'}</span>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('extract')}
                      className="flex items-center gap-1 hover:underline font-medium"
                      style={{ color: theme.accent }}
                    >
                      <FileCode size={11} />
                      <span>{t(lang, 'splitWordSwitchPlain') || 'Switch to Plain Text'}</span>
                    </button>
                  </div>
                  <div 
                    ref={contentContainerRef}
                    onMouseUp={handleMouseUp}
                    className="flex-1 overflow-y-auto p-4 kgv-scroll select-text prose max-w-none"
                    style={{
                      fontFamily: `'${docFont}', Georgia, serif`,
                      fontSize: `${15 + fontSizeOffset}px`,
                      lineHeight: '1.7',
                      color: theme.text,
                    }}
                    dangerouslySetInnerHTML={{ __html: docxHtml || `<p>${t(lang, 'splitNoContentLoaded') || 'No content'}</p>` }}
                  />
                </div>
              )}

              {/* Markdown Live View */}
              {refType === 'markdown' && (
                <div 
                  ref={contentContainerRef}
                  onMouseUp={handleMouseUp}
                  className="flex-1 overflow-y-auto p-4 select-text kgv-scroll"
                  style={{
                    fontFamily: `'${docFont}', Georgia, serif`,
                    fontSize: `${15 + fontSizeOffset}px`,
                    lineHeight: '1.7',
                  }}
                >
                  <div className="w-full max-w-2xl mx-auto">
                    {renderSimpleMarkdown(refContent)}
                  </div>
                </div>
              )}

              {/* Image Live View */}
              {refType === 'image' && imageBlobUrl && (
                <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1 bg-black/5 dark:bg-white/5 border-b text-[11px]" style={{ borderColor: theme.borderFaint }}>
                    <span className="opacity-75">{t(lang, 'splitImageReference') || 'Image Reference'}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setImageZoom(z => Math.max(30, z - 20))}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                        title={t(lang, 'splitZoomOutImg') || 'Zoom out image'}
                      >
                        <ZoomOut size={12} />
                      </button>
                      <span className="text-[10px] w-8 text-center">{imageZoom}%</span>
                      <button
                        type="button"
                        onClick={() => setImageZoom(z => Math.min(300, z + 20))}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                        title={t(lang, 'splitZoomInImg') || 'Zoom in image'}
                      >
                        <ZoomIn size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageZoom(100)}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                        title={t(lang, 'splitResetZoom') || 'Reset 100%'}
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/5 dark:bg-black/20">
                    <img 
                      src={imageBlobUrl} 
                      alt={refTitle} 
                      style={{ 
                        width: `${imageZoom}%`, 
                        maxWidth: 'none', 
                        objectFit: 'contain',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }} 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Extracted Text View Mode */}
          {displayMode === 'extract' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Quick Actions Bar for Extracted Text */}
              <div 
                className="px-3 py-1 border-b flex items-center justify-between text-[11px] shrink-0"
                style={{ borderColor: theme.borderFaint, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
              >
                <div className="flex items-center gap-2 opacity-70">
                  <span>{refContent.length} {t(lang, 'characters')?.toLowerCase() || 'chars'}</span>
                  <span>•</span>
                  <span>{refContent.trim() ? refContent.trim().split(/\s+/).filter(Boolean).length : 0} {t(lang, 'words')?.toLowerCase() || 'words'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtractRichToDraft()}
                    className="flex items-center gap-1 hover:underline font-semibold"
                    style={{ color: theme.accent }}
                    title="Trích xuất toàn bộ tài liệu sang bài viết chính (giữ 100% định dạng)"
                  >
                    <ArrowRight size={11} />
                    <span>{lang === 'vi' ? 'Trích xuất sang bài viết' : 'Extract to Draft'}</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(refContent)}
                    className="flex items-center gap-1 hover:underline font-medium"
                    style={{ color: theme.textMuted || theme.text }}
                  >
                    <Copy size={11} />
                    <span>{t(lang, 'splitCopyAll') || 'Copy All'}</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleQuote(refContent)}
                    className="flex items-center gap-1 hover:underline font-medium"
                    style={{ color: theme.textMuted || theme.text }}
                  >
                    <Quote size={11} />
                    <span>{t(lang, 'splitInsertAll') || 'Quote All'}</span>
                  </button>
                </div>
              </div>

              {/* Text Body with Drag & Drop to Editor support */}
              <div 
                ref={contentContainerRef}
                onMouseUp={handleMouseUp}
                draggable={true}
                onDragStart={handleDragStartExtract}
                className="flex-1 overflow-y-auto p-4 select-text kgv-scroll cursor-text"
                style={{
                  fontFamily: `'${docFont}', Georgia, serif`,
                  fontSize: `${15 + fontSizeOffset}px`,
                  lineHeight: '1.7',
                }}
              >
                <div className="w-full max-w-2xl mx-auto">
                  {!refContent.trim() ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed my-8" style={{ borderColor: theme.borderFaint }}>
                      <FileText size={36} className="mb-2 opacity-40" style={{ color: theme.accent }} />
                      <p className="font-medium text-sm mb-1">{t(lang, 'splitNoContentLoaded') || 'No reference content loaded'}</p>
                      <p className="text-xs opacity-60 max-w-xs mb-4">
                        {t(lang, 'splitUploadOrPasteDesc') || 'Upload document (.pdf, .docx, .txt, .md) or paste text from clipboard to start.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-xs"
                          style={{ backgroundColor: theme.accent }}
                        >
                          {t(lang, 'splitUploadFile') || 'Upload File'}
                        </button>
                        <button
                          type="button"
                          onClick={handlePasteFromClipboard}
                          className="px-3 py-1.5 rounded-lg text-xs border font-medium"
                          style={{ borderColor: theme.borderFaint, color: theme.text }}
                        >
                          {t(lang, 'splitPasteText') || 'Paste Text'}
                        </button>
                      </div>
                    </div>
                  ) : refType === 'markdown' ? renderSimpleMarkdown(refContent) : (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {searchQuery ? highlightSearch(refContent) : refContent}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. Direct Scratchpad Edit Mode */}
          {displayMode === 'edit' && (
            <div className="flex-1 flex flex-col min-h-0 p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b text-xs" style={{ borderColor: theme.borderFaint }}>
                <span className="font-medium opacity-75">
                  {t(lang, 'splitScratchpadTitle') || 'Direct Edit / Scratchpad Mode'}
                </span>
                <span className="text-[11px] opacity-60">
                  {refContent.length} {t(lang, 'characters')?.toLowerCase() || 'chars'} • {refContent.trim().split(/\s+/).filter(Boolean).length} {t(lang, 'words')?.toLowerCase() || 'words'}
                </span>
              </div>
              <textarea
                value={refContent}
                onChange={(e) => setRefContent(e.target.value)}
                placeholder={t(lang, 'splitScratchpadPlaceholder') || 'Type or paste reference text here...'}
                className="w-full flex-1 p-3 text-sm rounded-lg border outline-none resize-none leading-relaxed kgv-scroll kgv-split-auto-paste-target"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                  borderColor: theme.borderFaint,
                  color: theme.text,
                  fontFamily: `'${docFont}', Georgia, serif`,
                }}
              />
            </div>
          )}

          {/* Bottom Footer Helper & Quick Actions */}
          <div 
            className="px-3 py-1.5 border-t text-[11px] flex items-center justify-between shrink-0 select-none gap-2"
            style={{ borderColor: theme.borderFaint, color: theme.textFaint }}
          >
            <span className="truncate">
              {t(lang, 'splitTip') || 'Tip: Press Ctrl+V to paste or select text to quote'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="hover:underline font-medium flex items-center gap-1"
                style={{ color: theme.accent }}
              >
                <Clipboard size={11} />
                <span>{t(lang, 'splitPasteText') || 'Paste'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Compare / Diff Tab */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Diff Metrics Banner */}
          {diffData && (
            <div 
              className="px-3 py-2 border-b flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap"
              style={{ borderColor: theme.borderFaint, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
            >
              <div className="flex items-center gap-3">
                <div>
                  <span className="opacity-60">{t(lang, 'splitSimilarity') || 'Similarity'}: </span>
                  <span className="font-bold" style={{ color: diffData.similarity > 70 ? '#16a34a' : theme.accent }}>
                    {diffData.similarity}%
                  </span>
                </div>
                <div className="h-3 w-px bg-black/10 dark:bg-white/10" />
                <div>
                  <span className="opacity-60">{t(lang, 'splitMainDoc') || 'Main Doc'}: </span>
                  <span className="font-semibold">{diffData.wordCountMain} {t(lang, 'words')?.toLowerCase() || 'words'}</span>
                </div>
                <div className="h-3 w-px bg-black/10 dark:bg-white/10" />
                <div>
                  <span className="opacity-60">{t(lang, 'splitRefDoc') || 'Reference'}: </span>
                  <span className="font-semibold">{diffData.wordCountRef} {t(lang, 'words')?.toLowerCase() || 'words'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  {t(lang, 'splitMatch') || 'Match'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  {t(lang, 'splitDiff') || 'Diff'}
                </span>
              </div>
            </div>
          )}

          {/* Diff Side-by-Side Table */}
          <div className="flex-1 overflow-y-auto p-2 kgv-scroll select-text">
            <div className="w-full text-xs font-mono" style={{ fontFamily: `'${monoFont}', monospace` }}>
              <div className="grid grid-cols-2 gap-2 pb-1 mb-2 border-b font-bold opacity-60 text-[11px]" style={{ borderColor: theme.borderFaint }}>
                <div>{t(lang, 'splitMainDoc') || 'Current Draft'}</div>
                <div>{t(lang, 'splitRefDoc') || 'Reference Doc'}</div>
              </div>

              {diffData?.diffs.map((d, index) => {
                const isDiff = d.status !== 'same';
                return (
                  <div 
                    key={index}
                    className="grid grid-cols-2 gap-2 py-1 px-1.5 rounded transition-colors text-[12px] leading-relaxed my-0.5"
                    style={{
                      backgroundColor: isDiff 
                        ? (theme.isDark ? 'rgba(234, 179, 8, 0.12)' : 'rgba(254, 240, 138, 0.35)')
                        : 'transparent',
                    }}
                  >
                    <div className="overflow-x-auto whitespace-pre-wrap break-words pr-1 border-r" style={{ borderColor: theme.borderFaint, color: theme.text }}>
                      {d.left || <span className="italic opacity-30">— ({t(lang, 'splitEmptyDiff') || 'empty'}) —</span>}
                    </div>
                    <div className="overflow-x-auto whitespace-pre-wrap break-words pl-1 flex items-start justify-between gap-1 group" style={{ color: theme.text }}>
                      <span>{d.right || <span className="italic opacity-30">— ({t(lang, 'splitEmptyDiff') || 'empty'}) —</span>}</span>
                      {d.right && (
                        <button
                          type="button"
                          onClick={() => handleQuote(d.right)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[10px] border transition-opacity shrink-0"
                          style={{ borderColor: theme.borderFaint, color: theme.accent }}
                          title={t(lang, 'splitInsertLine') || 'Insert line into draft'}
                        >
                          <ArrowRight size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Paste Dialog / Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div 
            className="w-full max-w-lg rounded-xl border shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
              fontFamily: uiFont,
            }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.borderFaint }}>
              <div className="flex items-center gap-2">
                <Clipboard size={16} style={{ color: theme.accent }} />
                <h3 className="font-bold text-sm">
                  {t(lang, 'splitPasteModalTitle') || 'Paste Reference Text'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium opacity-75">
                {t(lang, 'splitDocTitleOptional') || 'Document Title (Optional):'}
              </label>
              <input
                type="text"
                value={pasteModalTitle}
                onChange={(e) => setPasteModalTitle(e.target.value)}
                placeholder={t(lang, 'splitPastedDefaultTitle') || 'E.g. Research Notes'}
                className="w-full px-3 py-1.5 text-xs rounded border outline-none bg-transparent"
                style={{ borderColor: theme.borderFaint, color: theme.text }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium opacity-75">
                {t(lang, 'splitTextContent') || 'Text Content:'}
              </label>
              <textarea
                rows={8}
                value={pasteModalText}
                onChange={(e) => setPasteModalText(e.target.value)}
                placeholder={t(lang, 'splitPastePlaceholder') || 'Paste text content (Ctrl+V) here...'}
                className="w-full p-3 text-xs rounded-lg border outline-none resize-none leading-relaxed bg-transparent"
                style={{ borderColor: theme.borderFaint, color: theme.text, fontFamily: `'${docFont}', Georgia, serif` }}
                autoFocus
              />
              <div className="flex items-center justify-between text-[11px] opacity-60">
                <span>{pasteModalText.length} {t(lang, 'characters')?.toLowerCase() || 'chars'}</span>
                <span>{pasteModalText.trim() ? pasteModalText.trim().split(/\s+/).length : 0} {t(lang, 'words')?.toLowerCase() || 'words'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: theme.borderFaint }}>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs border hover:opacity-80 transition-all"
                style={{ borderColor: theme.borderFaint, color: theme.textMuted }}
              >
                {t(lang, 'cancel') || 'Cancel'}
              </button>

              {refContent && (
                <button
                  type="button"
                  disabled={!pasteModalText.trim()}
                  onClick={async () => {
                    const combined = `${refContent}\n\n${pasteModalText.trim()}`;
                    const targetTitle = pasteModalTitle.trim() || refTitle;
                    setRefContent(combined);
                    setRefType('text');
                    if (pasteModalTitle.trim()) setRefTitle(pasteModalTitle.trim());
                    setShowPasteModal(false);
                    setDisplayMode('extract');
                    setRefFile(null);
                    setPdfBlobUrl(null);
                    setImageBlobUrl(null);
                    setDocxHtml(null);
                    setFileMeta({});

                    await saveReferenceDocumentToDB({
                      title: targetTitle,
                      type: 'text',
                      content: combined,
                      displayMode: 'extract',
                      fileBlob: null,
                      fileName: targetTitle,
                      fontSizeOffset,
                    });

                    showToast(t(lang, 'splitAppendToEnd') || 'Appended text!');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs border font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                  style={{ borderColor: theme.borderFaint, backgroundColor: theme.surface, color: theme.text }}
                >
                  {t(lang, 'splitAppendToEnd') || 'Append to End'}
                </button>
              )}

              <button
                type="button"
                disabled={!pasteModalText.trim()}
                onClick={async () => {
                  const targetContent = pasteModalText.trim();
                  const targetTitle = pasteModalTitle.trim() || t(lang, 'splitPastedDefaultTitle') || 'Pasted Text.txt';
                  setRefContent(targetContent);
                  setRefType('text');
                  setRefTitle(targetTitle);
                  setShowPasteModal(false);
                  setDisplayMode('extract');
                  setRefFile(null);
                  setPdfBlobUrl(null);
                  setImageBlobUrl(null);
                  setDocxHtml(null);
                  setFileMeta({});

                  await saveReferenceDocumentToDB({
                    title: targetTitle,
                    type: 'text',
                    content: targetContent,
                    displayMode: 'extract',
                    fileBlob: null,
                    fileName: targetTitle,
                    fontSizeOffset,
                  });

                  showToast(t(lang, 'splitReplaceOpen') || 'Loaded pasted text!');
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white shadow-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                style={{ backgroundColor: theme.accent }}
              >
                {t(lang, 'splitReplaceOpen') || 'Replace & Open'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
