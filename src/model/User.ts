import { Socket } from "socket.io";
import WorkspaceRoom from "./WorkspaceRoom";

class User {
    id: string;
    userId?: string;
    email:string;
    name: string;
    avatar: string;
    //password: string;

    socket: Socket;
    status: number; // 1- Online, 2- AFK, 3- Offline
    currentRoom: WorkspaceRoom;

    // constructor(id: string, email: string, name: string, avatar: string){
    //     this.id = id;
    //     this.email = email;
    //     this.name = name;
    //     this.avatar = avatar;
    // }

    constructor(){
        
    }

    joinRoom = (newRoom: WorkspaceRoom) => {
        this.currentRoom = newRoom;
    }

    changeStatus = (newStatus: number) => {
        this.status = newStatus;
    }


}   

export default User;