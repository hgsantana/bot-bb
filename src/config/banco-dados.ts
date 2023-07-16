import knex from "knex"
import { AMBIENTE } from "../main"

export const configurarBancoDados = () => {
  const KNEX_CONFIG = {
    client: "mssql",
    connection: {
      host: AMBIENTE.DB_HOST,
      database: AMBIENTE.DB_DATABASE,
      user: AMBIENTE.DB_USER,
      password: AMBIENTE.DB_PASS,
      ssl: { rejectUnauthorized: false },
      options: {
        trustServerCertificate: true,
        encrypt: true,
      },
    },
  }

  return knex(KNEX_CONFIG)
}
