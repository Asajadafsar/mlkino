import {waitFor} from '@testing-library/react'
import {installPanelVersionCheck} from './PanelVersion'
let script: HTMLScriptElement
let cleanup: () => void
const reload = jest.fn()
beforeEach(() => {
    jest.clearAllMocks()
    script = document.createElement('script')
    script.src = '/static/js/main.old.js'
    document.head.appendChild(script)
    global.fetch = jest.fn()
})
afterEach(() => {cleanup?.(); script.remove()})

test('restoring an old panel reloads the currently deployed version and bypasses HTTP cache', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ok: true, json: async () => ({files: {'main.js': '/static/js/main.new.js'}})})
    cleanup = installPanelVersionCheck(reload)
    window.dispatchEvent(new Event('pageshow'))
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/asset-manifest.json'), expect.objectContaining({cache: 'no-store'}))
    window.dispatchEvent(new Event('focus'))
    expect(reload).toHaveBeenCalledTimes(1)
})

test('returning to the current version keeps the page and form state intact', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ok: true, json: async () => ({files: {'main.js': '/static/js/main.old.js'}})})
    cleanup = installPanelVersionCheck(reload)
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(reload).not.toHaveBeenCalled()
})

test('network failures leave navigation usable without forcing a reload', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('offline'))
    cleanup = installPanelVersionCheck(reload)
    window.dispatchEvent(new Event('focus'))
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(reload).not.toHaveBeenCalled()
})

test('removing listeners prevents background checks after teardown', () => {
    cleanup = installPanelVersionCheck(reload)
    cleanup()
    window.dispatchEvent(new Event('pageshow'))
    expect(fetch).not.toHaveBeenCalled()
})


test('initial rendering waits for the deployed version check', async () => {
    let respond: (value: any) => void = () => {}
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(resolve => { respond = resolve }))
    const ready = jest.fn()
    cleanup = installPanelVersionCheck(reload, ready)
    expect(ready).not.toHaveBeenCalled()
    respond({ok: true, json: async () => ({files: {'main.js': '/static/js/main.old.js'}})})
    await waitFor(() => expect(ready).toHaveBeenCalledTimes(1))
    expect(reload).not.toHaveBeenCalled()
})
test('an old initial bundle reloads before the panel mounts', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ok: true, json: async () => ({files: {'main.js': '/static/js/main.new.js'}})})
    const ready = jest.fn()
    cleanup = installPanelVersionCheck(reload, ready)
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(ready).not.toHaveBeenCalled()
})
test('an offline initial visit can still render the available panel', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('offline'))
    const ready = jest.fn()
    cleanup = installPanelVersionCheck(reload, ready)
    await waitFor(() => expect(ready).toHaveBeenCalledTimes(1))
    expect(reload).not.toHaveBeenCalled()
})
