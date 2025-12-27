'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook to manage anti-bot security measures in forms
 * - Generates a timestamp when form loads
 * - Manages honeypot field state
 * - Provides encoded timestamp for submission
 */
export function useAntiBot() {
  const [formLoadedAt] = useState(() => Date.now())
  const [honeypot, setHoneypot] = useState('')

  // Encode the timestamp for server validation
  const getEncodedTimestamp = useCallback(() => {
    // Simple obfuscation
    return btoa(`cp_${formLoadedAt}`)
  }, [formLoadedAt])

  return {
    formLoadedAt,
    honeypot,
    setHoneypot,
    getEncodedTimestamp,
    // Include these in form submission
    getSecurityFields: useCallback(() => ({
      _hp: honeypot, // honeypot
      _ts: getEncodedTimestamp(), // timestamp
    }), [honeypot, getEncodedTimestamp]),
  }
}

/**
 * Hidden honeypot field component
 * Styled to be invisible to users but visible to bots
 */
export function HoneypotField({ 
  value, 
  onChange,
  name = 'company_website' // Common field name that bots fill
}: {
  value: string
  onChange: (value: string) => void
  name?: string
}) {
  return (
    <div 
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        opacity: 0,
        height: 0,
        width: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <label htmlFor={name}>
        Ne pas remplir ce champ
      </label>
      <input
        type="text"
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        tabIndex={-1}
      />
    </div>
  )
}
