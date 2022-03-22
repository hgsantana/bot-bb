import { Request, Response } from 'express'
import { AGENTES_COMERCIAL } from '../data/nomes-comercial'
import { AGENTES_TI } from '../data/nomes-ti'
import { RespostaCompleta } from '../models/resposta-completa'
import { RESPOSTA_COMERCIAL, RESPOSTA_TI } from '../services/html-service'

export const dadosCompletos = async (req: Request, res: Response) => {
    let resposta: RespostaCompleta
    resposta = {
        ti: RESPOSTA_TI,
        comercial: RESPOSTA_COMERCIAL
    }
    res.json(resposta)
}