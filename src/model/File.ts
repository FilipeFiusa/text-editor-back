class File{
    id: string
    fileName: string;
    path: string;
    content: string;
    createdAt: Date;
    lastChange: Date;

    constructor(fileName: string, path: string, content: string, createdAt: Date, lastChange: Date){
        this.fileName = fileName;
        this.path = path;
        this.content = content;
        this.createdAt = createdAt;
        this.lastChange = lastChange;
    }



}

export default File;