import { Namespace } from "socket.io";
import Folder from "../model/Folder";
import User from "../model/User";
import WorkspaceRoom from "../model/WorkspaceRoom";


export class WorkspaceController{
    namespaceInstance: Namespace;

    workspaceFolder: Folder[];
    workspaceRooms: WorkspaceRoom[] = [];
    connectedUsers: User[] = [];

    constructor(namespaceInstance: Namespace, folder: Folder[]){
        this.namespaceInstance = namespaceInstance;
        this.workspaceFolder = folder;

        for(let folder of this.workspaceFolder){
            for(let file of folder.files){
                let newRoom = new WorkspaceRoom(file);
                this.workspaceRooms.push(newRoom);
            }
        }

        this.namespaceInstance.on("connection", socket => {
            const user = new User;
            user.socket = socket;
            this.joinNamespace(user);

            socket.emit("send-folders", this.workspaceFolder.map(folder => {
                return folder.generateJsonForFront();
            }));

            socket.on("change-room", (roomName) => {
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

}