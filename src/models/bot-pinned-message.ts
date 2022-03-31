export type BotPinnedMessage = {
    chat_id: number | string
    message_id: number,
    tipo?: "TI" | "COMERCIAL"
}