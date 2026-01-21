'use client'

import { useState, useRef, useCallback, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeToDeleteProps {
  children: ReactNode
  onDelete: () => void
  threshold?: number // Percentage of width needed to trigger delete
  disabled?: boolean
  className?: string
}

export function SwipeToDelete({
  children,
  onDelete,
  threshold = 30, // 30% of width
  disabled = false,
  className,
}: SwipeToDeleteProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startTranslateRef = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return
    startXRef.current = e.touches[0].clientX
    startTranslateRef.current = translateX
    setIsDragging(true)
  }, [disabled, translateX])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return

    const currentX = e.touches[0].clientX
    const diff = currentX - startXRef.current
    const newTranslate = startTranslateRef.current + diff

    // Only allow swiping left (negative values)
    if (newTranslate > 0) {
      setTranslateX(0)
    } else {
      // Limit the swipe to -80% of container width
      const containerWidth = containerRef.current?.offsetWidth || 300
      const maxSwipe = containerWidth * -0.8
      setTranslateX(Math.max(newTranslate, maxSwipe))
    }
  }, [isDragging, disabled])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return
    setIsDragging(false)

    const containerWidth = containerRef.current?.offsetWidth || 300
    const thresholdPx = containerWidth * (threshold / 100)

    if (Math.abs(translateX) > thresholdPx) {
      // Trigger delete animation
      setTranslateX(-containerWidth)
      setTimeout(() => {
        onDelete()
        setTranslateX(0)
      }, 200)
    } else {
      // Reset position
      setTranslateX(0)
    }
  }, [isDragging, disabled, translateX, threshold, onDelete])

  const deleteOpacity = Math.min(Math.abs(translateX) / 100, 1)
  const showDeleteIcon = translateX < -20

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Delete background */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive text-destructive-foreground transition-opacity"
        style={{
          width: Math.abs(translateX) + 20,
          opacity: deleteOpacity,
        }}
      >
        {showDeleteIcon && (
          <div className="flex items-center gap-2 pr-4">
            <Trash2 className="h-5 w-5" />
            <span className="text-sm font-medium">Supprimer</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'relative bg-background transition-transform',
          isDragging ? 'transition-none' : 'duration-200'
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Version simplifiée avec confirmation
 */
interface SwipeToDeleteWithConfirmProps extends Omit<SwipeToDeleteProps, 'onDelete'> {
  onDelete: () => void
  confirmMessage?: string
}

export function SwipeToDeleteWithConfirm({
  children,
  onDelete,
  confirmMessage = 'Supprimer cet élément ?',
  ...props
}: SwipeToDeleteWithConfirmProps) {
  const handleDelete = useCallback(() => {
    if (window.confirm(confirmMessage)) {
      onDelete()
    }
  }, [onDelete, confirmMessage])

  return (
    <SwipeToDelete onDelete={handleDelete} {...props}>
      {children}
    </SwipeToDelete>
  )
}
