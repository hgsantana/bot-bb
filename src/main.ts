import compression from 'compression'
import express, { json } from 'express'
import { configurarAmbiente } from './config/ambiente'
import { routes } from './routes'
import { iniciar } from './services/dados-service'
import { iniciaMockService } from './services/mock-service'
import { iniciarWebsocket } from './services/websocket-service'

export const AMBIENTE = configurarAmbiente()

const app = express()

app.use(compression())
app.use(json())

app.all("*", routes)

const porta = process.env.PORT || 4000

const server = app.listen(porta, () => {
    console.log("Servindo na porta", porta)
    iniciar()
    iniciarWebsocket(server)
    iniciaMockService()
})
