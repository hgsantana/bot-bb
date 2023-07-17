import compression from "compression"
import express, { json } from "express"
import { iniciarBot } from "./bot"
import { configurarAmbiente } from "./config/ambiente"
import { configurarBancoDados } from "./config/banco-dados"
import { routes } from "./routes"
import { iniciaBancoDados } from "./services/bd-service"

export const AMBIENTE = configurarAmbiente()
export const SQL = configurarBancoDados()
export const app = express()

app.use(compression())
app.use(json())

app.all("*", routes)

const porta = process.env.PORT || 4000

app.listen(porta, async () => {
  console.log("Servindo na porta", porta)
  await iniciaBancoDados()
  await iniciarBot()
})
