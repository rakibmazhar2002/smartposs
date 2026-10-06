import { Command, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientNavigation, adminNavigation } from '@/core/config/navigation';
import { useAuth } from '@/core/hooks/use-auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [query, setQuery] = useState('');
  useEffect(() => { if (!open) setQuery(''); const listener = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (open) onClose(); } }; window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener); }, [onClose, open]);
  const items = useMemo(() => [...(user?.isSuperAdmin ? adminNavigation : []), ...clientNavigation].filter((item) => (!item.permission || hasPermission(item.permission)) && item.label.toLowerCase().includes(query.toLowerCase())), [hasPermission, query, user?.isSuperAdmin]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/45 px-4 pt-[12vh]" onMouseDown={onClose}><div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-lift" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-border px-4"><Search className="h-5 w-5 text-muted-foreground" /><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jump to a workspace..." className="h-14 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" /><kbd className="hidden rounded-md border border-border bg-surface-muted px-2 py-1 text-[10px] text-muted-foreground sm:inline-flex">ESC</kbd></div><div className="max-h-[360px] overflow-y-auto p-2">{items.map((item) => { const Icon = item.icon; return <button key={`${item.href}-${item.label}`} onClick={() => { navigate(item.href); onClose(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-surface-muted"><span className="rounded-lg bg-accent p-2 text-primary"><Icon className="h-4 w-4" /></span><span className="flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="block text-xs text-muted-foreground">{item.description}</span></span><Command className="h-3.5 w-3.5 text-muted-foreground" /></button>; })}{items.length === 0 ? <p className="px-3 py-10 text-center text-sm text-muted-foreground">No destinations match “{query}”.</p> : null}</div><div className="flex items-center gap-2 border-t border-border bg-surface-muted/50 px-4 py-3 text-[11px] text-muted-foreground"><span className="rounded border border-border px-1.5 py-0.5">↑↓</span> Navigate <span className="rounded border border-border px-1.5 py-0.5">↵</span> Open <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-[11px]" onClick={onClose}>Close</Button></div></div></div>;
}
