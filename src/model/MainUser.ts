import { User } from "@prisma/client";
import { Socket } from "socket.io";
import DirectChat from "./DirectChat";

export default class MainUser {
    id: string;
    user: User;
    socket: Socket;

    status: number;

    directChats: DirectChat[] = [];

    constructor(id: string, user: User, socket: Socket, directChats: DirectChat[]){
        this.id = id;
        this.user = user;
        this.socket = socket;
        this.directChats = directChats;
        this.status = 2;
    }


    simplifyObject() {
        return {
            id: this.id,
            username: this.user.username,
            avatar: this.user.avatar,
            status: this.status
        }
    }
}