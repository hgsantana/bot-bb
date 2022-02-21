import { Router } from "express";
import { dadosAtualizados } from "./rotas/dados-atualizados";
import { listagemCompleta } from "./rotas/listagem-completa";
import { root } from "./rotas/root";

export const routes = Router()

routes.get("/", root)
routes.get("/dadosAtualizados", dadosAtualizados)
routes.get("/listagemCompleta", listagemCompleta)