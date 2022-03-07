import fs from 'fs/promises'
import { AGENTES_COMERCIAL } from '../data/nomes-comercial'
import { AGENTES_TI } from '../data/nomes-ti'
import { RespostaJSON } from "../models/resposta-json"

export const buscaDados = async (tipo: "TI" | "COMERCIAL"): Promise<RespostaJSON | null> => {
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

export const salvaDados = async (dados: RespostaJSON, tipo: "TI" | "COMERCIAL") => {
    const dadosBackup = {...dados}
    dadosBackup.candidatos = tipo == "TI" ? AGENTES_TI : AGENTES_COMERCIAL
    const dadosString = JSON.stringify(dadosBackup)
    const arquivo = await fs.open(`backups/backup_${tipo}.json`, 'w+')
    await arquivo.writeFile(dadosString)
    await arquivo.close()
}
