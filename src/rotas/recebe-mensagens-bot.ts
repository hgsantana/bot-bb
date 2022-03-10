import { Request, Response } from 'express'

export const recebeMensagensBot = async (req: Request, res: Response) => {

    console.log(req.body)
    res.send()

}