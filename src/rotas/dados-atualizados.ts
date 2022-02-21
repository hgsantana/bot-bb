import { Request, Response } from 'express'
import { RESPOSTA_COMERCIAL, RESPOSTA_TI } from '../services/atualiza-dados'

export const dadosAtualizados = async (req: Request, res: Response) => {
    if (req.params.tipo == "comercial") {
        const { autorizadas, cancelados, convocados, desistentes, emQualificacao, empossados, expedidas, naoConvocados, qualificados, ultimaAtualizacao } = RESPOSTA_COMERCIAL
        res.json({ autorizadas, cancelados, convocados, desistentes, emQualificacao, empossados, expedidas, naoConvocados, qualificados, ultimaAtualizacao })
    } else {
        const { autorizadas, cancelados, convocados, desistentes, emQualificacao, empossados, expedidas, naoConvocados, qualificados, ultimaAtualizacao } = RESPOSTA_TI
        res.json({ autorizadas, cancelados, convocados, desistentes, emQualificacao, empossados, expedidas, naoConvocados, qualificados, ultimaAtualizacao })
    }
}