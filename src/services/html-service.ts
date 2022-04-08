import axios, { AxiosRequestConfig } from 'axios'
import { AGENTES_COMERCIAL } from '../data/nomes-comercial'
import { AGENTES_TI } from '../data/nomes-ti'
import { Candidato } from '../models/candidato'
import { RespostaCompleta } from '../models/resposta-completa'
import { StatusCompleto } from '../models/status-completo'
import { buscaDados, salvaDados } from './storage-service'
import { editaMensagensFixadas, enviaMensagemAdmin, enviaMensagemAlteracao } from './telegram-service'

export let RESPOSTA_TI: StatusCompleto = {
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
    inconsistentes: 0,
    ultimaAtualizacao: new Date(),
    candidatos: AGENTES_TI
}

export let RESPOSTA_COMERCIAL: StatusCompleto = {
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
    inconsistentes: 0,
    ultimaAtualizacao: new Date(),
    candidatos: AGENTES_COMERCIAL
}

export const iniciarHTMLService = async () => {
    await checaBackups()
    await atualizaTudo()
}

const checaBackups = async () => {
    const dadosSalvosTI = await buscaDados("TI")
    const dadosSalvosComercial = await buscaDados("COMERCIAL")
    if (dadosSalvosTI) {
        RESPOSTA_TI = dadosSalvosTI
    }
    if (dadosSalvosComercial) {
        RESPOSTA_COMERCIAL = dadosSalvosComercial
    }
}

const atualizaTudo = async () => {
    await atualizaSituacao(AGENTES_TI, "TI")
    await atualizaSituacao(AGENTES_COMERCIAL, "COMERCIAL")
    // reinicia atualizações após 60 segundos
    setTimeout(() => {
        atualizaTudo()
    }, 60 * 1000)
}

const atualizaSituacao = async (
    candidatos: Candidato[],
    tipo: "TI" | "COMERCIAL",
    msIntervalo = 300,
    houveAlteracao = false
) => {
    candidatos = candidatos.filter(c => c.situacao != "Empossado" && c.situacao != "Desistente")
    let total = candidatos.length
    console.log(`Consultando ${total} candidatos de ${tipo}...`)
    return new Promise<void>(resolve => {
        const inicio = new Date().getTime()

        let totalIndices = 0
        let indiceCandidato = 0
        let erros: Candidato[] = []

        const intervalo: any = setInterval(async () => {
            const candidato = candidatos[indiceCandidato]
            const resposta = tipo == "TI" ? RESPOSTA_TI : RESPOSTA_COMERCIAL
            const candidatoResposta = resposta.candidatos.find(candidatoAntigo => candidatoAntigo.nome == candidato.nome)
            if (!candidatoResposta) {
                console.log("Candidato não encontrado na listagem:", candidato.nome)
                return false
            }
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
                if (cookies) Cookie = cookies[0].split(";")[0] + ";" // pega apenas JSESSION
                const headers = {
                    Cookie,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
                const axiosConfig: AxiosRequestConfig = {
                    headers,
                    timeout: 5000
                }
                const resposta = await axios.post<string>('https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0.bbx',
                    dados,
                    axiosConfig
                )

                const formulario = await capturaFormulario(candidato, resposta.data, axiosConfig)
                if (formulario) houveAlteracao = alteraSituacaoCandidato(candidatoResposta, formulario, tipo) || houveAlteracao
                else throw { code: "SEM FORM" }
            } catch (error: any) {
                erros.push(candidato)
                console.log(`Erro=> ${candidato.nome} - ${error?.code || error?.err || error}`)
            }

            totalIndices++
            if (totalIndices == total) {
                const fim = new Date().getTime()
                const tempo = (fim - inicio)
                console.log("Total de Erros:", erros.length)
                console.log(`Batch ${tipo} executada em ${tempo} ms.`)

                atualizaRespostas(tipo, houveAlteracao)
                if (!erros.length) {
                    resolve()
                } else {
                    console.log("Corrigindo erros...")
                    resolve(await atualizaSituacao(erros, tipo, msIntervalo + 100, houveAlteracao))
                }
            }
        }, msIntervalo)
    })
}

const capturaFormulario = async (candidato: Candidato, formString: string, axiosConfig: AxiosRequestConfig) => {
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

const atualizaRespostas = (tipo: "TI" | "COMERCIAL", houveAlteracao: boolean) => {
    let resposta: StatusCompleto = tipo == "COMERCIAL" ? RESPOSTA_COMERCIAL : RESPOSTA_TI
    let autorizadas = 0
    let cancelados = 0
    let desistentes = 0
    let emQualificacao = 0
    let empossados = 0
    let expedidas = 0
    let inaptos = 0
    let naoConvocados = 0
    let qualificados = 0
    let ultimaAtualizacao = new Date()

    const candidatosNaoClassificados: Candidato[] = []

    resposta.candidatos.forEach(candidato => {
        const situacao = candidato.situacao.toLowerCase()
        if (situacao.includes("autorizada")) autorizadas++
        else if (situacao.includes("cancelado")) cancelados++
        else if (situacao.includes("qualificacao")) emQualificacao++
        else if (situacao.includes("empossado")) empossados++
        else if (situacao.includes("qualificado")) qualificados++
        else if (situacao.includes("expedida")) expedidas++
        else if (situacao.includes("desistente")) desistentes++
        else if (situacao.includes("inapto")) inaptos++
        else if (situacao.includes("não convocado")) naoConvocados++
        else candidatosNaoClassificados.push(candidato)
    })

    resposta.autorizadas = autorizadas
    resposta.cancelados = cancelados
    resposta.desistentes = desistentes
    resposta.emQualificacao = emQualificacao
    resposta.empossados = empossados
    resposta.expedidas = expedidas
    resposta.inaptos = inaptos
    resposta.naoConvocados = naoConvocados
    resposta.qualificados = qualificados
    resposta.ultimaAtualizacao = ultimaAtualizacao
    resposta.convocados = resposta.candidatos.length - resposta.naoConvocados
    console.log(`Dados ${tipo} atualizados.`)

    if (candidatosNaoClassificados.length) {
        console.log(`Erro=> Candidatos não classificados:`, candidatosNaoClassificados)
        console.log("Total não classificados:", candidatosNaoClassificados.length)
        enviaMensagemAdmin(candidatosNaoClassificados)
    }
    resposta.inconsistentes = candidatosNaoClassificados.length
    resposta.id++

    salvaDados(resposta, tipo)
    if (houveAlteracao) {
        editaMensagensFixadas()
    }
}

const alteraSituacaoCandidato = (candidato: Candidato, formulario: string, tipo: "TI" | "COMERCIAL") => {
    formulario = formulario.replace(/(\n)*(\t)*(\s\s)*/g, "") // remove espaços duplos, tabs e quebras
    const bolds = formulario.match(/<b>[\s\S]*?<\/b>/gi)
    let proximos: number[] = []
    const proximosTexto = formulario.match(/(?<=(º|&ordm;)(\D)*?)((\d)+(?=<))/gi)
    if (proximosTexto) proximos = proximosTexto.map(str => parseInt(str))
    let houveAlteracao = false
    if (bolds) {
        const situacaoCompleta = bolds[2]
            ?.replace("<b>", "")
            ?.replace("</b>", "")
            ?.replace("Situa&ccedil;&atilde;o:", "")
            ?.replace("&atilde;", "ã")
            ?.trim()

        candidato.agenciaSituacao = situacaoCompleta?.match(/(?<=ag[e|ê]ncia )([\w\/\ \.\-])*/gi)?.[0] || null

        // formata data para YYYY-MM-DD
        const arrayDataSituacao = situacaoCompleta?.match(/[0-9\.]+/gi)?.[0]?.split(".")
        if (arrayDataSituacao?.length)
            candidato.dataSituacao = `${arrayDataSituacao?.[2]}-${arrayDataSituacao?.[1]}-${arrayDataSituacao?.[0]}`
        else candidato.dataSituacao = null

        const situacaoAnterior = candidato.situacao
        const novaSituacao = situacaoCompleta
            ?.match(/qualificado|cancelado por prazo|inapto|Convoca(c|ç)(a|ã)o (autorizada|expedida)|em qualifica(c|ç)(a|ã)o|Desistente|n(a|ã)o convocado|Empossado/gi)
            ?.[0] || ""
        if (novaSituacao) {
            candidato.situacao = novaSituacao
            if (situacaoAnterior != novaSituacao) {
                houveAlteracao = true
                enviaMensagemAlteracao(situacaoAnterior, candidato, tipo, proximos)
                // websocketsAbertos.ti.forEach(w => w.send(JSON.stringify(candidato)))
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

export const geraRespostaCompleta = () => {
    const resposta: RespostaCompleta = {
        ti: RESPOSTA_TI,
        comercial: RESPOSTA_COMERCIAL
    }
    return resposta
}