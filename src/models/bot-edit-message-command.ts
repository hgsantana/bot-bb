export type BotEditMessageCommand = {
    chat_id?: number | string
    message_id?: number
    inline_message_id?: string
    text: string
    parse_mode?: string
}