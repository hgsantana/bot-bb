import { SQL } from "../main"
import { MensagemPinada } from "../models/bot-pinned-message"
import { Candidato } from "../models/candidato"
import { ChatCadastrado } from "../models/chat-cadastrado"
import { AreaCandidato } from "../models/tipo-candidato"
import { UsuarioCadastrado } from "../models/usuario-registrado"

export const chatsCadastrados: Array<ChatCadastrado> = []
export const usuariosCadastrados: Array<UsuarioCadastrado> = []
export const mensagensPinadas: Array<MensagemPinada> = []

export async function iniciaBancoDados() {
  chatsCadastrados.push(...(await listaChats()))
  usuariosCadastrados.push(...(await listaUsuariosCadastrados()))
  mensagensPinadas.push(...(await listaMensagensPinadas()))
}

export async function listaNomeCandidatos(
  area = AreaCandidato.TODOS
): Promise<Pick<Candidato, "id" | "nome">[]> {
  const candidatos = await SQL<Candidato>("botBB_candidatos")
    .select("id", "nome")
    .whereIn("area", area.split(","))
  return candidatos
}

export async function listaCandidatos(
  area = AreaCandidato.TODOS
): Promise<Candidato[]> {
  const candidatos = await SQL<Candidato>("botBB_candidatos")
    .select("*")
    .whereIn("area", area.split(","))
  return candidatos
}

export async function buscaCandidatoPorId(
  id: number
): Promise<Candidato | undefined> {
  return SQL<Candidato>("botBB_candidatos").select("*").first().where({ id })
}

export async function buscaCandidatoPorNome(
  nome: string
): Promise<Candidato | undefined> {
  return SQL<Candidato>("botBB_candidatos").select("*").first().where({ nome })
}

export async function listaUsuariosCadastrados() {
  return SQL<UsuarioCadastrado>("botBB_usuarios").select("*")
}

export async function listaMensagensPinadas() {
  return SQL<MensagemPinada>("botBB_mensagensPinadas").select("*")
}

export async function listaChats() {
  return SQL<ChatCadastrado>("botBB_chats").select("*")
}

export async function atualizaSituacao(candidato: Candidato) {
  return SQL<Candidato>("botBB_candidatos")
    .update({ situacao: candidato.situacao })
    .where({ id: candidato.id })
}

export async function buscaUsuario(id: number) {
  return SQL<UsuarioCadastrado>("botBB_usuarios").first().where({ id })
}

export async function atualizaUsuario(usuario: UsuarioCadastrado) {
  return SQL<UsuarioCadastrado>("botBB_usuarios")
    .update({ nomeChecagem: usuario.nomeChecagem })
    .where({ id: usuario.id })
}

export async function insereUsuario(
  usuario: Pick<UsuarioCadastrado, "idUsuario" | "nomeChecagem" | "usuario">
) {
  return SQL<UsuarioCadastrado>("botBB_usuarios").insert(usuario)
}

export async function removeUsuario(id: number) {
  return SQL<UsuarioCadastrado>("botBB_usuarios").delete().where({ id })
}

export async function buscaChat(idChat: number) {
  return SQL<ChatCadastrado>("botBB_chats").first().where({ idChat })
}

export async function insereChat(chat: Pick<ChatCadastrado, "idChat">) {
  return SQL<ChatCadastrado>("botBB_chats").insert(chat)
}

export async function removeChat(idChat: number) {
  return SQL<ChatCadastrado>("botBB_chats").delete().where({ idChat })
}

export async function insereMensagemPinada(mensagem: MensagemPinada) {
  return SQL<MensagemPinada>("botBB_mensagensPinadas").insert(mensagem)
}
