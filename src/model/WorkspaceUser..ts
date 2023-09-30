import { User } from "@prisma/client";
import { Socket } from "socket.io";
import MainUser from "./MainUser";
import WorkspaceRoom from "./WorkspaceRoom";


export default class WorkspaceUser {
    user: User;
    connected: boolean;
    socket: Socket;
    isLeader: boolean;
    mainUser: MainUser;

    status: number; // 1- Online, 2- AFK, 3- Offline
    currentRoom: WorkspaceRoom;
}