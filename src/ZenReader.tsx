import React, { useEffect, useRef, useState } from 'react';
import type { ThemeColors } from './types';

interface ZenReaderProps {
  content: string;
  title: string;
  theme: ThemeColors;
  docFont?: string;
  zoomPercent?: number;
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

  // Intersection Observer for scroll-reveal and focus spotlight
  useEffect(() => {
    if (!contentRef.current) return;
    const blocks = contentRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote');
    
    // Add base classes for CSS transitions
    blocks.forEach(block => {
      block.classList.add('zen-block');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Calculate how close to the center of the viewport the element is
          const rect = entry.boundingClientRect;
          const viewportHeight = window.innerHeight;
          const elementCenter = rect.top + rect.height / 2;
          const distanceToCenter = Math.abs(viewportHeight / 2 - elementCenter);
          const maxDistance = viewportHeight / 1.1;
          const ratio = Math.max(0, 1 - distanceToCenter / maxDistance);
          
          if (ratio > 0.3) {
             entry.target.classList.add('zen-focus');
             entry.target.classList.remove('zen-blur');
             entry.target.classList.remove('zen-hidden');
          } else {
             entry.target.classList.add('zen-blur');
             entry.target.classList.remove('zen-focus');
             entry.target.classList.remove('zen-hidden');
          }
        } else {
          // Out of viewport
          entry.target.classList.remove('zen-focus');
          entry.target.classList.remove('zen-blur');
          // If it's below the viewport, it should be zen-hidden to slide up when appearing
          if (entry.boundingClientRect.top > 0) {
            entry.target.classList.add('zen-hidden');
          } else {
            // Above viewport, just blur it out
            entry.target.classList.add('zen-blur');
          }
        }
      });
    }, {
      root: containerRef.current,
      threshold: Array.from({ length: 21 }).map((_, i) => i * 0.05), // Observe constantly for smooth focus
      rootMargin: "0px 0px -15% 0px" // Trigger slightly before it hits the bottom
    });

    blocks.forEach(block => observer.observe(block));

    return () => observer.disconnect();
  }, [content]);

  // Handle first letter drop cap & paragraph formatting
  useEffect(() => {
    if (!contentRef.current) return;
    const paragraphs = contentRef.current.querySelectorAll('p');
    if (paragraphs.length > 0) {
      // Find the first non-empty paragraph
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        if (p.textContent && p.textContent.trim().length > 0) {
          p.classList.add('zen-first-paragraph');
          break;
        }
      }
    }
  }, [content]);

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
        /* Minimalist scrollbar hide just in case */
        .zen-reader-scroll::-webkit-scrollbar { display: none; }
        
        /* Typography & Layout */
        .zen-content {
          max-width: 66ch;
          margin: 0 auto;
          font-family: 'Newsreader', 'Merriweather', ${docFont}, 'Georgia', serif;
          line-height: 1.95;
          letter-spacing: 0.015em;
          padding: 12vh 24px 20vh;
          font-size: ${1.125 * (zoomPercent / 100)}rem;
        }
        
        .zen-content h1, .zen-content h2, .zen-content h3 {
          line-height: 1.4;
          margin-top: 2em;
          margin-bottom: 1em;
          font-weight: 600;
        }
        
        .zen-content h1 { font-size: 2.25em; text-align: center; }
        .zen-content h2 { font-size: 1.75em; }
        .zen-content h3 { font-size: 1.35em; }
        
        /* Title */
        .zen-title {
          font-family: 'Newsreader', 'Merriweather', ${docFont}, 'Georgia', serif;
          font-size: ${2.5 * (zoomPercent / 100)}rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 3rem;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }

        /* Editorial Paragraphs */
        .zen-content p {
          margin: 0;
          text-indent: 1.8em;
        }
        
        /* Drop Cap for First Paragraph */
        .zen-first-paragraph {
          text-indent: 0 !important;
        }
        
        .zen-first-paragraph::first-letter {
          float: left;
          font-size: 3.5em;
          line-height: 0.8;
          padding-top: 0.1em;
          padding-right: 0.1em;
          padding-left: 0.05em;
          color: ${theme.accent};
          font-weight: bold;
        }

        /* Intersection Observer Transitions */
        .zen-block {
          transition: opacity 0.4s ease-out, transform 0.4s ease-out, filter 0.4s ease-out;
          will-change: opacity, transform, filter;
        }
        
        /* State: hidden (below viewport) */
        .zen-hidden {
          opacity: 0;
          transform: translateY(40px);
          filter: blur(4px);
        }
        
        /* State: blurred (out of focus, but in view) */
        .zen-blur {
          opacity: 0.35;
          transform: translateY(0);
          filter: blur(0px);
        }
        
        /* State: focus */
        .zen-focus {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0px);
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
