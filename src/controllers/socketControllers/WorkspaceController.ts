import { Namespace } from "socket.io";
import Folder from "../../model/Folder";
import Message from "../../model/Message";
import User from "../../model/User";
import Workspace from "../../model/Workspace";
import WorkspaceRoom from "../../model/WorkspaceRoom";


export class WorkspaceController{
    namespaceInstance: Namespace;

    workspace: Workspace;
    workspaceName: string;

    workspaceFolder: Folder;
    workspaceRooms: WorkspaceRoom[] = [];
    connectedUsers: User[] = [];

    generalChatMessages: Message[] = [];
    count: number = 1;

    constructor(namespaceInstance: Namespace, folder: Folder, workspaceName: string){
        this.namespaceInstance = namespaceInstance;
        this.workspaceFolder = folder;
        this.workspaceName = workspaceName;

        this.createRooms(folder);
        
        this.namespaceInstance.on("connection", socket => {
            const user = new User;
            user.socket = socket;
            this.joinNamespace(user);

            //console.log(socket.id + " connected on " + workspaceName)

            // socket.emit("send-folders", this.workspaceFolder.map(folder => {
            //     return folder.generateJsonForFront();
            // }));

            socket.emit("send-folders-r", this.workspaceFolder);
            socket.on("get-folders", async (callback) => {
                if(typeof callback == 'function'){
                    callback(this.workspaceFolder);
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
        })

    }

    joinNamespace = (newUser: User) => {
        this.connectedUsers.push(newUser);
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

}