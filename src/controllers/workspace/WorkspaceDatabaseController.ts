import connection from "../../db/connection";
import User from "../../model/User";
import Workspace from "../../model/Workspace";

interface Users_Workspaces{
    userId: number;
    workspaceId: number;
    joinedAt: Date
}

export class WorkspaceDatabaseController{
    create = async (userId: number, workspaceName: string, workspaceImageExtension: string) => {
        let workspacesWithCodeExists = null;
        let generatedCode = "";
        
        do{
            generatedCode = (Math.random() + 1).toString(36).substring(4);
            workspacesWithCodeExists = await connection<Workspace>("Workspaces").select().where({inviteCode: generatedCode});
        }while(workspacesWithCodeExists.length > 0);

        const workspaceImageName = "/public/workspaces/" + generatedCode + "." + workspaceImageExtension;

        const workspaceId = await connection<Workspace>("Workspaces").insert({
            name: workspaceName,
            workspaceImage: workspaceImageName,
            inviteCode: generatedCode,
            workspaceRootFolder: "",
            createdAt: new Date(),
            ownerId: userId
        })

        await connection<Users_Workspaces>("Users_Workspaces").insert({
            userId,
            workspaceId: workspaceId[0],
            joinedAt: new Date()
        })
        
        return {workspaceId: workspaceId[0], workspaceImageName};
    }

    workspaceExists = async (workspaceInviteCode: string) => {
        const workspace = await connection<Workspace>('Workspaces')
            .where({inviteCode: workspaceInviteCode})
            .select('*')
            .first();

        return workspace;
    }

    userAlreadyOnWorkspace = async (userId: number, workspaceInviteCode: string) => {
        const workspace = await connection<Users_Workspaces>('Users_Workspaces')
            .join('Workspaces', 'Users_Workspaces.workspaceId', 'Workspaces.id')
            .where("Users_Workspaces.userId", userId)
            .andWhere("Workspaces.inviteCode", workspaceInviteCode)
            .select('*')
            .first();

        return workspace;
    }

    
    joinWorkspace = async (userId:number, workspaceInviteCode: string) => {
        const workspace = await connection<Workspace>('Workspaces')
            .where({inviteCode: workspaceInviteCode})
            .select('*')
            .first();

        await connection<Users_Workspaces>("Users_Workspaces").insert({
            userId,
            workspaceId: workspace.id,
            joinedAt: new Date()
        })

        workspace.workspaceImage = "http://localhost:3333" + workspace.workspaceImage;

        return workspace;
    }

    getWorkspaces = async (userId: number) => {       
        const userWorkspaces = await connection<Workspace[]>('Workspaces')
            .join('Users_Workspaces', 'Users_Workspaces.workspaceId', 'Workspaces.id')
            .where('Users_Workspaces.userId', userId)
            .orderBy("Users_Workspaces.joinedAt", "desc")
            .select('Workspaces.*');

        userWorkspaces.forEach(workspace => {
            workspace.workspaceImage = "http://localhost:3333" + workspace.workspaceImage;
        });

        return userWorkspaces;
    }

    getWorkspaceById =async (workspaceId:number) => {
        const workspace = await connection<Workspace>('Workspaces')
            .where('id', workspaceId)
            .select('*')
            .first();

        workspace.workspaceImage = "http://localhost:3333" + workspace.workspaceImage;

        return workspace;
    }

    getAllWorkspaces = async () => {
        const workspaces = await connection<Workspace>('Workspaces')
            .select('*');

        workspaces.forEach(workspace => {
            workspace.workspaceImage = "http://localhost:3333" + workspace.workspaceImage;
        });

        return workspaces;
    }

    getWorkspaceUsers = async (workspaceId: number) => {
        const Users = await connection<User>('Users')
            .join('Users_Workspaces', 'Users_Workspaces.userId', 'Users.id')
            .where('Users_Workspaces.workspaceId', workspaceId)
            .select('Users_Workspaces.userId', "Users.username", "Users.avatar");

        return Users;
    }

}