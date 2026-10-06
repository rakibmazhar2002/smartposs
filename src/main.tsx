import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './core/hooks/use-auth';
import { ThemeProvider } from './core/hooks/use-theme';
import { ToastProvider } from './app/components/feedback/toast';
import { AppRouter } from './app/routes/AppRouter';
import './app/styles/globals.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });
}

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><ThemeProvider><AuthProvider><ToastProvider><AppRouter /></ToastProvider></AuthProvider></ThemeProvider></BrowserRouter></StrictMode>);
