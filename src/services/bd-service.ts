import { SQL } from "../main"
import { Candidato } from "../models/candidato"
import { TipoCandidato } from "../models/tipo-candidato"

export const listaNomeCandidatos = async (
  tipo = TipoCandidato.TODOS
): Promise<Pick<Candidato, "id" | "nome">[]> => {
  const candidatos = await SQL<Candidato>("candidatos_bb")
    .select("id", "nome")
    .whereIn("tecnologia", tipo.split(","))
  return candidatos
}

export const listaCandidatos = async (
  tipo = TipoCandidato.TODOS
): Promise<Candidato[]> => {
  const candidatos = await SQL<Candidato>("candidatos_bb")
    .select("*")
    .whereIn("tecnologia", tipo.split(","))
  return candidatos
}

export const buscaCandidato = async (
  id: number
): Promise<Candidato | undefined> => {
  return SQL<Candidato>("candidatos_bb").select("*").first().where({ id })
}
