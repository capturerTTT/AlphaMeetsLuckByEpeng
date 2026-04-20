import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Clear boot-fallback watchdog so the error screen never appears once React is running
if (typeof window !== 'undefined' && (window as any).__bootTimeout) {
  clearTimeout((window as any).__bootTimeout);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Remove the static boot-fallback content before React takes over
const bootFallback = document.getElementById('boot-fallback');
if (bootFallback) bootFallback.remove();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);