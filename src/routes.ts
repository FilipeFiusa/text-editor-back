import { Router } from 'express';
import { SessionController } from './controllers/session/SessionController';
import { UserController } from './controllers/user/UserController';

const routes = Router();
const usersController = new UserController();
const sessionController = new SessionController();

routes.use("/ping", async (request, response) => {
    response.send("pong")
})

routes.post('/user', usersController.create);
routes.get('/user', usersController.getAllUsers);

routes.post('/login', sessionController.create);
routes.post('/session', sessionController.checkToken);

export default routes;