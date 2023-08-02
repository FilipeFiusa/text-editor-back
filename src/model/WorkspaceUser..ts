import { Socket } from "socket.io";
import User from "./User";

export default class WorkspaceUser {
    user: User;
    connected: boolean;
    socket: Socket;
    mainConnection: Socket;
    isLeader: boolean;
}