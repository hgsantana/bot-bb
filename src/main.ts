import compression from 'compression'
import express from 'express'
import { routes } from './routes'
import { iniciar } from './services/dados-service'
import { iniciarWebsocket } from './services/websocket-service'

const app = express()

app.use(compression())

app.all("*", routes)

const porta = process.env.PORT || 4000

const server = app.listen(porta, () => {
    console.log("Servindo na porta", porta)
    iniciar()
})

iniciarWebsocket(server)