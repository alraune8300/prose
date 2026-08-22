export interface CitationSource {
  id: string;
  key: string; // citation key e.g. "smith2026"
  type: 'article' | 'book' | 'inproceedings' | 'webpage' | 'misc';
  author: string;
  title: string;
  year: string;
  journal?: string;
  publisher?: string;
  doi?: string;
  isbn?: string;
  url?: string;
  rawBibtex?: string;
}

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard' | 'vancouver' | 'springer' | 'acm';

export function parseBibtex(bibtexText: string): CitationSource[] {
  const sources: CitationSource[] = [];
  const entryRegex = /@([a-zA-Z]+)\s*\{\s*([^,\s]+)\s*,([^@]*)\}/g;
  let match;

  while ((match = entryRegex.exec(bibtexText)) !== null) {
    const type = match[1].toLowerCase() as CitationSource['type'];
    const key = match[2].trim();
    const body = match[3];

    const getField = (fieldName: string): string => {
      const fieldRegex = new RegExp(`${fieldName}\\s*=\\s*[{"]([^}"]+)[}"]`, 'i');
      const m = body.match(fieldRegex);
      return m ? m[1].trim() : '';
    };

    const author = getField('author') || 'Unknown Author';
    const title = getField('title') || 'Untitled';
    const year = getField('year') || new Date().getFullYear().toString();
    const journal = getField('journal') || getField('journaltitle') || '';
    const publisher = getField('publisher') || '';
    const doi = getField('doi') || '';
    const isbn = getField('isbn') || '';
    const url = getField('url') || '';

    sources.push({
      id: 'cit_' + Math.random().toString(36).substring(2, 9),
      key,
      type: ['article', 'book', 'inproceedings', 'webpage'].includes(type) ? type : 'misc',
      author,
      title,
      year,
      journal,
      publisher,
      doi,
      isbn,
      url,
      rawBibtex: match[0],
    });
  }

  return sources;
}

export function exportToBibtex(sources: CitationSource[]): string {
  return sources.map(s => {
    return `@${s.type}{${s.key},
  author = {${s.author}},
  title = {${s.title}},
  year = {${s.year}}${s.journal ? `,\n  journal = {${s.journal}}` : ''}${s.publisher ? `,\n  publisher = {${s.publisher}}` : ''}${s.doi ? `,\n  doi = {${s.doi}}` : ''}${s.url ? `,\n  url = {${s.url}}` : ''}
}`;
  }).join('\n\n');
}

export function formatInTextCitation(source: CitationSource, style: CitationStyle, index: number = 1): string {
  // Extract primary author last name
  const firstAuthor = source.author.split('and')[0].split(',')[0].trim();
  const etAl = source.author.includes('and') || source.author.includes(',') ? ' et al.' : '';

  switch (style) {
    case 'apa':
      return `(${firstAuthor}${etAl}, ${source.year})`;
    case 'mla':
      return `(${firstAuthor} ${source.year})`;
    case 'chicago':
      return `(${firstAuthor}, ${source.year})`;
    case 'harvard':
      return `(${firstAuthor}${etAl} ${source.year})`;
    case 'vancouver':
    case 'ieee':
    case 'springer':
    case 'acm':
      return `[${index}]`;
    default:
      return `(${firstAuthor}, ${source.year})`;
  }
}

export function formatBibliographyEntry(source: CitationSource, style: CitationStyle, index: number = 1): string {
  switch (style) {
    case 'apa':
      return `${source.author} (${source.year}). *${source.title}*. ${source.journal || source.publisher || ''}${source.doi ? ` https://doi.org/${source.doi}` : ''}`;
    case 'mla':
      return `${source.author}. "${source.title}." *${source.journal || source.publisher || ''}*, ${source.year}.`;
    case 'chicago':
      return `${source.author}. ${source.year}. "${source.title}." *${source.journal || source.publisher || ''}*.`;
    case 'harvard':
      return `${source.author} (${source.year}) *${source.title}*, ${source.journal || source.publisher || ''}.`;
    case 'vancouver':
      return `${index}. ${source.author}. ${source.title}. ${source.journal || source.publisher || ''}; ${source.year}.`;
    case 'springer':
      return `${index}. ${source.author} (${source.year}) ${source.title}. *${source.journal || source.publisher || ''}*.`;
    case 'acm':
      return `[${index}] ${source.author} ${source.year}. ${source.title}. *${source.journal || source.publisher || ''}*.`;
    case 'ieee':
      return `[${index}] ${source.author}, "${source.title}," *${source.journal || source.publisher || ''}*, ${source.year}.`;
    default:
      return `${source.author} (${source.year}). ${source.title}.`;
  }
}
