import { Prisma } from "@prisma/client";

class File{
    id: string
    fileName: string;
    path: string;
    content: string;
    createdAt: Date;
    lastChange: Date;

    workspaceId?: number;

    constructor(fileName: string, path: string, content: string, createdAt: Date, lastChange: Date);
    
    constructor(fileName: string, path: string, content: string, createdAt: Date, lastChange: Date, workspaceId?: number){
        this.fileName = fileName;
        this.path = path;
        this.content = content;
        this.createdAt = createdAt;
        this.lastChange = lastChange;

        if(workspaceId){
            this.workspaceId = workspaceId;
        }
    }


    static create(workspaceId: string, file:  Prisma.FileGetPayload<{ select: { [K in keyof Required<Prisma.FileSelect>]: true } }>){
        return new File(file.fileName, file.path, file.content, file.createdAt, file.lastChange)
    }


}

export default File;