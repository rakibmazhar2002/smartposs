import { Link, useLocation } from 'react-router-dom';
import { clientNavigation, adminNavigation } from '@/core/config/navigation';
import { useAuth } from '@/core/hooks/use-auth';
import { cn } from '@/core/lib/utils';

export function MobileBottomNav() {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const items = (location.pathname.startsWith('/admin') ? adminNavigation : clientNavigation).filter((item) => !item.permission || hasPermission(item.permission)).slice(0, 5);
  return <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 px-2 py-2 backdrop-blur-lg lg:hidden">{items.map((item) => { const Icon = item.icon; const active = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(`${item.href}/`)); return <Link key={item.href} to={item.href} className={cn('flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium', active ? 'text-primary' : 'text-muted-foreground')}><Icon className="h-4 w-4" /><span className="truncate">{item.label}</span></Link>; })}</nav>;
}
