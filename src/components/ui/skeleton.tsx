import { cn } from '@/lib/utils';

/**
 * Skeleton Component
 *
 * A placeholder component that shows a loading animation.
 * Used for skeleton loading states while content is being fetched.
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-[200px]" />
 * <Skeleton className="h-12 w-12 rounded-full" />
 * ```
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
