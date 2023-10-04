import { Prisma } from "@prisma/client";

export type Folder = Prisma.FolderGetPayload<{
    include: {
        files: true
        subFolders: {
            include: {
                subFolders: true,
                files: true
            }
        }
    }
}>

export type DC = Prisma.DirectChatGetPayload<{
    include: {
        userParticipants: true,
        directMessage: true
    }
}>

export type DirectMessage = Prisma.DirectMessageGetPayload<{
    include: {
        user: {
            select: {
                id: true,
                avatar: true,
                username: true
            }
        }
    }
}> 

export type File = Prisma.FileGetPayload<{}>;

export type User = Prisma.UserGetPayload<{}>;

export type Workspace = Prisma.WorkspaceGetPayload<{

}>;

export type WorkspaceMessage = Prisma.WorkspaceMessageGetPayload<{
    include: {
        user: {
            select: {
                id: true,
                avatar: true,
                username: true
            }
        }
    }
}>;