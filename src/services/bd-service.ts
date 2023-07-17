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
  const chats = await listaChats()
  const usuarios = await listaUsuariosCadastrados()
  const mensagens = await listaMensagensPinadas()
  if (chats && chats.length) chatsCadastrados.push(...chats)
  if (usuarios && usuarios.length) usuariosCadastrados.push(...usuarios)
  if (mensagens && mensagens.length) mensagensPinadas.push(...mensagens)
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

export async function buscaUsuarioPorId(id: number) {
  return SQL<UsuarioCadastrado>("botBB_usuarios").first().where({ id })
}

export async function buscaChatPorIdChat(idChat: number) {
  return SQL<ChatCadastrado>("botBB_chats").first().where({ idChat })
}

export async function atualizaSituacao(candidato: Candidato) {
  await SQL<Candidato>("botBB_candidatos")
    .update({ situacao: candidato.situacao })
    .where({ id: candidato.id })
}

export async function atualizaUsuario(usuario: UsuarioCadastrado) {
  await SQL<UsuarioCadastrado>("botBB_usuarios")
    .update({ nomeChecagem: usuario.nomeChecagem })
    .where({ id: usuario.id })
  const usuarios = await listaUsuariosCadastrados()
  usuariosCadastrados.splice(0, usuariosCadastrados.length, ...usuarios)
}

export async function insereUsuario(
  usuario: Pick<UsuarioCadastrado, "idUsuario" | "nomeChecagem" | "usuario">
) {
  await SQL<UsuarioCadastrado>("botBB_usuarios").insert(usuario)
  const usuarios = await listaUsuariosCadastrados()
  usuariosCadastrados.splice(0, usuariosCadastrados.length, ...usuarios)
}

export async function removeUsuario(id: number) {
  await SQL<UsuarioCadastrado>("botBB_usuarios").delete().where({ id })
  const usuarios = await listaUsuariosCadastrados()
  usuariosCadastrados.splice(0, usuariosCadastrados.length, ...usuarios)
}

export async function insereChat(chat: Pick<ChatCadastrado, "idChat">) {
  await SQL<ChatCadastrado>("botBB_chats").insert(chat)
  const chats = await listaChats()
  chatsCadastrados.splice(0, chatsCadastrados.length, ...chats)
}

export async function removeChat(id: number) {
  await SQL<ChatCadastrado>("botBB_chats").delete().where({ id })
  const chats = await listaChats()
  chatsCadastrados.splice(0, chatsCadastrados.length, ...chats)
}

export async function insereMensagemPinada(
  mensagem: Pick<MensagemPinada, "idChat" | "idMensagem">
) {
  await SQL<MensagemPinada>("botBB_mensagensPinadas").insert(mensagem)
  const mensagens = await listaMensagensPinadas()
  mensagensPinadas.splice(0, mensagensPinadas.length, ...mensagens)
}

export async function removeMensagemPinada(id: number) {
  await SQL<MensagemPinada>("botBB_mensagensPinadas").delete().where({ id })
  const mensagens = await listaMensagensPinadas()
  mensagensPinadas.splice(0, mensagensPinadas.length, ...mensagens)
}
