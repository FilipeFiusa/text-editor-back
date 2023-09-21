import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

dotenv.config();

interface User {
    id: string;
    email: string;
    password: string;
    login: string;
    username: string;
    avatar: string;
}

export class SessionController{
    public async create(request: Request, response: Response){
        const { login, password } = request.body;

        const user = await prisma.user.findFirst({
            where: {
                login: login
            }
        })
        
        // const user = await connection<User>("Users").select().where("login", login).first();

        if(!user || !bcrypt.compareSync(password, user.password)){
            response.status(400).json({msg: "Email ou Senha errados"});
            return
        }

        const token = jwt.sign({userId: user.id, userName: user.username,}, process.env.JWT_TOKEN_KEY);

        response.json({
            userId: user.id,
            userName: user.username,
            token
        })
    }

    public async checkToken(request: Request, response: Response){
        const { token } = request.body;

        // verify a token symmetric
        jwt.verify(token, process.env.JWT_TOKEN_KEY , (err: Error, decoded: any) => {
            if(!err){
                console.log(decoded) // bar
                response.status(200).json({msg: "valid token", decoded});
            }else{
                response.status(400).json({msg: "invalid token"});
            }
        });
    }
}