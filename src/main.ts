import express from 'express'
import { routes } from './routes'
import { iniciar } from './services/atualiza-dados'

const app = express()

app.all("*", routes)

const porta = process.env.PORT || 4000

app.listen(porta, () => {
    console.log("Servindo na porta", porta)
    iniciar()
})