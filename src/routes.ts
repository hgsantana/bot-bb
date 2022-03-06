import { Router } from "express";
import { dadosAtualizados } from "./rotas/dados-atualizados";
import { dadosCompletos } from "./rotas/dados-completos";
import { migracao } from "./rotas/migracao";

export const routes = Router()

routes.get("/dadosAtualizados/:tipo", dadosAtualizados)
routes.get("/dadosCompletos/:tipo", dadosCompletos)
routes.get("/migracao", migracao)