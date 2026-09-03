import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import React, { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('kgv-active-project-id');
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          background: '#FAFAFA',
          color: '#1F2937',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '440px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              Đã xảy ra sự cố khi tải ứng dụng
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px', lineHeight: 1.5 }}>
              Ứng dụng gặp lỗi tạm thời trong quá trình hiển thị. Bạn có thể thử tải lại trang hoặc khôi phục phiên làm việc.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 500,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Tải lại trang
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: '#F3F4F6',
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: '14px',
                  border: '1px solid #D1D5DB',
                  cursor: 'pointer'
                }}
              >
                Khôi phục phiên
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore registration errors */
    });
  });
}
