import { Candidato } from "./candidato";
import { MacroRegiao } from "./macro-regiao";

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
    macroRegioes: MacroRegiao[]
}

export type RespostaAlteracoes = {
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
    ultimaAtualizacao: Date
    candidatosAlterados: Candidato[]
}