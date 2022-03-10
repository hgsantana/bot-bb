import { respostaMOCK } from "../data/dados-mock"
import { AGENTES_COMERCIAL } from "../data/nomes-comercial"
import { AGENTES_TI } from "../data/nomes-ti"
import { BotUpdate } from "../models/bot-update"
import { BotUpdateResponse } from "../models/bot-update-response"
import { UsuarioRegistrado } from "../models/usuario-registrado"

const usuariosRegistrados: UsuarioRegistrado[] = []

export const checaMensagem = (mensagemRecebida: BotUpdate): BotUpdateResponse | null => {

    if (!mensagemRecebida?.message?.text) return null

    // mensagem de /status
    if (mensagemRecebida.message.text.startsWith("/status")) {
        const reply_to_message_id = mensagemRecebida.message.message_id
        return {
            chat_id: mensagemRecebida.message.chat.id,
            method: "sendMessage",
            parse_mode: "HTML",
            reply_to_message_id,
            text: `Olá, <a href="tg://user?id=${mensagemRecebida.message.from.id}">@${mensagemRecebida.message.from.first_name}</a>. Segue atualização de status das convocações: 
<pre>
  Não Convocados: ${respostaMOCK.naoConvocados}
  Convocados: ${respostaMOCK.convocados}
  
  Autorizadas: ${respostaMOCK.autorizadas}
  Expedidas: ${respostaMOCK.expedidas}
  Qualificação: ${respostaMOCK.emQualificacao}
  Qualificados: ${respostaMOCK.qualificados}
  Empossados: ${respostaMOCK.empossados}
  Cancelados por prazo: ${respostaMOCK.cancelados}
  Desistentes: ${respostaMOCK.desistentes}
  Inaptos: ${respostaMOCK.inaptos}
    
Atualização: ${respostaMOCK.ultimaAtualizacao.toLocaleString("pt-br", { timeStyle: 'short', dateStyle: 'short', timeZone: "America/Sao_Paulo" } as any)}
</pre>`
        }
    }

    // mensagem de /cadastrar
    if (mensagemRecebida.message.text.startsWith("/cadastrar")) {
        const nome = mensagemRecebida.message.text.split("/cadastrar")[1].replace(/\ \ /gi, " ").trim().toUpperCase()
        const idDestinatario = `@${mensagemRecebida.message.from.id}`
        const usuario = usuariosRegistrados.find(u => u.id == idDestinatario)
        const reply_to_message_id = mensagemRecebida.message.message_id

        let text = ``
        const candidatos = [...AGENTES_COMERCIAL, ...AGENTES_TI]
        const candidato = candidatos.find(c => c.nome == nome)

        if (!nome) text = `Você precisa usar a sintaxe correta: <pre>/cadastrar NOME COMPLETO</pre>.`
        else if (!candidato) text = `Este nome não existe no resultado final oficial.`
        else {
            text = `Olá, <a href="tg://user?id=${mensagemRecebida.message.from.id}">@${mensagemRecebida.message.from.first_name}</a>. A partir de agora, você receberá os avisos de "${nome}" no privado. Para cancelar os avisos, use o comando /descadastrar.`
            if (usuario) usuario.nomeChecagem = nome
            else usuariosRegistrados.push({ id: idDestinatario, nomeChecagem: nome })
        }


        return {
            chat_id: mensagemRecebida.message.chat.id,
            method: "sendMessage",
            parse_mode: "HTML",
            reply_to_message_id,
            text,
        }
    }

    // mensagem de descadastrar
    if (mensagemRecebida.message.text.startsWith("/descadastrar")) {
        const idDestinatario = `@${mensagemRecebida.message.from.id}`
        const usuario = usuariosRegistrados.find(u => u.id == idDestinatario)

        const reply_to_message_id = mensagemRecebida.message.message_id

        let text = `A partir de agora, você não receberá mais avisos.`
        if (usuario) usuariosRegistrados.splice(usuariosRegistrados.indexOf(usuario), 1)
        else text = `Você ainda não está cadastrado para receber avisos.`

        return {
            chat_id: mensagemRecebida.message.chat.id,
            method: "sendMessage",
            parse_mode: "HTML",
            reply_to_message_id,
            text,
        }
    }

    return null
}