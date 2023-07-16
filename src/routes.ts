import { Router } from "express"
import { recebeMensagensBot } from "./routes/recebe-mensagens-bot"

export const routes = Router()

// routes.get("/dadosResumidos", dadosResumidos)
// routes.get("/dadosCompletos", dadosCompletos)
routes.post("/bot", recebeMensagensBot)
routes.get("/", (req, res) => res.send("Bot em funcionamento..."))
// routes.get("/migracao", migracao)
