import TurndownService from 'turndown';
import { marked } from 'marked';
import type { Editor } from '@tiptap/react';
import { parseClipboardTable, insertParsedTable } from './tableUtils';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});

// Add rules to Turndown for custom styling, tables, underlines
turndownService.addRule('underline', {
  filter: ['u'],
  replacement: (content) => `<u>${content}</u>`,
});

turndownService.addRule('strikethrough', {
  filter: ['s', 'strike', 'del'],
  replacement: (content) => `~~${content}~~`,
});

turndownService.addRule('table', {
  filter: 'table',
  replacement: (content, node) => {
    try {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.rows);
      if (rows.length === 0) return content;

      let md = '\n\n';
      const matrix: string[][] = [];

      rows.forEach((row) => {
        const cells = Array.from(row.cells).map((c) => (c.textContent || '').trim().replace(/\|/g, '\\|'));
        matrix.push(cells);
      });

      if (matrix.length === 0) return content;

      const colCount = Math.max(...matrix.map((r) => r.length));
      
      // Header row
      const header = matrix[0] || [];
      const paddedHeader = Array.from({ length: colCount }, (_, i) => header[i] || '');
      md += '| ' + paddedHeader.join(' | ') + ' |\n';
      md += '| ' + Array.from({ length: colCount }, () => '---').join(' | ') + ' |\n';

      // Data rows
      for (let r = 1; r < matrix.length; r++) {
        const row = matrix[r];
        const paddedRow = Array.from({ length: colCount }, (_, i) => row[i] || '');
        md += '| ' + paddedRow.join(' | ') + ' |\n';
      }

      return md + '\n';
    } catch {
      return content;
    }
  },
});

/**
 * Clean HTML Sanitizer:
 * Strips Microsoft Word junk, unwanted external classes, noisy font families, inline RGBs,
 * keeping pure semantic tags (h1-h6, p, blockquote, strong, em, u, s, code, pre, ul, ol, li, a, table, tr, td, th, img, br).
 */
export function sanitizePastedHtml(rawHtml: string): string {
  if (!rawHtml || !rawHtml.trim()) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // 1. Remove comments, XML elements, style, script, link, meta
    const removals = doc.querySelectorAll('style, script, link, meta, noscript, o\\:p, xml, object, embed');
    removals.forEach((el) => el.remove());

    // 2. Clean attributes and unwanted inline styling from all elements
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      const tagName = el.tagName.toLowerCase();

      // Remove Word specific classes and generic classes
      const classAttr = el.getAttribute('class') || '';
      if (classAttr) {
        if (/Mso|msonormal|WordSection/i.test(classAttr)) {
          el.removeAttribute('class');
        } else {
          // Keep only simple semantic classes if needed, otherwise strip
          el.removeAttribute('class');
        }
      }

      // Clean styles: remove font-family, font-size, color, background-color (to inherit theme), margin, line-height
      const styleAttr = el.getAttribute('style');
      if (styleAttr) {
        // Only keep table cell alignment or specific border data if relevant
        const textAlignMatch = styleAttr.match(/text-align:\s*(left|center|right|justify)/i);
        el.removeAttribute('style');
        if (textAlignMatch && (tagName === 'td' || tagName === 'th' || tagName === 'p' || tagName.startsWith('h'))) {
          el.setAttribute('style', `text-align: ${textAlignMatch[1].toLowerCase()};`);
        }
      }

      // Clean ids, data-attributes (except footnotes or table metadata)
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        const aName = attr.name.toLowerCase();
        if (
          aName.startsWith('on') ||
          aName.startsWith('aria-') ||
          aName === 'id' ||
          (aName.startsWith('data-') && !aName.startsWith('data-footnote') && !aName.startsWith('data-table') && !aName.startsWith('data-bg'))
        ) {
          el.removeAttribute(attr.name);
        }
      });

      // Unwrap meaningless wrapper <div> or <span> that have no attributes
      if ((tagName === 'span' || tagName === 'div') && el.attributes.length === 0) {
        if (tagName === 'div') {
          // Change empty div to paragraph
          const p = doc.createElement('p');
          while (el.firstChild) {
            p.appendChild(el.firstChild);
          }
          el.parentNode?.replaceChild(p, el);
        } else if (tagName === 'span') {
          // Unwrap span
          const parent = el.parentNode;
          while (el.firstChild) {
            parent?.insertBefore(el.firstChild, el);
          }
          parent?.removeChild(el);
        }
      }
    });

    const cleanHtml = doc.body.innerHTML.trim();
    return cleanHtml;
  } catch (err) {
    console.warn('HTML Sanitizer fallback:', err);
    return rawHtml;
  }
}

/**
 * Intelligent Markdown syntax detector:
 * Checks if a plain text string contains common markdown structures
 * (Headings, Bold, Italic, Blockquotes, Lists, Tables, Code fences, Links).
 */
export function isMarkdownText(text: string): boolean {
  if (!text || text.trim().length < 2) return false;
  const trimmed = text.trim();

  // Heading markers: # H1, ## H2, ### H3
  const hasHeading = /^(#{1,6})\s+\S+/m.test(trimmed);

  // Markdown lists: - item, * item, + item, - [ ] checkbox, 1. item
  const hasList = /^(\s*[-*+]\s+\[[ xX]\]|\s*[-*+]\s+|\s*\d+\.\s+)\S+/m.test(trimmed);

  // Blockquote: > quote
  const hasBlockquote = /^>\s+\S+/m.test(trimmed);

  // Code block: ```code``` or `inline code`
  const hasCodeBlock = /```[\s\S]*?```/.test(trimmed) || /`[^`\n]+`/.test(trimmed);

  // Markdown bold/italic: **bold**, *italic*, __bold__, _italic_, ~~strike~~
  const hasEmphasis = /(\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^* \n]+\*(?!\*)|~~[^~]+~~)/.test(trimmed);

  // Markdown table: | col 1 | col 2 | \n | --- | --- |
  const hasTable = /\|[^\n]+\|\n\|[\s:-|-]+\|/.test(trimmed);

  // Markdown link/image: [text](url) or ![alt](url)
  const hasLinkOrImage = /!?\[[^\]\n]+\]\([^)\s]+\)/.test(trimmed);

  // Horizontal rule: ---, ***, ___
  const hasHr = /^(\*{3,}|-{3,}|_{3,})$/m.test(trimmed);

  // Count signals
  let signals = 0;
  if (hasHeading) signals += 2;
  if (hasList) signals += 1.5;
  if (hasBlockquote) signals += 1.5;
  if (hasCodeBlock) signals += 2;
  if (hasEmphasis) signals += 1;
  if (hasTable) signals += 3;
  if (hasLinkOrImage) signals += 1.5;
  if (hasHr) signals += 1;

  return signals >= 2;
}

/**
 * Converts Markdown string to clean, safe semantic HTML using marked
 */
export function parseMarkdownToHtml(markdown: string): string {
  try {
    const rawHtml = marked.parse(markdown, {
      gfm: true,
      breaks: true,
      async: false,
    }) as string;
    return sanitizePastedHtml(rawHtml);
  } catch (err) {
    console.warn('Markdown parsing error:', err);
    return markdown
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
}

/**
 * Converts HTML to clean Markdown using Turndown
 */
export function convertHtmlToMarkdown(html: string): string {
  try {
    return turndownService.turndown(html || '');
  } catch (err) {
    console.warn('Turndown conversion error:', err);
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerText || div.textContent || '';
  }
}

/**
 * Handles Smart Multi-tier Paste for Tiptap Editor
 * Returns true if paste was handled customly, false to let default editor behavior proceed.
 */
export function handleSmartEditorPaste(editor: Editor, event: React.ClipboardEvent | ClipboardEvent): boolean {
  if (!editor || editor.isDestroyed || !event.clipboardData) return false;

  const clipboardData = event.clipboardData;
  const html = clipboardData.getData('text/html') || '';
  const text = clipboardData.getData('text/plain') || '';

  // Tier 1: Check for Table structure (from Excel / Google Sheets / Numbers / HTML / TSV / Markdown Table)
  const tableMatrix = parseClipboardTable(text, html);
  if (tableMatrix && tableMatrix.length > 0 && (tableMatrix.length > 1 || (tableMatrix[0] && tableMatrix[0].length > 1))) {
    const ok = insertParsedTable(editor, tableMatrix);
    if (ok) {
      event.preventDefault();
      return true;
    }
  }

  // Tier 2: Check for Rich HTML (Word / Google Docs / Web pages)
  if (html && html.trim().length > 0) {
    const cleanedHtml = sanitizePastedHtml(html);
    if (cleanedHtml && cleanedHtml.length > 0) {
      // Check if it has actual semantic tags or is just a wrapped plain string
      const hasSemanticTags = /<(h[1-6]|p|blockquote|ul|ol|li|strong|b|em|i|u|s|code|pre|a|table|img)/i.test(cleanedHtml);
      if (hasSemanticTags) {
        event.preventDefault();
        editor.chain().focus().insertContent(cleanedHtml).run();
        return true;
      }
    }
  }

  // Tier 3: Check for Raw Markdown syntax in plain text
  if (text && isMarkdownText(text)) {
    event.preventDefault();
    const mdHtml = parseMarkdownToHtml(text);
    if (mdHtml && mdHtml.trim()) {
      editor.chain().focus().insertContent(mdHtml).run();
      return true;
    }
  }

  // Fallback to default paste
  return false;
}

/**
 * Smart Context Copy:
 * Formats current editor selection or entire doc into 'rich', 'markdown', or 'plain'
 */
export async function copySelectionAs(
  editor: Editor,
  format: 'rich' | 'markdown' | 'plain'
): Promise<{ success: boolean; charCount: number; format: string }> {
  if (!editor || editor.isDestroyed) return { success: false, charCount: 0, format };

  const { state } = editor;
  const { from, to, empty } = state.selection;

  let selectedHtml = '';
  let selectedText = '';

  if (empty) {
    // If selection is empty, copy the entire document
    selectedHtml = editor.getHTML();
    selectedText = editor.getText();
  } else {
    // Extract selected slice HTML
    try {
      const slice = state.selection.content();
      const div = document.createElement('div');
      const fragment = slice.content;
      const serializer = (editor.view as unknown as { serializer?: { serializeFragment: (f: unknown) => DocumentFragment } }).serializer;

      if (serializer && serializer.serializeFragment) {
        const domFragment = serializer.serializeFragment(fragment);
        div.appendChild(domFragment);
        selectedHtml = div.innerHTML;
      } else {
        // Fallback serializer using standard DOM
        selectedHtml = editor.getHTML();
      }
      selectedText = state.doc.textBetween(from, to, '\n');
    } catch {
      selectedHtml = editor.getHTML();
      selectedText = editor.getText();
    }
  }

  try {
    if (format === 'markdown') {
      const md = convertHtmlToMarkdown(selectedHtml || selectedText);
      await navigator.clipboard.writeText(md);
      return { success: true, charCount: md.length, format: 'Markdown' };
    } else if (format === 'plain') {
      const plain = selectedText || editor.getText();
      await navigator.clipboard.writeText(plain);
      return { success: true, charCount: plain.length, format: 'Plain Text' };
    } else {
      // Rich text (HTML + Plain text)
      const cleanHtml = sanitizePastedHtml(selectedHtml);
      const plain = selectedText || editor.getText();

      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        const blobHtml = new Blob([cleanHtml], { type: 'text/html' });
        const blobText = new Blob([plain], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      return { success: true, charCount: plain.length, format: 'Rich Text' };
    }
  } catch (err) {
    console.warn('Clipboard write error:', err);
    // Fallback: simple text write
    try {
      const plain = selectedText || editor.getText();
      await navigator.clipboard.writeText(plain);
      return { success: true, charCount: plain.length, format: 'Plain Text' };
    } catch {
      return { success: false, charCount: 0, format };
    }
  }
}
