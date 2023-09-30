import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import "reflect-metadata";
import { Server } from 'socket.io';
import { MainController } from './controllers/socketControllers/MainController';
import File from './model/File';
import Folder from './model/Folder';
import routes from './routes';

let currentText = "";

dotenv.config();

const app = express()
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'))

app.use(routes); 

const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8,
    cors: {
        origin: '*',
    }
});

const socketController = new MainController(io);
socketController.setupMainController();

server.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port: " + process.env.PORT || 3000);
})