'use client'

import { useState, useEffect } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export function useIsNativeApp() {
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    // Check if running in Capacitor
    const checkNative = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')
        setIsNative(Capacitor.isNativePlatform())
      } catch {
        setIsNative(false)
      }
    }

    checkNative()
  }, [])

  return isNative
}

export function useIsPlatform(platform: 'ios' | 'android' | 'web') {
  const [isPlatform, setIsPlatform] = useState(false)

  useEffect(() => {
    const checkPlatform = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')
        const currentPlatform = Capacitor.getPlatform()
        setIsPlatform(currentPlatform === platform)
      } catch {
        setIsPlatform(platform === 'web')
      }
    }

    checkPlatform()
  }, [platform])

  return isPlatform
}
