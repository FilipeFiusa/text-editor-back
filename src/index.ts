import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import "reflect-metadata";
import { Server } from 'socket.io';
import { WorkspaceController } from './controllers/WorkspaceController';
import File from './model/File';
import Folder from './model/Folder';

let currentText = "";

dotenv.config();

const app = express()
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server);
const namepace = io.of("namespace");

const tempFiles: Folder[] = [];
tempFiles.push(new Folder("1", "src", [
    new File("index.ts", "src", "nada aqui ainda", new Date(), new Date()),
    new File("index2.ts", "src", "nada aqui ainda 2", new Date(), new Date()),
    new File("index3.ts", "src", "nada aqui ainda 3", new Date(), new Date()),
]))

tempFiles.push(new Folder("1", "src/model", [
    new File("User.ts", "src/model", "nada aqui ainda model", new Date(), new Date()),
]))

const workspaceController = new WorkspaceController(namepace, tempFiles);

io.on('connection', (socket) => {
    io.emit("current-text", currentText);

    socket.on("text-changed", (text) =>{
        currentText = text;
        socket.broadcast.emit("receive-text", text);
    });
});


server.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port: " + process.env.PORT || 3000);
})