export function apiErrorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback
    const response = (error as {response?: {status: number; data?: unknown}}).response
    if (!response && error instanceof Error && !('isAxiosError' in error)) return error.message || fallback
    if (!response || response.status >= 500) return fallback
    function firstMessage(value: unknown): string | undefined {
        if (typeof value === 'string') return value
        if (Array.isArray(value)) return value.map(firstMessage).find(Boolean)
        if (value && typeof value === 'object') {
            const values = value as Record<string, unknown>
            return firstMessage(values.message) || firstMessage(values.detail) ||
                firstMessage(values.errors) || Object.entries(values).filter(([key]) =>
                    !['status', 'statusCode', 'error_code', 'code'].includes(key)).map(([, item]) =>
                    firstMessage(item)).find(Boolean)
        }
    }
    return firstMessage(response.data) || fallback
}
