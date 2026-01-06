'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: ResolvedTheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'chantipay_theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initialTheme = stored || 'light'
    setThemeState(initialTheme)
    
    const resolved = initialTheme === 'system' ? getSystemTheme() : initialTheme
    setResolvedTheme(resolved)
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const resolved = theme === 'system' ? getSystemTheme() : theme
    
    setResolvedTheme(resolved)
    
    if (resolved === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Notify Capacitor StatusBar if running in native app
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      updateNativeStatusBar(resolved)
    }
  }, [theme])

  // Listen to system theme changes only when mode is 'system'
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? 'dark' : 'light'
      setResolvedTheme(newResolved)
      
      const root = document.documentElement
      if (newResolved === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }

      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        updateNativeStatusBar(newResolved)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

// Helper to update native StatusBar
async function updateNativeStatusBar(theme: ResolvedTheme) {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    
    if (theme === 'dark') {
      await StatusBar.setStyle({ style: Style.Dark })
    } else {
      await StatusBar.setStyle({ style: Style.Light })
    }
  } catch (error) {
    // StatusBar plugin not available or not running in native context
    console.debug('StatusBar not available:', error)
  }
}
