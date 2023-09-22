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

            socket.on("add-folder", async (newFolderName, folderId) => {
                const searchedFolder = this.findFolder(this.workspaceFolder, folderId) as Folder;

                console.log("is it null ?")
                console.log(searchedFolder)

                if(!searchedFolder){
                    return;
                }

                if(searchedFolder.fullPath === "/") {
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
                
            })

            socket.on("rename-folder", (newFolderName, folderId) => {
                const searchedFolder = this.findFolder(this.workspaceFolder, folderId);

                let newFullPath = searchedFolder.fullPath.split("/");
                newFullPath[newFullPath.length-1] = newFolderName;

                searchedFolder.fullPath = newFullPath.join("/");
                searchedFolder.folderName = newFolderName;

                this.workspaceDB.renameFolder(newFolderName, newFullPath.join("/"), searchedFolder.id)

                namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
            })

            socket.on("delete-folder", (folderId) => {
                const folderToDelete = this.findFolder(this.workspaceFolder, folderId);
                const parentFolder = this.findParentFolder(this.workspaceFolder, folderId);
                this.workspaceDB.deleteFolder(folderId)

                parentFolder.subFolders.forEach((item, index) => {
                    if(item === folderToDelete){
                        parentFolder.subFolders.splice(index, 1);
                    }
                }); 

                namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
            })

            socket.on("add-file", async (newFileName, folderId) => {
                const searchedFolder = this.findFolder(this.workspaceFolder, folderId);

                if(!searchedFolder){
                    return;
                }

                if(searchedFolder.fullPath === "/") {
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
            })

            socket.on("rename-file", async (parentFolderId: string, newFileName:string, fileId: string) => {
                const searchedFolder = this.findFolder(this.workspaceFolder, parentFolderId);

                console.log(parentFolderId, newFileName, fileId) 

                for (let i = 0; i < searchedFolder.files.length; i++) {
                    const file = searchedFolder.files[i];

                    if(file.id === fileId){
                        this.workspaceRooms

                        for (let j = 0; j < this.workspaceRooms.length; j++) {
                            const room = this.workspaceRooms[j];

                            const oldPath = file.path + "/" + file.fileName
                            
                            if(room.roomName === oldPath){
                                let newFullPath = oldPath.split("/");
                                newFullPath[newFullPath.length-1] = newFileName;

                                file.fileName = newFileName;
                                room.file = file;
                                room.roomName = newFullPath.join("/");

                                console.log(room)
                            }
                        }

                        await this.workspaceDB.renameFile(newFileName, fileId);

                        namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                        namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
                    }
                    
                }

                searchedFolder.files
                
                //this.workspaceDB.renameFolder(newFolderName, newFullPath.join("/"), searchedFolder.id)

                namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
            })

            socket.on("delete-file", async (parentFolderId: string, fileId:string) => {
                const parentFolder = this.findFolder(this.workspaceFolder, parentFolderId); 

                parentFolder.files.forEach((file, index) => {
                    if(file.id === fileId){
                        parentFolder.files.splice(index, 1);
                    }
                });
                
                this.workspaceRooms.forEach((room, index) => {
                    if(room.file.id === fileId){
                        parentFolder.files.splice(index, 1);
                    }
                }); 
                
                this.workspaceDB.deleteFile(fileId)

                namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
            })

            socket.on("disconnect", () => {
                this.connectedWorkspaceUsers.map(user => {
                    if(!user || !user.socket)
                        return

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

    findFolder = (currentFolder: Folder, folderId: string): Folder => {
        if(currentFolder.id == folderId){
            return currentFolder as Folder;
        }

        if(currentFolder.subFolders && currentFolder.subFolders.length > 0){
            for (let i = 0; i < currentFolder.subFolders.length; i++) {
                const f = currentFolder.subFolders[i] as Folder;
                return this.findFolder(f, folderId) as Folder;
            }
        }

        return null;
    }

    findParentFolder = (currentFolder: Folder, folderId: string): Folder => {
        if(currentFolder.subFolders && currentFolder.subFolders.length > 0){
            for (let i = 0; i < currentFolder.subFolders.length; i++) {
                const f = currentFolder.subFolders[i] as Folder;

                if(f.id === folderId){
                    return currentFolder;
                }

                return this.findParentFolder(f, folderId) as Folder;
            }
        }

        return null;
    }
}
