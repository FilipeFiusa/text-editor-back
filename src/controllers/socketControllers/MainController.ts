import { writeFile } from "fs";
import { Server } from "socket.io";
import ConnectedUser from "../../model/ConnectedUser";
import File from "../../model/File";
import Folder from "../../model/Folder";
import Workspace from "../../model/Workspace";
import { WorkspaceDatabaseController } from "../workspace/WorkspaceDatabaseController";
import { WorkspaceController } from "./WorkspaceController";

const folderExample = [
    new Folder("1", "/",
        [new Folder("2", "src", [
                new Folder("3", "src/model", [] , [new File("User.ts", "src/model", "User.ts asdsadas asdasd asds", new Date(), new Date()),])
            ], [
            new File("index.ts", "src", "index.ts", new Date(), new Date()),
        ])], [
        new File("package-lock.json", "/", "package-lock.json", new Date(), new Date()),
        new File("package.json", "/", "package.json", new Date(), new Date()),
        new File("tsconfig.json", "/", "tsconfig.json", new Date(), new Date()),
    ]),
    new Folder("1", "/",
        [new Folder("2", "src", [
                new Folder("3", "src/db", [] , [new File("connection.js", "src/db", "connection", new Date(), new Date()),])
            ], [
            new File("index.js", "src", "index.js", new Date(), new Date()),
        ])], [
    new File("package-lock.json", "/", "package-lock.json", new Date(), new Date()),
    new File("package.json", "/", "package.json", new Date(), new Date()),
])]

var count = 1;


export class MainController{
    serverInstance: Server;

    workspaces: WorkspaceController[] = [];

    workspaceDB = new WorkspaceDatabaseController();

    connectedUsers: ConnectedUser[] = [];

    constructor(serverInstance: Server){
        this.serverInstance = serverInstance;
        
        this.loadWorkspaceInstances();
        
        this.serverInstance.on("connection", socket => {
            socket.on("user-authentication", async (userId: number) => {
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
                this.newWorkspaceControllerInstance(newWorkspace)
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
                        workspace.newUser();
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
            allWorkspaces.map(workspace => {
                this.newWorkspaceControllerInstance(workspace)
            })
        })
    }

    newWorkspaceControllerInstance = (workspace: Workspace) => {
        const workspaceController = new WorkspaceController(
            workspace,
            this.serverInstance.of(workspace.inviteCode),
            folderExample[count++ % 2],
            workspace.name,
            this.connectedUsers
        );

        this.workspaces.push(workspaceController);
    }


}