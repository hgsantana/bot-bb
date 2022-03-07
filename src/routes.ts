import { Router } from "express";
import { dadosResumidos } from "./rotas/dados-resumidos";
import { dadosCompletos } from "./rotas/dados-completos";
import { migracao } from "./rotas/migracao";

export const routes = Router()

routes.get("/dadosResumidos/:tipo", dadosResumidos)
routes.get("/dadosCompletos/:tipo", dadosCompletos)
routes.get("/migracao", migracao)