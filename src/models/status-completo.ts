import { Candidato } from "./candidato"

export type StatusCompleto = {
    id: number
    empossados: number
    cancelados: number
    desistentes: number
    inaptos: number
    qualificados: number
    emQualificacao: number
    autorizadas: number
    expedidas: number
    naoConvocados: number
    convocados: number
    inconsistentes: number
    ultimaAtualizacao: Date
    candidatos: Candidato[]

    proximoConvocado?: number
}