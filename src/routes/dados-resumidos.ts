import { Request, Response } from 'express'
import { RespostaResumida } from '../models/resposta-resumida'
import { RESPOSTA_COMERCIAL, RESPOSTA_TI } from '../services/html-service'

export const dadosResumidos = async (req: Request, res: Response) => {
    const ti: any = { ...RESPOSTA_TI }
    const comercial: any = { ...RESPOSTA_COMERCIAL }
    delete ti.candidatos
    delete comercial.candidatos
    const respostaResumida: RespostaResumida = {
        ti,
        comercial
    }
    res.json(respostaResumida)
}