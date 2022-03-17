export type Candidato = {
    nome: string
    situacao: string
    dataNascimento: string
    posicao: number
    tipo: string
    macroRegiao: number
    microRegiao: number

    agenciaSituacao?: string | null
    dataSituacao?: string | null
    quantidadeCadastros?: number | null
}