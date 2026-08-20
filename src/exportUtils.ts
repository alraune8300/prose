// Export utilities — runs entirely in browser via Blob + URL.createObjectURL
import type { Document, Folder } from './types';

export function exportTxt(doc: Document | undefined): void {
  if (!doc) return;
  const safeTitle = (doc.title || 'untitled').replace(/[\\/:*?"<>|]/g, '').trim() || 'untitled';
  const plainText = stripHtml(doc.content);
  const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${safeTitle}.txt`);
}

export function exportJson(folders: Folder[], docs: Document[]): void {
  const data = {
    version: 1,
    exported_at: Date.now(),
    folders: folders.map((f) => ({ id: f.id, name: f.name, created_at: f.created_at })),
    documents: docs.map((d) => ({
      id: d.id, title: d.title, content: d.content,
      updated_at: d.updated_at, folder_id: d.folder_id,
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `khonggianviet-backup-${date}.json`);
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  div.querySelectorAll('p, h1, h2, h3, li').forEach((el) => el.append('\n'));
  return (div.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
