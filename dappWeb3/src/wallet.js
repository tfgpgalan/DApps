const Web3 = require("web3");
//Sin proveedor
const web3 = new Web3();
const accounts=web3.eth.accounts
const cuenta1=accounts.create()
//La encriptación devuelve un keystore
const keyStore_pkEncriptada= web3.eth.accounts.encrypt(cuenta1.privateKey, 'Mipassword');
console.log(keyStore_pkEncriptada)
const cuenta1_devuelta=web3.eth.accounts.decrypt(keyStore_pkEncriptada,'Mipassword');
console.log(cuenta1)
console.log(cuenta1_devuelta)
console.log("WALLET CREADA ***************")
let Wallet=web3.eth.accounts.wallet.create(2)
console.log(Wallet.length)
for (i=0;i<Wallet.length;i++){
    console.log(Wallet[i])
}
