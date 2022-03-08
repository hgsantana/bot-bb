import { Request, Response } from 'express';
import { candidatosMock, respostaMOCK } from '../data/dados-mock';

export const dadosCompletosMock = async (req: Request, res: Response) => {

    const resposta = { ...respostaMOCK, candidatos: candidatosMock }
    res.json(resposta)

}
