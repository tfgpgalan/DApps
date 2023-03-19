
/*********************************************************************************
**
** Llamada al script desde package.json mediante 
**    npm run deploy <nombre_contrato> [parametros_constructores_contrato]
** Llamará a compile.js que devolverá el abi y el bytecode del contrato compilado.
** En datosProvider.json está la url del nodo y la private key que se utilizará
** para firmar la transacción de pespliege en el nodo.
** Se guardará el recibo de despliege en el fichero <nombrecontrato>.deployreceipt
**
**********************************************************************************/
const fs = require("fs");
const path = require("path")
const datosProvider = require("./datosProvider.json");
const Web3 = require('web3');
//Se ejecutará la compilación y me devuelve el abi y bytecode
const { abi, bytecode } = require('./compile');
const privateKey=datosProvider.privateKey;
const contractName=process.argv[2];
//Parametros del constructor del contrato.
const argumentsConstructor = JSON.parse(process.argv[3]);
const web3 = new Web3(datosProvider.providerUrl);
const publicAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;
(async () => {
    const gasEstimate = await new web3.eth.Contract(abi)
        .deploy({ data: bytecode, arguments: argumentsConstructor }).estimateGas({ from: publicAddress});
    //Creación de la transacción
    const transaction = await new web3.eth.Contract(abi).deploy({ data: bytecode, arguments: argumentsConstructor });
    let options = {
        to: transaction._parent._address,
        data: transaction.encodeABI(),
        gas: gasEstimate
    };
    //Firmamos la transacción con la clave privada
    let signedTransaction = await web3.eth.accounts.signTransaction(options, privateKey);
    //Mandar transacción firmada al nodo
    let receipt=await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    const freceipt=path.join(__dirname,`../${contractName}.deployreceipt`);
    fs.writeFileSync(freceipt, JSON.stringify(receipt,null,2), (err) => console.log);
    console.log(`Fichero recibo despliege:${freceipt}`);
    console.log(`Address contrato: ${receipt.contractAddress}`);
    process.exit(0);
})();

