import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global error logger for unhandled exceptions & promises
window.addEventListener('error', (event) => {
  console.error('CRITICAL UNCAUGHT WINDOW ERROR:', event.error || event.message);
  const root = document.getElementById('root');
  if (root && root.innerHTML.trim() === '') {
    root.innerHTML = `
      <div style="padding: 30px; color: #f87171; background: #0f172a; font-family: sans-serif; min-height: 100vh;">
        <h2 style="font-size: 20px; color: #ef4444;">⚠️ Script Error Encountered</h2>
        <p style="color: #facc15; font-size: 14px;">${event.message}</p>
        <p style="color: #94a3b8; font-size: 12px;">${event.filename || ''} line ${event.lineno || ''}</p>
        <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" 
          style="margin-top: 15px; padding: 8px 16px; background: #22c55e; color: #000; font-weight: bold; border-radius: 8px; border: none; cursor: pointer;">
          Reset Storage & Reload
        </button>
      </div>
    `;
  }
});

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RootErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#f87171', background: '#0a101f', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 24, color: '#ef4444', marginBottom: 12 }}>⚠️ Application Crash Detected</h1>
          <p style={{ color: '#facc15', fontSize: 16, marginBottom: 16 }}>{this.state.error?.toString()}</p>
          <pre style={{ background: '#1e293b', padding: 16, borderRadius: 8, overflowX: 'auto', whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: 12 }}>
            {this.state.error?.stack}
          </pre>
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button
              onClick={() => {
                sessionStorage.clear();
                localStorage.clear();
                window.location.href = '/';
              }}
              style={{ padding: '10px 20px', background: '#22c55e', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Clear Storage & Reset App
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
)

