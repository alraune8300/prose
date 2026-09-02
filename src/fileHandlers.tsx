import TurndownService from 'turndown';
import { Project, Folder } from './types';
import { saveAs } from 'file-saver';

// --- ODT Export ---
export async function exportToOdt(title: string, contentHtml: string) {
  try {
    const { htmlToOdt } = await import('odf-kit');
    const uint8array = await htmlToOdt(contentHtml);
    const blob = new Blob([uint8array], { type: 'application/vnd.oasis.opendocument.text' });
    saveAs(blob, `${(title || 'document').replace(/[\\/:*?"<>|]/g, '')}.odt`);
  } catch (err) {
    console.error('ODT Export Failed:', err);
    alert('Failed to generate ODT: ' + (err as Error)?.message);
  }
}

// --- HTML Export ---
export async function exportToHtmlFile(title: string, contentHtml: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${contentHtml}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${(title || 'document').replace(/[\\/:*?"<>|]/g, '')}.html`);
}

// --- Markdown Export ---
export async function exportToMarkdownFile(title: string, contentHtml: string) {
  const turndownService = new TurndownService();
  const md = turndownService.turndown(contentHtml);
  // Using BOM to fix Vietnamese encoding issues on some text editors (e.g., Notepad on Windows)
  const blob = new Blob(['\ufeff' + md], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${(title || 'document').replace(/[\\/:*?"<>|]/g, '')}.md`);
}

// --- JSON Backup ---
export async function exportToJsonBackup(projects: Project[], folders: Folder[] = []) {
  const data = { projects, folders };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  saveAs(blob, `backup_${new Date().toISOString().slice(0, 10)}.json`);
}

// --- JSON Import ---
export async function importJsonBackupFile(file: File): Promise<{projects: Project[], folders: Folder[]}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result);
        if (Array.isArray(data)) {
          resolve({ projects: data, folders: [] });
        } else {
          resolve({ projects: data.projects || [], folders: data.folders || [] });
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read backup file'));
    reader.readAsText(file);
  });
}

// --- File Import (MD, TXT) ---
export async function importFile(file: File): Promise<{title: string, htmlContent: string}> {
  return new Promise((resolve, reject) => {
    const title = file.name.replace(/\.[^/.]+$/, '');

    if (file.name.toLowerCase().endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer });
          resolve({ title, htmlContent: result.value });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read docx file'));
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          let htmlContent = text;
          
          if (file.name.toLowerCase().endsWith('.md')) {
            try {
              const { marked } = await import('marked');
              htmlContent = await marked.parse(text);
            } catch (_err) {
              htmlContent = '<p>' + text.replace(/\n/g, '<br>') + '</p>';
            }
          } else if (file.name.toLowerCase().endsWith('.txt')) {
             htmlContent = '<p>' + text.replace(/\n/g, '<br>') + '</p>';
          }
          
          resolve({ title, htmlContent });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    }
  });
}
