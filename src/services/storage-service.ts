import fs from 'fs/promises'
import { BackupTelegram } from '../models/backup-telegram'
import { StatusCompleto } from '../models/status-completo'

export const buscaDados = async (tipo: "TI" | "COMERCIAL"): Promise<StatusCompleto | null> => {
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
            const dados: StatusCompleto = JSON.parse(conteudo.toString())
            dados.ultimaAtualizacao = new Date(dados.ultimaAtualizacao)
            if (!dados.inconsistentes) dados.inconsistentes = 0
            return dados
        } else {
            console.log(`Backup de ${tipo} incompleto.`)
            return null
        }
    } catch (error) {
        console.log(`Ainda não há arquivo de backup de ${tipo}.`)
        return null
    }
}

export const salvaDados = async (dados: StatusCompleto, tipo: "TI" | "COMERCIAL") => {
    const dadosString = JSON.stringify(dados)
    const arquivo = await fs.open(`backups/backup_${tipo}.json`, 'w+')
    await arquivo.writeFile(dadosString)
    await arquivo.close()
}

export const buscaDadosTelegram = async (): Promise<BackupTelegram | null> => {
    try {
        await fs.readdir("./backups")
    } catch (error) {
        await fs.mkdir("./backups")
    }

    try {
        const arquivo = await fs.open(`backups/telegram.json`, 'r')
        const conteudo = await arquivo.readFile()
        await arquivo.close()

        if (conteudo.toString()) {
            console.log(`Backup do Telegram localizado.`)
            return JSON.parse(conteudo.toString())
        } else {
            console.log(`Backup do Telegram incompleto.`)
            return null
        }
    } catch (error) {
        console.log(`Ainda não há arquivo de backup do Telegram.`)
        return null
    }
}

export const salvaDadosTelegram = async (dados: BackupTelegram) => {
    const dadosBackup = { ...dados }
    const dadosString = JSON.stringify(dadosBackup)
    const arquivo = await fs.open(`backups/telegram.json`, 'w+')
    await arquivo.writeFile(dadosString)
    await arquivo.close()
}