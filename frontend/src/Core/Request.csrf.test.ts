import api from './Request'

// Exercise Axios's real browser adapter, including JSON and multipart requests.
test.each([false, true])('ticket requests include Django CSRF header (multipart=%s)', async multipart => {
    document.cookie = 'csrftoken=ticket-csrf-token; path=/'
    const headers: Record<string, string> = {}
    const xhr: any = {
        onloadend: null,
        open: jest.fn(),
        setRequestHeader: (name: string, value: string) => {headers[name] = value},
        getAllResponseHeaders: () => 'content-type: application/json',
        status: 201,
        statusText: 'Created',
        responseText: '{"data":{"id":7}}',
        send: () => xhr.onloadend(),
        abort: jest.fn(),
    }
    const mock = jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhr)
    try {
        const payload = multipart ? new FormData() : {subject: 'تیکت تست', category: 'other', message: 'درخواست تست'}
        await api.post('tickets/', payload)
        expect(headers['X-CSRFToken']).toBe('ticket-csrf-token')
        expect(xhr.withCredentials).toBe(true)
    } finally {
        mock.mockRestore()
        document.cookie = 'csrftoken=; Max-Age=0; path=/'
    }
})
