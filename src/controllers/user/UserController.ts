import bcrypt from 'bcryptjs';
import { Request, Response } from "express";
import connection from '../../db/connection';

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
        
        const userExists = await connection<User>("Users").select().where("email", email);

        console.log(userExists)

        if(userExists.length > 0){
            response.status(400).json({msg: "Email already exists"})
            return
        }

        const res = await connection<User>("Users").insert({
            email, 
            login,
            password: bcrypt.hashSync(password, 10), 
            username: login, 
            avatar: "" 
        })

        console.log(res);
        
        response.status(200).json({
            msg: "finalizou"
        })
    }

    public async getAllUsers(request: Request, response: Response){
        //const db = new Database('./src/db/database.sqlite');

        //const row = db.prepare('SELECT * FROM Users').all(); 

        const res = await connection<User>("Users").select();
        
        response.json(res);
    }


}