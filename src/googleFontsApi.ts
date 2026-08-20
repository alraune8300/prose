// Google Fonts Developer API integration
export type GoogleFontItem = {
  family: string;
  variants: string[];
  subsets: string[];
  category: string;
  files: Record<string, string>;
};

export type GoogleFontsResponse = {
  items: GoogleFontItem[];
  kind: string;
};

const API_BASE = 'https://www.googleapis.com/webfonts/v1/webfonts';
const STORAGE_KEY = 'kgv-gfonts-api-key';
const CACHE_KEY = 'kgv-gfonts-cache';
const INJECTED_KEY = 'kgv-injected-gfonts';
const CACHE_TTL = 24 * 60 * 60 * 1000;

function saveInjectedFont(family: string): void {
  try {
    const raw = localStorage.getItem(INJECTED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(family)) {
      list.push(family);
      localStorage.setItem(INJECTED_KEY, JSON.stringify(list));
    }
  } catch { /* ignore */ }
}

export function reinjectSavedFonts(): void {
  try {
    const raw = localStorage.getItem(INJECTED_KEY);
    if (!raw) return;
    const list: string[] = JSON.parse(raw);
    for (const family of list) injectGoogleFont(family);
  } catch { /* ignore */ }
}

export function saveApiKey(key: string): void {
  try { localStorage.setItem(STORAGE_KEY, key); } catch { /* ignore */ }
}

export function loadApiKey(): string {
  try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

export async function fetchGoogleFonts(apiKey: string): Promise<GoogleFontItem[]> {
  if (!apiKey) return [];
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as { ts: number; items: GoogleFontItem[] };
      if (Date.now() - parsed.ts < CACHE_TTL && parsed.items?.length) return parsed.items;
    }
  } catch { /* ignore */ }

  const url = `${API_BASE}?key=${encodeURIComponent(apiKey)}&sort=popularity`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Fonts API error: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as GoogleFontsResponse;
  const items = data.items || [];
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items })); } catch { /* ignore */ }
  return items;
}

export function searchFonts(items: GoogleFontItem[], query: string, category?: string): GoogleFontItem[] {
  let filtered = items;
  if (category && category !== 'all') filtered = filtered.filter((f) => f.category === category);
  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter((f) => f.family.toLowerCase().includes(q));
  }
  return filtered;
}

export function buildSimpleFontUrl(family: string): string {
  const familyParam = family.replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${familyParam}:ital,wght@0,400;0,700;1,400&display=swap`;
}

export function injectGoogleFont(family: string): string {
  const linkId = `kgv-gfont-${family.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) return linkId;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = buildSimpleFontUrl(family);
  document.head.appendChild(link);
  saveInjectedFont(family);
  return linkId;
}

export async function ensureFontLoaded(family: string, text: string = 'a'): Promise<boolean> {
  try {
    const fonts = (document as unknown as { fonts?: { load: (font: string, text: string) => Promise<unknown> } }).fonts;
    if (fonts) {
      await fonts.load(`400 16px "${family}"`, text);
      await fonts.load(`700 16px "${family}"`, text);
    }
    return true;
  } catch { return false; }
}

export const FONT_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans-serif' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
  { value: 'monospace', label: 'Monospace' },
];
