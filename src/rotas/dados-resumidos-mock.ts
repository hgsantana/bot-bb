import { Request, Response } from 'express';
import { respostaMOCK } from '../data/dados-mock';

export const dadosResumidosMock = async (req: Request, res: Response) => {

    res.json(respostaMOCK)

}