import { Router } from "express";
import { dadosAtualizados } from "./rotas/dados-atualizados";
import { dadosCompletos } from "./rotas/dados-completos";

export const routes = Router()

routes.get("/dadosAtualizados/:tipo", dadosAtualizados)
routes.get("/listagemCompleta/:tipo", dadosCompletos)