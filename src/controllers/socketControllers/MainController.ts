import { writeFile } from "fs";
import { Server } from "socket.io";
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

    constructor(serverInstance: Server){
        this.serverInstance = serverInstance;
        
        this.loadWorkspaceInstances();
        
        this.serverInstance.on("connection", socket => {
            socket.on("user-authentication", async (userId: number) => {
                const userWorkspaces = await this.workspaceDB.getWorkspaces(userId);
                socket.emit("user-workspaces", userWorkspaces);
            })

            socket.on("create-workspace", async (userId, workspaceName, workspaceImage, workspaceImageExtension:string) => {

                const { workspaceId,  workspaceImageName } = await this.workspaceDB.create(userId, workspaceName, workspaceImageExtension);

                // save the content to the disk, for example
                writeFile("." + workspaceImageName , workspaceImage, (err) => {
                    
                });

                const newWorkspace = await this.workspaceDB.getWorkspaceById(workspaceId);
                this.newWorkspaceControllerInstance(newWorkspace)
                socket.emit("new-user-workspace", newWorkspace);
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
                callback(true, "User joined");
                socket.emit("new-user-workspace", newWorkspace);
            })
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
            this.serverInstance.of(workspace.inviteCode),
            folderExample[count++ % 2],
            workspace.name
        );

        workspaceController.workspace = workspace;

        this.workspaces.push(workspaceController);
    }


}