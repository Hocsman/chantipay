'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAIFeedback, type FeedbackContext, type FeedbackType } from '@/hooks/useAIFeedback'
import { toast } from 'sonner'

interface FeedbackButtonsProps {
  context: FeedbackContext
  itemId: string
  onFeedback?: (feedback: FeedbackType) => void
  size?: 'sm' | 'default'
  showLabels?: boolean
  className?: string
  metadata?: Record<string, unknown>
}

export function FeedbackButtons({
  context,
  itemId,
  onFeedback,
  size = 'sm',
  showLabels = false,
  className,
  metadata,
}: FeedbackButtonsProps) {
  const { recordFeedback, hasFeedback, getFeedback } = useAIFeedback()
  const [localFeedback, setLocalFeedback] = useState<FeedbackType | null>(null)

  const currentFeedback = localFeedback || getFeedback(itemId)
  const hasGivenFeedback = localFeedback !== null || hasFeedback(itemId)

  const handleFeedback = (feedback: FeedbackType) => {
    recordFeedback(context, feedback, itemId, metadata)
    setLocalFeedback(feedback)
    onFeedback?.(feedback)

    if (feedback === 'helpful') {
      toast.success('Merci pour votre retour !', { duration: 2000 })
    } else {
      toast('Merci, nous améliorerons nos suggestions', {
        duration: 2000,
        icon: '💡',
      })
    }
  }

  if (hasGivenFeedback) {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <Check className="h-3 w-3" />
        <span className="text-xs">
          {currentFeedback === 'helpful' ? 'Utile' : 'Pas utile'}
        </span>
      </div>
    )
  }

  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {showLabels && (
        <span className="text-xs text-muted-foreground mr-1">Utile ?</span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className={cn(buttonSize, 'hover:text-green-600 hover:bg-green-50')}
        onClick={(e) => {
          e.stopPropagation()
          handleFeedback('helpful')
        }}
        title="Cette suggestion est utile"
      >
        <ThumbsUp className={iconSize} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(buttonSize, 'hover:text-red-600 hover:bg-red-50')}
        onClick={(e) => {
          e.stopPropagation()
          handleFeedback('not_helpful')
        }}
        title="Cette suggestion n'est pas utile"
      >
        <ThumbsDown className={iconSize} />
      </Button>
    </div>
  )
}

/**
 * Version compacte pour affichage inline
 */
export function FeedbackButtonsInline({
  context,
  itemId,
  onFeedback,
  className,
  metadata,
}: Omit<FeedbackButtonsProps, 'size' | 'showLabels'>) {
  const { recordFeedback, hasFeedback, getFeedback } = useAIFeedback()
  const [localFeedback, setLocalFeedback] = useState<FeedbackType | null>(null)

  const currentFeedback = localFeedback || getFeedback(itemId)
  const hasGivenFeedback = localFeedback !== null || hasFeedback(itemId)

  const handleFeedback = (feedback: FeedbackType) => {
    recordFeedback(context, feedback, itemId, metadata)
    setLocalFeedback(feedback)
    onFeedback?.(feedback)
  }

  if (hasGivenFeedback) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        {currentFeedback === 'helpful' ? '👍' : '👎'}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex gap-1', className)}>
      <button
        type="button"
        className="text-muted-foreground hover:text-green-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          handleFeedback('helpful')
        }}
        title="Utile"
      >
        👍
      </button>
      <button
        type="button"
        className="text-muted-foreground hover:text-red-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          handleFeedback('not_helpful')
        }}
        title="Pas utile"
      >
        👎
      </button>
    </span>
  )
}
