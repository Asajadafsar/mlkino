export type ChatPeer = {id: number; full_name: string; avatar?: string | null; role: string}
export type ChatMessage = {id: number; conversation: number; sender: number; sender_name: string; body: string; attachment?: string | null; attachment_kind: 'file' | 'voice'; reply_to?: number | null; created_at: string; read_at?: string | null; deleted_at?: string | null}
export type Conversation = {id: number; peer: ChatPeer; last_message?: ChatMessage | null; unread_count: number; updated_at: string}
export type RealtimeEvent = {event: string; data: any}
export function mergeMessages(previous: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
    const unique = new Map(previous.map(message => [message.id, message]))
    incoming.forEach(message => unique.set(message.id, message))
    return Array.from(unique.values()).sort((a, b) => a.id - b.id)
}
