import connection from "../../db/connection";
import File from "../../model/File";
import Folder from "../../model/Folder";
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

        const workspaceFolderId = await connection("Folders").insert({
            fullPath: "/",
            parentFolder: "",
            folderName: "/",
            createdAt: new Date(),
            workspaceId: workspaceId[0]
        })

        // tbl.text("root").notNullable();
        // tbl.text("folderName").notNullable();

        // tbl.dateTime('createdAt').notNullable();

        // tbl.integer('workspaceId').notNullable();
        
        return {workspaceId: workspaceId[0], workspaceImageName, workspaceFolderId: workspaceFolderId[0]};
    }

    addFolder = async (newFolderName: string, folderToAdd: Folder, workspaceId: string) => {
        const [newFolderId] = await connection("Folders")
            .insert({
                folderName: newFolderName,
                parentFolder: folderToAdd.folderName,
                fullPath: folderToAdd.fullPath == "/" ? newFolderName : folderToAdd.fullPath + "/" + newFolderName,
                createdAt: new Date(), 
                workspaceId: workspaceId
            });

        const folder = await connection<Folder>("Folders")
            .where({id: newFolderId.toString()})
            .select("*")
            .first()
        
        folder.files = [];
        folder.folders = [];

        console.log(folder);
        
        return folder;
    }

    getWorkspaceFolder = async (workspaceFolderId: number) => {
        const workspaceFolder = await connection<Folder>("Folders")
            .where({workspaceId: workspaceFolderId, fullPath: "/"})
            .select("*")
            .first();

        console.log(workspaceFolder)

        if(workspaceFolder){
            workspaceFolder.folders = await this.getFoldersFromFolder("/", workspaceFolderId);
            console.log( await this.getFoldersFromFolder("/", workspaceFolderId))
            workspaceFolder.files = await this.getFilesFromFolder(workspaceFolder.fullPath, workspaceFolderId);

            return workspaceFolder;
        }

        return null;
    }

    getFoldersFromFolder = async (parentFolder: string, workspaceFolderId: number) => {
        const folders = await connection<Folder>("Folders")
            .where({workspaceId: workspaceFolderId, parentFolder: parentFolder})
            .select("*");

        console.log(folders)
        
        for(let f of folders) {
            f.folders = await this.getFoldersFromFolder(f.folderName, workspaceFolderId);
            f.files = await this.getFilesFromFolder(f.fullPath, workspaceFolderId);
        }

        return folders;
    }

    addFile = async (newFileName: string, folder: Folder, workspaceId: number) => {
        const [newFileId] = await connection("Files")
            .insert({
                path: folder.fullPath,
                fileName: newFileName,
                content: "",
                createdAt: new Date(),
                lastChange: new Date(),
                workspaceId: workspaceId
            });
        
        return await connection<File>("Files")
            .where({id: newFileId.toString()})
            .select("*")
            .first();
    }
    
    getFilesFromFolder = async (fullPath:string, workspaceId: number) => {
        const files = await connection<File>("Files")
            .where({workspaceId: workspaceId, path: fullPath})
            .select("*");
        
        return files;
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

    getWorkspaceById = async (workspaceId:number) => {
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