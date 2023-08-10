class File{
    id: string
    fileName: string;
    path: string;
    content: string;
    createdAt: Date;
    lastChange: Date;

    workspaceId: number;

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





}

export default File;