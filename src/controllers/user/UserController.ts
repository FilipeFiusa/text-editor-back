import bcrypt from 'bcryptjs';
import { Request, Response } from "express";
import { prisma } from '../../lib/prisma';

export class UserController{
    public async create(request: Request, response: Response){
        const { login, email, password } = request.body;
        
        const userExists = await prisma.user.findFirst({
            where: {
                email: email,
                login: login
            }
        });

        if(userExists){
            response.status(400).json({msg: "Email already exists"})
            return
        }

        await prisma.user.create({
            data: {
                email,
                login,
                password: bcrypt.hashSync(password, 10), 
                username: login, 
                avatar: "" 
            }
        });
        
        response.status(200).json({
            msg: "finalizou"
        })
    }

    public async getAllUsers(request: Request, response: Response){
        const users = await prisma.user.findMany();
        
        response.json(users);
    }


}