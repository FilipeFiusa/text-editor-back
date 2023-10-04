import { writeFile } from "fs";
import { Server } from "socket.io";
import Workspace from "../../model/Workspace";
import { WorkspaceDatabaseController } from "../workspace/WorkspaceDatabaseController";
import { WorkspaceController } from "./WorkspaceController";
import MainUser from "../../model/MainUser";
import DirectChat from "../../model/DirectChat";
import {v4 as uuidv4} from 'uuid';
// import { prisma } from "../../lib/prisma";
import Message from "../../model/Message";
import { DC, DirectMessage } from "../../model/types";
import { MainDatabaseController } from "../workspace/MainDatabaseController";

export class MainController{
    serverInstance: Server;
    workspaces: WorkspaceController[] = [];
    workspaceDB = new WorkspaceDatabaseController();
    mainDB = new MainDatabaseController();
    connectedUsers: MainUser[] = [];

    directChats: DirectChat[] = [];

    constructor(serverInstance: Server){
        this.serverInstance = serverInstance;
    }

    setupMainController = async () => {
        await this.loadUsers();
        await this.loadDirectChats();
        await this.loadWorkspaceInstances();
        
        this.serverInstance.on("connection", socket => { 
            let connectedUser: MainUser;

            socket.on("user-authentication", async (userId: string) => {
                for(let user of this.connectedUsers){
                    if(user.id === userId){
                        user.socket = socket;
                        const userWorkspaces = await this.workspaceDB.getWorkspaces(userId);
                        socket.emit("user-workspaces", userWorkspaces);
                        
                        //console.log(user.directChats);

                        user.directChats.map((chat) => { 
                            socket.join(chat.id) 
                            this.serverInstance.to(chat.id).emit("user-connected", chat.id, user.id);
                        } ) 

                        socket.emit("user-direct-messages",  user.directChats.map((chat) => { return this.simplifyDirectChat(chat) }));
                        
                        user.status = 1;
                        connectedUser = user;
                        return;
                    }
                }
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

            socket.on("send-direct-message",async (directChatId: string, message: string, callback) => {      
                const currentChat = this.getDirectChatById(directChatId);

                if(!currentChat){
                    return
                }
                
                const newMessage = await this.mainDB.addMessages(message, connectedUser.id, directChatId)
                currentChat.messages.push(newMessage)

                this.serverInstance.to(currentChat.id).emit("new-direct-message", currentChat.id, newMessage)
                this.serverInstance.to(currentChat.id).emit("new-current-direct-message", currentChat.id, newMessage)
            })

            socket.on("disconnect", () => {
                for(let i = 0; i < this.connectedUsers.length; i++){
                    if(this.connectedUsers[i].socket == socket){
                        this.connectedUsers[i].status = 2;

                        this.connectedUsers[i].directChats.map((chat) => {
                            this.serverInstance.to(chat.id).emit("user-disconnected", chat.id, connectedUser.id);
                        })

                        break;
                    }
                }
            });
        })
    }

    getMainConnection = (userId: string)  => {
        for(let user of this.connectedUsers){
            if(user.id === userId){
                return user;
            }
        }

        return null;
    }
    
    loadUsers = async () => {
        const users = await this.mainDB.loadUsers();

        for(let user of users){
            this.connectedUsers.push(new MainUser(user.id, user, null, []))
        }
    }

    loadDirectChats = async () => {
        const _directChats: DC[] = await this.mainDB.loadDirectChats();
        
        for(let chat of _directChats){
            const messages: DirectMessage[] = await this.mainDB.loadDirectChatMessage(chat.id)

            let tempParticipantUsers = chat.userParticipants.map(user => {
                for(let mainUser of this.connectedUsers){
                    if(user.id === mainUser.id){
                        return mainUser;
                    }
                }
            });
            
            const newDirectChat: DirectChat = {
                id: chat.id,
                users: tempParticipantUsers,
                messages: messages
            }

            for(let user of newDirectChat.users){
                user.directChats.push(newDirectChat);
            }

            this.directChats.push(newDirectChat);
        }
    }

    loadWorkspaceInstances = async () => {
        const allWorkspaces = await this.workspaceDB.getAllWorkspaces();
        
        await Promise.all(allWorkspaces.map(async (workspace) => {
            await this.newWorkspaceControllerInstance(workspace);
        }))
    }

    newWorkspaceControllerInstance = async (workspace: Workspace) => {
        const folder = await this.workspaceDB.getWorkspaceFolder(workspace.id);
        const messages = await this.workspaceDB.getWorkspaceMessages(workspace.id);

        const workspaceController = new WorkspaceController(
            workspace,
            this.serverInstance.of(workspace.inviteCode),
            folder,
            messages,
            workspace.name,
            this.getMainConnection,
            this.startDirectChat
        );

        await workspaceController.setupWorkspace()

        this.workspaces.push(workspaceController);
    }

    startDirectChat = async (starterUser: MainUser, secondUser: MainUser, callback: (roomName: string) => void ) => {
        for (let chat of this.directChats){
            if(
                chat.users.length === 2 &&
                ( chat.users[0].id === starterUser.id && chat.users[1].id === secondUser.id ) ||
                ( chat.users[1].id === starterUser.id && chat.users[0].id === secondUser.id )
            ){
                callback(chat.id)
                return; 
            } 
        } 
 
        const _newDirectChat = await this.mainDB.addDirectChat(starterUser.id, secondUser.id)

        const newDirectChat: DirectChat = {
            id: _newDirectChat.id,
            users: [starterUser, secondUser],
            messages: []
        }
    
        this.directChats.push(newDirectChat); 

        for(let user of newDirectChat.users){
            if(user.socket){ 
                user.socket.join(newDirectChat.id);
            }
            user.directChats.push(newDirectChat);
        }


        this.serverInstance.to(newDirectChat.id).emit("new-user-direct-messages", this.simplifyDirectChat(newDirectChat)) 
         
        callback(newDirectChat.id);
    }
 
    getDirectChatById(id: string){
        console.log(this.directChats) 

        for(let chat of this.directChats){
            console.log(chat.id) 
            if(chat.id === id){
                return chat;
            }           
        }

        return null;
    }

    simplifyDirectChat = (directChat: DirectChat) =>{
        return {
            id: directChat.id,
            users: directChat.users.map((user) => {return user.simplifyObject()} ),
            messages: directChat.messages
        }
    }
}