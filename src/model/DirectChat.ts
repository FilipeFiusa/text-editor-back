import MainUser from "./MainUser"
import Message from "./Message";
import { DC, DirectMessage } from "./types";

export default class DirectChat {
    id: string;
    users: MainUser[];
    messages: DirectMessage[];

    // constructor(id: string, users: MainUser[], messages: Message[], ownerUser: MainUser){
    //     this.id = id;
    //     this.users = users;
    //     this.messages = messages;
    //     this.ownerUser = ownerUser;
    // }

    //constructor(directChat: DC);

    constructor(directChat: DC, starterUser: MainUser, secondUser: MainUser){
        this.id = directChat.id;
        this.users = [starterUser, secondUser];
        this.messages = [];
    }

    simplifyObject? = () =>{
        return {
            id: this.id,
            users: this.users.map((user) => {return user.simplifyObject()} ),
            messages: this.messages
        }
    }
}