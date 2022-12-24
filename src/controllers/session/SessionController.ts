import dotenv from 'dotenv';
import { Request, Response } from "express";
// import AppDataSource from "../../data-source";
dotenv.config();

export class SessionController{
    public async create(request: Request, response: Response){
        // const { email, password } = request.body;
        
        // const user = await AppDataSource.manager.findOne(User, {
        //     where: {
        //         email: email
        //     }
        // });

        // if(!user || !bcriptjs.compareSync(password, user.password)){
        //     response.status(400).json({msg: "Email ou Senha errados"});
        //     return
        // }

        // const token = jwt.sign({userId: user.id}, process.env.JWT_TOKEN_KEY);

        // response.json({
        //     token: token 
        // })
    }

    public async delete(request: Request, response: Response){
        // const users = await AppDataSource.manager.find(User)

        // response.json(users);
    }


}