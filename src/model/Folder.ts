import File from "./File";

class Folder{
    id: string
    fullPath: string;
    parentFolder: string;
    folderName: string;
    folders: Folder[];
    files: File[];

    workspaceId?: number;

    createdAt: Date;

    constructor(id: string, fullPath: string, parentFolder: string, folderName: string, folders: Folder[], files: File[]);

    constructor(id: string, fullPath: string, parentFolder: string, folderName: string, folders: Folder[], files: File[], workspaceId?: number){
        this.id = id;
        this.fullPath = fullPath;
        this.parentFolder = parentFolder;
        this.folderName = folderName;
        this.folders = folders;
        this.files = files;
        if(workspaceId){
            this.workspaceId = workspaceId;
        }
    }

    generateJsonForFront = () => {
        let files = this.files.map((file) => {
            return file.fileName;
        })

        return {
            id: this.id,
            folderName : this.folderName,
            fullPath: this.fullPath,
            parentFolder : this.parentFolder,
            files: files
        }
    }

}

export default Folder;