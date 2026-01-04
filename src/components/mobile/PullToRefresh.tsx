'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)

  const threshold = 80 // Distance minimale pour déclencher le refresh

  useEffect(() => {
    let touchStartY = 0
    let isScrollAtTop = false

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      isScrollAtTop = scrollTop === 0
      
      if (isScrollAtTop) {
        touchStartY = e.touches[0].clientY
        setStartY(touchStartY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrollAtTop || isRefreshing) return

      const touchY = e.touches[0].clientY
      const pullDist = touchY - touchStartY

      if (pullDist > 0 && pullDist < 150) {
        setIsPulling(true)
        setPullDistance(pullDist)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return

      if (pullDistance >= threshold) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } catch (error) {
          console.error('Refresh error:', error)
        } finally {
          setIsRefreshing(false)
        }
      }

      setIsPulling(false)
      setPullDistance(0)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh, threshold])

  const progress = Math.min((pullDistance / threshold) * 100, 100)
  const showIndicator = isPulling || isRefreshing

  return (
    <div className="relative">
      {/* Pull-to-refresh indicator */}
      {showIndicator && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200"
          style={{
            transform: `translateY(${isRefreshing ? '60px' : `${pullDistance * 0.5}px`})`,
            opacity: isRefreshing ? 1 : pullDistance / threshold,
          }}
        >
          <div className="bg-white rounded-full p-3 shadow-lg">
            {isRefreshing ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <svg
                className="h-6 w-6 text-primary transition-transform"
                style={{ transform: `rotate(${progress * 3.6}deg)` }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: isRefreshing ? 'translateY(0px)' : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
