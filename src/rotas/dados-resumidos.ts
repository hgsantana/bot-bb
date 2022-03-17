import { Request, Response } from 'express'
import { RespostaCompleta } from '../models/resposta-completa'
import { RESPOSTA_COMERCIAL, RESPOSTA_TI } from '../services/html-service'

export const dadosResumidos = async (req: Request, res: Response) => {
    const respostaResumida: RespostaCompleta = {
        ti: RESPOSTA_TI,
        comercial: RESPOSTA_COMERCIAL
    }
    res.json(respostaResumida)
}