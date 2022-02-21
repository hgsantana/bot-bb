import { Request, Response } from 'express'
import { RESPOSTA_COMERCIAL, RESPOSTA_TI } from '../services/atualiza-dados'

export const dadosCompletos = async (req: Request, res: Response) => {
    if (req.params.tipo == "comercial") res.json(RESPOSTA_COMERCIAL)
    else res.json(RESPOSTA_TI)
}