import { Request, Response } from 'express'
import { RESPOSTA_COMERCIAL, RESPOSTA_TI } from '../services/atualiza-dados'

export const dadosAtualizados = async (req: Request, res: Response) => {
    try {
        if (req.params.tipo == "comercial") {
            const { autorizadas, cancelados, convocados, desistentes, inaptos, emQualificacao, empossados, expedidas, naoConvocados, qualificados, ultimaAtualizacao } = RESPOSTA_COMERCIAL
            res.json({ autorizadas, cancelados, convocados, desistentes, inaptos, emQualificacao, empossados, expedidas, naoConvocados, qualificados, ultimaAtualizacao })
        } else {
            const { autorizadas, cancelados, convocados, desistentes, inaptos, emQualificacao, empossados, expedidas, naoConvocados, qualificados, ultimaAtualizacao } = RESPOSTA_TI
            res.json({ autorizadas, cancelados, convocados, desistentes, inaptos, emQualificacao, empossados, expedidas, naoConvocados, qualificados, ultimaAtualizacao })
        }
    } catch (error) {
        res.json({ autorizadas: 0, cancelados: 0, convocados: 0, desistentes: 0, inaptos: 0, emQualificacao: 0, empossados: 0, expedidas: 0, naoConvocados: 0, qualificados: 0, ultimaAtualizacao: 0 })
    }
}