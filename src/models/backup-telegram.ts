import { BotUpdateResponse } from "./bot-update-response"
import { ChatCadastrado } from "./chat-cadastrado"
import { UsuarioCadastrado } from "./usuario-registrado"

export type BackupTelegram = {

    usuariosCadastrados: UsuarioCadastrado[]
    chatsCadastrados: ChatCadastrado[]
    mensagensPinadas: BotUpdateResponse[]

}