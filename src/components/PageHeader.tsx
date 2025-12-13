interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, children, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 pb-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>
        )}
      </div>
      {(children || action) && <div className="flex items-center gap-2">{children || action}</div>}
    </div>
  );
}
