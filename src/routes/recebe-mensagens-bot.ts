import { Handler } from "express"
import { BotUpdate } from "../models/bot-update"
import { checaMensagem } from "../services/telegram-service"
// import { checaMensagem } from "../../backup/services/telegram-service"

export const recebeMensagensBot: Handler = async (req, res) => {
  const mensagemRecebida: BotUpdate = req.body
  const headerToken = req.headers["x-telegram-bot-api-secret-token"]
  if (!headerToken) return res.status(401).send()

  try {
    const resposta = checaMensagem(mensagemRecebida)
    if (resposta) res.send(resposta)
    else res.send()
    // const relatorio = await compilaRelatorio()
    // res.send(relatorio)
  } catch (error) {
    console.log("Erro=>", error)
    res.status(400).send()
  }
}
