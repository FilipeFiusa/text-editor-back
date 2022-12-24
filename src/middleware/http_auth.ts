import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

dotenv.config();

const verifyToken = (request: Request, response: Response, next: NextFunction) => {
    const token = request.headers.authorization;

    if (!token) {
        return response.status(403).send("A token is required for authentication");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
        request.userId = decoded;
    } catch (err) {
        return response.status(401).send("Invalid Token");
    }
    return next();
};

module.exports = verifyToken;

declare module 'express-serve-static-core' {
    interface Request {
        userId?: string | JwtPayload;
    }
  }