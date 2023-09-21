import { User } from "@prisma/client";
import { Socket } from "socket.io";


export default class WorkspaceUser {
    user: User;
    connected: boolean;
    socket: Socket;
    mainConnection: Socket;
    isLeader: boolean;
}