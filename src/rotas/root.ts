import { Request, Response } from 'express'

export const root = async (req: Request, res: Response) => {
    res.send("Servidor na porta 4000.")
}