import axios, { AxiosRequestConfig } from 'axios'
import { AGENTES_COMERCIAL } from '../data/nomes-comercial'
import { AGENTES_TI } from '../data/nomes-ti'
import { Candidato } from '../models/candidato'
import { RespostaJSON } from '../models/resposta-json'
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
    inconsistentes: 0,
    ultimaAtualizacao: new Date(),
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
    inconsistentes: 0,
    ultimaAtualizacao: new Date(),
}

export const iniciar = async () => {
    await checaBackups()
    await atualizaTudo()
}

const checaBackups = async () => {
    const dadosSalvosTI = await buscaDados("TI")
    const dadosSalvosComercial = await buscaDados("COMERCIAL")
    if (dadosSalvosTI) {
        if (!dadosSalvosTI.inconsistentes) dadosSalvosTI.inconsistentes = 0
        const { autorizadas,
            cancelados,
            convocados,
            desistentes,
            emQualificacao,
            empossados,
            expedidas,
            id,
            inaptos,
            naoConvocados,
            qualificados,
            inconsistentes,
            ultimaAtualizacao,
            candidatos } = dadosSalvosTI
        RESPOSTA_TI = {
            autorizadas,
            cancelados,
            convocados,
            desistentes,
            emQualificacao,
            empossados,
            expedidas,
            id,
            inaptos,
            naoConvocados,
            qualificados,
            inconsistentes,
            ultimaAtualizacao,
        }
        if (candidatos) AGENTES_TI.splice(0, AGENTES_TI.length, ...candidatos)
    }
    if (dadosSalvosComercial) {
        if (!dadosSalvosComercial.inconsistentes) dadosSalvosComercial.inconsistentes = 0
        const { autorizadas,
            cancelados,
            convocados,
            desistentes,
            emQualificacao,
            empossados,
            expedidas,
            id,
            inaptos,
            naoConvocados,
            qualificados,
            inconsistentes,
            ultimaAtualizacao,
            candidatos } = dadosSalvosComercial
        RESPOSTA_COMERCIAL = {
            autorizadas,
            cancelados,
            convocados,
            desistentes,
            emQualificacao,
            empossados,
            expedidas,
            id,
            inaptos,
            naoConvocados,
            qualificados,
            inconsistentes,
            ultimaAtualizacao,
        }
        if (candidatos) AGENTES_COMERCIAL.splice(0, AGENTES_COMERCIAL.length, ...candidatos)
    }
}

const atualizaTudo = async () => {
    await atualizaSituacao(AGENTES_TI, "TI")
    await atualizaSituacao(AGENTES_COMERCIAL, "COMERCIAL")
    // reinicia atualizações após 60 segundos
    setTimeout(() => {
        atualizaTudo()
    }, 60 * 1000);
}

const atualizaSituacao = async (candidatos: Candidato[], tipo: "TI" | "COMERCIAL", msIntervalo = 250) => {
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

                const situacaoCompleta = await capturaSituacaoCompleta(candidato, resposta.data, axiosConfig)
                if (situacaoCompleta) alteraSituacaoCandidato(candidato, situacaoCompleta)
                else throw { code: "SEM FORM" }
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
    let resposta: RespostaJSON = tipo == "COMERCIAL" ? RESPOSTA_COMERCIAL : RESPOSTA_TI
    let candidatos: Candidato[] = tipo == "COMERCIAL" ? AGENTES_COMERCIAL : AGENTES_TI
    resposta.autorizadas = 0
    resposta.cancelados = 0
    resposta.convocados = 0
    resposta.desistentes = 0
    resposta.emQualificacao = 0
    resposta.empossados = 0
    resposta.expedidas = 0
    resposta.inaptos = 0
    resposta.naoConvocados = 0
    resposta.qualificados = 0
    resposta.ultimaAtualizacao = new Date()

    const candidatosNaoClassificados: Candidato[] = []

    candidatos.forEach(candidato => {
        if (candidato.situacao.includes("autorizada")) resposta.autorizadas++
        else if (candidato.situacao.includes("Cancelado")) resposta.cancelados++
        else if (candidato.situacao.includes("qualificacao")) resposta.emQualificacao++
        else if (candidato.situacao.includes("Empossado")) resposta.empossados++
        else if (candidato.situacao.includes("Qualificado")) resposta.qualificados++
        else if (candidato.situacao.includes("expedida")) resposta.expedidas++
        else if (candidato.situacao.includes("Desistente")) resposta.desistentes++
        else if (candidato.situacao.includes("Inapto")) resposta.inaptos++
        else if (candidato.situacao.includes("Não Convocado")) resposta.naoConvocados++
        else candidatosNaoClassificados.push(candidato)
        resposta.convocados = candidatos.length - resposta.naoConvocados
    })

    console.log(`Dados ${tipo} atualizados:`, resposta)

    if (candidatosNaoClassificados.length) {
        resposta.inconsistentes = candidatosNaoClassificados.length
        console.log(`Candidatos ${tipo} não classificados:`, candidatosNaoClassificados)
    }

    if (tipo == "TI") {
        RESPOSTA_TI.id++
    } else {
        RESPOSTA_COMERCIAL.id++
    }

    salvaDados(resposta, tipo)
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