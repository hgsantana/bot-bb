import axios from 'axios'
import { AGENTES_COMERCIAL, AGENTES_TI } from '../data/nomes'
import { RespostaJSON } from '../models/resposta-json'

export let RESPOSTA_TI: RespostaJSON
export let RESPOSTA_COMERCIAL: RespostaJSON

export const atualizaTudo = async () => {
    RESPOSTA_TI = await atualizaDados(AGENTES_TI, "TI")
    RESPOSTA_COMERCIAL = await atualizaDados(AGENTES_COMERCIAL, "COMERCIAL")
    setTimeout(() => {
        atualizaTudo()
    }, 1000 * 60 * 30);
}

const atualizaDados = async (nomes: string[], tipo: string) => {
    return new Promise<RespostaJSON>(resolve => {
        const inicio = new Date().getTime()
        const resultado: string[] = []
        let erros = 0
        let indice = 0
        const intervalo: any = setInterval(async () => {
            if (indice >= nomes.length) return clearInterval(intervalo)
            const dados = new URLSearchParams({
                "formulario": "formulario",
                "publicadorformvalue": ",802,0,0,2,0,1",
                "formulario:nomePesquisa": nomes[indice],
                "formulario:cpfPesquisa": "",
                "formulario:j_id16": "Confirmar",
                "javax.faces.ViewState": "j_id1",
            }).toString()
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

                const response = await axios.post<string>('https://www37.bb.com.br/portalbb/resultadoConcursos/resultadoconcursos/arh0.bbx',
                    dados,
                    {
                        headers
                    }
                )
                const match = response.data.match(/<form[\s\S]*?<\/form>/i)
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
                            {
                                headers
                            })
                        const novoMatch = respostaFinal.data.match(/<form[\s\S]*?<\/form>/i)
                        if (novoMatch) resultado.push(novoMatch[0])
                    } else {
                        resultado.push(match[0])
                    }
                    if (resultado.length == nomes.length) {
                        const fim = new Date().getTime()
                        const tempo = (fim - inicio)
                        console.log(`Batch ${tipo} executada em ${tempo} ms.`)
                        return resolve(montaJSON(resultado, nomes, tipo))
                    }
                    if (erros + resultado.length == nomes.length) {
                        const fim = new Date().getTime()
                        const tempo = (fim - inicio)
                        console.log("Sucesso:", resultado.length)
                        console.log("Erros:", erros)
                        console.log(`Batch ${tipo} executada em ${tempo} ms.`)
                        return resolve(montaJSON(resultado, nomes, tipo))
                    }
                }
            } catch (error) {
                erros++
                if (erros + resultado.length == nomes.length) {
                    const fim = new Date().getTime()
                    const tempo = (fim - inicio)
                    console.log("Sucesso:", resultado.length)
                    console.log("Erros:", erros)
                    console.log(`Batch ${tipo} executada em ${tempo} ms.`)
                    return resolve(montaJSON(resultado, nomes, tipo))
                }
            }
        }, 80)
    })
}

const montaJSON = (resultado: string[], nomes: string[], tipo: string) => {
    let json: RespostaJSON = {
        autorizadas: 0,
        cancelados: 0,
        desistentes: 0,
        emQualificacao: 0,
        empossados: 0,
        expedidas: 0,
        qualificados: 0,
        naoConvocados: 0,
        convocados: 0,
        ultimaAtualizacao: new Date(),
        listagem: [],
    }
    resultado.forEach(candidato => {
        const bolds = candidato.match(/<b>[\s\S]*?<\/b>/gi)
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
            json.listagem?.push(candidatoTratado)
            if (candidatoTratado.situacao.includes("autorizada")) json.autorizadas++
            if (candidatoTratado.situacao.includes("Cancelado")) json.cancelados++
            if (candidatoTratado.situacao.includes("qualificacao")) json.emQualificacao++
            if (candidatoTratado.situacao.includes("Empossado")) json.empossados++
            if (candidatoTratado.situacao.includes("Qualificado")) json.qualificados++
            if (candidatoTratado.situacao.includes("expedida")) json.expedidas++
            if (candidatoTratado.situacao.includes("Desistente")) json.desistentes++
            if (candidatoTratado.situacao.includes("Não Convocado")) json.naoConvocados++
            json.convocados =
                + json.autorizadas
                + json.cancelados
                + json.emQualificacao
                + json.empossados
                + json.qualificados
                + json.expedidas
                + json.desistentes
        }
    })
    const { expedidas, autorizadas, cancelados, convocados, desistentes, emQualificacao, empossados, naoConvocados, qualificados } = json
    console.log(`Dados ${tipo} atualizados:`, { expedidas, autorizadas, cancelados, desistentes, emQualificacao, qualificados, empossados, convocados, naoConvocados })
    const totalListagem = json.convocados + json.naoConvocados
    if (totalListagem != nomes.length) console.log("Erros na listagem:", nomes.length - totalListagem)
    json.ultimaAtualizacao = new Date()
    return json
}