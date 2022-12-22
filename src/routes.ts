import { Router } from "express";
import { dadosCompletos } from "./routes/dados-completos";
import { dadosResumidos } from "./routes/dados-resumidos";
import { recebeMensagensBot } from "./routes/recebe-mensagens-bot";

export const routes = Router()

routes.get("/dadosResumidos", dadosResumidos)
routes.get("/dadosCompletos", dadosCompletos)
routes.post("/bot", recebeMensagensBot)
// routes.get("/migracao", migracao)