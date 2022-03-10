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

    console.log("Mensagem recebida no bot:", mensagem)

    let resposta: BotUpdateResponse | undefined

    if (mensagem.message.text.startsWith("/status")) {
        resposta = {
            chat_id: mensagem.message.chat.id,
            method: "sendMessage",
            parse_mode: "HTML",
            text: `Olá, @${mensagem.message.from.username}. Segue atualização de status das convocações: <pre><code class="language-json">${respostaMOCK}</code></pre>`
        }
    }

    if (resposta) res.send(resposta)
    else res.send()
}