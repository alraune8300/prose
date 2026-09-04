export interface Folder {
  id: string
  name: string
  parentId?: string | null
  created_at?: number
  isDeleted?: boolean
  deletedAt?: string | null
  isArchived?: boolean
  archivedAt?: string | null
  isPinned?: boolean
  pinnedAt?: string | null
}

export interface Document {
  id: string
  title: string
  content: string
  updated_at?: number | string
  folder_id?: string | null
  created_at?: number | string
  isPinned?: boolean
  pinnedAt?: string | null
}

export interface Page {
  id: string
  title: string
  content: string
  isDraft: boolean
  isScratchpad?: boolean
  createdAt: string
  lastModified: string
  lastOpened?: string
  folderId?: string | null
  originalPageId?: string | null
  isArchived?: boolean
  archivedAt?: string | null
  isPinned?: boolean
  pinnedAt?: string | null
  pageFormat?: PageFormat
}

export interface Project {
  id: string
  title: string
  pages: Page[]
  drafts: Page[]
  scratchpad?: Page[]
  scratchpadName?: string
  folders: Folder[]
  bin: Page[]
  archive?: Page[]
  createdAt: string
  lastModified: string
  lastOpened?: string
  folderId?: string | null
  isDeleted?: boolean
  deletedAt?: string | null
  isArchived?: boolean
  archivedAt?: string | null
  isPinned?: boolean
  pinnedAt?: string | null
  pageFormat?: PageFormat
}

export interface CustomFont {
  id?: string
  family: string
  dataUrl: string
  name?: string
  fileName?: string
}

export type ThemeMode = 'light' | 'dark' | 'sepia' | 'custom' | string

export interface ThemeConfig {
  id: string;
  name: string;
  isCustom?: boolean;
  isDefaultOverridden?: boolean;
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
}

export type CustomTheme = ThemeConfig; // Keep alias for backward compatibility for now

export interface ThemeColors {
  bg: string
  heroGrad: string
  cardGrad: string
  text: string
  textMuted: string
  textFaint: string
  accent: string
  accentLight: string
  accentMid: string
  border: string
  borderFaint: string
  surface: string
  header: string
  panel: string
  status: string
  isDark: boolean
  muted: string
  faint: string
  accentSoft: string
}

export type Lang = 'en' | 'vi' | 'fr' | 'de' | 'it' | 'es' | 'ko' | 'zh' | 'ja'

export interface Footnote {
  id: string
  number: number
  content: string
}

export type SyncStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export type Panel = 'none' | 'format' | 'export' | 'preview' | 'timer' | 'colors' | 'fonts' | 'importexport' | 'settings' | 'history' | 'search' | 'table' | 'codex' | 'inspector' | 'outline' | 'trash' | 'archive'

export type PaperSize = 'A4' | 'Letter' | 'Legal' | 'A5' | 'Tabloid' | 'pageless'
export type PageOrientation = 'portrait' | 'landscape'
export type PageMode = 'pageless' | 'pages'

export interface PageFormat {
  paperSize: PaperSize
  orientation: PageOrientation
  mode: PageMode
}

export const PAPER_SIZES_PX: Record<PaperSize, { w: number; h: number }> = {
  'A4':      { w: 794,  h: 1123 },
  'Letter':  { w: 816,  h: 1056 },
  'Legal':   { w: 816,  h: 1344 },
  'A5':      { w: 559,  h: 794  },
  'Tabloid': { w: 1056, h: 1632 },
  'pageless': { w: 660, h: 0 },
}

export type PageNumberPosition = 'bottom-center' | 'bottom-right' | 'top-right'
export type PageNumberStyle = 'arabic' | 'page-of-total' | 'roman'

export interface PageNumberingConfig {
  enabled: boolean
  position: PageNumberPosition
  style: PageNumberStyle
  skipTitlePage: boolean
}

export interface FormatState {
  fontFam: string
  headingFontFam: string
  monoFontFam?: string
  fontSize: number
  lineH: number
  align: 'left' | 'center' | 'right' | 'justify'
  maxW: number
  paraSpacing: number
  letterSpacing: number
  wordSpacing: number
  firstLineIndent: boolean
  smartQuotes?: boolean
  smartEllipses?: boolean
  smartArrows?: boolean
  markdownShortcuts?: boolean
  doubleSpacePeriod?: boolean
  toggleHeadings?: boolean
  dashesMode?: 'disabled' | 'em' | 'en-em'
  typewriterScroll?: boolean
  pageNumbering?: PageNumberingConfig
}

export interface VersionSnapshot {
  id: string;
  pageId: string;
  timestamp: string;
  content: string;
  title?: string;
  label?: string;
}


export interface CodexEntity {
  id: string;
  name: string;
  aliases: string[];
  type: 'Character' | 'Location' | 'Lore';
  traits: string;
  bio: string;
  color?: string;
}
