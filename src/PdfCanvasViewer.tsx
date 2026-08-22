import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import type { Theme } from './theme';
import type { Lang } from './i18n';

interface PdfCanvasViewerProps {
  file?: File | null;
  blobUrl?: string | null;
  theme: Theme;
  lang: Lang;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  file,
  blobUrl,
  theme,
  lang,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);

      try {
        let sourceData: Uint8Array | string = '';
        if (file) {
          const buffer = await file.arrayBuffer();
          sourceData = new Uint8Array(buffer);
        } else if (blobUrl) {
          sourceData = blobUrl;
        } else {
          return;
        }

        const loadingTask = pdfjsLib.getDocument(
          typeof sourceData === 'string'
            ? sourceData
            : { data: sourceData, useSystemFonts: true, isEvalSupported: false }
        );

        const pdf = await loadingTask.promise;
        if (!isCancelled) {
          pdfDocRef.current = pdf;
          setNumPages(pdf.numPages || 1);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.warn('PDF load error:', err);
          setError(
            lang === 'vi'
              ? 'Không thể tải trực tiếp bản xem PDF. Bạn có thể chuyển sang tab Trích xuất văn bản.'
              : 'Failed to render PDF preview. You can switch to Extracted Text view.'
          );
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [file, blobUrl, lang]);

  // Render current page to canvas
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDocRef.current || !canvasRef.current) return;

      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
        }

        const page = await pdfDocRef.current.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: ctx,
          transform: transform as number[] | undefined,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: unknown) {
        // Only log if not an intentional cancel
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name !== 'RenderingCancelledException') {
          console.warn('Page render error:', err);
        }
      }
    },
    [scale]
  );

  useEffect(() => {
    if (pdfDocRef.current && currentPage > 0) {
      renderPage(currentPage);
    }
  }, [currentPage, renderPage]);

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden select-none">
      {/* PDF Controls Bar */}
      <div 
        className="flex items-center justify-between px-3 py-1.5 border-b text-xs shrink-0"
        style={{ borderColor: theme.borderFaint, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
      >
        {/* Page Nav */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
            title={lang === 'vi' ? 'Trang trước' : 'Previous page'}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[11px] font-medium px-1">
            {lang === 'vi' ? `Trang ${currentPage} / ${numPages || 1}` : `Page ${currentPage} of ${numPages || 1}`}
          </span>
          <button
            type="button"
            disabled={currentPage >= numPages || loading}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
            title={lang === 'vi' ? 'Trang sau' : 'Next page'}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)))}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title={lang === 'vi' ? 'Thu nhỏ' : 'Zoom out'}
          >
            <ZoomOut size={13} style={{ color: theme.textMuted }} />
          </button>
          <span className="text-[10px] w-9 text-center font-mono opacity-80">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(3.0, +(s + 0.2).toFixed(1)))}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title={lang === 'vi' ? 'Phóng to' : 'Zoom in'}
          >
            <ZoomIn size={13} style={{ color: theme.textMuted }} />
          </button>
          <button
            type="button"
            onClick={() => setScale(1.2)}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
            title={lang === 'vi' ? 'Vừa vặn (100%)' : 'Reset 100%'}
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* Canvas Viewport Area */}
      <div 
        className="flex-1 overflow-auto p-4 flex flex-col items-center justify-start kgv-scroll"
        style={{ backgroundColor: theme.isDark ? '#141416' : '#e5e7eb' }}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 gap-2 opacity-70">
            <Loader2 size={28} className="animate-spin" style={{ color: theme.accent }} />
            <span className="text-xs font-medium">{lang === 'vi' ? 'Đang chuẩn bị trang PDF...' : 'Rendering PDF pages...'}</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm rounded-xl border border-red-500/20 bg-red-500/5 my-auto">
            <AlertCircle size={32} className="text-red-500 mb-2" />
            <p className="text-xs text-red-500 font-medium">{error}</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`shadow-xl rounded-sm transition-transform max-w-full ${loading ? 'hidden' : 'block'}`}
          style={{
            backgroundColor: '#ffffff',
          }}
        />
      </div>
    </div>
  );
};
export default PdfCanvasViewer;
