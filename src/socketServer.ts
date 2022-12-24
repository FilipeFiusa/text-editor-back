import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

let currentUsers: { userId: String; socketId: string; }[] = [];

export default function SocketServerController(server: http.Server){
    const io = new Server(server);

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            //return response.status(403).send("A token is required for authentication");
            next(new Error("invalid token"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
            console.log("Valid token! UserId: " + (<any>decoded).userId);

            currentUsers.push({
                userId: (<any>decoded).userId,
                socketId: socket.id
            })

            console.log(currentUsers);
            next();
        } catch (err) {
            next(new Error("invalid token"));
        }
      });

    io.on('connection', (socket) => {
        console.log('a user connected');
    });

    return io;
}

