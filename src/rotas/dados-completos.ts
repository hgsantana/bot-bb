import { Request, Response } from 'express'
import { AGENTES_COMERCIAL } from '../data/nomes-comercial'
import { AGENTES_TI } from '../data/nomes-ti'
import { RespostaJSON } from '../models/resposta-json'
import { RESPOSTA_COMERCIAL, RESPOSTA_TI } from '../services/html-service'

export const dadosCompletos = async (req: Request, res: Response) => {
    let resposta: RespostaJSON
    if (req.params.tipo == "comercial") {
        resposta = { ...RESPOSTA_COMERCIAL, candidatos: AGENTES_COMERCIAL }
    } else {
        resposta = { ...RESPOSTA_TI, candidatos: AGENTES_TI }
    }
    res.json(resposta)
}