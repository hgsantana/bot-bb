import { Request, Response } from 'express'
import { respostaMOCK } from '../data/dados-mock'
import { AMBIENTE } from '../main'
import { BotUpdate } from '../models/bot-update'
import { BotUpdateResponse } from '../models/bot-update-response'

export const recebeMensagensBot = async (req: Request, res: Response) => {
    const mensagem: BotUpdate = req.body
    if (!req.query
        || !req.query.token
        || req.query.token != AMBIENTE.TELEGRAM_TOKEN
    ) return res.status(401).send()

    const resposta: BotUpdateResponse | null = checaMensagem(mensagem)

    if (resposta) res.send(resposta)
    else res.send()
}

const checaMensagem = (mensagem: BotUpdate): BotUpdateResponse | null => {
    if (mensagem.message.text.startsWith("/status")) {
        return {
            chat_id: mensagem.message.chat.id,
            method: "sendMessage",
            parse_mode: "HTML",
            text: `Olá, <a href="tg://user?id=${mensagem.message.from.id}">@${mensagem.message.from.first_name}</a>. Segue atualização de status das convocações: 
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

    return null
}