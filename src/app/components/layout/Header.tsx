import { Bell, Command, Menu, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adminNavigation, clientNavigation } from '@/core/config/navigation';
import { useAuth } from '@/core/hooks/use-auth';
import { api } from '@/core/services/api-client';
import { Button } from '../ui/button';
import { BranchSwitcher } from './BranchSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function Header({ onMenu, onCommand, onNotifications }: { onMenu: () => void; onCommand: () => void; onNotifications: () => void }) {
  const location = useLocation();
  const { user, tenant } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const demo = import.meta.env.VITE_DEMO_MODE === 'true';
  useEffect(() => {
    if (!user || demo) return;
    void api.tenant.notifications().then((result) => setUnreadCount(result.notifications.filter((notification) => !notification.isRead).length)).catch(() => setUnreadCount(0));
  }, [demo, user]);
  const item = [...clientNavigation, ...adminNavigation].find((entry) => location.pathname === entry.href || (entry.href !== '/dashboard' && location.pathname.startsWith(`${entry.href}/`)));
  const visibleUnread = demo ? 2 : unreadCount;
  return <header className="no-print sticky top-0 z-20 flex h-20 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8"><div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={onMenu}><Menu className="h-5 w-5" /></Button><div className="min-w-0"><p className="eyebrow hidden sm:block">{tenant?.name ?? 'SmartPOS'}{user?.isSuperAdmin && location.pathname.startsWith('/admin') ? ' · Control plane' : ''}</p><h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{item?.label ?? 'Workspace'}</h1></div></div><div className="flex items-center gap-1.5 sm:gap-2"><div className="hidden md:block"><BranchSwitcher compact /></div><Button variant="outline" size="sm" className="hidden gap-2 text-muted-foreground lg:inline-flex" onClick={onCommand}><Search className="h-3.5 w-3.5" /><span>Search</span><kbd className="ml-3 rounded border border-border px-1.5 py-0.5 text-[10px]"><Command className="inline h-3 w-3" /> K</kbd></Button><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open command palette" onClick={onCommand}><Search className="h-5 w-5" /></Button><ThemeToggle /><Button variant="ghost" size="icon" className="relative" aria-label={visibleUnread ? `${visibleUnread} unread notifications` : 'Open notifications'} onClick={onNotifications}><Bell className="h-5 w-5" />{visibleUnread > 0 ? <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground">{visibleUnread > 9 ? '9+' : visibleUnread}</span> : null}</Button><div className="ml-1 hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs font-bold text-white sm:flex">{user?.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div></div></header>;
}
