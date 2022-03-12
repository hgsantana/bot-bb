import { Request, Response } from 'express'
import { RESPOSTA_COMERCIAL, RESPOSTA_TI } from '../services/html-service'

export const dadosResumidos = async (req: Request, res: Response) => {
    if (req.params.tipo == "comercial") {
        res.json(RESPOSTA_COMERCIAL)
    } else {
        res.json(RESPOSTA_TI)
    }
}