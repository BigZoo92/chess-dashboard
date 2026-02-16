import type React from 'react';

import { cn } from '@/lib/utils';

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('inline-flex rounded-md bg-muted p-1', className)} {...props} />;
}

export function TabsTrigger({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        'rounded-sm px-3 py-1.5 text-sm transition',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        className
      )}
      {...props}
    />
  );
}
