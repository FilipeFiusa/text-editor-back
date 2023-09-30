import MainUser from "./MainUser"
import Message from "./Message";
import { User } from "./types";

export default class DirectChat {
    id: string;
    users: MainUser[];
    messages: Message[];
    ownerUser: MainUser;

    constructor(id: string, users: MainUser[], messages: Message[], ownerUser: MainUser){
        this.id = id;
        this.users = users;
        this.messages = messages;
        this.ownerUser = ownerUser;
    }

    simplifyObject(){
        return {
            id: this.id,
            users: this.users.map((user) => {return user.simplifyObject()} ),
            messages: this.messages
        }
    }
}