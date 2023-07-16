import dotenv from "dotenv"
import { VariaveisAmbiente } from "../models/variaveis-ambiente"

export const configurarAmbiente = () => {
  dotenv.config()

  const DB_HOST = process.env.DB_HOST
  const DB_DATABASE = process.env.DB_DATABASE
  const DB_USER = process.env.DB_USER
  const DB_PASS = process.env.DB_PASS
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
  const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID
  const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`

  if (
    !TELEGRAM_TOKEN ||
    !TELEGRAM_ADMIN_ID ||
    !DB_HOST ||
    !DB_DATABASE ||
    !DB_USER ||
    !DB_PASS
  ) {
    console.error("Variáveis de ambiente não configuradas")
    return process.exit(1)
  }

  const variaveis: VariaveisAmbiente = {
    TELEGRAM_TOKEN,
    TELEGRAM_API,
    TELEGRAM_ADMIN_ID,
    DB_HOST,
    DB_DATABASE,
    DB_USER,
    DB_PASS,
  }

  console.log("Ambiente configurado.")

  return variaveis
}
