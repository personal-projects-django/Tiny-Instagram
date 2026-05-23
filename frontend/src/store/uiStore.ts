// src/store/uiStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme    = 'dark' | 'light'
type Language = 'fa' | 'en'

interface UIState {
  theme       : Theme
  language    : Language
  toggleTheme : () => void
  setLanguage : (lang: Language) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme    : 'dark',
      language : 'fa',

      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      setLanguage: (language) => set({ language }),
    }),
    { name: 'ui-storage' }
  )
)