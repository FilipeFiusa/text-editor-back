import { prisma } from "../../lib/prisma";
import { Folder, User, WorkspaceMessage } from "../../model/types";

interface Users_Workspaces{
    userId: string;
    workspaceId: number;
    joinedAt: Date
}

export class WorkspaceDatabaseController{
    create = async (userId: string, workspaceName: string, workspaceImageExtension: string) => {
        let workspacesWithCodeExists = null;
        let generatedCode = "";
        
        do{
            generatedCode = (Math.random() + 1).toString(36).substring(4);
            workspacesWithCodeExists = await prisma.workspace.findFirst({
                where: {
                    inviteCode: generatedCode
                }
            });
        }while(workspacesWithCodeExists);

        const workspaceImageName = "/public/workspaces/" + generatedCode + "." + workspaceImageExtension;

        const newWorkspace = await prisma.workspace.create({
            data: {
                name: workspaceName,
                workspaceImage: workspaceImageName,
                inviteCode: generatedCode,
                workspaceRootFolder: "",
                createdAt: new Date(),
                owner: {
                    connect: {
                        id: userId
                    }
                },
                users: {
                    connect: {
                        id: userId
                    }
                }
            }
        })

        const workspaceFolder = await prisma.folder.create({
            data: {
                fullPath: "/",
                parentFolder: "",
                folderName: "/",
                workspaceId: newWorkspace.id
            }
        })
        
        return {workspaceId: newWorkspace.id, workspaceImageName, workspaceFolderId: workspaceFolder.id};
    }

    addFolder = async (newFolderName: string, folderToAdd: Folder, workspaceId: string, workspaceFolderId: string) => {
        const newFolder = await prisma.folder.create({
            data: {
                folderName: newFolderName,
                parentFolder: folderToAdd.folderName,
                fullPath: folderToAdd.fullPath == "/" ? newFolderName : folderToAdd.fullPath + "/" + newFolderName,
                Workspace: {
                    connect: {
                        id: workspaceId
                    }
                },
                parent: {
                    connect: {
                        id: workspaceFolderId
                    },
                },
            }
        })

        const folder: Folder = await prisma.folder.findFirst({
            include: {
                files: true,
                subFolders: {
                    include: {
                        files: true,
                    subFolders: true
                    }
                }
            },
            where: {
                id: newFolder.id
            }
        });
        
        return folder;
    }

    getWorkspaceFolder = async (workspaceFolderId: string) => {
        // Db will load up to 5 nested subfolder 
        const workspaceFolder = await prisma.folder.findFirst({
            include: {
                files: true,
                subFolders: {
                    include: {
                        files: true,
                        subFolders: {
                            include: {
                                files: true,
                                subFolders: {
                                    include: {
                                        files: true,
                                        subFolders: {
                                            include: {
                                                files: true,
                                                subFolders: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            where: {
                workspaceId: workspaceFolderId,
                fullPath: "/",
            }
        })

        return workspaceFolder;
    }

    addMessage = async (content: string, userId: string, workspaceId: string) => {
        const newMessage: WorkspaceMessage = await prisma.workspaceMessage.create({
            data: {
                content: content,
                user: {
                    connect: {
                        id: userId
                    }
                },
                workspace: {
                    connect: {
                        id: workspaceId
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        avatar: true,
                        username: true
                    }
                }
            }
        })

        return newMessage;
    }

    getWorkspaceMessages = async (workspaceFolderId: string) => { 
        const workspaceFolder: WorkspaceMessage[] = await prisma.workspaceMessage.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        avatar: true,
                        username: true,
                    }
                }
            },
            where: {
                workspaceId: workspaceFolderId,
            }
        })

        return workspaceFolder;
    }

    addFile = async (newFileName: string, folder: Folder, workspaceId: string) => {
        const newFile = await prisma.file.create({
            data: {
                path: folder.fullPath,
                fileName: newFileName,
                content: "",
                createdAt: new Date(),
                lastChange: new Date(),
                Folder: {
                    connect: {
                        id: folder.id
                    }
                }
            }
        })
        return newFile;
    }

    workspaceExists = async (workspaceInviteCode: string) => {
        const workspace = await prisma.workspace.findFirst({
            where: {
                inviteCode: workspaceInviteCode
            }
        })

        return workspace ? workspace : null;
    }

    userAlreadyOnWorkspace = async (userId: string, workspaceInviteCode: string) => {
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                workspacesOwned: {
                    where: {
                        inviteCode: workspaceInviteCode
                    }
                },
            }
        })

        return user.workspacesOwned.length != 0;
    }
    
    joinWorkspace = async (userId: string, workspaceInviteCode: string) => {
        const workspace = await prisma.workspace.findFirst({
            where: {
                inviteCode: workspaceInviteCode
            }
        });

        if(!workspace){
            return null;
        }

        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                workspaces: {
                    connect: {
                        id: workspace.id
                    }
                }
            }
        })

        workspace.workspaceImage = "http://localhost:3333" + workspace.workspaceImage;

        return workspace;
    }

    getWorkspaces = async (userId: string) => {       
        const w = await prisma.user.findFirst({
            where: {
                id: userId
            },
            select: { 
                workspaces: true
            }
        }) 
        if(!w) {
            return [];
        }

        const { workspaces } = w;

        workspaces.forEach(workspace => {
            workspace.workspaceImage = "http://localhost:3333" + workspace.workspaceImage;
        });

        return workspaces;
    }

    getWorkspaceById = async (workspaceId:string) => {
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: workspaceId
            }
        })

        workspace.workspaceImage = "http://localhost:3333" + workspace.workspaceImage;

        return workspace;
    }

    getAllWorkspaces = async () => {
        const workspaces = await prisma.workspace.findMany();

        workspaces.forEach(workspace => {
            workspace.workspaceImage = "http://localhost:3333" + workspace.workspaceImage;
        });

        return workspaces;
    }

    getWorkspaceUsers = async (workspaceId: string) => {
        const {users} = await prisma.workspace.findUnique({
            where: {
                id: workspaceId
            },
            include: {
                users: true
            }
        })

        users.sort((user1: User, user2: User) => {
            const aName = user1.username.toLocaleLowerCase();
            const bName = user2.username.toLocaleLowerCase(); 
            
            if (aName < bName) {
                return -1;
            }
            if (aName > bName) {
                return 1;
            }
            return 0;
        })

        return users;
    }

    renameFolder = async (newName: string, newFullPath: string, folderId: string) => {
        await prisma.folder.update({
            where: {
                id: folderId
            },
            data: {
                folderName: newName,
                fullPath: newFullPath
            }
        })
    }

    deleteFolder = async (folderId: string) => {
        await prisma.folder.deleteMany({
            where: {
                id: folderId
            }
        })
    }

    renameFile = async (newName: string, fileId: string) => {
        await prisma.file.update({
            where: {
                id: fileId
            },
            data: {
                fileName: newName,
                lastChange: new Date()
            }
        })
    }

    deleteFile = async (fileId: string) => {
        await prisma.file.deleteMany({
            where: {
                id: fileId
            }
        })
    }
}