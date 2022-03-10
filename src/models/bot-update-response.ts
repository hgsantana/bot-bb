export type BotUpdateResponse = {
    chat_id: number | string
    text: string

    method?: string
    parse_mode?: string
    entities?: any[]
    disable_web_page_preview?: boolean
    disable_notification?: boolean
    protect_content?: boolean
    reply_to_message_id?: number
    allow_sending_without_reply?: boolean
    reply_markup?: any
}