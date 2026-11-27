import axios from 'axios'
import {ACCOUNTS_URL} from './APP_URL'
import {getCsrfToken} from './Csrf'
import {installSessionRefresh} from './SessionRefresh'

jest.mock('./Csrf', () => ({getCsrfToken: jest.fn()}))

test('refresh shares a request with valid CSRF and retries one stale CSRF failure', async () => {
    ;(getCsrfToken as jest.Mock).mockResolvedValueOnce('old-mask').mockResolvedValueOnce('new-mask')
    const refresh = jest.spyOn(axios, 'post')
        .mockRejectedValueOnce(Object.assign(new Error('CSRF'), {
            isAxiosError: true, response: {status: 403, data: {error_code: 'csrf_failed'}},
        })).mockResolvedValueOnce({})
    const send = jest.fn(async (config: any) => {
        if (!config._retry) throw {config, response: {status: 401}}
        return {data: {ok: true}, status: 200, statusText: 'OK', config, headers: {}}
    })
    const client = axios.create({adapter: send})
    installSessionRefresh(client)
    await Promise.all([client.get('/profile/'), client.get('/locations/')])
    expect(refresh.mock.calls.map(([url, , config]) => [url, config?.headers?.['X-CSRFToken']])).toEqual([
        [`${ACCOUNTS_URL}/token/refresh/`, 'old-mask'],
        [`${ACCOUNTS_URL}/token/refresh/`, 'new-mask'],
    ])
    expect(getCsrfToken).toHaveBeenNthCalledWith(2, true)
    expect(send).toHaveBeenCalledTimes(4)
    refresh.mockRestore()
})
