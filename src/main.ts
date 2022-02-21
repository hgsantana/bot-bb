import express from 'express'
import { routes } from './routes'
import { atualizaTudo } from './services/atualiza-dados'

const app = express()


app.all("*", routes)

app.listen(4000, () => {
    console.log("Servidor na porta 4000")
    atualizaTudo()
})