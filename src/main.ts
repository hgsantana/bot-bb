import compression from 'compression'
import express, { json } from 'express'
import { configurarAmbiente } from './config/ambiente'
import { routes } from './routes'
import { iniciarHTMLService } from './services/html-service'

export const AMBIENTE = configurarAmbiente()

const app = express()

app.use(compression())
app.use(json())

app.all("*", routes)

const porta = process.env.PORT || 4000

const server = app.listen(porta, () => {
    console.log("Servindo na porta", porta)
    iniciarHTMLService()
    // iniciarWebsocketService(server)
})
