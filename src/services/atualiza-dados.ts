import axios, { AxiosRequestConfig } from 'axios'
import { AGENTES_COMERCIAL } from '../data/nomes-comercial'
import { AGENTES_TI } from '../data/nomes-ti'
import { Candidato } from '../models/candidato'
import { MacroRegiao } from '../models/macro-regiao'
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
    listagem: []
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
    listagem: []
}

export const atualizaTudo = async () => {
    await atualizaDados(AGENTES_TI, "TI")
    await atualizaDados(AGENTES_COMERCIAL, "COMERCIAL")
    setTimeout(() => {
        atualizaTudo()
    }, 1000 * 60 * 60);
}

const atualizaDados = async (macroRegioes: MacroRegiao[], tipo: "TI" | "COMERCIAL", msIntervalo = 100) => {
    let total = 0
    macroRegioes.forEach(macro => {
        macro.microRegioes.forEach(micro => {
            total += micro.candidatos.length
        })
    })
    console.log(`Consultando ${total} registros de ${tipo}...`)
    return new Promise<void>(resolve => {
        let totalIndices = 0
        const inicio = new Date().getTime()
        let erros: Candidato[] = []
        let indiceMacro = 0
        let indiceMicro = 0
        let indiceCandidato = 0
        const intervalo: any = setInterval(async () => {
            const candidato = macroRegioes[indiceMacro].microRegioes[indiceMicro].candidatos[indiceCandidato]
            const dados = new URLSearchParams({
                "formulario": "formulario",
                "publicadorformvalue": ",802,0,0,2,0,1",
                "formulario:nomePesquisa": candidato.nome,
                "formulario:cpfPesquisa": "",
                "formulario:j_id16": "Confirmar",
                "javax.faces.ViewState": "j_id1",
            }).toString()
            const ultimaMacro = indiceMacro == macroRegioes.length - 1
            const ultimaMicro = indiceMicro == macroRegioes[indiceMacro].microRegioes.length - 1
            const ultimoCandidato = indiceCandidato == macroRegioes[indiceMacro].microRegioes[indiceMicro].candidatos.length - 1
            if (ultimaMacro && ultimaMicro && ultimoCandidato) {
                clearInterval(intervalo)
            } else if (ultimoCandidato && ultimaMicro) {
                indiceCandidato = 0
                indiceMicro = 0
                indiceMacro++
            } else if (ultimoCandidato) {
                indiceCandidato = 0
                indiceMicro++
            }
            else indiceCandidato++
            try {
                const getCookies = await axios.get('https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0.bbx')
                const cookies = getCookies.headers['set-cookie']
                let Cookie = ""
                if (cookies) Cookie = cookies[0]
                else throw { code: "SEM COOKIE" }
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
                            const situacao = retornaSituacao(novoMatch[0])
                            if (situacao) {
                                candidato.situacao = situacao
                            } else throw { code: "SEM SITUAÇÃO" }
                        } else throw { code: "SEM FORM" }
                    } else {
                        const situacao = retornaSituacao(match[0])
                        if (situacao) {
                            candidato.situacao = situacao
                        } else throw { code: "SEM SITUAÇÃO" }
                    }
                } else throw { code: "SEM FORM" }
            } catch (error: any) {
                erros.push(candidato)
                console.log("Erro:", {
                    nome: candidato.nome,
                    codigo: error?.code || error?.err
                })
            }
            totalIndices++
            if (totalIndices == total) {
                const fim = new Date().getTime()
                const tempo = (fim - inicio)
                console.log("Erros:", erros)
                console.log(`Batch ${tipo} executada em ${tempo} ms.`)
                if (erros.length) {
                    console.log("Corrigindo erros...");
                    resolve(await corrigeErros(erros, tipo, msIntervalo + 100))
                } else {
                    atualizaJSON(tipo)
                    resolve()
                }
            }
        }, msIntervalo)
    })
}

const corrigeErros = async (candidatos: Candidato[], tipo: "TI" | "COMERCIAL", msIntervalo = 100) => {
    let total = candidatos.length
    console.log(`Consultando ${total} registros de ${tipo}...`)
    return new Promise<void>(resolve => {
        let totalIndices = 0
        const inicio = new Date().getTime()
        let erros: Candidato[] = []
        let indiceCandidato = 0
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
                            const situacao = retornaSituacao(novoMatch[0])
                            if (situacao) {
                                candidato.situacao = situacao
                            }
                        }
                    } else {
                        const situacao = retornaSituacao(match[0])
                        if (situacao) {
                            candidato.situacao = situacao
                        }
                    }
                }
            } catch (error: any) {
                erros.push(candidato)
                console.log("Erro:", {
                    nome: candidato.nome,
                    codigo: error?.code || error?.err
                })
            }
            totalIndices++
            if (totalIndices == total) {
                const fim = new Date().getTime()
                const tempo = (fim - inicio)
                console.log("Erros:", erros)
                console.log(`Batch ${tipo} executada em ${tempo} ms.`)
                if (erros.length) {
                    console.log("Corrigindo erros...");
                    resolve(await corrigeErros(erros, tipo, msIntervalo + 100))
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
    let macroRegioes: MacroRegiao[] = tipo == "COMERCIAL" ? AGENTES_COMERCIAL : AGENTES_TI
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
    json.listagem = macroRegioes
    json.ultimaAtualizacao = new Date()
    const candidatosNaoClassificados: Candidato[] = []
    json.listagem.forEach(macro => {
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
}

const retornaSituacao = (matchFormulario: string) => {
    const bolds = matchFormulario.match(/<b>[\s\S]*?<\/b>/gi)
    const nascimento = matchFormulario.match(/Data de Nascimento: ([0-9]*\/[0-9]*)\w+/gi)
    const posicaoMacro = matchFormulario.match(/Data de Nascimento: ([0-9]*\/[0-9]*)\w+/gi)
    const posicaoMicro = matchFormulario.match(/Data de Nascimento: ([0-9]*\/[0-9]*)\w+/gi)
    if (bolds && nascimento && posicaoMacro && posicaoMicro) {
        return bolds[2]
            .replace("<b>", "")
            .replace("</b>", "")
            .replace("Situa&ccedil;&atilde;o:", "")
            .replace("&atilde;", "ã")
            .trim()
    }
}