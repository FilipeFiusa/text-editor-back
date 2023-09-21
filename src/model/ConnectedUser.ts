import { Socket } from "socket.io";

export default class ConnectedUser {
    userId: string;
    socket: Socket;
    mainConnection: Socket;
}