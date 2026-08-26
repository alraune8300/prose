import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { useNotionStore } from '../apps/notion-workspace/stores/notionStore';
import { NotionPage, Project } from '../types';
import { saveProjectToDB, getProjectFromDB, getAllProjectsFromDB } from '../db';

export const CORE_DOCUMENTS_STORAGE_KEY = 'core_documents_v1';
export const NOTION_WORKSPACE_STORAGE_KEY = 'notion_workspace_tree_v1';

export interface CoreDocumentMetadata {
  title: string;
  coverUrl?: string | null;
  icon?: string;
  exportedFrom: string;
  createdAt: number;
  [key: string]: any;
}

export interface CoreDocumentRecord {
  id: string;
  title: string;
  content: string; // Complete Markdown with YAML frontmatter
  rawMarkdown: string; // Markdown without frontmatter
  metadata: CoreDocumentMetadata;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parses TipTap JSON or HTML string into standard Markdown with support for:
 * - Headings (H1, H2, H3)
 * - Paragraphs and inline formatting (bold, italic, strikethrough, inline code, links)
 * - Bullet and Ordered Lists
 * - TaskLists (- [ ] / - [x])
 * - Callouts (> [!NOTE])
 * - Codeblocks (```lang)
 * - Databases (Table / Kanban -> Markdown table)
 * - HTML Tables
 */
export function convertTipTapToMarkdown(content: string | any): string {
  if (!content) return '';

  // If content is already a TipTap JSON object or JSON string
  let docNode: any = null;
  if (typeof content === 'object' && content !== null && content.type === 'doc') {
    docNode = content;
  } else if (typeof content === 'string' && content.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed && parsed.type === 'doc') {
        docNode = parsed;
      }
    } catch {
      // Not JSON, continue to HTML parser
    }
  }

  if (docNode) {
    return parseTipTapJsonToMarkdown(docNode);
  }

  // Otherwise, parse as HTML using DOMParser
  return parseHtmlToMarkdown(typeof content === 'string' ? content : '');
}

function parseInlineMarks(text: string, marks?: any[]): string {
  if (!marks || marks.length === 0) return text;
  let formatted = text;

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        formatted = `**${formatted}**`;
        break;
      case 'italic':
        formatted = `*${formatted}*`;
        break;
      case 'strike':
        formatted = `~~${formatted}~~`;
        break;
      case 'code':
        formatted = `\`${formatted}\``;
        break;
      case 'link':
        formatted = `[${formatted}](${mark.attrs?.href || '#'})`;
        break;
      case 'underline':
        formatted = `<u>${formatted}</u>`;
        break;
    }
  }

  return formatted;
}

function parseTipTapJsonToMarkdown(node: any): string {
  if (!node) return '';

  const renderChildren = (children?: any[]): string => {
    if (!children || !Array.isArray(children)) return '';
    return children.map((c) => {
      if (c.type === 'text') {
        return parseInlineMarks(c.text || '', c.marks);
      }
      return parseTipTapJsonToMarkdown(c);
    }).join('');
  };

  switch (node.type) {
    case 'doc':
      return (node.content || []).map((child: any) => parseTipTapJsonToMarkdown(child)).join('\n\n');

    case 'heading': {
      const level = node.attrs?.level || 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${renderChildren(node.content)}`;
    }

    case 'paragraph':
      return renderChildren(node.content);

    case 'bulletList':
      return (node.content || [])
        .map((li: any) => `* ${renderChildren(li.content)}`)
        .join('\n');

    case 'orderedList': {
      const start = node.attrs?.start || 1;
      return (node.content || [])
        .map((li: any, idx: number) => `${start + idx}. ${renderChildren(li.content)}`)
        .join('\n');
    }

    case 'listItem':
      return renderChildren(node.content);

    case 'taskList':
      return (node.content || [])
        .map((item: any) => {
          const checked = item.attrs?.checked === true;
          return `- [${checked ? 'x' : ' '}] ${renderChildren(item.content)}`;
        })
        .join('\n');

    case 'taskItem': {
      const checked = node.attrs?.checked === true;
      return `- [${checked ? 'x' : ' '}] ${renderChildren(node.content)}`;
    }

    case 'callout':
      return `> [!NOTE]\n> ${renderChildren(node.content)}`;

    case 'codeBlock': {
      const lang = node.attrs?.language || '';
      const code = (node.content || []).map((c: any) => c.text || '').join('');
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case 'blockquote':
      return `> ${renderChildren(node.content)}`;

    case 'horizontalRule':
      return '---';

    case 'image': {
      const alt = node.attrs?.alt || '';
      const src = node.attrs?.src || '';
      return `![${alt}](${src})`;
    }

    case 'database': {
      const columns: Array<{ key: string; label: string }> = node.attrs?.columns || [
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status' },
        { key: 'tags', label: 'Tags' },
        { key: 'date', label: 'Date' }
      ];
      const rows: Array<{ title?: string; status?: string; tags?: string[]; date?: string }> = node.attrs?.rows || [];

      const headerLine = `| ${columns.map(c => c.label).join(' | ')} |`;
      const separatorLine = `| ${columns.map(() => '---').join(' | ')} |`;
      const dataLines = rows.map(r => {
        const cells = columns.map(c => {
          if (c.key === 'tags') return Array.isArray(r.tags) ? r.tags.join(', ') : '';
          if (c.key === 'title') return r.title || '';
          if (c.key === 'status') return r.status || '';
          if (c.key === 'date') return r.date || '';
          return (r as any)[c.key] || '';
        });
        return `| ${cells.join(' | ')} |`;
      });

      return [headerLine, separatorLine, ...dataLines].join('\n');
    }

    case 'table': {
      const rows = (node.content || []).map((rowNode: any) => {
        const cells = (rowNode.content || []).map((cellNode: any) => renderChildren(cellNode.content).replace(/\n/g, ' '));
        return `| ${cells.join(' | ')} |`;
      });
      if (rows.length === 0) return '';
      // Ensure separator after first row
      const firstRowCellCount = (node.content?.[0]?.content || []).length || 1;
      const separator = `| ${Array(firstRowCellCount).fill('---').join(' | ')} |`;
      return [rows[0], separator, ...rows.slice(1)].join('\n');
    }

    default:
      return renderChildren(node.content);
  }
}

function parseHtmlToMarkdown(html: string): string {
  if (!html || !html.trim()) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function nodeToMd(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // Check for custom data-type attributes
    const dataType = el.getAttribute('data-type');
    if (dataType === 'callout') {
      const inner = Array.from(el.childNodes).map(nodeToMd).join('').trim();
      return `> [!NOTE]\n> ${inner}\n\n`;
    }

    if (dataType === 'database') {
      try {
        const rowsAttr = el.getAttribute('data-rows');
        const colsAttr = el.getAttribute('data-columns');
        const rows = rowsAttr ? JSON.parse(rowsAttr) : [];
        const cols = colsAttr ? JSON.parse(colsAttr) : [
          { key: 'title', label: 'Title' },
          { key: 'status', label: 'Status' },
          { key: 'tags', label: 'Tags' },
          { key: 'date', label: 'Date' }
        ];

        const headerLine = `| ${cols.map((c: any) => c.label).join(' | ')} |`;
        const separatorLine = `| ${cols.map(() => '---').join(' | ')} |`;
        const dataLines = rows.map((r: any) => {
          const cells = cols.map((c: any) => {
            if (c.key === 'tags') return Array.isArray(r.tags) ? r.tags.join(', ') : '';
            return r[c.key] || '';
          });
          return `| ${cells.join(' | ')} |`;
        });
        return `${[headerLine, separatorLine, ...dataLines].join('\n')}\n\n`;
      } catch {
        return '';
      }
    }

    if (dataType === 'taskList' || (tagName === 'ul' && el.getAttribute('data-type') === 'taskList')) {
      const items = Array.from(el.children).map(li => {
        const checked = li.getAttribute('data-checked') === 'true';
        const text = Array.from(li.childNodes).map(nodeToMd).join('').trim();
        return `- [${checked ? 'x' : ' '}] ${text}`;
      });
      return `${items.join('\n')}\n\n`;
    }

    if (dataType === 'taskItem') {
      const checked = el.getAttribute('data-checked') === 'true';
      const text = Array.from(el.childNodes).map(nodeToMd).join('').trim();
      return `- [${checked ? 'x' : ' '}] ${text}`;
    }

    switch (tagName) {
      case 'h1':
        return `# ${Array.from(el.childNodes).map(nodeToMd).join('').trim()}\n\n`;
      case 'h2':
        return `## ${Array.from(el.childNodes).map(nodeToMd).join('').trim()}\n\n`;
      case 'h3':
        return `### ${Array.from(el.childNodes).map(nodeToMd).join('').trim()}\n\n`;
      case 'h4':
        return `#### ${Array.from(el.childNodes).map(nodeToMd).join('').trim()}\n\n`;
      case 'h5':
        return `##### ${Array.from(el.childNodes).map(nodeToMd).join('').trim()}\n\n`;
      case 'h6':
        return `###### ${Array.from(el.childNodes).map(nodeToMd).join('').trim()}\n\n`;

      case 'p':
        return `${Array.from(el.childNodes).map(nodeToMd).join('').trim()}\n\n`;

      case 'strong':
      case 'b':
        return `**${Array.from(el.childNodes).map(nodeToMd).join('')}**`;

      case 'em':
      case 'i':
        return `*${Array.from(el.childNodes).map(nodeToMd).join('')}*`;

      case 's':
      case 'strike':
      case 'del':
        return `~~${Array.from(el.childNodes).map(nodeToMd).join('')}~~`;

      case 'code':
        if (el.parentElement?.tagName.toLowerCase() === 'pre') {
          return el.textContent || '';
        }
        return `\`${el.textContent || ''}\``;

      case 'pre': {
        const codeEl = el.querySelector('code');
        const lang = codeEl?.className.replace(/language-/, '') || '';
        const codeContent = codeEl ? codeEl.textContent : el.textContent;
        return `\`\`\`${lang}\n${codeContent || ''}\n\`\`\`\n\n`;
      }

      case 'blockquote':
        return `> ${Array.from(el.childNodes).map(nodeToMd).join('').trim()}\n\n`;

      case 'ul': {
        const items = Array.from(el.children).map(li => `* ${Array.from(li.childNodes).map(nodeToMd).join('').trim()}`);
        return `${items.join('\n')}\n\n`;
      }

      case 'ol': {
        const items = Array.from(el.children).map((li, idx) => `${idx + 1}. ${Array.from(li.childNodes).map(nodeToMd).join('').trim()}`);
        return `${items.join('\n')}\n\n`;
      }

      case 'li':
        return Array.from(el.childNodes).map(nodeToMd).join('');

      case 'a': {
        const href = el.getAttribute('href') || '#';
        const text = Array.from(el.childNodes).map(nodeToMd).join('');
        return `[${text}](${href})`;
      }

      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        return `![${alt}](${src})\n\n`;
      }

      case 'hr':
        return `---\n\n`;

      case 'table': {
        const rows = Array.from(el.querySelectorAll('tr')).map(tr => {
          const cells = Array.from(tr.querySelectorAll('th, td')).map(td => Array.from(td.childNodes).map(nodeToMd).join('').trim());
          return `| ${cells.join(' | ')} |`;
        });
        if (rows.length === 0) return '';
        const colCount = (el.querySelector('tr')?.querySelectorAll('th, td').length) || 1;
        const separator = `| ${Array(colCount).fill('---').join(' | ')} |`;
        return `${[rows[0], separator, ...rows.slice(1)].join('\n')}\n\n`;
      }

      case 'details': {
        const summary = el.querySelector('summary')?.textContent || 'Toggle';
        const contentNodes = Array.from(el.childNodes).filter(n => (n as HTMLElement).tagName?.toLowerCase() !== 'summary');
        const content = contentNodes.map(nodeToMd).join('').trim();
        return `<details>\n<summary>${summary}</summary>\n${content}\n</details>\n\n`;
      }

      default:
        return Array.from(el.childNodes).map(nodeToMd).join('');
    }
  }

  return Array.from(doc.body.childNodes).map(nodeToMd).join('').trim();
}

/**
 * Parses Markdown into TipTap-compatible HTML blocks and structured tree
 */
export function convertMarkdownToTipTap(markdown: string): {
  html: string;
  frontmatter: Record<string, any>;
  bodyMarkdown: string;
} {
  let frontmatter: Record<string, any> = {};
  let bodyMarkdown = markdown || '';

  // Extract YAML frontmatter
  const fmMatch = bodyMarkdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (fmMatch) {
    try {
      const parsedFm = yamlLoad(fmMatch[1]);
      if (parsedFm && typeof parsedFm === 'object') {
        frontmatter = parsedFm as Record<string, any>;
      }
      bodyMarkdown = fmMatch[2];
    } catch {
      // Fallback if YAML parsing fails
    }
  }

  const lines = bodyMarkdown.split(/\r?\n/);
  const htmlParts: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let inTaskList = false;
  let taskItems: string[] = [];
  let inBulletList = false;
  let bulletItems: string[] = [];
  let inOrderedList = false;
  let orderedItems: string[] = [];

  const flushListsAndTables = () => {
    if (inTaskList) {
      htmlParts.push(`<ul data-type="taskList">${taskItems.join('')}</ul>`);
      inTaskList = false;
      taskItems = [];
    }
    if (inBulletList) {
      htmlParts.push(`<ul>${bulletItems.map(i => `<li>${i}</li>`).join('')}</ul>`);
      inBulletList = false;
      bulletItems = [];
    }
    if (inOrderedList) {
      htmlParts.push(`<ol>${orderedItems.map(i => `<li>${i}</li>`).join('')}</ol>`);
      inOrderedList = false;
      orderedItems = [];
    }
    if (inTable && tableRows.length > 0) {
      const header = tableRows[0];
      const data = tableRows.slice(1);
      const ths = header.map(h => `<th><p>${parseInlineMarkdown(h)}</p></th>`).join('');
      const trs = data.map(row => `<tr>${row.map(cell => `<td><p>${parseInlineMarkdown(cell)}</p></td>`).join('')}</tr>`).join('');
      htmlParts.push(`<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`);
      inTable = false;
      tableRows = [];
    }
  };

  const parseInlineMarkdown = (text: string): string => {
    let res = text;
    // Bold
    res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    res = res.replace(/__(.*?)__/g, '<strong>$1</strong>');
    // Italic
    res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
    res = res.replace(/_(.*?)_/g, '<em>$1</em>');
    // Strikethrough
    res = res.replace(/~~(.*?)~~/g, '<s>$1</s>');
    // Inline code
    res = res.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Links
    res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return res;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block check
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        flushListsAndTables();
        inCodeBlock = true;
        codeBlockLang = trimmed.replace(/^```/, '').trim();
        codeBlockContent = [];
        continue;
      } else {
        inCodeBlock = false;
        const codeHtml = codeBlockContent.map(l => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')).join('\n');
        htmlParts.push(`<pre><code class="language-${codeBlockLang}">${codeHtml}</code></pre>`);
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Empty line
    if (!trimmed) {
      flushListsAndTables();
      continue;
    }

    // Markdown Table check (| ... |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Check if it's separator row (e.g. |---|---|)
      if (/^\|\s*[-:]+[-| :]*\|$/.test(trimmed)) {
        continue; // Skip separator line
      }
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());
      if (!inTable) {
        flushListsAndTables();
        inTable = true;
        tableRows = [cells];
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushListsAndTables();
    }

    // TaskList check (- [ ] or - [x])
    const taskMatch = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      const checked = taskMatch[2].toLowerCase() === 'x';
      const content = parseInlineMarkdown(taskMatch[3]);
      if (!inTaskList) {
        flushListsAndTables();
        inTaskList = true;
      }
      taskItems.push(`<li data-type="taskItem" data-checked="${checked}"><p>${content}</p></li>`);
      continue;
    }

    // Bullet List check (* or -)
    const bulletMatch = line.match(/^(\s*)[*-]\s+(.*)$/);
    if (bulletMatch) {
      const content = parseInlineMarkdown(bulletMatch[2]);
      if (!inBulletList) {
        flushListsAndTables();
        inBulletList = true;
      }
      bulletItems.push(content);
      continue;
    }

    // Ordered List check (1. 2. etc)
    const orderMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (orderMatch) {
      const content = parseInlineMarkdown(orderMatch[2]);
      if (!inOrderedList) {
        flushListsAndTables();
        inOrderedList = true;
      }
      orderedItems.push(content);
      continue;
    }

    // Callout / Blockquote check (> [!NOTE] or > )
    if (trimmed.startsWith('>')) {
      flushListsAndTables();
      const quoteContent = trimmed.replace(/^>\s*/, '');
      if (quoteContent.startsWith('[!NOTE]') || quoteContent.startsWith('💡')) {
        const text = quoteContent.replace(/^(\[!NOTE\]|💡)\s*/, '');
        htmlParts.push(`<div data-type="callout"><p>${parseInlineMarkdown(text)}</p></div>`);
      } else {
        htmlParts.push(`<blockquote><p>${parseInlineMarkdown(quoteContent)}</p></blockquote>`);
      }
      continue;
    }

    // Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      flushListsAndTables();
      htmlParts.push('<hr>');
      continue;
    }

    // Headings
    if (trimmed.startsWith('#')) {
      flushListsAndTables();
      const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const text = parseInlineMarkdown(hMatch[2]);
        htmlParts.push(`<h${level}>${text}</h${level}>`);
        continue;
      }
    }

    // Standard paragraph
    flushListsAndTables();
    htmlParts.push(`<p>${parseInlineMarkdown(trimmed)}</p>`);
  }

  flushListsAndTables();

  const finalHtml = htmlParts.join('') || '<p></p>';
  return {
    html: finalHtml,
    frontmatter,
    bodyMarkdown
  };
}

/**
 * 1. Exports a Notion page to Core App Document:
 * - Extracts title, coverUrl, icon, and TipTap content
 * - Converts to standard Markdown
 * - Attaches YAML frontmatter
 * - Adds record to `core_documents_v1` in localStorage
 * - Also saves as a Project in Core App DB (Dexie) so it's directly openable
 * - Preserves original Notion Page intact (Copy/Convert policy)
 * - Returns newCoreDocId
 */
export async function exportNotionToCoreDoc(notionPageId: string): Promise<string> {
  const notionStore = useNotionStore.getState();
  const page = notionStore.pages[notionPageId];

  if (!page) {
    throw new Error(`Notion page with id "${notionPageId}" not found`);
  }

  const title = page.title || 'Untitled Notion Page';
  const coverUrl = page.coverUrl || null;
  const icon = page.icon || 'FileText';
  const createdAtTimestamp = page.createdAt ? new Date(page.createdAt).getTime() : Date.now();

  // 1. Convert TipTap content to standard Markdown
  const markdownBody = convertTipTapToMarkdown(page.content);

  // 2. Generate YAML Frontmatter
  const frontmatterObj: CoreDocumentMetadata = {
    title,
    ...(coverUrl ? { coverUrl } : {}),
    icon,
    exportedFrom: 'notion_workspace',
    createdAt: createdAtTimestamp,
  };

  const frontmatterYaml = yamlDump(frontmatterObj).trim();
  const fullDocumentMarkdown = `---\n${frontmatterYaml}\n---\n\n${markdownBody}`;

  const newCoreDocId = 'core-doc-' + uuidv4();
  const nowIso = new Date().toISOString();

  // 3. Isolated Storage in core_documents_v1 (LocalStorage)
  try {
    const rawExisting = localStorage.getItem(CORE_DOCUMENTS_STORAGE_KEY);
    const existingList: CoreDocumentRecord[] = rawExisting ? JSON.parse(rawExisting) : [];
    
    const newRecord: CoreDocumentRecord = {
      id: newCoreDocId,
      title,
      content: fullDocumentMarkdown,
      rawMarkdown: markdownBody,
      metadata: frontmatterObj,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const updatedList = [newRecord, ...existingList.filter(d => d.id !== newCoreDocId)];
    localStorage.setItem(CORE_DOCUMENTS_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Error saving to core_documents_v1:', err);
  }

  // 4. Save to Core App Dexie DB so it's fully accessible in Core App UI
  try {
    const newPageId = 'page-' + uuidv4();
    const htmlContent = page.content && typeof page.content === 'string' && page.content.startsWith('<') 
      ? page.content 
      : convertMarkdownToTipTap(markdownBody).html;

    const newProject: Project = {
      id: newCoreDocId,
      title,
      pages: [{
        id: newPageId,
        title,
        content: htmlContent,
        isDraft: false,
        createdAt: nowIso,
        lastModified: nowIso
      }],
      drafts: [],
      folders: [],
      bin: [],
      createdAt: nowIso,
      lastModified: nowIso,
      isDeleted: false
    };

    await saveProjectToDB(newProject);
  } catch (err) {
    console.warn('Error saving to Dexie DB:', err);
  }

  return newCoreDocId;
}

/**
 * 2. Imports a Core Document into Notion Workspace:
 * - Reads Markdown and extracts Frontmatter
 * - Parses Markdown -> TipTap Block structure
 * - Creates a new NotionPage object
 * - Adds to `notion_workspace_tree_v1`
 * - Preserves original Core Document intact (Copy/Convert policy)
 * - Returns newNotionPageId
 */
export async function importCoreDocToNotion(coreDocId: string, parentId?: string | null): Promise<string> {
  let docTitle = 'Tài liệu nhập từ Core App';
  let docContent = '';
  let docCoverUrl: string | null = null;
  let docIcon = 'FileText';

  // 1. Try reading from core_documents_v1
  try {
    const raw = localStorage.getItem(CORE_DOCUMENTS_STORAGE_KEY);
    if (raw) {
      const list: CoreDocumentRecord[] = JSON.parse(raw);
      const record = list.find(r => r.id === coreDocId);
      if (record) {
        docTitle = record.title || docTitle;
        docContent = record.content || '';
        if (record.metadata) {
          docCoverUrl = record.metadata.coverUrl || null;
          docIcon = record.metadata.icon || docIcon;
        }
      }
    }
  } catch (e) {
    console.warn('Error checking core_documents_v1:', e);
  }

  // 2. If not found or empty, try reading from Dexie DB
  if (!docContent) {
    try {
      const proj = await getProjectFromDB(coreDocId);
      if (proj && proj.pages.length > 0) {
        docTitle = proj.title || proj.pages[0].title || docTitle;
        docContent = proj.pages[0].content || '';
      } else {
        // Search in all projects
        const all = await getAllProjectsFromDB();
        const found = all.find(p => p.id === coreDocId || p.pages.some(pg => pg.id === coreDocId));
        if (found) {
          const pg = found.pages.find(pg => pg.id === coreDocId) || found.pages[0];
          docTitle = pg?.title || found.title;
          docContent = pg?.content || '';
        }
      }
    } catch (e) {
      console.warn('Error reading from Dexie:', e);
    }
  }

  // 3. Parse content & frontmatter
  const parsed = convertMarkdownToTipTap(docContent);
  if (parsed.frontmatter) {
    if (parsed.frontmatter.title) docTitle = parsed.frontmatter.title;
    if (parsed.frontmatter.coverUrl) docCoverUrl = parsed.frontmatter.coverUrl;
    if (parsed.frontmatter.icon) docIcon = parsed.frontmatter.icon;
  }

  const newNotionPageId = uuidv4();
  const now = new Date().toISOString();

  const newNotionPage: NotionPage = {
    id: newNotionPageId,
    parentId: parentId || null,
    title: docTitle,
    icon: docIcon,
    coverUrl: docCoverUrl,
    content: parsed.html,
    properties: { Status: 'Not Started' },
    createdAt: now,
    updatedAt: now,
    order: Date.now(),
    isFavorite: false,
    isDeleted: false,
  };

  // 4. Insert into Notion Workspace Store (notion_workspace_tree_v1)
  const notionStore = useNotionStore.getState();
  notionStore.createPage(parentId || null, newNotionPage);

  return newNotionPageId;
}
