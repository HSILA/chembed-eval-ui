'use client'

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('theme-light', theme === 'light')
  root.classList.toggle('theme-dark', theme === 'dark')
  root.style.colorScheme = theme
}

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = window.localStorage.getItem('chembed-review-theme')
  return saved === 'light' || saved === 'dark' ? saved : 'dark'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    window.localStorage.setItem('chembed-review-theme', nextTheme)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="cursor-pointer rounded border border-neutral-700 bg-neutral-900 px-3 py-1 text-sm text-neutral-100 shadow-sm transition-colors hover:bg-neutral-800"
      aria-label="Toggle light and dark theme"
      title="Toggle light/dark theme"
    >
      ☀️ / 🌙
    </button>
  )
}
