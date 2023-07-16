import axios, { AxiosRequestConfig } from "axios"
import { Candidato } from "../models/candidato"

export const capturaFormulario = async (
  formString: string,
  axiosConfig: AxiosRequestConfig
) => {
  let match = formString.match(/<form[\s\S]*?<\/form>/i)
  if (match) {
    const campoIndice = match[0].match(/id="formulario:j_id17:(.)*?col02/gi)
    if (campoIndice) {
      const novosDados = new URLSearchParams({
        publicadorformvalue: ",802,0,0,2,0,1",
        formulario: "formulario",
        autoScroll: "",
        "javax.faces.ViewState": "j_id2",
        [campoIndice[campoIndice.length - 1].replace('id="', "")]: campoIndice[
          campoIndice.length - 1
        ].replace('id="', ""),
      }).toString()

      const respostaFinal = await axios.post<string>(
        "https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0_lista.bbx",
        novosDados,
        axiosConfig
      )

      const novoMatch = respostaFinal.data.match(/<form[\s\S]*?<\/form>/i)
      if (novoMatch) match = novoMatch
      else throw { code: "SEM FORM" }
    }
    return match[0]
  } else return null
}
