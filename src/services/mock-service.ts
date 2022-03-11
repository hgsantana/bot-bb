import { candidatosMock, respostaMOCK, situacoesMock } from "../data/dados-mock";
import { Candidato } from "../models/candidato";
import { enviaMensagemPrivada, enviaMensagemPublica, usuariosCadastrados } from "./telegram-service";
import { websocketsAbertos } from "./websocket-service";

export const iniciaMockService = () => {
    setInterval(() => {
        geraAlteracaoMock()
    }, 1000 * 60); // cada 1min
}

const geraAlteracaoMock = async () => {
    console.log("Mockando alterações...")
    const totalAlteracoes = 2
    let alteracoes = 0

    while (alteracoes < totalAlteracoes) {
        const indiceRandom = Math.round((candidatosMock.length - 1) * Math.random())
        const indiceSituacao = Math.round((situacoesMock.length - 1) * Math.random())
        const candidatoMockado = candidatosMock[indiceRandom]
        const situacaoMockada = situacoesMock[indiceSituacao]
        const situacaoAnterior = candidatoMockado.situacao
        candidatoMockado.situacao = situacaoMockada

        // if (situacaoAnterior == "Não Convocado") enviaMensagemPublica(situacaoAnterior, candidatoMockado)
        // const usuariosFiltrados = usuariosCadastrados.filter(u => u.nomeChecagem == candidatoMockado.nome)
        // usuariosFiltrados.forEach(u => {
        //     enviaMensagemPrivada(u, situacaoAnterior, candidatoMockado)
        // })

        // websocketsAbertos.ti.forEach(w => w.send(JSON.stringify(candidatoMockado)))
        alteracoes++
    }
    atualizaJSONMock()
}

const atualizaJSONMock = () => {
    respostaMOCK.autorizadas = 0
    respostaMOCK.cancelados = 0
    respostaMOCK.convocados = 0
    respostaMOCK.desistentes = 0
    respostaMOCK.emQualificacao = 0
    respostaMOCK.empossados = 0
    respostaMOCK.expedidas = 0
    respostaMOCK.inaptos = 0
    respostaMOCK.naoConvocados = 0
    respostaMOCK.qualificados = 0
    respostaMOCK.ultimaAtualizacao = new Date()

    const candidatosNaoClassificados: Candidato[] = []

    candidatosMock.forEach(candidato => {
        if (candidato.situacao.includes("autorizada")) respostaMOCK.autorizadas++
        else if (candidato.situacao.includes("Cancelado")) respostaMOCK.cancelados++
        else if (candidato.situacao.includes("qualificacao")) respostaMOCK.emQualificacao++
        else if (candidato.situacao.includes("Empossado")) respostaMOCK.empossados++
        else if (candidato.situacao.includes("Qualificado")) respostaMOCK.qualificados++
        else if (candidato.situacao.includes("expedida")) respostaMOCK.expedidas++
        else if (candidato.situacao.includes("Desistente")) respostaMOCK.desistentes++
        else if (candidato.situacao.includes("Inapto")) respostaMOCK.inaptos++
        else if (candidato.situacao.includes("Não Convocado")) respostaMOCK.naoConvocados++
        else candidatosNaoClassificados.push(candidato)
        respostaMOCK.convocados = candidatosMock.length - respostaMOCK.naoConvocados
    })

    if (candidatosNaoClassificados.length) {
        respostaMOCK.inconsistentes = candidatosNaoClassificados.length
        console.log(`Candidatos MOCK não classificados:`, candidatosNaoClassificados)
    }

    respostaMOCK.id++
}

