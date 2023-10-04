import { Namespace, Socket } from "socket.io";
import ConnectedUser from "../../model/MainUser";
import Message from "../../model/Message";
import User from "../../model/User";
import Workspace from "../../model/Workspace";
import WorkspaceRoom from "../../model/WorkspaceRoom";
import WorkspaceUser from "../../model/WorkspaceUser.";
import { WorkspaceDatabaseController } from "../workspace/WorkspaceDatabaseController";

import type { Folder, File, WorkspaceMessage } from "../../model/types"
import MainUser from "../../model/MainUser";

export class WorkspaceController{
    namespaceInstance: Namespace;

    workspace: Workspace;
    workspaceName: string;

    workspaceFolder: Folder;
    workspaceRooms: WorkspaceRoom[] = [];
    // connectedUsers: User[] = [];

    workspaceDB = new WorkspaceDatabaseController();

    generalChatMessages: WorkspaceMessage[] = [];
    count: number = 1;

    connectedWorkspaceUsers: WorkspaceUser[] = [];

    getMainConnection: (userId : string) => MainUser;
    startDirectChat: (currentUser: MainUser, receivingUser: MainUser, callback: (roomName: string) => void) => void;

    constructor(
        workspace: Workspace, 
        namespaceInstance: Namespace, 
        folder: Folder, 
        messages: WorkspaceMessage[],
        workspaceName: string, 
        getMainConnection: (userId : string) => MainUser,
        startDirectChat: (currentUser: MainUser, receivingUser: MainUser, callback: (roomName: string) => void) => void
    ){
        this.workspace = workspace;
        this.namespaceInstance = namespaceInstance;
        this.workspaceFolder = folder;
        this.generalChatMessages = messages;
        this.workspaceName = workspaceName;
        this.getMainConnection = getMainConnection;
        this.startDirectChat = startDirectChat;
    }

    setupWorkspace = async () => {
        await this.loadUsers();
        this.createRooms(this.workspaceFolder);
        //console.log(this.connectedWorkspaceUsers)
        
        this.namespaceInstance.on("connection", socket => {
            let workspaceUser: WorkspaceUser;

            socket.emit("send-folders-r", this.workspaceFolder);

            socket.on("auth", (userId, callback) => {
                this.connectedWorkspaceUsers.map(user => {
                    if(user.user.id === userId){
                        user.connected = true;
                        user.socket = socket;

                        workspaceUser = user;

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

            socket.on("send-general-message", async (userId, content, callback) => {
                const newMessage: WorkspaceMessage = await this.workspaceDB.addMessage(content, userId, this.workspace.id);

                this.generalChatMessages.push(newMessage);

                this.namespaceInstance.emit("new-general-message", newMessage);
            })

            socket.on("change-room", (roomName) => {
                for(let room of this.workspaceRooms){
                    if(room.roomName == roomName){
                        if(workspaceUser.currentRoom && socket.rooms.has(workspaceUser.currentRoom.roomName)){
                            socket.leave(workspaceUser.currentRoom.roomName);
                        }

                        workspaceUser.currentRoom = room;
                        socket.join(roomName);

                        socket.emit("room-changed", room.file.content);
                    }
                }
            })

            socket.on("text-changed", text => {
                let currentRoom = workspaceUser.currentRoom;

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
                    const newFolder = await this.workspaceDB.addFolder(newFolderName, this.workspaceFolder, this.workspace.id.toString(), this.workspaceFolder.id);
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

                    this.namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                    this.namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
                    
                    return;
                }

                const newFolder = await this.workspaceDB.addFolder(newFolderName, searchedFolder, this.workspace.id.toString(), searchedFolder.id);
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

                this.namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                this.namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
                
            })

            socket.on("rename-folder", (newFolderName, folderId) => {
                const searchedFolder = this.findFolder(this.workspaceFolder, folderId);

                let newFullPath = searchedFolder.fullPath.split("/");
                newFullPath[newFullPath.length-1] = newFolderName;

                searchedFolder.fullPath = newFullPath.join("/");
                searchedFolder.folderName = newFolderName;

                this.workspaceDB.renameFolder(newFolderName, newFullPath.join("/"), searchedFolder.id)

                this.namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                this.namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
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

                this.namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                this.namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
            })

            socket.on("add-file", async (newFileName, folderId) => {
                const searchedFolder = this.findFolder(this.workspaceFolder, folderId);

                if(!searchedFolder){
                    return;
                }

                if(searchedFolder.fullPath === "/") {
                    // add on root folder

                    const newFile =  await this.workspaceDB.addFile(newFileName, this.workspaceFolder, this.workspace.id);
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

                    this.namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                    this.namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
                    
                    return;
                }

                const newFile =  await this.workspaceDB.addFile(newFileName, searchedFolder, this.workspace.id);
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

                
                this.namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                this.namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
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

                        this.namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                        this.namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
                    }
                    
                }

                searchedFolder.files
                
                //this.workspaceDB.renameFolder(newFolderName, newFullPath.join("/"), searchedFolder.id)

                this.namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                this.namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
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

                this.namespaceInstance.emit("file-list-updated", this.workspaceFolder);
                this.namespaceInstance.emit("file-list-updated-specific", this.workspaceFolder);
            }) 

            socket.on("start-direct-chat", async (receivingUserId: string) => {
                for(let receivingUser of this.connectedWorkspaceUsers){
                    if(receivingUser.user.id === receivingUserId){
                        const currentUserMain = this.getMainConnection(workspaceUser.user.id);
                        const receivingUserMain = this.getMainConnection(receivingUser.user.id);

                        this.startDirectChat(currentUserMain, receivingUserMain, (roomName: string) => {
                            socket.emit("direct-chat-created", roomName)  
                        }); 
                        return
                    }
                }
            })

            socket.on("disconnect", () => {
                this.connectedWorkspaceUsers.map(user => {
                    if(!user || !user.socket)
                        return

                    if(user.socket.id == socket.id){
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
                currentRoom: null,
                status: 3, 
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
                    currentRoom: null,
                    status: 3, 
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
