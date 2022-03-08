import { Router } from "express";
import { dadosResumidos } from "./rotas/dados-resumidos";
import { dadosCompletos } from "./rotas/dados-completos";
import { migracao } from "./rotas/migracao";
import { dadosResumidosMock } from "./rotas/dados-resumidos-mock";
import { dadosCompletosMock } from "./rotas/dados-completos-mock";

export const routes = Router()

routes.get("/dadosResumidos/:tipo", dadosResumidos)
routes.get("/dadosCompletos/:tipo", dadosCompletos)
routes.get("/dadosResumidosMock", dadosResumidosMock)
routes.get("/dadosCompletosMock", dadosCompletosMock)
routes.get("/migracao", migracao)