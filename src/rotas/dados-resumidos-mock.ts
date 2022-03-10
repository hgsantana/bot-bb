import { Request, Response } from 'express';
import { candidatosMock, respostaMOCK, situacoesMock } from '../data/dados-mock';
import { Candidato } from '../models/candidato';
import { websocketsAbertos } from '../services/websocket-service';

export const dadosResumidosMock = async (req: Request, res: Response) => {

    res.json(respostaMOCK)

}