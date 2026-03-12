import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--accent-subtle)] text-[var(--accent)]',
        success:
          'border-transparent bg-[var(--success-subtle)] text-[var(--success)]',
        destructive:
          'border-transparent bg-[var(--danger-subtle)] text-[var(--danger)]',
        warning:
          'border-transparent bg-[var(--warning-subtle)] text-[var(--warning)]',
        outline:
          'border-[var(--border)] text-[var(--text-secondary)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
