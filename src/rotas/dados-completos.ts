import { Request, Response } from 'express'
import { AGENTES_COMERCIAL } from '../data/nomes-comercial'
import { AGENTES_TI } from '../data/nomes-ti'
import { RespostaJSON } from '../models/resposta-json'
import { RESPOSTA_COMERCIAL, RESPOSTA_TI } from '../services/dados-service'

export const dadosCompletos = async (req: Request, res: Response) => {
    let resposta: RespostaJSON
    if (req.params.tipo == "comercial") {
        resposta = RESPOSTA_COMERCIAL
        resposta.candidatos = AGENTES_COMERCIAL
    } else {
        resposta = RESPOSTA_TI
        resposta.candidatos = AGENTES_TI
    }
    res.json(resposta)
}