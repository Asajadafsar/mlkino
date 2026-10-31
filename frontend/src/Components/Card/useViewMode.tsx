import {useCallback, useEffect, useState} from 'react'

export type ViewMode = 'list' | 'card'

const PREFIX = 'viewMode:'

function read(key: string, fallback: ViewMode): ViewMode {
    try {
        const saved = localStorage.getItem(PREFIX + key)
        return saved === 'list' || saved === 'card' ? saved : fallback
    } catch {
        return fallback
    }
}

/**
 * نمای انتخابی کاربر را برای هر صفحه جداگانه در localStorage نگه می‌دارد.
 * viewKey معمولاً همان resource صفحه است: useViewMode('announcements')
 */
export function useViewMode(viewKey: string, defaultMode: ViewMode = 'list') {
    const [view, setView] = useState<ViewMode>(() => read(viewKey, defaultMode))

    // اگر بین صفحات با viewKey متفاوت جابه‌جا شدیم
    useEffect(() => {
        setView(read(viewKey, defaultMode))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewKey])

    const changeView = useCallback(
        (next: ViewMode) => {
            setView(next)
            try {
                localStorage.setItem(PREFIX + viewKey, next)
            } catch {
                /* حالت private mode یا storage پر */
            }
        },
        [viewKey],
    )

    return [view, changeView] as const
}