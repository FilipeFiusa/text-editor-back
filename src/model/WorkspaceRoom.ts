import File from './File';

class WorkspaceRoom {
    roomName: string;
    file: File;

    constructor(file: File){
        this.file = file;
        this.roomName = file.path + "/" + file.fileName;
    }
}

export default WorkspaceRoom;