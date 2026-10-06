import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/core/lib/utils';

export function StatCard({ label, value, hint, icon: Icon, trend, accent = 'blue' }: { label: string; value: string | number; hint: string; icon: LucideIcon; trend?: number; accent?: 'blue' | 'violet' | 'emerald' | 'amber' }) {
  const accentClasses = { blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-300', violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300', emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300', amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' };
  return <Card className="overflow-hidden"><CardContent className="relative p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</p></div><div className={cn('rounded-xl p-3', accentClasses[accent])}><Icon className="h-5 w-5" /></div></div><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">{trend !== undefined ? <span className={cn('inline-flex items-center gap-0.5 font-semibold', trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground')}>{trend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : trend < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}{Math.abs(trend)}%</span> : null}<span>{hint}</span></div><div className="absolute -bottom-10 -right-8 h-24 w-24 rounded-full bg-primary/[0.035]" /></CardContent></Card>;
}
