import axios from 'axios'
import {PANEL_URL} from './APP_URL'
import {exitImpersonation, getImpersonationStatus, startImpersonation} from './Impersonation'

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => ({get: jest.fn(), post: jest.fn(), interceptors: {response: {use: jest.fn()}}})),
        post: jest.fn(),
        isAxiosError: (value: any) => Boolean(value?.isAxiosError),
    },
}))
const clientConfig = (axios.create as jest.Mock).mock.calls[0][0]
const client = (axios.create as jest.Mock).mock.results[0].value
const active = {active: true, actor_id: 1, target_id: 12, target_role: 'user', session_id: 'session-1', expires_at: '2026-10-29T14:00:00Z'}
beforeEach(() => {
    client.get.mockReset()
    client.post.mockReset()
    document.cookie = 'csrftoken=test-csrf-token; path=/'
})

test('uses a credentialed client without changing authentication tokens', () => {
    expect(clientConfig).toEqual(expect.objectContaining({withCredentials: true, baseURL: PANEL_URL}))
})

test('starts only after CSRF initialization and sends no POST body', async () => {
    client.get.mockResolvedValue({data: {}})
    client.post.mockResolvedValue({data: {data: active}})
    expect(await startImpersonation(12)).toEqual(active)
    expect(client.get).toHaveBeenCalledWith('impersonation/csrf/')
    expect(client.post).toHaveBeenCalledWith('users/12/impersonate/', undefined, {headers: {'X-CSRFToken': 'test-csrf-token'}})
    expect(client.get.mock.invocationCallOrder[0]).toBeLessThan(client.post.mock.invocationCallOrder[0])
})

test('never sends a mutation if the CSRF cookie is unavailable', async () => {
    document.cookie = 'csrftoken=; Max-Age=0; path=/'
    client.get.mockResolvedValue({data: {}})
    await expect(startImpersonation(12)).rejects.toThrow('ورود مدیریتی')
    expect(client.post).not.toHaveBeenCalled()
})

test('supports both the raw and wrapped status responses', async () => {
    client.get.mockResolvedValueOnce({data: active}).mockResolvedValueOnce({data: {data: active}})
    expect(await getImpersonationStatus()).toEqual(active)
    expect(await getImpersonationStatus()).toEqual(active)
})

test('rejects self impersonation and superadmin targets in server responses', async () => {
    client.get.mockResolvedValueOnce({data: {...active, actor_id: 12}})
    await expect(getImpersonationStatus()).rejects.toThrow('معتبر نیست')
    client.get.mockResolvedValueOnce({data: {...active, target_role: 'superadmin'}})
    await expect(getImpersonationStatus()).rejects.toThrow('معتبر نیست')
})

test('exit initializes CSRF and verifies that the session is inactive', async () => {
    client.get.mockResolvedValue({data: {}})
    client.post.mockResolvedValue({data: {data: {active: false}}})
    expect(await exitImpersonation()).toEqual({active: false})
    expect(client.post).toHaveBeenCalledWith('impersonation/exit/', undefined, {headers: {'X-CSRFToken': 'test-csrf-token'}})
})

test('rejects an invalid target ID before requesting CSRF or changing a session', async () => {
    await expect(startImpersonation(-1)).rejects.toThrow('شناسه کاربر')
    expect(client.get).not.toHaveBeenCalled()
    expect(client.post).not.toHaveBeenCalled()
})

test('rejects malformed status payloads instead of treating them as inactive', async () => {
    client.get.mockResolvedValueOnce({data: null})
    await expect(getImpersonationStatus()).rejects.toThrow('معتبر نیست')
})
