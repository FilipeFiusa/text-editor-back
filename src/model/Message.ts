export default class Message {
    id: number;
    icon: string;
    userName: string;
    content: string;

    constructor(id:number, icon:string, userName:string, content:string){
        this.id = id;
        this.icon = icon;
        this.userName = userName;
        this.content = content;
    }
}