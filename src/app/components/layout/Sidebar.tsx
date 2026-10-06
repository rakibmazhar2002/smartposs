import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, ShieldCheck, Sparkles, X } from 'lucide-react';
import { adminNavigation, clientNavigation, type NavigationItem } from '@/core/config/navigation';
import { useAuth } from '@/core/hooks/use-auth';
import { cn, initials } from '@/core/lib/utils';
import { BranchSwitcher } from './BranchSwitcher';
import { Button } from '../ui/button';

export function Sidebar({ collapsed, onToggle, mobileOpen, onClose }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { user, tenant, signOut, hasPermission } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');
  const items = (isAdmin ? adminNavigation : clientNavigation).filter((item) => !item.permission || hasPermission(item.permission));
  return <>
    {mobileOpen ? <button className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" aria-label="Close navigation" onClick={onClose} /> : null}
    <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-border bg-surface transition-transform duration-200 lg:translate-x-0', collapsed ? 'lg:w-[84px]' : 'lg:w-[272px]', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex h-20 items-center justify-between border-b border-border px-4 lg:px-5"><Link to={isAdmin ? '/admin' : '/dashboard'} className="flex min-w-0 items-center gap-3" onClick={onClose}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20"><Sparkles className="h-5 w-5" /></div>{!collapsed ? <div className="min-w-0"><p className="truncate text-sm font-bold tracking-tight">Smart<span className="text-primary">POS</span></p><p className="eyebrow mt-0.5 text-[9px]">{isAdmin ? 'Control plane' : 'Business OS'}</p></div> : null}</Link><Button className="lg:hidden" variant="ghost" size="icon-sm" aria-label="Close navigation" onClick={onClose}><X className="h-4 w-4" /></Button></div>
      <div className="flex-1 overflow-y-auto px-3 py-5"><div className={cn('mb-6', collapsed ? 'lg:px-1' : '')}>{isAdmin ? <div className={cn('flex items-center gap-2 rounded-xl border border-violet-500/15 bg-violet-500/5 p-2.5', collapsed ? 'lg:justify-center lg:p-2' : '')}><ShieldCheck className="h-4 w-4 shrink-0 text-violet-500" />{!collapsed ? <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Super Admin mode</span> : null}</div> : <BranchSwitcher compact={collapsed} />}</div><nav className="space-y-1">{items.map((item) => <NavItem key={item.href} item={item} active={location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(`${item.href}/`))} collapsed={collapsed} onClick={onClose} />)}</nav></div>
      <div className="border-t border-border p-3"><div className={cn('flex items-center gap-3 rounded-xl p-2', collapsed ? 'lg:justify-center' : '')}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{initials(user?.fullName ?? 'User')}</div>{!collapsed ? <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{user?.fullName}</p><p className="truncate text-[11px] text-muted-foreground">{tenant?.name}</p></div> : null}<Button variant="ghost" size="icon-sm" aria-label="Sign out" onClick={() => { void signOut(); }}><LogOut className="h-4 w-4" /></Button></div><Button variant="ghost" size="icon-sm" className="mt-2 hidden w-full lg:inline-flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={onToggle}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span className="text-xs">Collapse navigation</span></>}</Button></div>
    </aside>
  </>;
}

function NavItem({ item, active, collapsed, onClick }: { item: NavigationItem; active: boolean; collapsed: boolean; onClick: () => void }) { const Icon = item.icon; return <Link to={item.href} onClick={onClick} title={collapsed ? item.label : undefined} className={cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground', collapsed ? 'lg:justify-center lg:px-2' : '')}><Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />{!collapsed ? <span className="truncate">{item.label}</span> : null}{!collapsed && active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" /> : null}</Link>; }
