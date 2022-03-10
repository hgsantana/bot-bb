import { Router } from "express";
import { dadosCompletos } from "./rotas/dados-completos";
import { dadosCompletosMock } from "./rotas/dados-completos-mock";
import { dadosResumidos } from "./rotas/dados-resumidos";
import { dadosResumidosMock } from "./rotas/dados-resumidos-mock";
import { migracao } from "./rotas/migracao";
import { recebeMensagensBot } from "./rotas/recebe-mensagens-bot";

export const routes = Router()

routes.get("/dadosResumidos/:tipo", dadosResumidos)
routes.get("/dadosCompletos/:tipo", dadosCompletos)
routes.get("/dadosResumidosMock", dadosResumidosMock)
routes.get("/dadosCompletosMock", dadosCompletosMock)
routes.get("/migracao", migracao)
routes.post("/bot", recebeMensagensBot)