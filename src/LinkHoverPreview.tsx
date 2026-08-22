import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Copy, Check, Edit3, Unlink, Globe } from 'lucide-react';
import type { ThemeColors } from './types';
import type { Lang } from './i18n';

interface LinkPreviewData {
  url: string;
  text: string;
  rect: DOMRect;
  element: HTMLAnchorElement;
}

interface LinkHoverPreviewProps {
  theme: ThemeColors;
  uiFont: string;
  lang: Lang;
  onEditLink?: (element: HTMLAnchorElement, url: string) => void;
  onRemoveLink?: (element: HTMLAnchorElement) => void;
}

export function extractDomainAndFavicon(url: string) {
  try {
    const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const parsed = new URL(validUrl);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
    return {
      hostname,
      pathname: parsed.pathname.length > 1 ? parsed.pathname : '',
      fullUrl: validUrl,
      faviconUrl,
    };
  } catch {
    return {
      hostname: url.replace(/^https?:\/\//, '').split('/')[0] || url,
      pathname: '',
      fullUrl: url,
      faviconUrl: '',
    };
  }
}

export default function LinkHoverPreview({
  theme,
  uiFont,
  lang,
  onEditLink,
  onRemoveLink,
}: LinkHoverPreviewProps) {
  const [activePreview, setActivePreview] = useState<LinkPreviewData | null>(null);
  const [copied, setCopied] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (target && target.href && !target.closest('.kgv-link-preview-card')) {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        const rect = target.getBoundingClientRect();
        setActivePreview({
          url: target.getAttribute('href') || target.href,
          text: target.innerText || target.textContent || '',
          rect,
          element: target,
        });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      const related = e.relatedTarget as HTMLElement;
      if (cardRef.current?.contains(related)) {
        return; // Mouse moved into card
      }
      if (target) {
        hideTimerRef.current = setTimeout(() => {
          setActivePreview(null);
        }, 300);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleCardMouseEnter = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  const handleCardMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => {
      setActivePreview(null);
    }, 200);
  };

  if (!activePreview) return null;

  const { hostname, pathname, fullUrl, faviconUrl } = extractDomainAndFavicon(activePreview.url);

  // Calculate position relative to viewport
  const left = Math.max(12, Math.min(window.innerWidth - 320, activePreview.rect.left + (activePreview.rect.width / 2) - 150));
  const top = activePreview.rect.bottom + 8 < window.innerHeight - 120
    ? activePreview.rect.bottom + 8
    : Math.max(10, activePreview.rect.top - 95);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
      className="kgv-link-preview-card fixed z-[9999] w-80 rounded-xl shadow-2xl border p-3 transition-all duration-150 animate-in fade-in zoom-in-95 pointer-events-auto select-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text,
        fontFamily: uiFont,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-2 pb-2 border-b" style={{ borderColor: theme.borderFaint }}>
        {/* Favicon / Globe */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden bg-black/5 dark:bg-white/5" style={{ borderColor: theme.borderFaint }}>
          {faviconUrl ? (
            <img 
              src={faviconUrl} 
              alt={hostname} 
              className="w-5 h-5 object-contain"
              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} 
            />
          ) : (
            <Globe size={16} style={{ color: theme.accent }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs truncate" style={{ color: theme.text }}>
            {hostname}
          </div>
          <div className="text-[11px] truncate opacity-60" style={{ color: theme.textMuted }}>
            {pathname ? `${pathname}` : fullUrl}
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center justify-between gap-1.5 pt-1 text-xs">
        <div className="flex items-center gap-1">
          {/* Open Link */}
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-md transition-all hover:opacity-80 active:scale-95 text-xs font-medium"
            style={{ backgroundColor: theme.accentLight, color: theme.accent }}
            title={lang === 'vi' ? 'Mở trong tab mới' : 'Open in new tab'}
          >
            <ExternalLink size={12} />
            <span>{lang === 'vi' ? 'Mở liên kết' : 'Open'}</span>
          </a>

          {/* Copy URL */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md border transition-all hover:bg-black/5 dark:hover:bg-white/10 text-xs"
            style={{ borderColor: theme.borderFaint, color: theme.text }}
            title={lang === 'vi' ? 'Sao chép đường dẫn' : 'Copy link address'}
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            <span>{copied ? (lang === 'vi' ? 'Đã sao chép' : 'Copied') : (lang === 'vi' ? 'Sao chép' : 'Copy')}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {onEditLink && (
            <button
              onClick={() => {
                onEditLink(activePreview.element, activePreview.url);
                setActivePreview(null);
              }}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title={lang === 'vi' ? 'Chỉnh sửa liên kết' : 'Edit link'}
              style={{ color: theme.textMuted }}
            >
              <Edit3 size={13} />
            </button>
          )}

          {onRemoveLink && (
            <button
              onClick={() => {
                onRemoveLink(activePreview.element);
                setActivePreview(null);
              }}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title={lang === 'vi' ? 'Xóa liên kết' : 'Remove link'}
              style={{ color: '#ef4444' }}
            >
              <Unlink size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
