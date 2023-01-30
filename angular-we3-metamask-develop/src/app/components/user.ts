export class User {
    address: string='';
    balance: string ='';
    public constructor(init?:Partial<User>) {
        Object.assign(this, init);
    }
    
}