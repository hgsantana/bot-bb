import axios, { AxiosError } from "axios"
import { AMBIENTE } from "../server"
import { BotPinCommandResponse } from "../../src/models/bot-command-response"
import { BotEditMessageCommand } from "../../src/models/bot-edit-message-command"
import { BotMessageResponse } from "../../src/models/bot-message-response"
import { BotPinCommand } from "../../src/models/bot-pin-command"
import { BotUpdate } from "../../src/models/bot-update"
import { BotUpdateResponse } from "../../src/models/bot-update-response"
import { Candidato } from "../../src/models/candidato"
import { MensagemPinada } from "../models/bot-pinned-message"
import { BotUnpinMessage } from "../models/bot-unpin-message"
import {
  atualizaUsuario,
  buscaCandidatoPorNome,
  buscaCandidatosPorIds,
  buscaChatPorIdChat,
  buscaUsuarioPorIdUsuario,
  chatsCadastrados,
  insereChat,
  insereMensagemPinada,
  insereUsuario,
  mensagensPinadas,
  removeChat,
  removeMensagemPinada,
  removeUsuario,
  usuariosCadastrados,
} from "./bd-service"
import { RELATORIO_ERROS, compilaRelatorio } from "./candidato-service"

const pilhaMensagens: Array<BotUpdateResponse> = []

// consome a pilha de mensagens a cada 1s
setInterval(() => {
  if (pilhaMensagens.length) {
    const api = AMBIENTE.TELEGRAM_API + "/sendMessage"
    const mensagem = pilhaMensagens.shift()
    axios.post(api, mensagem).catch((e: AxiosError) => {
      if (mensagem) pilhaMensagens.push(mensagem)
      console.error("Erro=>", e.response?.data || e)
    })
  }
}, 2000)

export const checaMensagem = (mensagemRecebida: BotUpdate) => {
  if (!mensagemRecebida?.message?.text) return null

  const textoMensagem = mensagemRecebida?.message?.text
    .replace(/\@BB_convocacao_bot/gi, "")
    .toLocaleLowerCase()
    .trim()

  if (!textoMensagem || !textoMensagem.startsWith("/")) return null
  const usuario =
    mensagemRecebida.message.from.username ||
    mensagemRecebida.message.from.first_name ||
    mensagemRecebida.message.from.last_name ||
    mensagemRecebida.message.from.id

  console.log(`Mensagem recebida de '${usuario}': '${textoMensagem}'`)

  if (textoMensagem.startsWith("/start")) return start(mensagemRecebida)

  if (textoMensagem.startsWith("/cadastrar")) return cadastrar(mensagemRecebida)

  if (textoMensagem.startsWith("/descadastrar"))
    return descadastrar(mensagemRecebida)

  // comandos abaixo somente permitidos para admins reconhecidos
  if (mensagemRecebida.message.from.id.toString() != AMBIENTE.TELEGRAM_ADMIN_ID)
    return null

  if (textoMensagem.startsWith("/status")) return status(mensagemRecebida)

  if (textoMensagem.startsWith("/iniciar")) return iniciar(mensagemRecebida)

  if (textoMensagem.startsWith("/parar")) return parar(mensagemRecebida)

  if (textoMensagem.startsWith("/fixar")) return fixar(mensagemRecebida)

  if (textoMensagem.startsWith("/desafixar")) return desafixar(mensagemRecebida)

  if (textoMensagem.startsWith("/erros")) return erros()

  return null
}

async function start(
  mensagemRecebida: BotUpdate
): Promise<BotUpdateResponse | null> {
  const nome =
    mensagemRecebida.message.from.username ||
    mensagemRecebida.message.from.first_name
  const idDestinatario = mensagemRecebida.message.from.id
  const reply_to_message_id = mensagemRecebida?.message?.message_id
  let text =
    `Olá, <a href="tg://user?id=${idDestinatario}">@${nome}</a>. Bem vindo ao BOT de Convocações do BB. ` +
    `Você pode usar três comandos: <pre>/start</pre>, <pre>/cadastrar</pre> e <pre>/descadastrar</pre>. ` +
    `O comando <pre>/start</pre> mostra esta mensagem de ajuda inicial. Os outros dois comandos serão explicados a seguir.`
  const mensagem: BotUpdateResponse = {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text,
  }

  let cadastrarText =
    `O comando /cadastrar serve para você ser marcado quando houver alterações para determinado candidato. ` +
    `Você só pode se cadastrar para um candidato por vez. Se usar o comando mais de uma vez, somente o última vez terá efeito. ` +
    `Para usar, envie uma mensagem semelhente a esta:\n\n` +
    `<pre>/cadastrar FULANO DE TAL</pre>\n\n` +
    `Pronto. A partir daí, você será marcado no chat de atualizações sempre que FULANO DE TAL tiver uma atualização de status.` +
    `O nome utilizado deve ser exatamente igual consta no Diário Oficial da União (DOU) do resultado final.\n\n`
  const mensagemCadastrar: BotUpdateResponse = {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    text: cadastrarText,
  }

  let descadastrarText =
    `O comando /descadastrar serve para você deixar de ser marcado no grupo de atualizações. ` +
    `Para usar, envie uma mensagem assim:\n\n` +
    `<pre>/descadastrar</pre>\n\n` +
    `Pronto. A partir daí, você não será marcado mais no chat de atualizações.`
  const mensagemDescadastrar: BotUpdateResponse = {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    text: descadastrarText,
  }

  let mensagemFinalText =
    `Importante: as marcações só acontecem no grupo das atualizações. Você não será marcado nem avisado por aqui. Por isso, ` +
    `não saia do grupo se quiser ser notificado.\n\n ` +
    `Você acompanha as atualizações em https://t.me/+zN5NEtFGNUsyNGNh`
  const mensagemFinal: BotUpdateResponse = {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    text: mensagemFinalText,
  }

  pilhaMensagens.push(mensagemCadastrar)
  pilhaMensagens.push(mensagemDescadastrar)
  pilhaMensagens.push(mensagemFinal)
  return mensagem
}

const cadastrar = async (
  mensagemRecebida: BotUpdate
): Promise<BotUpdateResponse | null> => {
  const nome = mensagemRecebida.message.text
    .split("/cadastrar")[1]
    .replace(/\ \ /gi, " ")
    .trim()
    .toUpperCase()
  const idDestinatario = mensagemRecebida.message.from.id
  const nomeUsuario = `${
    mensagemRecebida.message.from.username ||
    mensagemRecebida.message.from.first_name
  }`
  const usuario = await buscaUsuarioPorIdUsuario(idDestinatario)
  const reply_to_message_id = mensagemRecebida?.message?.message_id

  let text = ``
  const candidato = await buscaCandidatoPorNome(nome)

  if (!nome)
    text = `Você precisa usar a sintaxe correta: <pre>/cadastrar NOME COMPLETO</pre>`
  else if (!candidato) text = `Este nome não existe no resultado final oficial.`
  else {
    text =
      `Olá, <a href="tg://user?id=${idDestinatario}">@${nomeUsuario}</a>. ` +
      `A partir de agora, você será marcado nas alterações para "${nome}" no Grupo de Atualizações. ` +
      `Para cancelar, use o comando <pre>/descadastrar</pre>`
    if (usuario) {
      usuario.nomeChecagem = nome
      await atualizaUsuario(usuario)
    } else {
      const novoUsuario = {
        idUsuario: idDestinatario,
        nomeChecagem: nome,
        usuario: nomeUsuario,
      }
      await insereUsuario(novoUsuario)
      console.log("Novo usuário cadastrado:", novoUsuario)
    }
  }
  const mensagem: BotUpdateResponse = {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text,
  }
  return mensagem
}

const descadastrar = async (
  mensagemRecebida: BotUpdate
): Promise<BotUpdateResponse | null> => {
  const idDestinatario = mensagemRecebida.message.from.id
  const usuario = await buscaUsuarioPorIdUsuario(idDestinatario)
  const reply_to_message_id = mensagemRecebida?.message?.message_id

  let text = `A partir de agora, você não será mais marcado no Grupo de Atualizações.`
  if (usuario) {
    await removeUsuario(usuario.id)
    console.log("Usuário removido:", usuario)
  } else text = `Você ainda não está cadastrado para ser marcado.`

  const mensagem: BotUpdateResponse = {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text,
  }
  return mensagem
}

const status = async (
  mensagemRecebida: BotUpdate
): Promise<BotUpdateResponse | null> => {
  // somente permitido para admins reconhecidos
  if (mensagemRecebida.message.from.id != 1574661558) return null
  const mensagemStatus = await compilaMensagemStatus(
    mensagemRecebida.message.chat.id,
    mensagemRecebida.message.message_id
  )
  return mensagemStatus
}

const iniciar = async (
  mensagemRecebida: BotUpdate
): Promise<BotUpdateResponse | null> => {
  // somente permitido para admins reconhecidos
  if (mensagemRecebida.message.from.id != 1574661558) return null
  const chat = await buscaChatPorIdChat(mensagemRecebida.message.chat.id)
  let text = ""
  if (chat) text = `As atualizações já estão ativas para este chat.`
  else {
    text = `Ativando atualizações para este chat.`
    const novoChat = { idChat: mensagemRecebida.message.chat.id }
    await insereChat(novoChat)
    console.log(`Atualizações ativadas para o chat:`, novoChat)
  }
  const reply_to_message_id = mensagemRecebida?.message?.message_id
  const mensagem: BotUpdateResponse = {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text,
  }
  return mensagem
}

const parar = async (
  mensagemRecebida: BotUpdate
): Promise<BotUpdateResponse | null> => {
  const chat = await buscaChatPorIdChat(mensagemRecebida.message.chat.id)
  let text = ""
  if (chat) {
    await removeChat(chat.id)
    console.log("Desativando atualizações para o chat:", chat)
    text = `As atualizações foram interrompidas para este chat.`
  } else {
    text = `Não há atualizações ativas para este chat. Caso deseje ativa-las, use o comando /iniciar.`
  }
  const reply_to_message_id = mensagemRecebida?.message?.message_id
  const mensagem: BotUpdateResponse = {
    chat_id: mensagemRecebida?.message?.chat?.id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text,
  }
  return mensagem
}

const fixar = async (mensagemRecebida: BotUpdate) => {
  const mensagemPinada = mensagensPinadas.find(
    (m) => m.idChat == mensagemRecebida.message.chat.id
  )
  if (mensagemPinada) {
    const mensagem = await compilaMensagemStatus(
      mensagemRecebida.message.chat.id,
      mensagemRecebida.message.message_id
    )
    mensagem.text = `Já existe uma mensagem fixada neste grupo.`
    return mensagem
  }

  const mensagem = await compilaMensagemStatus(
    mensagemRecebida.message.chat.id,
    mensagemRecebida.message.message_id
  )

  await axios
    .post<BotMessageResponse>(AMBIENTE.TELEGRAM_API + "/sendMessage", mensagem)
    .then(({ data: resposta }) => {
      if (resposta.ok) {
        const mensagemFixada: BotPinCommand = {
          chat_id: resposta.result.chat.id,
          message_id: resposta.result.message_id,
          disable_notification: false,
        }
        axios
          .post<BotPinCommandResponse>(
            AMBIENTE.TELEGRAM_API + "/pinChatMessage",
            mensagemFixada
          )
          .then(async ({ data: respostaFixada }) => {
            if (respostaFixada.result) {
              const novaMensagemPinada: Pick<
                MensagemPinada,
                "idChat" | "idMensagem"
              > = {
                idChat: resposta.result.chat.id,
                idMensagem: resposta.result.message_id,
              }
              await insereMensagemPinada(novaMensagemPinada)
              console.log("Mensagem fixada:", novaMensagemPinada)
            } else console.error("Falha ao fixar mensagem:", mensagemFixada)
          })
          .catch((erro) => {
            console.error("Erro=>", erro)
          })
      }
    })
    .catch((e: AxiosError) => {
      console.error("Erro=>", e.response?.data || e)
    })
  return null
}

async function desafixar(mensagemRecebida: BotUpdate) {
  try {
    const mensagemPinada = mensagensPinadas.find(
      (m) => m.idChat == mensagemRecebida.message.chat.id
    )
    if (!mensagemPinada) {
      console.error(
        `Mensagem Pinada não localizada. Chat ${mensagemRecebida.message.chat.id}.`
      )
      return null
    }

    const mensagemUnpin: BotUnpinMessage = {
      chat_id: mensagemPinada.idChat,
      message_id: mensagemPinada.idMensagem,
    }
    await axios
      .post<BotMessageResponse>(
        AMBIENTE.TELEGRAM_API + "/unpinChatMessage",
        mensagemUnpin
      )
      .then(async ({ data: resposta }) => {
        if (resposta.ok) {
          await removeMensagemPinada(mensagemPinada.id)
          console.log("Mensagem desafixada:", mensagemUnpin)
        } else {
          console.error("Falha ao desafixar mensagem:", mensagemUnpin)
          console.error(resposta)
        }
      })
      .catch((erro) => {
        console.error("Erro=>", erro)
      })
  } catch (error) {
    console.error("Erro=>", error)
  }
  return null
}

export async function erros() {
  const ids: Array<number> = []
  RELATORIO_ERROS.forEach((ocorrencia) => ids.push(ocorrencia.id))
  const candidatos = await buscaCandidatosPorIds(ids)
  RELATORIO_ERROS.forEach((o) => {
    const candidato = candidatos?.find((c) => c.nome === o.nome)
    if (candidato) {
      const mensagemCandidato: BotUpdateResponse = {
        chat_id: AMBIENTE.TELEGRAM_ADMIN_ID,
        parse_mode: "HTML",
        text:
          `<pre>` +
          `Erros da última verificação:\n` +
          `-------------` +
          `\n\n` +
          `Nome    : ${o.nome}\n` +
          `Situação: ${candidato.situacao}\n` +
          `Região  : ${candidato.microRegiao}\n` +
          `Erros   : ${Array.from(o.erros)}\n` +
          `</pre>`,
      }
      pilhaMensagens.push(mensagemCandidato)
    }
  })
}

export async function enviaMensagemAlteracao(
  situacaoAnterior: string,
  candidato: Candidato
) {
  for await (const chat of chatsCadastrados) {
    const usuariosAvisar = usuariosCadastrados.filter(
      (u) => u.nomeChecagem.toUpperCase() == candidato.nome.toUpperCase()
    )
    let avisaUsuarios = ""
    if (usuariosAvisar) {
      console.log(`Avisando ${usuariosAvisar.length} usuários.`)
      avisaUsuarios += "\n\n"
      usuariosAvisar.forEach((usuario) => {
        avisaUsuarios += `<a href="tg://user?id=${usuario.idUsuario}">@${usuario.usuario}</a> `
      })
    }
    try {
      const mensagem = novaMensagemAviso(
        candidato,
        chat.idChat,
        situacaoAnterior,
        avisaUsuarios
      )
      pilhaMensagens.push(mensagem)
    } catch (error) {
      console.log("Erro=> Erro enviando mensagem para o grupo do Telegram")
      console.log("Erro=> ", error)
    }
  }
}

export const enviaMensagemAdmin = async (total: number) => {
  try {
    const mensagem: BotUpdateResponse = {
      chat_id: AMBIENTE.TELEGRAM_ADMIN_ID,
      parse_mode: "HTML",
      text:
        `<pre>` +
        `Inconsistências: ${total}\n` +
        `Envie /erros para ver os erros atuais.` +
        `</pre>`,
    }
    pilhaMensagens.push(mensagem)
  } catch (error) {
    console.log("Erro=> Erro enviando mensagem para usuário do Telegram")
    console.log("Erro=> ", error)
  }
}

export const editaMensagensFixadas = async () => {
  for await (const mensagem of mensagensPinadas) {
    const { idChat, idMensagem } = mensagem
    const mensagemGerada = await compilaMensagemStatus(idChat, idMensagem)
    const novaMensagemFixada: BotEditMessageCommand = {
      chat_id: idChat,
      message_id: idMensagem,
      parse_mode: "HTML",
      text: mensagemGerada.text,
    }
    axios
      .post<BotMessageResponse>(
        AMBIENTE.TELEGRAM_API + "/editMessageText",
        novaMensagemFixada
      )
      .then(({ data: resposta }) => {
        console.log("Editando mensagem fixada:", {
          chat: resposta.result.chat.id,
          mensagem: resposta.result.message_id,
        })
      })
      .catch((e: AxiosError) => {
        console.error("Erro=>", e.response?.data || e)
      })
  }
}

async function compilaMensagemStatus(
  chat_id: number,
  reply_to_message_id?: number
) {
  const statusCompleto = await compilaRelatorio()
  const mensagemStatus: BotUpdateResponse = {
    chat_id,
    method: "sendMessage",
    parse_mode: "HTML",
    reply_to_message_id,
    text:
      `Status geral atualizado:\n` +
      `<pre>\n` +
      `${statusCompleto.ultimaAtualizacao.toLocaleString("pt-br", {
        timeStyle: "short",
        dateStyle: "short",
        timeZone: "America/Sao_Paulo",
      } as any)}\n` +
      `\n` +
      `------ TI ------\n` +
      `Aprovados     : ${
        statusCompleto.ti.naoConvocados + statusCompleto.ti.convocados
      }\n` +
      `Convocados    : ${statusCompleto.ti.convocados} (${(
        (statusCompleto.ti.convocados /
          (statusCompleto.ti.naoConvocados + statusCompleto.ti.convocados)) *
          100 || 0
      ).toFixed(2)}%)\n` +
      `Não Convocados: ${statusCompleto.ti.naoConvocados} (${(
        (statusCompleto.ti.naoConvocados /
          (statusCompleto.ti.naoConvocados + statusCompleto.ti.convocados)) *
          100 || 0
      ).toFixed(2)}%)\n` +
      `Empossados    : ${statusCompleto.ti.empossados} (${(
        (statusCompleto.ti.empossados /
          (statusCompleto.ti.naoConvocados + statusCompleto.ti.convocados)) *
          100 || 0
      ).toFixed(2)}%)\n` +
      `Autorizadas : ${statusCompleto.ti.autorizadas}\n` +
      `Expedidas   : ${statusCompleto.ti.expedidas}\n` +
      `Qualificação: ${statusCompleto.ti.emQualificacao}\n` +
      `Qualificados: ${statusCompleto.ti.qualificados}\n` +
      `\n` +
      `Cancelados : ${statusCompleto.ti.cancelados} (${(
        (statusCompleto.ti.cancelados / statusCompleto.ti.convocados) * 100 || 0
      ).toFixed(2)}%)\n` +
      `Desistentes: ${statusCompleto.ti.desistentes} (${(
        (statusCompleto.ti.desistentes / statusCompleto.ti.convocados) * 100 ||
        0
      ).toFixed(2)}%)\n` +
      `Inaptos    : ${statusCompleto.ti.inaptos} (${(
        (statusCompleto.ti.inaptos / statusCompleto.ti.convocados) * 100 || 0
      ).toFixed(2)}%)\n` +
      `\n\n` +
      `--- COMERCIAL ---\n` +
      `Aprovados     : ${
        statusCompleto.comercial.naoConvocados +
        statusCompleto.comercial.convocados
      }\n` +
      `Convocados    : ${statusCompleto.comercial.convocados} (${(
        (statusCompleto.comercial.convocados /
          (statusCompleto.comercial.naoConvocados +
            statusCompleto.comercial.convocados)) *
          100 || 0
      ).toFixed(2)}%)\n` +
      `Não Convocados: ${statusCompleto.comercial.naoConvocados} (${(
        (statusCompleto.comercial.naoConvocados /
          (statusCompleto.comercial.naoConvocados +
            statusCompleto.comercial.convocados)) *
          100 || 0
      ).toFixed(2)}%)\n` +
      `Empossados    : ${statusCompleto.comercial.empossados} (${(
        (statusCompleto.comercial.empossados /
          (statusCompleto.comercial.naoConvocados +
            statusCompleto.comercial.convocados)) *
          100 || 0
      ).toFixed(2)}%)\n` +
      `\n` +
      `Autorizadas : ${statusCompleto.comercial.autorizadas}\n` +
      `Expedidas   : ${statusCompleto.comercial.expedidas}\n` +
      `Qualificação: ${statusCompleto.comercial.emQualificacao}\n` +
      `Qualificados: ${statusCompleto.comercial.qualificados}\n` +
      `\n` +
      `Cancelados : ${statusCompleto.comercial.cancelados} (${(
        (statusCompleto.comercial.cancelados /
          statusCompleto.comercial.convocados) *
          100 || 0
      ).toFixed(2)}%)\n` +
      `Desistentes: ${statusCompleto.comercial.desistentes} (${(
        (statusCompleto.comercial.desistentes /
          statusCompleto.comercial.convocados) *
          100 || 0
      ).toFixed(2)}%)\n` +
      `Inaptos    : ${statusCompleto.comercial.inaptos} (${(
        (statusCompleto.comercial.inaptos /
          statusCompleto.comercial.convocados) *
          100 || 0
      ).toFixed(2)}%)\n` +
      `</pre>`,
  }
  return mensagemStatus
}

function novaMensagemAviso(
  candidato: Candidato,
  chat_id: number,
  situacaoAnterior: string,
  avisaUsuarios: string
) {
  const mensagem: BotUpdateResponse = {
    chat_id,
    parse_mode: "HTML",
    method: "sendMessage",
    text:
      `Alteração:\n` +
      `<pre>\n` +
      `Nome: ${candidato.nome}\n` +
      `\n` +
      `Situação: ${candidato.situacao.toUpperCase()}\n` +
      `\n` +
      `Anterior: ${situacaoAnterior.toUpperCase()}\n` +
      `\n` +
      `Agência: ${
        candidato.agenciaSituacao ? candidato.agenciaSituacao : "SEM AGÊNCIA"
      }\n` +
      `Data: ${
        candidato.dataSituacao ? candidato.dataSituacao : "SEM DATA"
      }\n` +
      `Macro: ${
        candidato.macroRegiao ? candidato.macroRegiao : "SEM MACRO REGIÃO"
      }\n` +
      `Micro: ${
        candidato.microRegiao ? candidato.microRegiao : "SEM MICRO REGIÃO"
      }\n` +
      `\n` +
      `Tipo: ${candidato.tipo ? candidato.tipo : "SEM TIPO"}\n` +
      `</pre>\n` +
      `Status geral na mensagem fixada.` +
      avisaUsuarios,
  }
  return mensagem
}
