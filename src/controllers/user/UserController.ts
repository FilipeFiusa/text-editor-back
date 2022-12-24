import { Request, Response } from "express";

export class UserController{
    public async create(request: Request, response: Response){
        // const { name, avatar, email, password } = request.body;

        // const userExists = await AppDataSource.manager.find(User, {
        //     where: {
        //         email: email
        //     }
        // })

        // if(userExists.length > 0){
        //     response.status(400).json({msg: "Email already exists"})
        //     return
        // }

        // const newUser = new User();

        // newUser.name = name;
        // newUser.email = email;
        // newUser.avatar = avatar;
        // newUser.password = bcriptjs.hashSync(password, 8);



        // console.log("Saved a new user with id: " + newUser.id)

        // response.json({
        //     msg: "New user Created with id " + newUser.id 
        // })
    }

    public async getAllUsers(request: Request, response: Response){

        response.json();
    }


}