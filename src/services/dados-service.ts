import axios, { AxiosRequestConfig } from 'axios'
import { AGENTES_COMERCIAL } from '../data/nomes-comercial'
import { AGENTES_TI } from '../data/nomes-ti'
import { Candidato } from '../models/candidato'
import { MacroRegiao } from '../models/macro-regiao'
import { RespostaAlteracoes, RespostaJSON } from '../models/resposta-json'
import { buscaDados, salvaDados } from './storage-service'

export let RESPOSTA_TI: RespostaJSON = {
    id: 1000,
    empossados: 0,
    cancelados: 0,
    desistentes: 0,
    inaptos: 0,
    qualificados: 0,
    emQualificacao: 0,
    autorizadas: 0,
    expedidas: 0,
    naoConvocados: 0,
    convocados: 0,
    ultimaAtualizacao: new Date().toISOString().substring(0, 19).replace("T", " "),
    macroRegioes: AGENTES_TI
}

export let RESPOSTA_COMERCIAL: RespostaJSON = {
    id: 1000,
    empossados: 0,
    cancelados: 0,
    desistentes: 0,
    inaptos: 0,
    qualificados: 0,
    emQualificacao: 0,
    autorizadas: 0,
    expedidas: 0,
    naoConvocados: 0,
    convocados: 0,
    ultimaAtualizacao: new Date().toISOString().substring(0, 19).replace("T", " "),
    macroRegioes: AGENTES_COMERCIAL
}

export const ALTERACOES_TI: RespostaAlteracoes = {
    id: 1000,
    candidatosAlterados: [],
    autorizadas: [],
    cancelados: [],
    convocados: [],
    desistentes: [],
    emQualificacao: [],
    empossados: [],
    expedidas: [],
    inaptos: [],
    naoConvocados: [],
    qualificados: [],
    ultimaAtualizacao: new Date().toISOString().substring(0, 19).replace("T", " ")
}

export const ALTERACOES_COMERCIAL: RespostaAlteracoes = {
    id: 1000,
    autorizadas: [],
    cancelados: [],
    convocados: [],
    desistentes: [],
    emQualificacao: [],
    empossados: [],
    expedidas: [],
    inaptos: [],
    naoConvocados: [],
    qualificados: [],
    ultimaAtualizacao: new Date().toISOString().substring(0, 19).replace("T", " "),
    candidatosAlterados: [],
}

let ALTERADOS_TI: Candidato[] = []
let ALTERADOS_COMERCIAL: Candidato[] = []

export const iniciar = async () => {
    RESPOSTA_TI = await buscaDados("TI") || RESPOSTA_TI
    ALTERACOES_TI.id = RESPOSTA_TI.id

    RESPOSTA_COMERCIAL = await buscaDados("COMERCIAL") || RESPOSTA_COMERCIAL
    ALTERACOES_COMERCIAL.id = RESPOSTA_COMERCIAL.id

    atualizaAlteracoes("COMERCIAL", {})
    atualizaAlteracoes("TI", {})
    atualizaTudo({ dados_comercial: RESPOSTA_COMERCIAL.macroRegioes, dados_ti: RESPOSTA_TI.macroRegioes })
}

const atualizaTudo = async ({ dados_ti, dados_comercial }: { dados_ti: MacroRegiao[], dados_comercial: MacroRegiao[] }) => {
    let candidatos_TI: Candidato[] = []
    let candidatos_COMERCIAL: Candidato[] = []
    dados_ti.forEach(macro => macro.microRegioes.forEach(micro => candidatos_TI = candidatos_TI.concat(micro.candidatos)))
    dados_comercial.forEach(macro => macro.microRegioes.forEach(micro => candidatos_COMERCIAL = candidatos_COMERCIAL.concat(micro.candidatos)))
    await atualizaSituacao(candidatos_TI, "TI")
    await atualizaSituacao(candidatos_COMERCIAL, "COMERCIAL")
    setTimeout(() => {
        atualizaTudo({ dados_comercial, dados_ti })
    }, 1000 * 60 * 60);
}

const atualizaSituacao = async (candidatos: Candidato[], tipo: "TI" | "COMERCIAL", msIntervalo = 500) => {
    candidatos = candidatos.filter(c => c.situacao != "Empossado")
    let total = candidatos.length
    console.log(`Consultando ${total} candidatos de ${tipo}...`)
    return new Promise<void>(resolve => {
        const inicio = new Date().getTime()

        let totalIndices = 0
        let indiceCandidato = 0
        let erros: Candidato[] = []

        const intervalo: any = setInterval(async () => {
            const candidato = candidatos[indiceCandidato]
            const dados = new URLSearchParams({
                "formulario": "formulario",
                "publicadorformvalue": ",802,0,0,2,0,1",
                "formulario:nomePesquisa": candidato.nome,
                "formulario:cpfPesquisa": "",
                "formulario:j_id16": "Confirmar",
                "javax.faces.ViewState": "j_id1",
            }).toString()

            const ultimoCandidato = indiceCandidato == candidatos.length - 1
            if (ultimoCandidato) clearInterval(intervalo)
            else indiceCandidato++

            try {
                const getCookies = await axios.get('https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0.bbx')
                const cookies = getCookies.headers['set-cookie']
                let Cookie = ""
                if (cookies) Cookie = cookies[0]

                const headers = {
                    Cookie,
                    "Content-Type": "application/x-www-form-urlencoded"
                }

                const axiosConfig: AxiosRequestConfig = {
                    headers,
                    timeout: 10000
                }

                const resposta = await axios.post<string>('https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0.bbx',
                    dados,
                    axiosConfig
                )

                const situacaoAtual = candidato.situacao.toString()
                const situacaoCompleta = await capturaSituacaoCompleta(candidato, resposta.data, axiosConfig)
                if (situacaoCompleta) alteraSituacaoCandidato(candidato, situacaoCompleta)
                else throw { code: "SEM FORM" }
                if (candidato.situacao !== situacaoAtual) {
                    if (tipo == "TI") ALTERADOS_TI.push(candidato)
                    else ALTERADOS_COMERCIAL.push(candidato)
                }
            } catch (error: any) {
                erros.push(candidato)
                console.log(`Erro: ${candidato.nome} - ${error?.code || error?.err || error}`)
            }

            totalIndices++
            if (totalIndices == total) {
                const fim = new Date().getTime()
                const tempo = (fim - inicio)
                console.log("Total de Erros:", erros.length)
                console.log(`Batch ${tipo} executada em ${tempo} ms.`)

                if (erros.length) {
                    console.log("Corrigindo erros...");
                    resolve(await atualizaSituacao(erros, tipo, msIntervalo + 100))
                } else {
                    atualizaJSON(tipo)
                    resolve()
                }
            }
        }, msIntervalo)
    })
}

const capturaSituacaoCompleta = async (candidato: Candidato, formString: string, axiosConfig: AxiosRequestConfig) => {
    let match = formString.match(/<form[\s\S]*?<\/form>/i)
    if (match) {
        const campoIndice = match[0].match(/id="formulario:j_id17:(.)*?col02/gi)
        if (campoIndice) {
            candidato.quantidadeCadastros = campoIndice.length

            const novosDados = new URLSearchParams({
                publicadorformvalue: ",802,0,0,2,0,1",
                formulario: "formulario",
                autoScroll: "",
                "javax.faces.ViewState": "j_id2",
                [campoIndice[campoIndice.length - 1].replace('id="', '')]: campoIndice[campoIndice.length - 1].replace('id="', '')
            }).toString()

            const respostaFinal = await axios.post<string>('https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0_lista.bbx',
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

const atualizaJSON = (tipo: "TI" | "COMERCIAL") => {
    let json: RespostaJSON = tipo == "COMERCIAL" ? RESPOSTA_COMERCIAL : RESPOSTA_TI
    json.autorizadas = 0
    json.cancelados = 0
    json.convocados = 0
    json.desistentes = 0
    json.emQualificacao = 0
    json.empossados = 0
    json.expedidas = 0
    json.inaptos = 0
    json.naoConvocados = 0
    json.qualificados = 0
    json.ultimaAtualizacao = new Date().toISOString().substring(0, 19).replace("T", " ")

    const candidatosNaoClassificados: Candidato[] = []

    json.macroRegioes.forEach(macro => {
        macro.microRegioes.forEach(micro => {
            micro.candidatos.forEach(candidato => {
                if (candidato.situacao.includes("autorizada")) json.autorizadas++
                else if (candidato.situacao.includes("Cancelado")) json.cancelados++
                else if (candidato.situacao.includes("qualificacao")) json.emQualificacao++
                else if (candidato.situacao.includes("Empossado")) json.empossados++
                else if (candidato.situacao.includes("Qualificado")) json.qualificados++
                else if (candidato.situacao.includes("expedida")) json.expedidas++
                else if (candidato.situacao.includes("Desistente")) json.desistentes++
                else if (candidato.situacao.includes("Inapto")) json.inaptos++
                else if (candidato.situacao.includes("Não Convocado")) json.naoConvocados++
                else candidatosNaoClassificados.push(candidato)
                json.convocados =
                    + json.autorizadas
                    + json.cancelados
                    + json.emQualificacao
                    + json.empossados
                    + json.qualificados
                    + json.expedidas
                    + json.desistentes
                    + json.inaptos
            })
        })
    })

    const { expedidas, autorizadas, cancelados, convocados, desistentes, inaptos, emQualificacao, empossados, naoConvocados, qualificados } = json
    console.log(`Dados ${tipo} atualizados:`, { expedidas, autorizadas, cancelados, desistentes, inaptos, emQualificacao, qualificados, empossados, convocados, naoConvocados, total: convocados + naoConvocados })

    if (candidatosNaoClassificados.length) {
        console.log(`Candidatos ${tipo} não classificados:`, candidatosNaoClassificados)
    }

    if (tipo == "TI") {
        ALTERACOES_TI.id++
        RESPOSTA_TI.id++
        atualizaAlteracoes(tipo, { json, candidatosAlterados: ALTERADOS_TI })
    } else {
        ALTERACOES_COMERCIAL.id++
        RESPOSTA_COMERCIAL.id++
        atualizaAlteracoes(tipo, { json, candidatosAlterados: ALTERADOS_COMERCIAL })
    }

    salvaDados(json, tipo)
}

const alteraSituacaoCandidato = (candidato: Candidato, formulario: string) => {
    const bolds = formulario.match(/<b>[\s\S]*?<\/b>/gi)
    if (bolds) {
        const situacaoCompleta = bolds[2]
            ?.replace("<b>", "")
            ?.replace("</b>", "")
            ?.replace("Situa&ccedil;&atilde;o:", "")
            ?.replace("&atilde;", "ã")
            ?.trim()

        candidato.agenciaSituacao = situacaoCompleta?.match(/(?<=ag[e|ê]ncia )([\w\/\ \.])*/gi)?.[0] || "None"

        const arrayDataSituacao = situacaoCompleta?.match(/[0-9\.]+/gi)?.[0]?.split(".")
        if (arrayDataSituacao?.length)
            candidato.dataSituacao = `${arrayDataSituacao?.[2]}-${arrayDataSituacao?.[1]}-${arrayDataSituacao?.[0]}`
        else candidato.dataSituacao = "None"

        candidato.situacao = situacaoCompleta?.match(/qualificado|cancelado por prazo|inapto|Convoca(c|ç)(a|ã)o (autorizada|expedida)|em qualifica(c|ç)(a|ã)o|Desistente|n(a|ã)o convocado|Empossado/gi)?.[0] || ""
        if (!candidato.situacao) throw { code: "SEM SITUAÇÃO" }
    } else {
        throw { code: "SEM SITUAÇÃO" }
    }
}

const atualizaAlteracoes = (tipo: "TI" | "COMERCIAL", { json, candidatosAlterados }: { json?: RespostaJSON, candidatosAlterados?: Candidato[] }) => {
    if (tipo == "TI") {
        if (json) {
            ALTERACOES_TI.autorizadas[0] = ALTERACOES_TI.autorizadas[1]
            ALTERACOES_TI.cancelados[0] = ALTERACOES_TI.cancelados[1]
            ALTERACOES_TI.convocados[0] = ALTERACOES_TI.convocados[1]
            ALTERACOES_TI.desistentes[0] = ALTERACOES_TI.desistentes[1]
            ALTERACOES_TI.emQualificacao[0] = ALTERACOES_TI.emQualificacao[1]
            ALTERACOES_TI.empossados[0] = ALTERACOES_TI.empossados[1]
            ALTERACOES_TI.expedidas[0] = ALTERACOES_TI.expedidas[1]
            ALTERACOES_TI.inaptos[0] = ALTERACOES_TI.inaptos[1]
            ALTERACOES_TI.naoConvocados[0] = ALTERACOES_TI.naoConvocados[1]
            ALTERACOES_TI.qualificados[0] = ALTERACOES_TI.qualificados[1]

            ALTERACOES_TI.autorizadas[1] = json.autorizadas
            ALTERACOES_TI.cancelados[1] = json.cancelados
            ALTERACOES_TI.convocados[1] = json.convocados
            ALTERACOES_TI.desistentes[1] = json.desistentes
            ALTERACOES_TI.emQualificacao[1] = json.emQualificacao
            ALTERACOES_TI.empossados[1] = json.empossados
            ALTERACOES_TI.expedidas[1] = json.expedidas
            ALTERACOES_TI.inaptos[1] = json.inaptos
            ALTERACOES_TI.naoConvocados[1] = json.naoConvocados
            ALTERACOES_TI.qualificados[1] = json.qualificados
            ALTERACOES_TI.ultimaAtualizacao = new Date().toISOString().substring(0, 19).replace("T", " ")
            ALTERACOES_TI.candidatosAlterados = candidatosAlterados || ALTERACOES_TI.candidatosAlterados
        } else {
            ALTERACOES_TI.autorizadas = [RESPOSTA_TI.autorizadas, RESPOSTA_TI.autorizadas]
            ALTERACOES_TI.cancelados = [RESPOSTA_TI.cancelados, RESPOSTA_TI.cancelados]
            ALTERACOES_TI.convocados = [RESPOSTA_TI.convocados, RESPOSTA_TI.convocados]
            ALTERACOES_TI.desistentes = [RESPOSTA_TI.desistentes, RESPOSTA_TI.desistentes]
            ALTERACOES_TI.emQualificacao = [RESPOSTA_TI.emQualificacao, RESPOSTA_TI.emQualificacao]
            ALTERACOES_TI.empossados = [RESPOSTA_TI.empossados, RESPOSTA_TI.empossados]
            ALTERACOES_TI.expedidas = [RESPOSTA_TI.expedidas, RESPOSTA_TI.expedidas]
            ALTERACOES_TI.inaptos = [RESPOSTA_TI.inaptos, RESPOSTA_TI.inaptos]
            ALTERACOES_TI.naoConvocados = [RESPOSTA_TI.naoConvocados, RESPOSTA_TI.naoConvocados]
            ALTERACOES_TI.qualificados = [RESPOSTA_TI.qualificados, RESPOSTA_TI.qualificados]
            ALTERACOES_TI.ultimaAtualizacao = new Date().toISOString().substring(0, 19).replace("T", " ")
        }
        ALTERADOS_TI = []
    } else {
        if (json) {
            ALTERACOES_COMERCIAL.autorizadas[0] = ALTERACOES_COMERCIAL.autorizadas[1]
            ALTERACOES_COMERCIAL.cancelados[0] = ALTERACOES_COMERCIAL.cancelados[1]
            ALTERACOES_COMERCIAL.convocados[0] = ALTERACOES_COMERCIAL.convocados[1]
            ALTERACOES_COMERCIAL.desistentes[0] = ALTERACOES_COMERCIAL.desistentes[1]
            ALTERACOES_COMERCIAL.emQualificacao[0] = ALTERACOES_COMERCIAL.emQualificacao[1]
            ALTERACOES_COMERCIAL.empossados[0] = ALTERACOES_COMERCIAL.empossados[1]
            ALTERACOES_COMERCIAL.expedidas[0] = ALTERACOES_COMERCIAL.expedidas[1]
            ALTERACOES_COMERCIAL.inaptos[0] = ALTERACOES_COMERCIAL.inaptos[1]
            ALTERACOES_COMERCIAL.naoConvocados[0] = ALTERACOES_COMERCIAL.naoConvocados[1]
            ALTERACOES_COMERCIAL.qualificados[0] = ALTERACOES_COMERCIAL.qualificados[1]

            ALTERACOES_COMERCIAL.autorizadas[1] = json.autorizadas
            ALTERACOES_COMERCIAL.cancelados[1] = json.cancelados
            ALTERACOES_COMERCIAL.convocados[1] = json.convocados
            ALTERACOES_COMERCIAL.desistentes[1] = json.desistentes
            ALTERACOES_COMERCIAL.emQualificacao[1] = json.emQualificacao
            ALTERACOES_COMERCIAL.empossados[1] = json.empossados
            ALTERACOES_COMERCIAL.expedidas[1] = json.expedidas
            ALTERACOES_COMERCIAL.inaptos[1] = json.inaptos
            ALTERACOES_COMERCIAL.naoConvocados[1] = json.naoConvocados
            ALTERACOES_COMERCIAL.qualificados[1] = json.qualificados
            ALTERACOES_COMERCIAL.ultimaAtualizacao = new Date().toISOString().substring(0, 19).replace("T", " ")
            ALTERACOES_COMERCIAL.candidatosAlterados = candidatosAlterados || ALTERACOES_COMERCIAL.candidatosAlterados
        } else {
            ALTERACOES_COMERCIAL.autorizadas = [RESPOSTA_COMERCIAL.autorizadas, RESPOSTA_COMERCIAL.autorizadas]
            ALTERACOES_COMERCIAL.cancelados = [RESPOSTA_COMERCIAL.cancelados, RESPOSTA_COMERCIAL.cancelados]
            ALTERACOES_COMERCIAL.convocados = [RESPOSTA_COMERCIAL.convocados, RESPOSTA_COMERCIAL.convocados]
            ALTERACOES_COMERCIAL.desistentes = [RESPOSTA_COMERCIAL.desistentes, RESPOSTA_COMERCIAL.desistentes]
            ALTERACOES_COMERCIAL.emQualificacao = [RESPOSTA_COMERCIAL.emQualificacao, RESPOSTA_COMERCIAL.emQualificacao]
            ALTERACOES_COMERCIAL.empossados = [RESPOSTA_COMERCIAL.empossados, RESPOSTA_COMERCIAL.empossados]
            ALTERACOES_COMERCIAL.expedidas = [RESPOSTA_COMERCIAL.expedidas, RESPOSTA_COMERCIAL.expedidas]
            ALTERACOES_COMERCIAL.inaptos = [RESPOSTA_COMERCIAL.inaptos, RESPOSTA_COMERCIAL.inaptos]
            ALTERACOES_COMERCIAL.naoConvocados = [RESPOSTA_COMERCIAL.naoConvocados, RESPOSTA_COMERCIAL.naoConvocados]
            ALTERACOES_COMERCIAL.qualificados = [RESPOSTA_COMERCIAL.qualificados, RESPOSTA_COMERCIAL.qualificados]
            ALTERACOES_COMERCIAL.ultimaAtualizacao = new Date().toISOString().substring(0, 19).replace("T", " ")
        }
        ALTERADOS_COMERCIAL = []
    }
}
