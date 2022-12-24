import { Request, Response } from "express";
import AppDataSource from "../../data-source";
import User from "../../model/User";
import Workspace from "../../model/Workspace";

export class WorkspaceController{
    create = async (request: Request, response: Response) => {
        const {name, description, privacity, accessControl} = request.body;

        const workspaceExists = await AppDataSource.manager.find(Workspace, {
            where: {
                name: name
            }
        });

        if(workspaceExists.length > 0){
            return response.status(400).json({msg: "Workspace with this name already exists"});
        }

        const user = await AppDataSource.manager.findOne(User, {
            where: {
                id: request.userId.toString()
            }
        });

        const newWorkspace = new Workspace(name, description, privacity, accessControl, user);

        await AppDataSource.manager.save(newWorkspace);
        
        console.log("Saved a new user with id: " + newWorkspace.id)

        response.json({
            msg: "New user Created with id " + newWorkspace.id 
        })
    }


}