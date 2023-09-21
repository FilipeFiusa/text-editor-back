import { Namespace } from "socket.io";
import ConnectedUser from "../../model/ConnectedUser";
import Message from "../../model/Message";
import User from "../../model/User";
import Workspace from "../../model/Workspace";
import WorkspaceRoom from "../../model/WorkspaceRoom";
import WorkspaceUser from "../../model/WorkspaceUser.";
import { WorkspaceDatabaseController } from "../workspace/WorkspaceDatabaseController";

import type { Folder, File } from "../../model/types"

export class WorkspaceController{
    namespaceInstance: Namespace;

    workspace: Workspace;
    workspaceName: string;

    workspaceFolder: Folder;
    workspaceRooms: WorkspaceRoom[] = [];
    // connectedUsers: User[] = [];

    workspaceDB = new WorkspaceDatabaseController();

    generalChatMessages: Message[] = [];
    count: number = 1;

    connectedWorkspaceUsers: WorkspaceUser[] = [];

    constructor(workspace: Workspace, namespaceInstance: Namespace, folder: Folder, workspaceName: string, connectedUsersOnMainConnection: ConnectedUser[]){
        this.workspace = workspace;
        this.namespaceInstance = namespaceInstance;
        this.workspaceFolder = folder;
        this.workspaceName = workspaceName;

        this.loadUsers();
        this.createRooms(folder);
        
        this.namespaceInstance.on("connection", socket => {
            const user = new User();
            user.socket = socket;


            socket.emit("send-folders-r", this.workspaceFolder);

            socket.on("auth", (userId, callback) => {
                this.connectedWorkspaceUsers.map(user => {
                    if(user.user.id === userId){

                        user.connected = true;
                        user.socket = socket;

                        this.namespaceInstance.emit("users-changed", this.currentConnectedUsers());
                    }
                });

                if(typeof callback == 'function'){
                    callback();
                }
            })

            socket.on("initialize", async (callback) => {
                if(typeof callback == 'function'){
                    callback(this.workspaceFolder, this.currentConnectedUsers());
                }
            });

            socket.on("get-users", async (callback) => {
                if(typeof callback == 'function'){
                    callback(this.currentConnectedUsers());
                } 
            });
            
            socket.on("get-messages", async (callback) => {
                if(typeof callback == 'function'){
                    console.log(this.generalChatMessages)

                    callback(this.generalChatMessages);
                }
            }); 

            socket.on("send-general-message", async (userName, content, callback) => {
                const generatedCode = (Math.random() + 1);
                const newMessage = new Message(generatedCode, "", userName, content);

                this.generalChatMessages.push(newMessage);

                socket.broadcast.emit("new-general-message", newMessage);

                if(typeof callback == 'function'){
                    callback(newMessage);
                }
            })

            socket.on("change-room", (roomName) => {
                console.log(roomName);
                for(let room of this.workspaceRooms){
                    if(room.roomName == roomName){
                        if(user.currentRoom && socket.rooms.has(user.currentRoom.roomName)){
                            socket.leave(user.currentRoom.roomName);
                        }

                        user.currentRoom = room;
                        socket.join(roomName);

                        socket.emit("room-changed", room.file.content);
                    }
                }
            })

            socket.on("text-changed", text => {
                let currentRoom = user.currentRoom;

                if(!currentRoom){
                    return;
                }

                currentRoom.file.content = text;

                socket.to(currentRoom.roomName).emit("receive-text-changed", text);
            })

            socket.on("add-folder", async (newFolderName, folder) => {
                if(folder === "/") {
                    const newFolder = await this.workspaceDB.addFolder(newFolderName, this.workspaceFolder, workspace.id.toString(), this.workspaceFolder.id);
                    this.workspaceFolder.subFolders.push(newFolder);

                    this.workspaceFolder.subFolders.sort((a: Folder,b: Folder) => {
                        const aName = a.folderName.toLocaleLowerCase();
                        const bName = b.folderName.toLocaleLowerCase(); 
                        
                        if (aName < bName) {
                            return -1;
                        }
                        if (aName > bName) {
                            return 1;
                        }
                        return 0;
                    })

                    namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                    namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
                    
                    return;
                }
                
                const searchedFolder = this.findFolder(this.workspaceFolder, folder);

                if(searchedFolder){
                    console.log("folder found");
                    //console.log(searchedFolder);

                    const newFolder = await this.workspaceDB.addFolder(newFolderName, searchedFolder, workspace.id.toString(), searchedFolder.id);
                    searchedFolder.subFolders.push(newFolder);

                    searchedFolder.subFolders.sort((a: Folder,b: Folder) => {
                        const aName = a.folderName.toLocaleLowerCase();
                        const bName = b.folderName.toLocaleLowerCase();
                        
                        if (aName < bName) {
                            return -1;
                        }
                        if (aName > bName) {
                            return 1;
                        }
                        return 0;
                    })

                    namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                    namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
                }
            })

            socket.on("add-file", async (newFileName, folder) => {
                //console.log(folder);

                if(folder === "/") {
                    // add on root folder

                    const newFile =  await this.workspaceDB.addFile(newFileName, this.workspaceFolder, workspace.id);
                    this.workspaceFolder.files.push(newFile);
                    this.createRoom(newFile);

                    this.workspaceFolder.files.sort((a: File,b: File) => {
                        const aName = a.fileName.toLocaleLowerCase();
                        const bName = b.fileName.toLocaleLowerCase();
                        
                        if (aName < bName) {
                            return -1;
                        }
                        if (aName > bName) {
                            return 1;
                        }
                        return 0;
                    })

                    namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                    namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
                    
                    return;
                }
                
                const searchedFolder = this.findFolder(this.workspaceFolder, folder);

                if(searchedFolder){
                    console.log("folder found");
                    //console.log(searchedFolder);

                    const newFile =  await this.workspaceDB.addFile(newFileName, searchedFolder, workspace.id);
                    searchedFolder.files.push(newFile);
                    this.createRoom(newFile);

                    searchedFolder.files.sort((a: File,b: File) => {
                        const aName = a.fileName.toLocaleLowerCase();
                        const bName = b.fileName.toLocaleLowerCase();
                        
                        if (aName < bName) {
                            return -1;
                        }
                        if (aName > bName) {
                            return 1;
                        }
                        return 0;
                    })
 
                    
                    namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                    namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
                }
            })

            socket.on("rename-folder", (newFolderName, folderPath) => {
                console.log(newFolderName, folderPath)

                const searchedFolder = this.findFolder(this.workspaceFolder, folderPath);

                searchedFolder.fullPath = searchedFolder.fullPath.replace(searchedFolder.folderName, newFolderName);
                searchedFolder.folderName = newFolderName;

                namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
            })

            socket.on("disconnect", () => {

                console.log(this.connectedWorkspaceUsers);

                this.connectedWorkspaceUsers.map(user => {
                    if(!user || !user.socket)
                        return

                    console.log(user.socket.id)
                    console.log(socket.id)
                    if(user.socket.id == socket.id){
                        console.log("Disconnected")
                        user.connected = false;
                        user.socket = null;
                    }
                })

                this.namespaceInstance.emit("users-changed", this.currentConnectedUsers());
            });
        })

    }

    createRooms = (folder: Folder ) => {
        if(!folder.subFolders){
            return
        }

        for (let i = 0; i < folder.subFolders.length; i++) {
            const f = folder.subFolders[i] as Folder;
            
            this.createRooms(f);
        }

        for(let file of folder.files){
            this.createRoom(file);
        }
    }

    createRoom = (file: File) => {
        let newRoom = new WorkspaceRoom(file);
        this.workspaceRooms.push(newRoom);
    }

    loadUsers = async () =>  {
        const users = await this.workspaceDB.getWorkspaceUsers(this.workspace.id);

        users.map((user) => {
            const workspaceUser: WorkspaceUser = {
                connected: false,
                user: user,
                socket: null,
                mainConnection: null,
                isLeader: user.id == this.workspace.ownerId ? true : false
            }
    
            this.connectedWorkspaceUsers.push(workspaceUser);
        })
    }

    currentConnectedUsers = () => {
        return this.connectedWorkspaceUsers.map(user => {
            return {
                user: user.user,
                connected: user.connected,
                isLeader: user.isLeader
            }
        })
    }

    newUser =  async (userId: string) => {
        const users = await this.workspaceDB.getWorkspaceUsers(this.workspace.id);

        users.map(user => {
            if(userId == user.id){
                const workspaceUser: WorkspaceUser = {
                    connected: false,
                    user: user,
                    socket: null,
                    mainConnection: null,
                    isLeader: user.id == this.workspace.ownerId ? true : false
                }
        
                this.connectedWorkspaceUsers.push(workspaceUser);
            }
        })

        this.namespaceInstance.emit("users-changed", this.currentConnectedUsers());
    }

    findFolder = (currentFolder: Folder, folderPath: string) => {
        const subFolders: string[] = folderPath.split("/");
        let aux: any = currentFolder;

        for(let i = 0; i <= subFolders.length; i++) {
            const subPath = subFolders[i];
            
            for(let f of aux.subFolders){
                const aux2 = f.fullPath.split("/").pop();

                if(aux2 == subPath){
                    aux = f;
                    break;
                }
            }
        }

        const currentFolderName = aux.fullPath.split("/").pop();
        const destinyFolder = folderPath.split("/").pop();
        console.log("current - "  + currentFolderName)
        console.log("folderPath - "  + destinyFolder)

        if(currentFolderName === destinyFolder){
            return aux;
        }

        return null;
    }
}