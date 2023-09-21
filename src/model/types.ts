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

export type File = Prisma.FileGetPayload<{}>;

export type User = Prisma.UserGetPayload<{}>;

export type Workspace = Prisma.WorkspaceGetPayload<{}>;