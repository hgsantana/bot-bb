import { Candidato } from "./candidato";

export type RespostaJSON = {
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
    ultimaAtualizacao: string
    candidatos: Candidato[]
}

export type RespostaAlteracoes = {
    id: number
    empossados: number[]
    cancelados: number[]
    desistentes: number[]
    inaptos: number[]
    qualificados: number[]
    emQualificacao: number[]
    autorizadas: number[]
    expedidas: number[]
    naoConvocados: number[]
    convocados: number[]
    ultimaAtualizacao: string
    candidatosAlterados: Candidato[]
}