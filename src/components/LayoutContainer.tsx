import { cn } from '@/lib/utils';

interface LayoutContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function LayoutContainer({ children, className }: LayoutContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8 space-y-6 md:space-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}
