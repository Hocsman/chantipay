interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, children, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-8 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {(children || action) && (
        <div className="flex items-center gap-3 shrink-0">
          {children || action}
        </div>
      )}
    </div>
  );
}
