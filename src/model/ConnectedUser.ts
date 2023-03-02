import { Socket } from "socket.io";

export default class ConnectedUser {
    userId: number;
    socket: Socket;
    mainConnection: Socket;
}