import { Router } from "express";
import { dadosCompletos } from "./rotas/dados-completos";
import { dadosResumidos } from "./rotas/dados-resumidos";
import { recebeMensagensBot } from "./rotas/recebe-mensagens-bot";

export const routes = Router()

routes.get("/dadosResumidos", dadosResumidos)
routes.get("/dadosCompletos", dadosCompletos)
routes.post("/bot", recebeMensagensBot)
// routes.get("/migracao", migracao)