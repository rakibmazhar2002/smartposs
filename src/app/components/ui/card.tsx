import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/core/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('rounded-2xl border border-border bg-surface shadow-soft', className)} {...props} />);
Card.displayName = 'Card';
export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col gap-1.5 p-5 sm:p-6', className)} {...props} />;
export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn('text-sm font-semibold tracking-tight text-foreground', className)} {...props} />;
export const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => <p className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />;
export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />;
export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('flex items-center p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />;
