import axios, { AxiosRequestConfig } from "axios"
import { BotConfig } from "../models/bot-config"
import { Candidato } from "../models/candidato"
import { buscaCandidato, listaNomeCandidatos } from "./bd-service"
import { capturaFormulario } from "./html-service"

export const iniciaChecagemCandidatos = async (CONFIG: BotConfig) => {
  console.log("Iniciando checagem de nomes.")
  console.log("Capturando nomes do Banco de Dados...")

  const nomesCandidatos = await listaNomeCandidatos()
  console.log(`${nomesCandidatos.length} nomes capturados.`)
  percorreFilaCandidatos(nomesCandidatos, CONFIG)
}

const percorreFilaCandidatos = async (
  filaCandidatos: Array<Pick<Candidato, "id" | "nome">>,
  CONFIG: BotConfig
) => {
  const totalFila = filaCandidatos.length
  const inicio = new Date()
  const emProcessamento = new Set<Pick<Candidato, "id" | "nome">>()
  const erros = new Set<Pick<Candidato, "id" | "nome">>()

  console.log("Início da checagem:", inicio.toLocaleString())
  console.log(`Consultando ${totalFila} candidatos...`)

  const intervalo: NodeJS.Timeout = setInterval(async () => {
    const candidato = filaCandidatos.shift()
    // finaliza se deu sucesso em todos
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
      await processaErros(erros)
      console.log(`Reiniciando checagem em ${CONFIG.tempoDescansoFila}s`)
      return setTimeout(() => {
        iniciaChecagemCandidatos(CONFIG)
      }, CONFIG.tempoDescansoFila * 1000)
    }
    emProcessamento.add(candidato)
    console.log(`Verificando candidato ${candidato.id}: '${candidato.nome}'`)

    // log parcial
    if (candidato.id != 0 && candidato.id % 100 === 0) {
      console.log("Erros:", erros.size)
      console.log("Em processamento:", emProcessamento.size)
      console.log(
        "Processados:",
        totalFila - (filaCandidatos.length + emProcessamento.size)
      )
      console.log("Restam na fila:", filaCandidatos.length)
    }

    const sucesso = await checaSituacaoCandidato(candidato)
    emProcessamento.delete(candidato)
    if (sucesso) {
      erros.delete(candidato)
    } else {
      erros.add(candidato)
    }
  }, CONFIG.tempoEntreChecagens)
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

async function processaErros(erros: Set<Pick<Candidato, "id" | "nome">>) {
  return new Promise(async (resolve, reject) => {
    const fila = Array.from(erros)
    console.log(`Aguardando o processamento de ${fila.length} erros.`)
    for await (const candidato of fila) {
      console.log(`Verificando candidato ${candidato.id}: '${candidato.nome}'`)
      const sucesso = await checaSituacaoCandidato(candidato)
      if (sucesso) {
        erros.delete(candidato)
      }
    }
    console.log("Erros finalizados.")
    if (erros.size) {
      console.error("Permanecem com erro:", erros)
    }
    resolve(null)
  })
}

const checaSituacaoCandidato = async (
  candidato: Pick<Candidato, "nome" | "id">
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
    console.error(
      `Erro=> ${candidato.nome} - ${error?.code || error?.err || error}`
    )
    return false
  }
  return true
}

const alteraSituacaoCandidato = async (
  idCandidato: number,
  formulario: string
) => {
  const candidato = await buscaCandidato(idCandidato)
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
      candidato.situacao = novaSituacao
      if (situacaoAnterior != novaSituacao) {
        houveAlteracao = true
        // enviaMensagemAlteracao(situacaoAnterior, candidato, tipo, proximos)
        // websocketsAbertos.ti.forEach(w => w.send(JSON.stringify(candidato)))
        console.log(`Alterando situação de ${candidato?.nome}`)
        console.log(`Nova situação: ${novaSituacao}`)
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
