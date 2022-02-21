export type RespostaJSON = {
    empossados: number
    cancelados: number
    desistentes: number
    qualificados: number
    emQualificacao: number
    autorizadas: number
    expedidas: number
    naoConvocados: number
    convocados: number
    listagem?: { nome: string, situacao: string }[]
}