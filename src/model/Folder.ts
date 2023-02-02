import File from "./File";

class Folder{
    id: string
    root: string;
    folders: Folder[];
    files: File[];

    constructor(id: string, root: string, folders: Folder[], files: File[]){
        this.id = id;
        this.root = root;
        this.folders = folders;
        this.files = files;
    }

    generateJsonForFront = () => {
        let files = this.files.map((file) => {
            return file.fileName;
        })

        return {
            id: this.id,
            root: this.root,
            files: files
        }
    }

}

export default Folder;