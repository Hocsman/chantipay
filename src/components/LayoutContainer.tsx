interface LayoutContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function LayoutContainer({ children, className = '' }: LayoutContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6 ${className}`}>
      {children}
    </div>
  );
}
