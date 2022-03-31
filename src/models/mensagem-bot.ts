import { BotUpdateResponse } from "./bot-update-response"

export type MensagemBot = {
    tipo?: "TI" | "COMERCIAL"
    mensagem: BotUpdateResponse
}