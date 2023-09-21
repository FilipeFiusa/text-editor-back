import bcrypt from 'bcryptjs';
import { Request, Response } from "express";
import { prisma } from '../../lib/prisma';

interface User {
    id: number;
    email: string;
    password: string;
    login: string;
    username: string;
    avatar: string;
}

export class UserController{
    public async create(request: Request, response: Response){
        const { login, email, password } = request.body;
        
        const userExists = await prisma.user.findFirst({
            where: {
                email: email,
                login: login
            }
        });

        // const userExists = await connection<User>("Users").select().where("email", email);

        console.log(userExists)

        if(userExists){
            response.status(400).json({msg: "Email already exists"})
            return
        }

        const newUser = await prisma.user.create({
            data: {
                email,
                login,
                password: bcrypt.hashSync(password, 10), 
                username: login, 
                avatar: "" 
            }
        });

        // const res = await connection<User>("Users").insert({
        //     email, 
        //     login,
        //     password: bcrypt.hashSync(password, 10), 
        //     username: login, 
        //     avatar: "" 
        // })

        console.log(newUser);
        
        response.status(200).json({
            msg: "finalizou"
        })
    }

    public async getAllUsers(request: Request, response: Response){
        //const db = new Database('./src/db/database.sqlite');

        //const row = db.prepare('SELECT * FROM Users').all(); 

        // const res = await connection<User>("Users").select();

        const users = await prisma.user.findMany();
        
        response.json(users);
    }


}