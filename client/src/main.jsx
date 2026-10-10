import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'


try {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  }
} catch (err) {
  console.error('Fatal initialization error:', err);
  const container = document.getElementById('root');
  if (container) {
    container.innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#07090e;color:#fff;padding:24px;text-align:center;font-family:-apple-system,sans-serif;">
        <div style="font-size:42px;margin-bottom:14px;">⚠️</div>
        <h2 style="font-size:18px;margin-bottom:8px;">حدث خطأ أثناء تشغيل التطبيق</h2>
        <p style="font-size:12px;color:#94a3b8;max-width:320px;margin-bottom:20px;line-height:1.5;">${err?.message || 'Error initializing app'}</p>
        <button onclick="localStorage.clear();location.reload();" style="padding:12px 24px;background:#38bdf8;color:#000;border:none;border-radius:14px;font-weight:700;font-size:14px;cursor:pointer;">إعادة ضبط التطبيق / Reset App</button>
      </div>
    `;
  }
}

