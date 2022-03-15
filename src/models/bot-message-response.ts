export type BotMessageResponse = {
    ok: true,
    result: {
        message_id: number
        from: Object
        chat: Object
        date: number
        text: string
    }
}