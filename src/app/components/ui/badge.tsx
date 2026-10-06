import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/core/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]', {
  variants: {
    variant: {
      default: 'border-primary/20 bg-primary/10 text-primary',
      secondary: 'border-border bg-secondary text-secondary-foreground',
      success: 'border-success/20 bg-success/10 text-success',
      warning: 'border-warning/25 bg-warning/10 text-warning',
      destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
      outline: 'border-border bg-transparent text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, variant, ...props }: BadgeProps) { return <div className={cn(badgeVariants({ variant }), className)} {...props} />; }
