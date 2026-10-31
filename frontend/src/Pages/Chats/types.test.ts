import {ChatMessage, mergeMessages} from './types'
const message = (id: number, body = 'test') => ({id, body} as ChatMessage)
test('REST history and simultaneous websocket echoes produce one copy per message', () => {
    expect(mergeMessages([message(3),message(1)], [message(2), message(3,'updated')]).map(row => [row.id,row.body])).toEqual([[1,'test'],[2,'test'],[3,'updated']])
})
