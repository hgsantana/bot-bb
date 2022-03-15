export type BotMessageResponse = {
    ok: true
    result: {
        message_id: number
        chat: {
            id: number
            first_name: string
            last_name: string
            username: string
            type: string
        }
        from: {
            id: number
            is_bot: boolean
            first_name: string
            username: string
        }
        date: number
        text: string
    }
}