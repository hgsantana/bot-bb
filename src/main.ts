import express from 'express'
import { routes } from './routes'

const app = express()

app.all("*", routes)

app.listen(4000, () => {
    console.log("Servidor na porta 4000")
})