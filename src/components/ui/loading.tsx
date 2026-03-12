import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function Loading({ size = 'default', className }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    default: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      role="status"
      className={cn('flex items-center justify-center', className)}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-[var(--accent)] border-t-transparent',
          sizeClasses[size]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
