import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store/useAppStore';

if (typeof window !== 'undefined') {
  (window as any).__useAppStore = useAppStore;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'bg-slate-900 text-slate-100 border border-white/10 shadow-glass-md text-sm',
        duration: 3500,
        style: {
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '0.75rem',
        },
      }}
    />
    <App />
  </React.StrictMode>
);
