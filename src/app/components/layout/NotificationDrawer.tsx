import { Bell, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/core/services/api-client';
import type { Notification } from '@/core/types/domain';
import { formatRelativeDate } from '@/core/lib/formatters';
import { cn } from '@/core/lib/utils';
import { Button } from '../ui/button';
import { EmptyState } from '../feedback/empty-state';

export function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => { if (open) void api.tenant.notifications().then((result) => setNotifications(result.notifications)).catch(() => setNotifications([])); }, [open]);
  return <>{open ? <button className="fixed inset-0 z-50 bg-slate-950/35" aria-label="Close notifications" onClick={onClose} /> : null}<aside className={cn('fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col border-l border-border bg-surface shadow-lift transition-transform duration-200', open ? 'translate-x-0' : 'translate-x-full')}><div className="flex h-20 items-center justify-between border-b border-border px-5"><div><p className="eyebrow">Inbox</p><h2 className="mt-1 text-lg font-semibold">Notifications</h2></div><Button variant="ghost" size="icon" aria-label="Close notifications" onClick={onClose}><X className="h-5 w-5" /></Button></div><div className="flex-1 overflow-y-auto p-4">{notifications.length === 0 ? <EmptyState icon={Bell} title="You are all caught up" description="Lifecycle alerts and workspace updates will appear here." className="border-0 bg-transparent py-16" /> : <div className="space-y-3">{notifications.map((notification) => <div key={notification.id} className={cn('rounded-xl border p-4', notification.isRead ? 'border-border bg-surface' : 'border-primary/20 bg-primary/[0.035]')}><div className="flex items-start gap-3"><div className={cn('mt-0.5 h-2 w-2 shrink-0 rounded-full', notification.isRead ? 'bg-muted-foreground/30' : 'bg-primary')} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{notification.title}</p>{!notification.isRead ? <Button variant="ghost" size="icon-sm" aria-label="Mark as read" onClick={() => { void api.tenant.markNotificationRead(notification.id).then(() => setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item))); }}><Check className="h-3.5 w-3.5" /></Button> : null}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{notification.message}</p><p className="mt-3 text-[11px] text-muted-foreground">{formatRelativeDate(notification.createdAt)}</p></div></div></div>)}</div>}</div></aside></>;
}
