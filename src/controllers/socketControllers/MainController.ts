import { writeFile } from "fs";
import { Server } from "socket.io";
import ConnectedUser from "../../model/ConnectedUser";
import File from "../../model/File";
import Folder from "../../model/Folder";
import Workspace from "../../model/Workspace";
import { WorkspaceDatabaseController } from "../workspace/WorkspaceDatabaseController";
import { WorkspaceController } from "./WorkspaceController";
import { Prisma } from "@prisma/client";


export class MainController{
    serverInstance: Server;

    workspaces: WorkspaceController[] = [];

    workspaceDB = new WorkspaceDatabaseController();

    connectedUsers: ConnectedUser[] = [];

    constructor(serverInstance: Server){
        this.serverInstance = serverInstance;
        
        this.loadWorkspaceInstances();
        
        this.serverInstance.on("connection", socket => {
            socket.on("user-authentication", async (userId: string) => {
                const user: ConnectedUser = {
                    socket: socket,
                    mainConnection: null,
                    userId: userId,
                }

                this.connectedUsers.push(user)

                const userWorkspaces = await this.workspaceDB.getWorkspaces(userId);
                socket.emit("user-workspaces", userWorkspaces);
            })

            socket.on("create-workspace", async (userId, workspaceName, workspaceImage, workspaceImageExtension:string, callback) => {

                const { workspaceId,  workspaceImageName } = await this.workspaceDB.create(userId, workspaceName, workspaceImageExtension);

                // save the content to the disk, for example
                writeFile("." + workspaceImageName , workspaceImage, (err) => console.log(err));

                const newWorkspace = await this.workspaceDB.getWorkspaceById(workspaceId);
                await this.newWorkspaceControllerInstance(newWorkspace)
                socket.emit("new-user-workspace", newWorkspace);

                if(typeof callback == 'function'){
                    callback(true);
                }
            })

            socket.on("join-workspace", async (userId, inviteCode, callback) => {
                if(!await this.workspaceDB.workspaceExists(inviteCode)){
                    callback(false, "Invite Code doesnt exists");
                    return;
                }

                if(await this.workspaceDB.userAlreadyOnWorkspace(userId, inviteCode)){
                    callback(false, "User already on workspace");
                    return;
                }
                
                const newWorkspace = await this.workspaceDB.joinWorkspace(userId, inviteCode);
                this.workspaces.map(workspace => {
                    if(workspace.workspace.inviteCode == inviteCode) {
                        workspace.newUser(userId);
                    }
                })
                callback(true, "User joined");
                socket.emit("new-user-workspace", newWorkspace);
            })

            socket.on("disconnect", () => {
                for(let i = 0; i < this.connectedUsers.length; i++){
                    if(this.connectedUsers[i].socket == socket){
                        this.connectedUsers = this.connectedUsers.splice(i, 1);
                        break;
                    }
                }
            });
        })
    }

    loadWorkspaceInstances = () => {
        this.workspaceDB.getAllWorkspaces().then(allWorkspaces => {
            allWorkspaces.map(async (workspace: Workspace) => {
                await this.newWorkspaceControllerInstance(workspace)
            })
        })
    }

    newWorkspaceControllerInstance = async (workspace: Workspace) => {
        const folder = await this.workspaceDB.getWorkspaceFolder(workspace.id);
    

        const workspaceController = new WorkspaceController(
            workspace,
            this.serverInstance.of(workspace.inviteCode),
            folder,
            workspace.name,
            this.connectedUsers
        );

        this.workspaces.push(workspaceController);
    }
}