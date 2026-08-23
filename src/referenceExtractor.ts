import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { parseMarkdownToHtml, sanitizePastedHtml } from './clipboardEngine';

// Configure PDF.js worker safely
if (typeof window !== 'undefined') {
  try {
    if (pdfWorkerUrl) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
  } catch (e) {
    console.warn('PDF.js worker setup fallback', e);
  }
}

export interface ExtractedDocResult {
  title: string;
  rawText: string;
  htmlContent?: string;
  fileType: 'pdf' | 'docx' | 'markdown' | 'text' | 'image' | 'code';
  blobUrl?: string;
  file?: File;
  fileSize?: number;
  pageCount?: number;
}

/**
 * Extracts text from a PDF file/blob safely
 */
export async function extractTextFromPdfBlob(blob: Blob): Promise<{ text: string; pageCount: number }> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    
    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc && pdfWorkerUrl) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      }
    } catch {
      // ignore worker configuration issues
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });
    
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages || 1;
    const pagesText: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items || [])
          .map((item) => ('str' in item ? (item as { str: string }).str : ''))
          .filter(Boolean)
          .join(' ');
        
        if (pageText.trim()) {
          pagesText.push(`--- [Trang ${i} / ${pageCount}] ---\n${pageText.trim()}`);
        }
      } catch (pageErr) {
        console.warn(`Lỗi đọc trang ${i}:`, pageErr);
      }
    }

    const fullText = pagesText.join('\n\n');
    return {
      text: fullText || `[Tài liệu PDF (${pageCount} trang) - Chuyển sang tab "Xem trực tiếp" để đọc nội dung trực quan]`,
      pageCount,
    };
  } catch (err) {
    console.warn('PDF text extraction fallback:', err);
    return {
      text: `[Tài liệu PDF]\nĐã tải tệp PDF thành công. Bạn có thể sử dụng chế độ "Xem trực tiếp (Live View)" để duyệt toàn bộ trang.`,
      pageCount: 1,
    };
  }
}

/**
 * Extracts text and HTML from a DOCX file/blob with full fidelity
 */
export async function extractFromDocxBlob(blob: Blob): Promise<{ html: string; text: string }> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const [htmlRes, textRes] = await Promise.all([
      mammoth.convertToHtml({ arrayBuffer }),
      mammoth.extractRawText({ arrayBuffer }),
    ]);
    const cleanHtml = sanitizePastedHtml(htmlRes.value || '');
    return {
      html: cleanHtml || htmlRes.value || '',
      text: textRes.value || '',
    };
  } catch (err) {
    console.warn('DOCX extraction error:', err);
    return {
      html: '<p>[Không thể hiển thị định dạng HTML của tệp DOCX này]</p>',
      text: '[Tài liệu Word DOCX]',
    };
  }
}

/**
 * Universal file processor: detects file type and generates both Live View and Extracted Text data with full rich-text fidelity
 */
export async function processReferenceFile(file: File): Promise<ExtractedDocResult> {
  const name = file.name || 'document';
  const lowerName = name.toLowerCase();
  const size = file.size || 0;

  // 1. PDF File
  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    let blobUrl = '';
    try {
      blobUrl = URL.createObjectURL(file);
    } catch {
      // fallback
    }

    const res = await extractTextFromPdfBlob(file);
    const htmlContent = res.text
      .split(/\n\n+/)
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    return {
      title: name,
      rawText: res.text,
      htmlContent,
      fileType: 'pdf',
      blobUrl,
      file,
      fileSize: size,
      pageCount: res.pageCount,
    };
  }

  // 2. Word (.docx) File
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    try {
      const { html, text } = await extractFromDocxBlob(file);
      return {
        title: name,
        rawText: text || html.replace(/<[^>]+>/g, ' '),
        htmlContent: html,
        fileType: 'docx',
        file,
        fileSize: size,
      };
    } catch {
      return {
        title: name,
        rawText: `[Tệp DOCX: ${name}] - Không thể phân tích cú pháp nội dung.`,
        fileType: 'docx',
        file,
        fileSize: size,
      };
    }
  }

  // 3. Image Files
  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(lowerName)) {
    let blobUrl = '';
    try {
      blobUrl = URL.createObjectURL(file);
    } catch {
      // fallback
    }
    return {
      title: name,
      rawText: `[Hình ảnh tham khảo: ${name} (${(size / 1024).toFixed(1)} KB)]`,
      fileType: 'image',
      blobUrl,
      file,
      fileSize: size,
    };
  }

  // 4. Markdown & Plain Text & Code & Data files
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      let fileType: ExtractedDocResult['fileType'] = 'text';
      let htmlContent = '';

      if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
        fileType = 'markdown';
        htmlContent = parseMarkdownToHtml(text);
      } else if (/\.(js|ts|tsx|jsx|py|java|c|cpp|json|csv|html|css|xml|yaml|yml|sql|sh)$/i.test(lowerName)) {
        fileType = 'code';
        htmlContent = `<pre><code class="language-${lowerName.split('.').pop()}">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
      } else {
        fileType = 'text';
        htmlContent = text
          .split(/\n\n+/)
          .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('');
      }

      resolve({
        title: name,
        rawText: text,
        htmlContent: htmlContent || text,
        fileType,
        file,
        fileSize: size,
      });
    };
    reader.onerror = () => {
      resolve({
        title: name,
        rawText: `[Tệp ${name}] - Lỗi đọc nội dung văn bản.`,
        fileType: 'text',
        file,
        fileSize: size,
      });
    };
    reader.readAsText(file);
  });
}

