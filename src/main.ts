import compression from 'compression'
import express from 'express'
import { routes } from './routes'
import { iniciar } from './services/dados-service'

const app = express()

app.use(compression())

app.all("*", routes)

const porta = process.env.PORT || 4000

app.listen(porta, () => {
    console.log("Servindo na porta", porta)
    iniciar()
})