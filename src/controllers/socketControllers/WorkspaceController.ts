import { Namespace } from "socket.io";
import ConnectedUser from "../../model/ConnectedUser";
import Folder from "../../model/Folder";
import Message from "../../model/Message";
import User from "../../model/User";
import Workspace from "../../model/Workspace";
import WorkspaceRoom from "../../model/WorkspaceRoom";
import WorkspaceUser from "../../model/WorkspaceUser.";
import { WorkspaceDatabaseController } from "../workspace/WorkspaceDatabaseController";


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
            const user = new User;
            user.socket = socket;


            socket.emit("send-folders-r", this.workspaceFolder);

            socket.on("auth", (userId, callback) => {
                console.log(userId)

                this.connectedWorkspaceUsers.map(user => {
                    if(user.user.userId === userId){

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

            socket.on("disconnect", () => {

                this.connectedWorkspaceUsers.map(user => {
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

    createRooms = (folder: Folder) => {
        for(let f of folder.folders){
            this.createRooms(f);
        }

        for(let file of folder.files){
            let newRoom = new WorkspaceRoom(file);
            this.workspaceRooms.push(newRoom);
        }
    }

    loadUsers = async () =>  {
        const users = await this.workspaceDB.getWorkspaceUsers(this.workspace.id);;

        users.map(user => {
            const workspaceUser: WorkspaceUser = {
                connected: false,
                user: user,
                socket: null,
                mainConnection: null
            }
    
            this.connectedWorkspaceUsers.push(workspaceUser);
        })
    }

    currentConnectedUsers = () => {
        return this.connectedWorkspaceUsers.map(user => {
            return {
                user: user.user,
                connected: user.connected
            }
        })
    }

    newUser =  async () => {
        const users = await this.workspaceDB.getWorkspaceUsers(this.workspace.id);

        users.map(user => {


            this.connectedWorkspaceUsers.map(connectedUser => {
                if(connectedUser.user.userId == user.id){
                    const workspaceUser: WorkspaceUser = {
                        connected: false,
                        user: user,
                        socket: null,
                        mainConnection: null
                    }
            
                    this.connectedWorkspaceUsers.push(workspaceUser);
                }
            })
        })

        this.namespaceInstance.emit("users-changed", this.currentConnectedUsers());
    }
}