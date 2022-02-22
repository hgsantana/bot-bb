import { Request, Response } from 'express'
import { ALTERACOES_COMERCIAL, ALTERACOES_TI } from '../services/atualiza-dados'

export const dadosAtualizados = async (req: Request, res: Response) => {
    if (req.params.tipo == "comercial") {
        res.json(ALTERACOES_COMERCIAL)
    } else {
        res.json(ALTERACOES_TI)
    }
}