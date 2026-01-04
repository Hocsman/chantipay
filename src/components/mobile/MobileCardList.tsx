'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileCardListItemProps {
  title: string
  subtitle?: string
  description?: string
  icon?: LucideIcon
  badge?: React.ReactNode
  rightContent?: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
}

export function MobileCardListItem({
  title,
  subtitle,
  description,
  icon: Icon,
  badge,
  rightContent,
  onClick,
  href,
  className,
}: MobileCardListItemProps) {
  const Component = href ? 'a' : 'div'
  const props = href ? { href } : {}

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-all active:scale-[0.98]',
        (onClick || href) && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          {Icon && (
            <div className="mt-1 flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-base leading-tight truncate">
                {title}
              </h3>
              {badge}
            </div>

            {subtitle && (
              <p className="text-sm text-muted-foreground mb-1">{subtitle}</p>
            )}

            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}

            {rightContent && (
              <div className="mt-3">{rightContent}</div>
            )}
          </div>

          {/* Chevron */}
          {(onClick || href) && (
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface MobileCardListProps {
  children: React.ReactNode
  className?: string
}

export function MobileCardList({ children, className }: MobileCardListProps) {
  return <div className={cn('space-y-3', className)}>{children}</div>
}
