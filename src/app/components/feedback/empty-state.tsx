import { Inbox, type LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/core/lib/utils';

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: { icon?: LucideIcon; title: string; description: string; action?: { label: string; onClick: () => void }; className?: string }) {
  return <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/40 px-6 py-12 text-center', className)}>
    <div className="mb-4 rounded-2xl bg-accent p-3 text-primary"><Icon className="h-6 w-6" /></div>
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
    {action ? <Button className="mt-5" size="sm" onClick={action.onClick}>{action.label}</Button> : null}
  </div>;
}
