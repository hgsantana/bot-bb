import axios from "axios"
import { candidatosMock, respostaMOCK } from "../data/dados-mock"
import { AMBIENTE } from "../main"
import { BotUpdate } from "../models/bot-update"
import { BotUpdateResponse } from "../models/bot-update-response"
import { Candidato } from "../models/candidato"
import { UsuarioRegistrado } from "../models/usuario-registrado"

const candidatosChecagem = [...candidatosMock]
export const usuariosCadastrados: UsuarioRegistrado[] = []

export const checaMensagem = (mensagemRecebida: BotUpdate): BotUpdateResponse | null => {

    if (!mensagemRecebida?.message?.text) return null

    /********************* /status *********************/
    if (mensagemRecebida.message.text.toLocaleLowerCase().startsWith("/status")) {
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

    /********************* /cadastrar *********************/
    if (mensagemRecebida.message.text.toLocaleLowerCase().startsWith("/cadastrar")) {
        const nome = mensagemRecebida.message.text.split("/cadastrar")[1].replace(/\ \ /gi, " ").trim().toUpperCase()
        const idDestinatario = `${mensagemRecebida.message.from.id}`
        const usuario = usuariosCadastrados.find(u => u.id == idDestinatario)
        const reply_to_message_id = mensagemRecebida.message.message_id

        let text = ``
        const candidato = candidatosChecagem.find(c => c.nome == nome)

        if (!nome) text = `Você precisa usar a sintaxe correta: <pre>/cadastrar NOME COMPLETO</pre>`
        else if (!candidato) text = `Este nome não existe no resultado final oficial.`
        else {
            text = `Olá, <a href="tg://user?id=${mensagemRecebida.message.from.id}">@${mensagemRecebida.message.from.first_name}</a>. A partir de agora, você receberá os avisos de alterações para "${nome}" no privado. Para cancelar os avisos, use o comando /descadastrar.`
            if (usuario) usuario.nomeChecagem = nome
            else {
                console.log("Cadastrando novo usuário para envio de mensagens:", { id: idDestinatario, nomeChecagem: nome })
                usuariosCadastrados.push({ id: idDestinatario, nomeChecagem: nome })
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

export const enviaMensagemPrivada = async (UsuarioRegistrado: UsuarioRegistrado, situacaoAnterior: string, candidato: Candidato) => {
    try {
        const mensagem: BotUpdateResponse = {
            chat_id: UsuarioRegistrado.id,
            parse_mode: "HTML",
            text: `Alteração em "${UsuarioRegistrado.nomeChecagem}":
<pre>
  Nova Situação: ${candidato.situacao}
  Situação anterior: ${situacaoAnterior}
  
  Agência situação: ${candidato.agenciaSituacao ? candidato.agenciaSituacao : "SEM AGÊNCIA"}
  Data da situação: ${candidato.dataSituacao ? candidato.dataSituacao : "SEM DATA"}
  Macro Região: ${candidato.macroRegiao ? candidato.macroRegiao : "SEM MACRO REGIÃO"}
  Micro Região: ${candidato.microRegiao ? candidato.microRegiao : "SEM MICRO REGIÃO"}
  
  Tipo do candidato: ${candidato.tipo ? candidato.tipo : "SEM TIPO"}
</pre>`
        }
        const api = AMBIENTE.TELEGRAM_API + '/sendMessage'

        console.log("Enviando mensagem para:", api)
        console.log("Mensagem:", mensagem)

        await axios.post(api, mensagem).catch(e => {
            console.log("Erro=>", e);
        })
    } catch (error) {
        console.log("Erro=> Erro enviando mensagem para usuário do Telegram")
        console.log("Erro=> ", error)
    }
}

export const enviaMensagemPublica = async (chat_id: number, situacaoAnterior: string, candidato: Candidato) => {
    try {
        const mensagem: BotUpdateResponse = {
            chat_id,
            parse_mode: "HTML",
            text: `Novo candidato convocado!
<pre>
  Nome: ${candidato.nome}
  Nova Situação: ${candidato.situacao}
  Situação anterior: ${situacaoAnterior}
  
  Agência situação: ${candidato.agenciaSituacao ? candidato.agenciaSituacao : "SEM AGÊNCIA"}
  Data da situação: ${candidato.dataSituacao ? candidato.dataSituacao : "SEM DATA"}
  Macro Região: ${candidato.macroRegiao ? candidato.macroRegiao : "SEM MACRO REGIÃO"}
  Micro Região: ${candidato.microRegiao ? candidato.microRegiao : "SEM MICRO REGIÃO"}
  
  Tipo do candidato: ${candidato.tipo ? candidato.tipo : "SEM TIPO"}
</pre>`
        }
        const api = AMBIENTE.TELEGRAM_API + '/sendMessage'

        console.log("Enviando mensagem para:", api)
        console.log("Mensagem:", mensagem)

        await axios.post(api, mensagem).catch(e => {
            console.log("Erro=>", e);
        })
    } catch (error) {
        console.log("Erro=> Erro enviando mensagem para usuário do Telegram")
        console.log("Erro=> ", error)
    }
}