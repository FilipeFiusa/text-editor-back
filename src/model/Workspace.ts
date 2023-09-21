import { Prisma } from "@prisma/client";

export default class Workspace {
    id: string;
    name: string;
    workspaceImage: string;
    inviteCode: string;
    workspaceRootFolder?: string;
    ownerId: string

    createdAt?: Date

    constructor(
        id: string,
        name: string,
        workspaceImage: string,
        inviteCode: string,
        workspaceRootFolder: string,
        ownerId: string,
        createdAt: Date,
    ) {
            this.id = id
            this.name = name
            this.workspaceImage = workspaceImage
            this.inviteCode = inviteCode
            this.workspaceRootFolder = workspaceRootFolder
            this.ownerId = ownerId
            this.createdAt = createdAt
        }    

    static create(workspace: Prisma.WorkspaceGetPayload<{ select: { [K in keyof Required<Prisma.WorkspaceSelect>]: true } }>) {
        return new Workspace(
            workspace.id, 
            workspace.name, 
            workspace.workspaceImage, 
            workspace.inviteCode, 
            workspace.workspaceRootFolder, 
            workspace.ownerId, 
            workspace.createdAt)
    }
}