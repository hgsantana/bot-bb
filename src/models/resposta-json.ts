import { Candidato } from "./candidato";
import { MacroRegiao } from "./macro-regiao";

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
    macroRegioes: MacroRegiao[]
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