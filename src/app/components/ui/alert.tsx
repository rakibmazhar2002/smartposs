import type { HTMLAttributes } from 'react';
import { cn } from '@/core/lib/utils';

export function Alert({ className, tone = 'info', ...props }: HTMLAttributes<HTMLDivElement> & { tone?: 'info' | 'warning' | 'error' | 'success' }) { return <div role="status" className={cn('rounded-xl border px-4 py-3 text-sm', tone === 'info' && 'border-primary/20 bg-primary/5 text-primary', tone === 'warning' && 'border-warning/25 bg-warning/10 text-warning', tone === 'error' && 'border-destructive/20 bg-destructive/5 text-destructive', tone === 'success' && 'border-success/20 bg-success/5 text-success', className)} {...props} />; }
