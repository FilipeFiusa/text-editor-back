import User from "./User"

export default class Workspace{

    id: number
    name: string
    description: string
    createdAt: Date

    owner: User

    constructor(name: string, description: string, privacity: number, accessControl: number, owner: User){
        this.name = name;
        this.description = description;
        this.owner = owner;
    }
    
}