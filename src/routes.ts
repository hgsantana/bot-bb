import { Router } from "express";
import { dadosAtualizados } from "./rotas/dados-atualizados";
import { dadosCompletos } from "./rotas/dados-completos";
import { root } from "./rotas/root";

export const routes = Router()

routes.get("/", root)
routes.get("/dadosAtualizados/:tipo", dadosAtualizados)
routes.get("/listagemCompleta/:tipo", dadosCompletos)