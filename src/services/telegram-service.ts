import axios from "axios"
import { AGENTES_COMERCIAL } from "../data/nomes-comercial"
import { AGENTES_TI } from "../data/nomes-ti"
import { AMBIENTE } from "../main"
import { BotUpdate } from "../models/bot-update"
import { BotUpdateResponse } from "../models/bot-update-response"
import { Candidato } from "../models/candidato"
import { ChatCadastrado } from "../models/chat-cadastrado"
import { RespostaJSON } from "../models/resposta-json"
import { UsuarioCadastrado } from "../models/usuario-registrado"
import { geraStatusCompleto } from "./dados-service"
import { buscaDadosTelegram, salvaDadosTelegram } from "./storage-service"

const nomesCandidatos = [...AGENTES_COMERCIAL.map(a => a.nome), ...AGENTES_TI.map(a => a.nome)]
export let usuariosCadastrados: UsuarioCadastrado[] = []
export let chatsCadastrados: ChatCadastrado[] = []

// restaura backup do telegram
buscaDadosTelegram().then(dados => {
    if (dados) {
        usuariosCadastrados = dados.usuariosCadastrados
        chatsCadastrados = dados.chatsCadastrados
    }
})

export const checaMensagem = (mensagemRecebida: BotUpdate): BotUpdateResponse | null => {

    if (!mensagemRecebida?.message?.text) return null

    /********************* /iniciar *********************/
    if (mensagemRecebida.message.text.toLocaleLowerCase().startsWith("/iniciar")) {
        const chat = chatsCadastrados.find(c => c.id == mensagemRecebida.message.chat.id)
        let text = ""
        if (chat) text = `As atualizações já estão ativas para este chat.`
        else {
            console.log("Ativando atualizações para o chat:", mensagemRecebida.message.chat.id)
            text = `Ativando atualizações para este chat. Para interrompê-las, use o comando /parar.`
            chatsCadastrados.push({ id: mensagemRecebida.message.chat.id })
            salvaDadosTelegram({ usuariosCadastrados, chatsCadastrados })
        }
        const reply_to_message_id = mensagemRecebida.message.message_id
        return {
            chat_id: mensagemRecebida.message.chat.id,
            method: "sendMessage",
            parse_mode: "HTML",
            reply_to_message_id,
            text
        }
    }

    /********************* /parar *********************/
    if (mensagemRecebida.message.text.toLocaleLowerCase().startsWith("/parar")) {
        const chat = chatsCadastrados.find(c => c.id == mensagemRecebida.message.chat.id)
        let text = ""
        if (chat) {
            const indiceChat = chatsCadastrados.indexOf(chat)
            chatsCadastrados.splice(indiceChat, 1)
            salvaDadosTelegram({ usuariosCadastrados, chatsCadastrados })
            console.log("Desativando atualizações para o chat:", mensagemRecebida.message.chat.id)
            text = `As atualizações foram interrompidas para este chat.`
        } else {
            text = `Não há atualizações ativas para este chat. Caso deseje ativa-las, use o comando /iniciar.`
        }
        const reply_to_message_id = mensagemRecebida.message.message_id
        return {
            chat_id: mensagemRecebida.message.chat.id,
            method: "sendMessage",
            parse_mode: "HTML",
            reply_to_message_id,
            text
        }
    }

    /********************* /status *********************/
    if (mensagemRecebida.message.text.toLocaleLowerCase().startsWith("/status")) {
        const statusCompleto = geraStatusCompleto()
        const reply_to_message_id = mensagemRecebida.message.message_id
        return {
            chat_id: mensagemRecebida.message.chat.id,
            method: "sendMessage",
            parse_mode: "HTML",
            reply_to_message_id,
            text: `Status atual das convocações:\n` +
                `<pre>\n` +
                `Não Convocados: ${statusCompleto.naoConvocados}\n` +
                `Convocados: ${statusCompleto.convocados}\n` +
                `\n` +
                `Autorizadas: ${statusCompleto.autorizadas}\n` +
                `Expedidas: ${statusCompleto.expedidas}\n` +
                `Qualificação: ${statusCompleto.emQualificacao}\n` +
                `Qualificados: ${statusCompleto.qualificados}\n` +
                `Empossados: ${statusCompleto.empossados}\n` +
                `Cancelados: ${statusCompleto.cancelados}\n` +
                `Desistentes: ${statusCompleto.desistentes}\n` +
                `Inaptos: ${statusCompleto.inaptos}\n` +
                `\n` +
                `${statusCompleto.ultimaAtualizacao.toLocaleString("pt-br", { timeStyle: 'short', dateStyle: 'short', timeZone: "America/Sao_Paulo" } as any)}\n` +
                `</pre>`
        }
    }

    /********************* /cadastrar *********************/
    if (mensagemRecebida.message.text.toLocaleLowerCase().startsWith("/cadastrar")) {
        const nome = mensagemRecebida.message.text.split("/cadastrar")[1].replace(/\ \ /gi, " ").trim().toUpperCase()
        const idDestinatario = `${mensagemRecebida.message.from.id}`
        const usuario = usuariosCadastrados.find(u => u.id == idDestinatario)
        const reply_to_message_id = mensagemRecebida.message.message_id

        let text = ``
        const candidato = nomesCandidatos.find(n => n == nome)

        if (!nome) text = `Você precisa usar a sintaxe correta: <pre>/cadastrar NOME COMPLETO</pre>`
        else if (!candidato) text = `Este nome não existe no resultado final oficial.`
        else {
            text = `Olá, <a href="tg://user?id=${mensagemRecebida.message.from.id}">@${mensagemRecebida.message.from.first_name}</a>. ` +
                `A partir de agora, você receberá os avisos de alterações para "${nome}" no privado. ` +
                `Para cancelar os avisos, use o comando /descadastrar.`
            if (usuario) usuario.nomeChecagem = nome
            else {
                console.log("Cadastrando novo usuário para envio de mensagens:", { id: idDestinatario, nomeChecagem: nome })
                usuariosCadastrados.push({ id: idDestinatario, nomeChecagem: nome })
                salvaDadosTelegram({ usuariosCadastrados, chatsCadastrados })
            }
        }


        return {
            chat_id: mensagemRecebida.message.chat.id,
            method: "sendMessage",
            parse_mode: "HTML",
            reply_to_message_id,
            text,
        }
    }

    /********************* /descadastrar *********************/
    if (mensagemRecebida.message.text.toLocaleLowerCase().startsWith("/descadastrar")) {
        const idDestinatario = `${mensagemRecebida.message.from.id}`
        const usuario = usuariosCadastrados.find(u => u.id == idDestinatario)

        const reply_to_message_id = mensagemRecebida.message.message_id

        let text = `A partir de agora, você não receberá mais avisos.`
        if (usuario) {
            console.log("Descadastrando usuário para envio de mensagens:", usuario)
            usuariosCadastrados.splice(usuariosCadastrados.indexOf(usuario), 1)
            salvaDadosTelegram({ usuariosCadastrados, chatsCadastrados })
        } else text = `Você ainda não está cadastrado para receber avisos.`

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

export const enviaMensagemPrivada = async (UsuarioRegistrado: UsuarioCadastrado, situacaoAnterior: string, candidato: Candidato) => {
    try {
        const mensagem: BotUpdateResponse = {
            chat_id: UsuarioRegistrado.id,
            parse_mode: "HTML",
            text: `Alteração em "${UsuarioRegistrado.nomeChecagem}":\n` +
                `<pre>\n` +
                `Situação: ${candidato.situacao.toUpperCase()}\n` +
                `Anterior: ${situacaoAnterior.toUpperCase()}\n` +
                `\n` +
                `Agência: ${candidato.agenciaSituacao ? candidato.agenciaSituacao : "SEM AGÊNCIA"}\n` +
                `Data: ${candidato.dataSituacao ? candidato.dataSituacao : "SEM DATA"}\n` +
                `Macro: ${candidato.macroRegiao ? candidato.macroRegiao : "SEM MACRO REGIÃO"}\n` +
                `Micro: ${candidato.microRegiao ? candidato.microRegiao : "SEM MICRO REGIÃO"}\n` +
                `\n` +
                `Tipo: ${candidato.tipo ? candidato.tipo : "SEM TIPO"}\n` +
                `</pre>`
        }
        const api = AMBIENTE.TELEGRAM_API + '/sendMessage'

        await axios.post(api, mensagem).catch(e => {
            console.log("Erro=>", e);
        })
    } catch (error) {
        console.log("Erro=> Erro enviando mensagem para usuário do Telegram")
        console.log("Erro=> ", error)
    }
}

export const enviaMensagemPublica = (situacaoAnterior: string, candidato: Candidato) => {
    chatsCadastrados.forEach(async chat => {
        try {
            const mensagem: BotUpdateResponse = {
                chat_id: chat.id,
                parse_mode: "HTML",
                text: `Alteração em candidato detectada:\n` +
                    `<pre>\n` +
                    `Nome: ${candidato.nome}\n` +
                    `Situação: ${candidato.situacao.toUpperCase()}\n` +
                    `Anterior: ${situacaoAnterior.toUpperCase()}\n` +
                    `\n` +
                    `Agência: ${candidato.agenciaSituacao ? candidato.agenciaSituacao : "SEM AGÊNCIA"}\n` +
                    `Data: ${candidato.dataSituacao ? candidato.dataSituacao : "SEM DATA"}\n` +
                    `Macro: ${candidato.macroRegiao ? candidato.macroRegiao : "SEM MACRO REGIÃO"}\n` +
                    `Micro: ${candidato.microRegiao ? candidato.microRegiao : "SEM MICRO REGIÃO"}\n` +
                    `\n` +
                    `Tipo: ${candidato.tipo ? candidato.tipo : "SEM TIPO"}\n` +
                    `</pre>`
            }
            const api = AMBIENTE.TELEGRAM_API + '/sendMessage'

            await axios.post(api, mensagem).catch(e => {
                console.log("Erro=>", e);
            })
        } catch (error) {
            console.log("Erro=> Erro enviando mensagem para o grupo do Telegram")
            console.log("Erro=> ", error)
        }
    })
}

export const enviaStatus = (resposta: RespostaJSON) => {
    chatsCadastrados.forEach(async chat => {
        try {
            const mensagem: BotUpdateResponse = {
                chat_id: chat.id,
                parse_mode: "HTML",
                text: `Alteração no quadro geral:\n` +
                    `<pre>\n` +
                    `Não Convocados: ${resposta.naoConvocados}\n` +
                    `Convocados: ${resposta.convocados}\n` +
                    `\n` +
                    `Autorizadas: ${resposta.autorizadas}\n` +
                    `Expedidas: ${resposta.expedidas}\n` +
                    `Qualificação: ${resposta.emQualificacao}\n` +
                    `Qualificados: ${resposta.qualificados}\n` +
                    `Empossados: ${resposta.empossados}\n` +
                    `Cancelados: ${resposta.cancelados}\n` +
                    `Desistentes: ${resposta.desistentes}\n` +
                    `Inaptos: ${resposta.inaptos}\n` +
                    `\n` +
                    `${resposta.ultimaAtualizacao
                        .toLocaleString("pt-br", { timeStyle: 'short', dateStyle: 'short', timeZone: "America/Sao_Paulo" } as any)}\n` +
                    `</pre>`
            }
            const api = AMBIENTE.TELEGRAM_API + '/sendMessage'

            await axios.post(api, mensagem).catch(e => {
                console.log("Erro=>", e);
            })
        } catch (error) {
            console.log("Erro=> Erro enviando mensagem para o grupo do Telegram")
            console.log("Erro=> ", error)
        }
    })
}

export const enviaMensagemAdmin = async (candidatosInconsistentes: Candidato[]) => {
    try {
        let textoInconsistentes = ""
        candidatosInconsistentes.forEach(c => {
            textoInconsistentes += `\n\n` +
                `Nome: ${c.nome}\n` +
                `Situação: ${c.situacao}\n` +
                `Micro-Região: ${c.microRegiao}`
        })
        const mensagem: BotUpdateResponse = {
            chat_id: AMBIENTE.TELEGRAM_ADMIN_ID,
            parse_mode: "HTML",
            text: `Candidatos com inconsistência detectados:\n` +
                `<pre>\n` +
                `Inconsistências: ${candidatosInconsistentes.length}\n` +
                `${textoInconsistentes}\n` +
                `</pre>`
        }
        const api = AMBIENTE.TELEGRAM_API + '/sendMessage'

        await axios.post(api, mensagem).catch(e => {
            console.log("Erro=>", e);
        })
    } catch (error) {
        console.log("Erro=> Erro enviando mensagem para usuário do Telegram")
        console.log("Erro=> ", error)
    }
}