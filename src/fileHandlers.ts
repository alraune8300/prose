import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { PageFormat, PAPER_SIZES_PX, Project, Folder } from './types';
import { saveProjectToDB, saveFolderToDB } from './db';
import { Document, Packer, Paragraph, TextRun, AlignmentType, PageNumber, Footer, HeadingLevel, PageOrientation } from 'docx';
import { extractTextFromPdfBlob } from './referenceExtractor';

const turndownService = new TurndownService();

const PAPER_SIZES_PT: Record<string, { w: number; h: number }> = {
  'A4':      { w: 595,  h: 842 },
  'Letter':  { w: 612,  h: 792 },
  'Legal':   { w: 612,  h: 1008 },
  'A5':      { w: 420,  h: 595  },
  'Tabloid': { w: 792,  h: 1224 },
  'pageless': { w: 495, h: 0 },
};

export async function exportToPdf(title: string, contentHtml: string, pageFormat: PageFormat) {
  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  
  const size = PAPER_SIZES_PX[pageFormat.paperSize] || PAPER_SIZES_PX['A4'];
  const isPageless = pageFormat.paperSize === 'pageless' || pageFormat.mode === 'pageless' || size.h === 0;
  
  const w = isPageless ? 660 : (pageFormat.orientation === 'landscape' ? size.h : size.w);
  const h = isPageless ? 0 : (pageFormat.orientation === 'landscape' ? size.w : size.h);

  container.style.width = `${w}px`;
  container.style.padding = '40px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111111';
  container.style.fontFamily = 'Georgia, serif';
  container.style.fontSize = '16px';
  container.style.lineHeight = '1.7';
  container.style.boxSizing = 'border-box';
  container.style.wordBreak = 'break-word';
  container.style.overflowWrap = 'break-word';
  container.style.whiteSpace = 'normal';
  container.style.textAlign = 'justify';
  
  container.innerHTML = `<style>
    #pdf-export-container * { box-sizing: border-box; }
    #pdf-export-container p, #pdf-export-container h1, #pdf-export-container h2, #pdf-export-container h3, #pdf-export-container h4, #pdf-export-container h5, #pdf-export-container h6, #pdf-export-container li { white-space: normal; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; }
  </style><div style="width: 100%; max-width: 100%;"><h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: left;">${title}</h1>${contentHtml}</div>`;
  
  document.body.appendChild(container);

  try {
    // Wait for fonts/images to settle
    await new Promise(resolve => setTimeout(resolve, 150));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const clonedContainer = clonedDoc.getElementById('pdf-export-container');
        if (clonedContainer) {
          clonedContainer.style.position = 'static';
          clonedContainer.style.left = '0';
          clonedContainer.style.top = '0';
          clonedContainer.style.margin = '0';
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    if (!imgData || imgData === 'data:,' || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Generated image data is invalid.');
    }

    const pdfWidth = w;
    const scaleFactor = canvas.width / pdfWidth;
    const totalPdfHeight = canvas.height / scaleFactor;

    if (isPageless) {
      const pdfH = Math.max(100, totalPdfHeight);
      const pdf = new jsPDF({
        orientation: pageFormat.orientation === 'landscape' ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pdfWidth, pdfH],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, totalPdfHeight);
      pdf.save(`${(title || 'document').replace(/[\\/:*?"<>|]/g, '')}.pdf`);
    } else {
      const pagePdfHeight = h;
      const pageCanvasHeight = pagePdfHeight * scaleFactor;
      const totalPages = Math.ceil(canvas.height / pageCanvasHeight);

      const pdf = new jsPDF({
        orientation: pageFormat.orientation === 'landscape' ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pdfWidth, pagePdfHeight],
      });

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage([pdfWidth, pagePdfHeight], pageFormat.orientation === 'landscape' ? 'landscape' : 'portrait');
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageCanvasHeight;

        const pageCtx = pageCanvas.getContext('2d');
        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

          const sourceY = i * pageCanvasHeight;
          const sourceH = Math.min(pageCanvasHeight, canvas.height - sourceY);

          if (sourceH > 0) {
            pageCtx.drawImage(
              canvas,
              0, sourceY,
              canvas.width, sourceH,
              0, 0,
              canvas.width, sourceH
            );
          }
        }

        const pageImgData = pageCanvas.toDataURL('image/png');
        pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pagePdfHeight);
      }

      pdf.save(`${(title || 'document').replace(/[\\/:*?"<>|]/g, '')}.pdf`);
    }
  } catch (err) {
    console.error('PDF export error:', err);
    alert('Failed to generate PDF. Try printing to PDF instead.');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export async function exportToDocx(title: string, contentHtml: string, pageFormat: PageFormat) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(contentHtml, 'text/html');
  const children = Array.from(doc.body.children);
  
  const docxElements: Paragraph[] = [];
  
  // Title Heading 1
  docxElements.push(new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 240 }, // 12pt
  }));
  
  for (const el of children) {
    const tagName = el.tagName.toLowerCase();
    const textContent = el.textContent || '';
    
    if (tagName === 'h1') {
      docxElements.push(new Paragraph({
        text: textContent,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }));
    } else if (tagName === 'h2') {
      docxElements.push(new Paragraph({
        text: textContent,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }));
    } else if (tagName === 'h3') {
      docxElements.push(new Paragraph({
        text: textContent,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 180, after: 120 },
      }));
    } else if (tagName === 'p') {
      const runs: TextRun[] = [];
      
      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          runs.push(new TextRun({
            text: node.textContent || '',
          }));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const childEl = node as HTMLElement;
          const childTag = childEl.tagName.toLowerCase();
          
          const isBold = childTag === 'strong' || childTag === 'b';
          const isItalic = childTag === 'em' || childTag === 'i';
          const isUnderline = childTag === 'u';
          
          const subRuns: TextRun[] = [];
          const collectSubRuns = (subNode: Node) => {
            if (subNode.nodeType === Node.TEXT_NODE) {
              subRuns.push(new TextRun({
                text: subNode.textContent || '',
                bold: isBold,
                italic: isItalic,
                underline: isUnderline ? {} : undefined,
              }));
            } else if (subNode.nodeType === Node.ELEMENT_NODE) {
              const subEl = subNode as HTMLElement;
              const subTag = subEl.tagName.toLowerCase();
              const subBold = isBold || subTag === 'strong' || subTag === 'b';
              const subItalic = isItalic || subTag === 'em' || subTag === 'i';
              const subUnderline = isUnderline || subTag === 'u';
              
              Array.from(subEl.childNodes).forEach(n => {
                if (n.nodeType === Node.TEXT_NODE) {
                  subRuns.push(new TextRun({
                    text: n.textContent || '',
                    bold: subBold,
                    italic: subItalic,
                    underline: subUnderline ? {} : undefined,
                  }));
                } else {
                  collectSubRuns(n);
                }
              });
            }
          };
          
          Array.from(childEl.childNodes).forEach(collectSubRuns);
          runs.push(...subRuns);
        }
      };
      
      Array.from(el.childNodes).forEach(processNode);
      
      docxElements.push(new Paragraph({
        children: runs,
        spacing: { after: 120 },
      }));
    } else if (tagName === 'ul' || tagName === 'ol') {
      const isOrdered = tagName === 'ol';
      const listItems = Array.from(el.querySelectorAll('li'));
      
      listItems.forEach(li => {
        docxElements.push(new Paragraph({
          text: li.textContent || '',
          bullet: isOrdered ? undefined : { level: 0 },
          numbering: isOrdered ? { reference: 'ordered-list', level: 0 } : undefined,
          spacing: { after: 60 },
        }));
      });
    }
  }
  
  // Calculate dxa sizes from matrix (points * 20)
  const sizePt = PAPER_SIZES_PT[pageFormat.paperSize] || PAPER_SIZES_PT['A4'];
  const wPt = pageFormat.orientation === 'landscape' ? sizePt.h : sizePt.w;
  const hPt = pageFormat.orientation === 'landscape' ? sizePt.w : sizePt.h;
  
  const wDxa = wPt * 20;
  const hDxa = hPt * 20;
  const marginDxa = 72 * 20; // 1440
  const headerDxa = 36 * 20; // 720
  const footerDxa = 36 * 20; // 720
  
  const wordDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: wDxa,
              height: hDxa,
            },
            margin: {
              top: marginDxa,
              bottom: marginDxa,
              left: marginDxa,
              right: marginDxa,
              header: headerDxa,
              footer: footerDxa,
            },
            orientation: pageFormat.orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Trang ", size: 20 }), // half-points: 20 is 10pt
                  PageNumber.CURRENT,
                  new TextRun({ text: " / ", size: 20 }),
                  PageNumber.TOTAL_PAGES,
                ],
              }),
            ],
          }),
        },
        children: docxElements,
      },
    ],
  });
  
  const buffer = await Packer.toBlob(wordDoc);
  triggerDownload(buffer, `${(title || 'document').replace(/[\\/:*?"<>|]/g, '')}.docx`);
}

export function exportToHtmlFile(title: string, contentHtml: string) {
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7;color:#222;background:#fdfdfd}</style></head><body><h1>${title}</h1>${contentHtml}</body></html>`;
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  triggerDownload(blob, `${(title || 'document').replace(/[\\/:*?"<>|]/g, '')}.html`);
}

export function exportToMarkdownFile(title: string, contentHtml: string) {
  const markdown = `# ${title}\n\n` + turndownService.turndown(contentHtml);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, `${(title || 'document').replace(/[\\/:*?"<>|]/g, '')}.md`);
}

export function exportToJsonBackup(projects: Project[], folders?: Folder[]) {
  const data = { version: 1, exportedAt: Date.now(), projects, folders: folders || [] };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, `kgv-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

export async function importJsonBackupFile(file: File): Promise<{ projectCount: number; folderCount: number }> {
  const text = await file.text();
  let data: Record<string, unknown> | Array<unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON backup file format');
  }

  let projectsToSave: Project[] = [];
  let foldersToSave: Folder[] = [];

  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray((data as { projects?: unknown[] }).projects)) {
    projectsToSave = (data as { projects: Project[] }).projects;
    if (Array.isArray((data as { folders?: unknown[] }).folders)) {
      foldersToSave = (data as { folders: Folder[] }).folders;
    }
  } else if (Array.isArray(data)) {
    projectsToSave = data as Project[];
  } else if (data && typeof data === 'object' && 'id' in data && ('pages' in data || 'title' in data)) {
    projectsToSave = [data as unknown as Project];
  } else if (data && typeof data === 'object' && 'documents' in data && Array.isArray((data as { documents?: unknown[] }).documents)) {
    const docs = (data as { documents: Array<Record<string, unknown>> }).documents;
    const pages = docs.map((d) => ({
      id: (d.id as string) || 'page-' + Math.random().toString(36).substring(2, 8),
      title: (d.title as string) || 'Untitled Document',
      content: (d.content as string) || '',
      isDraft: false,
      createdAt: d.created_at ? new Date(d.created_at as string).toISOString() : new Date().toISOString(),
      lastModified: d.updated_at ? new Date(d.updated_at as string).toISOString() : new Date().toISOString(),
      folderId: (d.folder_id as string) || undefined,
    }));
    const proj: Project = {
      id: 'proj-' + Date.now(),
      title: 'Imported Backup',
      pages,
      drafts: [],
      folders: [],
      bin: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    projectsToSave = [proj];
  } else {
    throw new Error('Unrecognized backup JSON data structure');
  }

  for (const f of foldersToSave) {
    if (f && f.id && f.name) {
      await saveFolderToDB(f);
    }
  }

  let count = 0;
  for (const p of projectsToSave) {
    if (p && p.id && (p.title || p.pages)) {
      const cleanProj: Project = {
        ...p,
        title: p.title || 'Untitled Project',
        pages: Array.isArray(p.pages) ? p.pages : [],
        drafts: Array.isArray(p.drafts) ? p.drafts : [],
        folders: Array.isArray(p.folders) ? p.folders : [],
        bin: Array.isArray(p.bin) ? p.bin : [],
        createdAt: p.createdAt || new Date().toISOString(),
        lastModified: p.lastModified || new Date().toISOString(),
      };
      await saveProjectToDB(cleanProj);
      count++;
    }
  }

  return { projectCount: count, folderCount: foldersToSave.length };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importFile(file: File): Promise<{ title: string; htmlContent: string }> {
  const name = file.name;
  const ext = name.split('.').pop()?.toLowerCase();
  const title = name.replace(/\.[^/.]+$/, '');

  try {
    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return { title, htmlContent: result.value || '<p></p>' };
    } else if (ext === 'pdf') {
      try {
        const { text } = await extractTextFromPdfBlob(file);
        const paragraphs = text
          .split(/\r?\n\r?\n+/)
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
          .join('');
        return { title, htmlContent: paragraphs || `<p>${escapeHtml(text)}</p>` };
      } catch (pdfErr) {
        console.warn('PDF text extraction error in importFile:', pdfErr);
        return { title, htmlContent: `<p><em>[Tài liệu PDF: ${escapeHtml(name)}]</em></p>` };
      }
    } else if (ext === 'html' || ext === 'htm') {
      const htmlText = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const bodyHtml = doc.body ? doc.body.innerHTML : htmlText;
      return { title, htmlContent: bodyHtml };
    } else if (ext === 'md') {
      const mdText = await file.text();
      const div = document.createElement('div');
      div.innerHTML = mdText
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>');
      return { title, htmlContent: `<p>${div.innerHTML}</p>` };
    } else if (ext === 'json') {
      const jsonText = await file.text();
      try {
        const data = JSON.parse(jsonText);
        if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
          const p = data.projects[0];
          const firstPage = p.pages?.[0];
          return { title: p.title || title, htmlContent: firstPage?.content || '<p></p>' };
        }
      } catch {
        // fallback
      }
      return { title, htmlContent: `<p>${escapeHtml(jsonText)}</p>` };
    } else {
      const text = await file.text();
      const paragraphs = text
        .split(/\r?\n\r?\n+/)
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
        .join('');
      return { title, htmlContent: paragraphs || `<p>${escapeHtml(text)}</p>` };
    }
  } catch (err) {
    console.error('importFile error:', err);
    throw err;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
