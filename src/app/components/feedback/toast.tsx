import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/core/lib/utils';
import { Button } from '../ui/button';

type ToastTone = 'success' | 'info' | 'error';
interface ToastItem { id: number; title: string; message?: string; tone: ToastTone; }
interface ToastContextValue { push: (toast: Omit<ToastItem, 'id'>) => void; }
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4500);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return <ToastContext.Provider value={value}>{children}<div className="no-print fixed bottom-5 right-5 z-[80] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">{toasts.map((toast) => <ToastCard key={toast.id} toast={toast} dismiss={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} />)}</div></ToastContext.Provider>;
}

function ToastCard({ toast, dismiss }: { toast: ToastItem; dismiss: () => void }) {
  const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? XCircle : Info;
  return <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-lift"><Icon className={cn('mt-0.5 h-5 w-5 shrink-0', toast.tone === 'success' ? 'text-success' : toast.tone === 'error' ? 'text-destructive' : 'text-primary')} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{toast.title}</p>{toast.message ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{toast.message}</p> : null}</div><Button variant="ghost" size="icon-sm" aria-label="Dismiss notification" onClick={dismiss}><X className="h-4 w-4" /></Button></div>;
}

export function useToast(): ToastContextValue { const value = useContext(ToastContext); if (!value) throw new Error('useToast must be used inside ToastProvider.'); return value; }
