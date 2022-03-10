import { Request, Response } from 'express'
import { AMBIENTE } from '../main'

export const recebeMensagensBot = async (req: Request, res: Response) => {

    if (!req.query
        || !req.query.token
        || req.query.token != AMBIENTE.TELEGRAM_TOKEN
    ) return res.status(401).send()

    console.log("Mensagem recebida no bot:", req.body)
    res.send()

}