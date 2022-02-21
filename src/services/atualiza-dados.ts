import axios, { AxiosRequestConfig } from 'axios'
import { AGENTES_COMERCIAL, AGENTES_TI } from '../data/nomes'
import { Candidato } from '../models/candidato'
import { RespostaJSON } from '../models/resposta-json'

export let RESPOSTA_TI: RespostaJSON = {
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
    ultimaAtualizacao: new Date(),
    listagem: AGENTES_TI.map(nome => {
        return {
            nome: nome,
            situacao: ""
        }
    })
}

export let RESPOSTA_COMERCIAL: RespostaJSON = {
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
    ultimaAtualizacao: new Date(),
    listagem: AGENTES_COMERCIAL.map(nome => {
        return {
            nome: nome,
            situacao: ""
        }
    })
}

export const atualizaTudo = async () => {
    await atualizaDados(RESPOSTA_TI.listagem, "TI")
    await atualizaDados(RESPOSTA_COMERCIAL.listagem, "COMERCIAL")
    setTimeout(() => {
        atualizaTudo()
    }, 1000 * 60 * 60);
}

const atualizaDados = async (listagem: Candidato[], tipo: "TI" | "COMERCIAL", msIntervalo = 100) => {
    console.log(`Consultando ${listagem.length} registros de ${tipo}...`)
    return new Promise<void>(resolve => {
        const colecaoIndices = new Set()
        const inicio = new Date().getTime()
        let erros: Candidato[] = []
        let indice = 0
        const intervalo: any = setInterval(async () => {
            if (indice >= listagem.length) return clearInterval(intervalo)
            const dados = new URLSearchParams({
                "formulario": "formulario",
                "publicadorformvalue": ",802,0,0,2,0,1",
                "formulario:nomePesquisa": listagem[indice].nome,
                "formulario:cpfPesquisa": "",
                "formulario:j_id16": "Confirmar",
                "javax.faces.ViewState": "j_id1",
            }).toString()
            const indiceAtual = indice
            indice++

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
                }
                const resposta = await axios.post<string>('https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0.bbx',
                    dados,
                    axiosConfig
                )
                const match = resposta.data.match(/<form[\s\S]*?<\/form>/i)
                if (match) {
                    const campoIndice = match[0].match(/id="formulario:j_id17:(.)*?col02/gi)
                    if (campoIndice) {
                        const novosDados = new URLSearchParams({
                            publicadorformvalue: ",802,0,0,2,0,1",
                            formulario: "formulario",
                            autoScroll: "",
                            "javax.faces.ViewState": "j_id2",
                            [campoIndice[campoIndice.length - 1].replace('id="', '')]: campoIndice[campoIndice.length - 1].replace('id="', '')
                        }).toString()
                        const respostaFinal = await axios.post<string>('https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0_lista.bbx',
                            novosDados,
                            axiosConfig)
                        const novoMatch = respostaFinal.data.match(/<form[\s\S]*?<\/form>/i)
                        if (novoMatch) {
                            const candidatoTratado = trataCandidato(novoMatch[0])
                            if (candidatoTratado) {
                                listagem[indiceAtual].nome = candidatoTratado.nome
                                listagem[indiceAtual].situacao = candidatoTratado.situacao
                            }
                        }
                    } else {
                        const candidatoTratado = trataCandidato(match[0])
                        if (candidatoTratado) {
                            listagem[indiceAtual].nome = candidatoTratado.nome
                            listagem[indiceAtual].situacao = candidatoTratado.situacao
                        }
                    }
                }
            } catch (error: any) {
                erros.push(listagem[indiceAtual])
                console.log("Erro:", {
                    nome: listagem[indiceAtual].nome,
                    codigo: error?.code || error?.err
                })
            }
            colecaoIndices.add(indiceAtual)
            if (colecaoIndices.size == listagem.length) {
                const fim = new Date().getTime()
                const tempo = (fim - inicio)
                console.log("Erros:", erros)
                console.log(`Batch ${tipo} executada em ${tempo} ms.`)
                if (erros.length) {
                    console.log("Corrigindo erros...");
                    resolve(await atualizaDados(erros, tipo, msIntervalo + 100))
                } else {
                    atualizaJSON(tipo)
                    resolve()
                }
            }
        }, msIntervalo)
    })
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
    json.ultimaAtualizacao = new Date()
    const candidatosNaoClassificados: Candidato[] = []
    json.listagem.forEach(candidato => {
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
    const { expedidas, autorizadas, cancelados, convocados, desistentes, inaptos, emQualificacao, empossados, naoConvocados, qualificados } = json
    console.log(`Dados ${tipo} atualizados:`, { expedidas, autorizadas, cancelados, desistentes, inaptos, emQualificacao, qualificados, empossados, convocados, naoConvocados, total: convocados + naoConvocados })
    if (candidatosNaoClassificados.length) {
        console.log(`Candidatos ${tipo} não classificados:`, candidatosNaoClassificados)
    }
}

const trataCandidato = (matchFormulario: string) => {
    const bolds = matchFormulario.match(/<b>[\s\S]*?<\/b>/gi)
    if (bolds) {
        const candidatoTratado = {
            nome: bolds[0]
                .replace("<b>", "")
                .replace("</b>", "")
                .replace("Situa&ccedil;&atilde;o:", "")
                .replace("&atilde;", "ã")
                .trim(),
            situacao: bolds[2]
                .replace("<b>", "")
                .replace("</b>", "")
                .replace("Situa&ccedil;&atilde;o:", "")
                .replace("&atilde;", "ã")
                .trim()
        }
        return candidatoTratado
    }
}