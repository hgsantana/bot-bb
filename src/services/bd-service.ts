import { SQL } from "../main"
import { Candidato } from "../models/candidato"
import { TipoCandidato } from "../models/tipo-candidato"

export const listaNomeCandidatos = async (
  tipo: TipoCandidato
): Promise<Pick<Candidato, "id" | "nome">[]> => {
  const candidatos = await SQL<Candidato>("candidatos_bb")
    .select("id", "nome")
    .whereIn("tecnologia", tipo.split(","))
  return candidatos
}

export const listaCandidatos = async (
  tipo: TipoCandidato
): Promise<Candidato[]> => {
  const candidatos = await SQL<Candidato>("candidatos_bb")
    .select("*")
    .whereIn("tecnologia", tipo.split(","))
  return candidatos
}
