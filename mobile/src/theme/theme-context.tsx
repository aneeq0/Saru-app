import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { darkColors, fontFamily, lightColors, type Palette } from '@/theme/tokens'

const STORAGE_KEY = 'saru.theme.mode'

export type ThemeMode = 'light' | 'dark'

export type FontSet = {
  display?: string
  displayMedium?: string
  displayBold?: string
  body?: string
  bodyMedium?: string
  bodySemibold?: string
}

type ThemeValue = {
  mode: ThemeMode
  colors: Palette
  fonts: FontSet
  fontsReady: boolean
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const emptyFonts: FontSet = {}

const ThemeContext = createContext<ThemeValue | null>(null)

export function ThemeProvider({ children, fontsReady }: { children: ReactNode; fontsReady: boolean }) {
  const [mode, setModeState] = useState<ThemeMode>('light')

  useEffect(() => {
    let mounted = true
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!mounted) return
        if (value === 'dark' || value === 'light') setModeState(value)
      })
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    void AsyncStorage.setItem(STORAGE_KEY, next)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      void AsyncStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      colors: mode === 'dark' ? darkColors : lightColors,
      fonts: fontsReady ? fontFamily : emptyFonts,
      fontsReady,
      setMode,
      toggleMode,
    }),
    [mode, fontsReady, setMode, toggleMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme(): ThemeValue {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error('useAppTheme must be used within ThemeProvider')
  }
  return value
}
