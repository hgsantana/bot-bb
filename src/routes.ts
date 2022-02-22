import { Router } from "express";
import { dadosAtualizados } from "./rotas/dados-atualizados";
import { dadosCompletos } from "./rotas/dados-completos";
import { migraDados } from "./rotas/migra-dados";

export const routes = Router()

routes.get("/dadosAtualizados/:tipo", dadosAtualizados)
routes.get("/dadosCompletos/:tipo", dadosCompletos)
routes.get("/migracao", migraDados)