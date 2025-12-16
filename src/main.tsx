import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

function renderFatal(err: unknown) {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  rootEl.innerHTML = `
    <div style="padding:16px;font-family:ui-monospace,Menlo,monospace;white-space:pre-wrap">
      <h2 style="margin:0 0 10px 0">Runtime error (visas istället för grå sida)</h2>
<div>${String((err as any)?.stack || (err as any)?.message || err)}</div>
    </div>
  `;
}

window.addEventListener('error', (e) => renderFatal(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => renderFatal((e as any).reason));

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  renderFatal(err);
}