import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { CommandPalette } from './CommandPalette';
import { NotificationDrawer } from './NotificationDrawer';

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  return <div className="min-h-screen bg-background"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /><div className={`${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[272px]'} transition-[padding] duration-200`}><Header onMenu={() => setMobileOpen(true)} onCommand={() => setCommandOpen(true)} onNotifications={() => setNotificationOpen(true)} /><main className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10"><div className="app-grid-bg pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60" /> <div className="relative mx-auto w-full max-w-[1440px] animate-fade-in">{children}</div></main></div><MobileBottomNav /><CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} /><NotificationDrawer open={notificationOpen} onClose={() => setNotificationOpen(false)} /></div>;
}
