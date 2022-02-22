import axios, { AxiosRequestConfig } from 'axios'
import fs from 'fs/promises'
import { AGENTES_COMERCIAL } from '../data/nomes-comercial'
import { AGENTES_TI } from '../data/nomes-ti'
import { Candidato } from '../models/candidato'
import { MacroRegiao } from '../models/macro-regiao'
import { RespostaAlteracoes, RespostaJSON } from '../models/resposta-json'

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
    macroRegioes: AGENTES_TI
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
    macroRegioes: AGENTES_COMERCIAL
}

export const ALTERACOES_TI: RespostaAlteracoes = {
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
    ultimaAtualizacao: new Date()
}

export const ALTERACOES_COMERCIAL: RespostaAlteracoes = {
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
    ultimaAtualizacao: new Date(),
    candidatosAlterados: [],
}

let ALTERADOS_TI: Candidato[] = []
let ALTERADOS_COMERCIAL: Candidato[] = []

export const iniciar = async () => {
    RESPOSTA_TI = await buscaDados("TI") || RESPOSTA_TI
    RESPOSTA_COMERCIAL = await buscaDados("COMERCIAL") || RESPOSTA_COMERCIAL
    atualizaAlteracoes("COMERCIAL", {})
    atualizaAlteracoes("TI", {})
    atualizaTudo({ dados_comercial: RESPOSTA_COMERCIAL.macroRegioes, dados_ti: RESPOSTA_TI.macroRegioes })
}

const atualizaTudo = async ({ dados_ti, dados_comercial }: { dados_ti: MacroRegiao[], dados_comercial: MacroRegiao[] }) => {
    await atualizaDados(dados_ti, "TI")
    await atualizaDados(dados_comercial, "COMERCIAL")
    setTimeout(() => {
        atualizaTudo({ dados_comercial, dados_ti })
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
                    timeout: 10000
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
                                if (candidato.situacao != situacao) {
                                    if (tipo == "TI") ALTERADOS_TI.push(candidato)
                                    else ALTERADOS_COMERCIAL.push(candidato)
                                    candidato.situacao = situacao
                                }
                            } else throw { code: "SEM SITUAÇÃO" }
                        } else throw { code: "SEM FORM" }
                    } else {
                        const situacao = retornaSituacao(match[0])
                        if (situacao) {
                            if (candidato.situacao != situacao) {
                                if (tipo == "TI") ALTERADOS_TI.push(candidato)
                                else ALTERADOS_COMERCIAL.push(candidato)
                                candidato.situacao = situacao
                            }
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
                    timeout: 10000
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
                                if (candidato.situacao != situacao) {
                                    if (tipo == "TI") ALTERADOS_TI.push(candidato)
                                    else ALTERADOS_COMERCIAL.push(candidato)
                                    candidato.situacao = situacao
                                }
                            } else throw { code: "SEM SITUAÇÃO" }
                        }
                    } else {
                        const situacao = retornaSituacao(match[0])
                        if (situacao) {
                            if (candidato.situacao != situacao) {
                                if (tipo == "TI") ALTERADOS_TI.push(candidato)
                                else ALTERADOS_COMERCIAL.push(candidato)
                                candidato.situacao = situacao
                            }
                        } else throw { code: "SEM SITUAÇÃO" }
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
    salvaDados(json, tipo)
    if (tipo == "TI") atualizaAlteracoes(tipo, { json, candidatosAlterados: ALTERADOS_TI })
    else atualizaAlteracoes(tipo, { json, candidatosAlterados: ALTERADOS_COMERCIAL })
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


const buscaDados = async (tipo: "TI" | "COMERCIAL"): Promise<RespostaJSON | null> => {
    try {
        await fs.readdir("./backups")
    } catch (error) {
        await fs.mkdir("./backups")
    }
    try {
        const arquivo = await fs.open(`backups/backup_${tipo}.json`, 'r')
        const conteudo = await arquivo.readFile()
        await arquivo.close()
        if (conteudo.toString()) {
            console.log(`Backup de ${tipo} localizado.`)
            return JSON.parse(conteudo.toString())
        } else {
            console.log(`Backup de ${tipo} incompleto.`)
            return null
        }
    } catch (error) {
        console.log(`Ainda não há arquivo de backup de ${tipo}.`)
        return null
    }
}

const salvaDados = async (dados: RespostaJSON, tipo: "TI" | "COMERCIAL") => {
    const dadosString = JSON.stringify(dados)
    const arquivo = await fs.open(`backups/backup_${tipo}.json`, 'w+')
    await arquivo.writeFile(dadosString)
    await arquivo.close()
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
            ALTERACOES_TI.ultimaAtualizacao = new Date()
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
            ALTERACOES_TI.ultimaAtualizacao = new Date()
        }
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
            ALTERACOES_COMERCIAL.ultimaAtualizacao = new Date()
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
            ALTERACOES_COMERCIAL.ultimaAtualizacao = new Date()
        }

    }
    ALTERADOS_TI = []
    ALTERADOS_COMERCIAL = []
}