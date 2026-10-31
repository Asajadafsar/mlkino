// Core/useViewMode.ts
import {useState} from 'react'

export type ViewMode = 'list' | 'card'

const STORAGE_PREFIX = 'view-mode:'

export function useViewMode(resource: string, defaultMode: ViewMode = 'list') {
    const storageKey = `${STORAGE_PREFIX}${resource}`

    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        if (typeof window === 'undefined') return defaultMode
        const stored = window.localStorage.getItem(storageKey)
        return stored === 'card' || stored === 'list' ? stored : defaultMode
    })

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode)
        try {
            window.localStorage.setItem(storageKey, mode)
        } catch {
            // ignore quota/access errors
        }
    }

    return [viewMode, setViewMode] as const
}