import { Candidato } from "./candidato"

export type RespostaJSON = {
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
    ultimaAtualizacao: Date
    listagem: Candidato[]
}