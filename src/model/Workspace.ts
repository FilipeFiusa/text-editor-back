
export default interface Workspace {
    id: number;
    name: string;
    workspaceImage: string;
    inviteCode: string;
    workspaceRootFolder?: string;
    ownerId: number

    createdAt?: Date
}