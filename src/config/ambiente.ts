import dotenv from 'dotenv'
import { VariaveisAmbiente } from '../models/variaveis-ambiente'


export const configurarAmbiente = () => {
    dotenv.config()

    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
    const TELEGRAM_API = `https://api.telegram.org/${TELEGRAM_TOKEN}`

    if (!TELEGRAM_TOKEN) throw "Variáveis de ambiente não configuradas, finalizando..."

    const variaveis: VariaveisAmbiente = {
        TELEGRAM_TOKEN,
        TELEGRAM_API
    }

    return variaveis
}