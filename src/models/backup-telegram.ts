import { MensagemPinada } from "./bot-pinned-message"
import { ChatCadastrado } from "./chat-cadastrado"
import { UsuarioCadastrado } from "./usuario-registrado"

export type BackupTelegram = {
  usuariosCadastrados: UsuarioCadastrado[]
  chatsCadastrados: ChatCadastrado[]
  mensagensFixadas: MensagemPinada[]
}
