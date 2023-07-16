import { Request, Response } from "express"
import { AMBIENTE } from "../main"
import { BotUpdate } from "../models/bot-update"
// import { checaMensagem } from "../../backup/services/telegram-service"

export const recebeMensagensBot = async (req: Request, res: Response) => {
  const mensagemRecebida: BotUpdate = req.body
  if (
    !req.query ||
    !req.query.token ||
    req.query.token != AMBIENTE.TELEGRAM_TOKEN
  )
    return res.status(401).send()

  try {
    const resposta = "" //checaMensagem(mensagemRecebida)
    if (resposta) res.send(resposta)
    else res.send()
  } catch (error) {
    console.log("Erro=>", error)
    res.status(400).send()
  }
}