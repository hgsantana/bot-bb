import dotenv from 'dotenv'
import { VariaveisAmbiente } from '../models/variaveis-ambiente'


export const configurarAmbiente = () => {
    dotenv.config()

    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
    const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID
    const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`

    if (!TELEGRAM_TOKEN || !TELEGRAM_ADMIN_ID) {
        console.error("Variáveis de ambiente não configuradas")
        return process.abort()
    }

    const variaveis: VariaveisAmbiente = {
        TELEGRAM_TOKEN,
        TELEGRAM_API,
        TELEGRAM_ADMIN_ID
    }

    console.log("Ambiente configurado.")

    return variaveis
}