import React, { useEffect, useRef, useState } from 'react';
import type { ThemeColors } from './types';

interface ZenReaderProps {
  content: string;
  title: string;
  theme: ThemeColors;
  docFont?: string;
  zoomPercent?: number;
  onClose: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

export function ZenReader({ content, title, theme, docFont = 'Newsreader, Georgia, serif', zoomPercent = 100, onClose, onTouchStart, onTouchEnd }: ZenReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  // Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Scroll progress
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    if (scrollHeight <= 0) {
      setProgress(100);
    } else {
      setProgress((target.scrollTop / scrollHeight) * 100);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] overflow-y-auto zen-reader-scroll" 
      style={{ background: theme.bg, color: theme.text, scrollbarWidth: 'none' }}
      onScroll={handleScroll}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        /* Minimalist scrollbar hide */
        .zen-reader-scroll::-webkit-scrollbar { display: none; }
        
        /* Typography & Layout */
        .zen-content {
          max-width: 72ch;
          margin: 0 auto;
          font-family: ${docFont || "'Newsreader', 'Merriweather', 'Georgia', serif"};
          line-height: 1.85;
          letter-spacing: 0.01em;
          padding: 10vh 24px 20vh;
          font-size: ${1.0625 * (zoomPercent / 100)}rem;
          color: ${theme.text};
          word-break: break-word;
        }
        
        /* Title */
        .zen-title {
          font-family: ${docFont || "'Newsreader', 'Merriweather', 'Georgia', serif"};
          font-size: ${2.25 * (zoomPercent / 100)}rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 2.75rem;
          line-height: 1.3;
          letter-spacing: -0.02em;
          color: ${theme.text};
        }

        /* Standard Paragraphs - No drop caps, clean spacing */
        .zen-content p {
          margin: 0 0 1.25em 0;
          line-height: 1.85;
          text-indent: 0;
        }
        
        /* Headings - hierarchy and natural alignment */
        .zen-content h1, .zen-content h2, .zen-content h3, .zen-content h4, .zen-content h5, .zen-content h6 {
          font-weight: 600;
          line-height: 1.35;
          color: ${theme.text};
        }
        
        .zen-content h1 {
          font-size: 1.85em;
          font-weight: 700;
          margin-top: 1.8em;
          margin-bottom: 0.6em;
        }
        
        .zen-content h2 {
          font-size: 1.45em;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        
        .zen-content h3 {
          font-size: 1.2em;
          margin-top: 1.3em;
          margin-bottom: 0.4em;
        }
        
        .zen-content h4, .zen-content h5, .zen-content h6 {
          font-size: 1.05em;
          margin-top: 1.1em;
          margin-bottom: 0.35em;
        }

        /* Unordered & Ordered Lists */
        .zen-content ul {
          list-style-type: disc;
          margin: 0 0 1.25em 1.5em;
          padding-left: 0.5em;
        }

        .zen-content ol {
          list-style-type: decimal;
          margin: 0 0 1.25em 1.5em;
          padding-left: 0.5em;
        }

        .zen-content li {
          margin: 0.35em 0;
          line-height: 1.75;
        }

        /* Task Lists */
        .zen-content ul[data-type="taskList"] {
          list-style: none;
          margin: 0 0 1.25em 0;
          padding-left: 0;
        }

        .zen-content li[data-type="taskItem"] {
          display: flex;
          align-items: flex-start;
          gap: 0.6em;
          margin: 0.4em 0;
        }

        .zen-content li[data-type="taskItem"] > label {
          margin-top: 0.3em;
          user-select: none;
        }

        .zen-content li[data-type="taskItem"] input[type="checkbox"] {
          cursor: pointer;
          accent-color: ${theme.accent};
          width: 15px;
          height: 15px;
        }

        .zen-content li[data-type="taskItem"] > div {
          flex: 1 1 auto;
        }

        /* Blockquotes */
        .zen-content blockquote {
          margin: 1.5em 0;
          padding: 0.6em 0 0.6em 1.25em;
          border-left: 3px solid ${theme.accent};
          font-style: italic;
          opacity: 0.9;
        }

        /* Horizontal Rules */
        .zen-content hr {
          border: none;
          border-top: 1px solid ${theme.border || 'rgba(128,128,128,0.25)'};
          margin: 2.25em 0;
          opacity: 0.7;
        }

        /* Tables */
        .zen-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          font-size: 0.95em;
        }

        .zen-content th, .zen-content td {
          border: 1px solid ${theme.border || 'rgba(128,128,128,0.2)'};
          padding: 8px 14px;
          text-align: left;
        }

        .zen-content th {
          background-color: ${theme.surface || 'rgba(128,128,128,0.08)'};
          font-weight: 600;
        }

        /* Code & Preformatted */
        .zen-content pre {
          background-color: ${theme.surface || 'rgba(128,128,128,0.08)'};
          border: 1px solid ${theme.borderFaint || 'rgba(128,128,128,0.15)'};
          border-radius: 8px;
          padding: 1em 1.25em;
          margin: 1.5em 0;
          overflow-x: auto;
          font-family: monospace;
          font-size: 0.9em;
          line-height: 1.6;
        }

        .zen-content code {
          font-family: monospace;
          font-size: 0.88em;
          background-color: ${theme.surface || 'rgba(128,128,128,0.08)'};
          padding: 0.15em 0.35em;
          border-radius: 4px;
        }

        .zen-content pre code {
          background: none;
          padding: 0;
          border: none;
        }

        /* Images */
        .zen-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5em auto;
          display: block;
        }

        /* Text Alignments */
        .zen-content .has-text-align-center,
        .zen-content [style*="text-align: center"],
        .zen-content [style*="text-align:center"] {
          text-align: center;
        }

        .zen-content .has-text-align-right,
        .zen-content [style*="text-align: right"],
        .zen-content [style*="text-align:right"] {
          text-align: right;
        }

        .zen-content .has-text-align-justify,
        .zen-content [style*="text-align: justify"],
        .zen-content [style*="text-align:justify"] {
          text-align: justify;
        }

        .zen-content .has-text-align-left,
        .zen-content [style*="text-align: left"],
        .zen-content [style*="text-align:left"] {
          text-align: left;
        }

        /* Formatting marks */
        .zen-content mark {
          background-color: #fef08a;
          color: #1f2937;
          padding: 0.1em 0.25em;
          border-radius: 2px;
        }

        .zen-content u {
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .zen-content s {
          text-decoration: line-through;
        }

        .zen-content strong, .zen-content b {
          font-weight: 700;
        }

        .zen-content em, .zen-content i {
          font-style: italic;
        }

        .zen-content a {
          color: ${theme.accent};
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      `}</style>
      
      {/* Stealth Exit Button */}
      <button 
        onClick={onClose}
        className="fixed top-6 right-6 p-4 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300 z-50 mix-blend-difference text-white cursor-pointer"
        title="Exit Zen Reader (Esc)"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className="zen-content">
        <h1 className="zen-title">{title || 'Untitled Document'}</h1>
        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* Reading Progress Bar (1px) */}
      <div 
        className="fixed bottom-0 left-0 h-[1px] z-50 transition-all duration-150 ease-out"
        style={{ width: `${progress}%`, backgroundColor: theme.accent }}
      />
    </div>
  );
}

