import axios from 'axios'
import api from './Request'

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => Object.assign(jest.fn(), {
            interceptors: {response: {use: jest.fn()}},
        })),
        post: jest.fn(),
    },
}))

const rejectResponse = (api.interceptors.response.use as jest.Mock).mock.calls[0][1]
const unauthorized = () => ({config: {url: '/accounts/profile/'}, response: {status: 401}})

beforeEach(() => {
    ;(axios.post as jest.Mock).mockReset()
    ;(api as unknown as jest.Mock).mockReset().mockResolvedValue({status: 200})
})

test('concurrent expired requests share one refresh and each retry only once', async () => {
    let finish!: () => void
    ;(axios.post as jest.Mock).mockReturnValue(new Promise<void>(resolve => { finish = resolve }))
    const first = unauthorized()
    const second = unauthorized()
    const requests = [rejectResponse(first), rejectResponse(second)]
    expect(axios.post).toHaveBeenCalledTimes(1)
    finish()
    await Promise.all(requests)
    expect(api).toHaveBeenCalledTimes(2)
    expect(first.config).toHaveProperty('_retry', true)
    await expect(rejectResponse(first)).rejects.toBe(first)
    expect(axios.post).toHaveBeenCalledTimes(1)
})

test('refresh failure rejects all waiting requests and permits a later session to refresh', async () => {
    const failure = {response: {status: 401}}
    ;(axios.post as jest.Mock).mockRejectedValue(failure)
    const results = await Promise.allSettled([rejectResponse(unauthorized()), rejectResponse(unauthorized())])
    expect(results.every(result => result.status === 'rejected' && result.reason === failure)).toBe(true)
    ;(axios.post as jest.Mock).mockResolvedValue({status: 200})
    await expect(rejectResponse(unauthorized())).resolves.toEqual({status: 200})
    expect(axios.post).toHaveBeenCalledTimes(2)
})

test.each([undefined, 403, 500])('does not refresh or discard error details for status %s', async status => {
    const failure = {config: {}, response: status ? {status, data: {message: 'server message'}} : undefined}
    await expect(rejectResponse(failure)).rejects.toBe(failure)
    expect(axios.post).not.toHaveBeenCalled()
})
