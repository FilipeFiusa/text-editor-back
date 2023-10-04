import { prisma } from "../../lib/prisma";
import { DC } from "../../model/types";

export class MainDatabaseController{
    addDirectChat = async (starterUserId: string, secondUserId: string) => {
        const newDirectChat = await prisma.directChat.create({
            data: {
                userParticipants: {
                    connect: [
                        {
                            id: starterUserId
                        },
                        {
                            id: secondUserId
                        }
                    ]
                }
            },
            include: {
                userParticipants: true
            }
        });

        return newDirectChat;
    }

    addMessages = async (content: string, userId: string, directChatId: string) => {
        const newMessage = await prisma.directMessage.create({
            data: {
                content: content,
                user: {
                    connect: {
                        id: userId
                    }
                },
                directChat: {
                    connect: {
                        id: directChatId
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        avatar: true,
                        username: true
                    }
                }
            }
        })

        return newMessage;
    }

    loadUsers = async () => {
        return await prisma.user.findMany(); 
    }

    loadDirectChats = async () => {
        const directChats: DC[] = await prisma.directChat.findMany({
            include: {
                userParticipants: true,
                directMessage: true
            }
        });

        return directChats;
    }

    loadDirectChatMessage = async (chatId: string) => {
        const messages = await prisma.directMessage.findMany({
            where: {
                directChatId: chatId
            },
            include: {
                user: {
                    select: {
                        avatar: true,
                        id: true,
                        username: true
                    }
                }
            }
        });

        return messages;
    }
}