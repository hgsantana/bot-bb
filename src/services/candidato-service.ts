import axios, { AxiosRequestConfig } from "axios"
import { BotConfig } from "../models/bot-config"
import { Candidato } from "../models/candidato"
import { RespostaResumida } from "../models/resposta-resumida"
import { Situacao } from "../models/situacao"
import { AreaCandidato } from "../models/tipo-candidato"
import {
  atualizaSituacao,
  buscaCandidatoPorId,
  buscaCandidatosPorIds,
  listaCandidatos,
  listaNomeCandidatos,
} from "./bd-service"
import { capturaFormulario } from "./html-service"
import { enviaMensagemAdmin, enviaMensagemAlteracao } from "./telegram-service"

export const CANDIDATOS_ERRO = new Set<Pick<Candidato, 'id' | 'nome'>>()

export const iniciaChecagemCandidatos = async (CONFIG: BotConfig) => {
  console.log("Iniciando checagem de nomes.")

  console.log("Capturando nomes do Banco de Dados...")
  try {
    const filaCandidatos = await listaNomeCandidatos()

    const totalFila = filaCandidatos.length
    const inicio = new Date()
    const emProcessamento = new Set<Pick<Candidato, "id" | "nome">>()

    console.log(`${filaCandidatos.length} nomes capturados.`)
    console.log("Início da checagem:", inicio.toLocaleString())
    console.log(`Consultando ${totalFila} candidatos...`)

    const intervalo: NodeJS.Timeout = setInterval(async () => {
      const candidato = filaCandidatos.shift()

      // Verifica o fim da fila
      if (candidato) {
        emProcessamento.add(candidato)
      } else {
        const fim = new Date()
        clearInterval(intervalo)
        console.log("Fim da fila:", fim.toLocaleString())
        console.log(
          "Tempo transcorrido (s):",
          (fim.getTime() - inicio.getTime()) / 1000
        )
        await aguardaProcessamento(emProcessamento)
        await processaErros()
        console.log(`Reiniciando checagem em ${CONFIG.tempoDescansoFila}s`)
        return setTimeout(() => {
          iniciaChecagemCandidatos(CONFIG)
        }, CONFIG.tempoDescansoFila * 1000)
      }
      emProcessamento.add(candidato)

      // log parcial
      if (candidato.id != 0 && candidato.id % 100 === 0) {
        console.log("Erros:", CANDIDATOS_ERRO.size)
        console.log("Em processamento:", emProcessamento.size)
        console.log(
          "Processados:",
          totalFila - (filaCandidatos.length + emProcessamento.size)
        )
        console.log("Restam na fila:", filaCandidatos.length)
      }

      // Verifica situação do candidato
      const sucesso = await checaSituacaoCandidato(candidato)
      emProcessamento.delete(candidato)
      if (sucesso) {
        CANDIDATOS_ERRO.delete(candidato)
      } else {
        CANDIDATOS_ERRO.add(candidato)
      }
    }, CONFIG.tempoEntreChecagens)
  } catch (error) {
    console.error(error)
  }
}

async function aguardaProcessamento(
  emProcessamento: Set<Pick<Candidato, "id" | "nome">>
) {
  return new Promise((resolve, reject) => {
    console.log(
      `Aguardando o processamento de ${emProcessamento.size} candidatos.`
    )
    const intervaloProcessamento = setInterval(() => {
      if (emProcessamento.size == 0) {
        clearInterval(intervaloProcessamento)
        console.log(`Processamentos finalizados.`)
        resolve(true)
      }
    }, 2 * 1000) // 2s entre verificações
  })
}

async function processaErros() {
  const inicioErros = new Date()
  return new Promise(async (resolve, reject) => {
    const fila = Array.from(CANDIDATOS_ERRO)
    console.log(`Aguardando o processamento de ${fila.length} erros.`)
    for await (const candidato of fila) {
      console.log(`Verificando erro ${candidato.id}: '${candidato.nome}'`)
      const sucesso = await checaSituacaoCandidato(candidato)
      if (sucesso) {
        CANDIDATOS_ERRO.delete(candidato)
      }
    }
    if (CANDIDATOS_ERRO.size) {
      console.error("Permanecem com erro:", CANDIDATOS_ERRO)
      await enviaMensagemAdmin(CANDIDATOS_ERRO.size)
    }
    const fimErros = new Date()
    console.log(
      `Erros finalizados em ${(fimErros.getTime() - inicioErros.getTime()) / 1000
      }s`
    )
    resolve(null)
  })
}

const checaSituacaoCandidato = async (
  candidato: Pick<Candidato, "nome" | "id" | 'erro'>
) => {
  const dados = new URLSearchParams({
    formulario: "formulario",
    publicadorformvalue: ",802,0,0,2,0,1",
    "formulario:nomePesquisa": candidato.nome,
    "formulario:cpfPesquisa": "",
    "formulario:j_id16": "Confirmar",
    "javax.faces.ViewState": "j_id1",
  }).toString()

  try {
    const getCookies = await axios.get(
      "https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0.bbx"
    )
    if (!getCookies) throw { code: "FALHA GET COOKIE" }
    const cookies = getCookies.headers["set-cookie"]
    let Cookie = ""
    if (cookies) Cookie = cookies[0].split(";")[0] + ";" // pega apenas JSESSION
    const headers = {
      Cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    }
    const axiosConfig: AxiosRequestConfig = {
      headers,
      timeout: 5 * 1000, // 5s para cancelar a requisição
    }
    const resposta = await axios.post<string>(
      "https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0.bbx",
      dados,
      axiosConfig
    )

    const formulario = await capturaFormulario(resposta.data, axiosConfig)

    if (formulario) await alteraSituacaoCandidato(candidato.id, formulario)
    else throw { code: "SEM FORM" }
  } catch (error: any) {
    const erro = `${error?.code || error?.err || error}`
    console.error(
      `Erro=> ${candidato.nome} - ${erro}`
    )
    candidato.erro = erro
    return false
  }
  return true
}

const alteraSituacaoCandidato = async (
  idCandidato: number,
  formulario: string
) => {
  const candidato = await buscaCandidatoPorId(idCandidato)
  if (!candidato) {
    throw "Candidado não localizado."
  }

  formulario = formulario.replace(/(\n)*(\t)*(\s\s)*/g, "") // remove espaços duplos, tabs e quebras
  const bolds = formulario.match(/<b>[\s\S]*?<\/b>/gi)

  let proximos: number[] = []
  const proximosTexto = formulario.match(/(?<=(º|&ordm;)(\D)*?)((\d)+(?=<))/gi)
  if (proximosTexto) proximos = proximosTexto.map((str) => parseInt(str))
  let houveAlteracao = false
  if (bolds) {
    const situacaoCompleta = bolds[2]
      ?.replace("<b>", "")
      ?.replace("</b>", "")
      ?.replace("Situa&ccedil;&atilde;o:", "")
      ?.replace("&atilde;", "ã")
      ?.trim()

    candidato.agenciaSituacao =
      situacaoCompleta?.match(/(?<=ag[e|ê]ncia )([\w\/\ \.\-])*/gi)?.[0] || ""

    // formata data para YYYY-MM-DD
    const arrayDataSituacao = situacaoCompleta
      ?.match(/[0-9\.]+/gi)?.[0]
      ?.split(".")
    if (arrayDataSituacao?.length)
      candidato.dataSituacao = `${arrayDataSituacao?.[2]}-${arrayDataSituacao?.[1]}-${arrayDataSituacao?.[0]}`
    else candidato.dataSituacao = ""

    const situacaoAnterior = candidato.situacao
    const novaSituacao =
      situacaoCompleta?.match(
        /qualificado|cancelado por prazo|inapto|Convoca(c|ç)(a|ã)o (autorizada|expedida)|em qualifica(c|ç)(a|ã)o|Desistente|n(a|ã)o convocado|Empossado/gi
      )?.[0] || ""
    if (novaSituacao) {
      switch (novaSituacao) {
        case Situacao.AUTORIZADA:
          candidato.situacao = Situacao.AUTORIZADA
          break
        case Situacao.CANCELADO:
          candidato.situacao = Situacao.CANCELADO
          break
        case Situacao.DESISTENTE:
          candidato.situacao = Situacao.DESISTENTE
          break
        case Situacao.EMPOSSADO:
          candidato.situacao = Situacao.EMPOSSADO
          break
        case Situacao.EM_QUALIFICACAO:
          candidato.situacao = Situacao.EM_QUALIFICACAO
          break
        case Situacao.EXPEDIDA:
          candidato.situacao = Situacao.EXPEDIDA
          break
        case Situacao.INAPTO:
          candidato.situacao = Situacao.INAPTO
          break
        case Situacao.NAO_CONVOCADO:
          candidato.situacao = Situacao.NAO_CONVOCADO
          break
        case Situacao.QUALIFICADO:
          candidato.situacao = Situacao.QUALIFICADO
          break
      }
      if (situacaoAnterior != novaSituacao) {
        houveAlteracao = true
        console.log(
          `Nova Situação de '${candidato?.nome}': ${situacaoAnterior} > ${novaSituacao}`
        )
        await atualizaSituacao(candidato)
        await enviaMensagemAlteracao(situacaoAnterior, candidato)
      }
    } else {
      console.log("Erro=> Regex não capturou situação:", situacaoCompleta)
      throw { code: "FALHA REGEX" }
    }
  } else {
    console.log(`Erro=> ${candidato.nome} - SEM SITUAÇÃO`)
  }
  return houveAlteracao
}

export async function compilaRelatorio() {
  const relatorio: RespostaResumida = {
    comercial: {
      autorizadas: 0,
      cancelados: 0,
      convocados: 0,
      desistentes: 0,
      empossados: 0,
      emQualificacao: 0,
      expedidas: 0,
      id: 0,
      inaptos: 0,
      inconsistentes: 0,
      naoConvocados: 0,
      qualificados: 0,
    },
    ti: {
      autorizadas: 0,
      cancelados: 0,
      convocados: 0,
      desistentes: 0,
      empossados: 0,
      emQualificacao: 0,
      expedidas: 0,
      id: 0,
      inaptos: 0,
      inconsistentes: 0,
      naoConvocados: 0,
      qualificados: 0,
    },
    ultimaAtualizacao: new Date(),
  }

  const candidatos = await listaCandidatos()

  candidatos.forEach((candidato) => {
    switch (candidato.situacao) {
      case Situacao.AUTORIZADA:
        if (candidato.area == AreaCandidato.COMERCIAL) {
          relatorio.comercial.autorizadas += 1
        } else {
          relatorio.ti.autorizadas += 1
        }
        break
      case Situacao.CANCELADO:
        if (candidato.area == AreaCandidato.COMERCIAL) {
          relatorio.comercial.cancelados += 1
        } else {
          relatorio.ti.cancelados += 1
        }
        break
      case Situacao.DESISTENTE:
        if (candidato.area == AreaCandidato.COMERCIAL) {
          relatorio.comercial.desistentes += 1
        } else {
          relatorio.ti.desistentes += 1
        }
        break
      case Situacao.EMPOSSADO:
        if (candidato.area == AreaCandidato.COMERCIAL) {
          relatorio.comercial.empossados += 1
        } else {
          relatorio.ti.empossados += 1
        }
        break
      case Situacao.EM_QUALIFICACAO:
        if (candidato.area == AreaCandidato.COMERCIAL) {
          relatorio.comercial.emQualificacao += 1
        } else {
          relatorio.ti.emQualificacao += 1
        }
        break
      case Situacao.EXPEDIDA:
        if (candidato.area == AreaCandidato.COMERCIAL) {
          relatorio.comercial.expedidas += 1
        } else {
          relatorio.ti.expedidas += 1
        }
        break
      case Situacao.INAPTO:
        if (candidato.area == AreaCandidato.COMERCIAL) {
          relatorio.comercial.inaptos += 1
        } else {
          relatorio.ti.inaptos += 1
        }
        break
      case Situacao.NAO_CONVOCADO:
        if (candidato.area == AreaCandidato.COMERCIAL) {
          relatorio.comercial.naoConvocados += 1
        } else {
          relatorio.ti.naoConvocados += 1
        }
        break
      case Situacao.QUALIFICADO:
        if (candidato.area == AreaCandidato.COMERCIAL) {
          relatorio.comercial.qualificados += 1
        } else {
          relatorio.ti.qualificados += 1
        }
        break
    }
  })

  relatorio.comercial.convocados =
    candidatos.filter((c) => c.area == AreaCandidato.COMERCIAL).length -
    relatorio.comercial.naoConvocados

  relatorio.ti.convocados =
    candidatos.filter((c) => c.area == AreaCandidato.TI).length -
    relatorio.ti.naoConvocados

  return relatorio
}
