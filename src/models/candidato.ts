import { TipoCandidato } from "./tipo-candidato"

export type Candidato = {
  id: number
  nome: string
  dataNascimento: string
  concurso: string
  inscricao: string
  macroRegiao: number
  microRegiao: number
  tipo: "CLASSIFICADO" | "CADASTRO-RESERVA"
  pontos: number
  posicao: number
  posicaoPcd: number | null
  posicaoPpp: number | null
  situacao: string
  dataSituacao: string
  agenciaSituacao: string
  tecnologia: TipoCandidato
}
