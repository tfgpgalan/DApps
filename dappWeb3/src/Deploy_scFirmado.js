//Librería para tratar ficheros
let fs = require("fs");
let Web3 = require("web3");
//Compilador de solidity
const solc = require('solc')
const nodoUrl = 'HTTP://127.0.0.1:8545';
let web3 = new Web3(nodoUrl);
const address = '0x10000d3E30C7232dD42aA085A7fc0Ee350d28006'
const privateKey = '2dc4d0c6dd381b6e1130888a0b1abf8269121354252c8d3d59569a7c11f68ba7'
//Obtención de clave publica desde la privada
const publicAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;
if (address != publicAddress) {
    throw Error(`La dir (${address}) no corresponde con la public dir (${publicAddress}) del privateKey`);
}

run()

//await se puede poner dentro de function async.
//Básicamente await espera a que termine la promesa para tomar el valor
async function send(transaction) {
    let gas = await transaction.estimateGas({ from: address });
    //Vamos a tomar la siguiente transacción de la address
    let nonce = await web3.eth.getTransactionCount(address);
    //Para informar
    let gasPrice = await web3.eth.getGasPrice();
    console.log(`Gas estimado: ${gas} precio del gas ${gasPrice} nonce: ${nonce}`)
    let options = {
        nonce: nonce,
        to: transaction._parent._address,
        data: transaction.encodeABI(),
        gas: gas
    };
    //Firmamos la transacción con la clave privada
    let signedTransaction = await web3.eth.accounts.signTransaction(options, privateKey);
    //Enviamos la transacción firmada, devolviendo un receipt
    //https://web3js.readthedocs.io/en/v1.8.1/web3-eth.html#eth-gettransactionreceipt-return
    return await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
}

async function deploy(contractName, contractArgs) {
    //Leemos el fichero con el contrato
    const contentSc = fs.readFileSync(contractName + '.sol').toString()
    //Especifica las entradas y las salidas al compilador
    var objectSolc = {
        language: 'Solidity',
        sources: {
            'coches': {
                content: contentSc
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    }
    //La salida de la compilación tendrá el bytecode y el abi del contrato
    const output = JSON.parse(solc.compile(JSON.stringify(objectSolc)))
    const bytecodeContract = output.contracts.coches.Coches.evm.bytecode.object
    const abi = output.contracts.coches.Coches.abi;
    //Creamos un objeto Contract desde el abi devuelto
    let contract = new web3.eth.Contract(abi);
    //Enviamos el contrato desplegado, y nos devuelve el recibo del envío
    let receipt = await send(contract.deploy({ data: "0x" + bytecodeContract, arguments: contractArgs }), 0);

    console.log(`El contrato ${contractName} se desplegó en la dirección ${receipt.contractAddress}`);
    console.log(`en la transacción ${receipt.transactionHash}`);
    return new web3.eth.Contract(abi, receipt.contractAddress);
}

async function run() {
    //
    let myContract = await deploy("Coches", [100]);
    //Hacemos un send (requiere gasto, value=100) del método addCoche del sc desplegado
    //Creo la transacción que puede ser called, send, estimated, createAccessList or ABI encoded
    let addCocheTx = myContract.methods.addCoche('1', 'XXXMERCEDES', '555', '333');
    //Firmo la transacción
    const createTx = await web3.eth.accounts.signTransaction(
        {
            to: myContract.options.address,
            data: addCocheTx.encodeABI(),
            gas: await addCocheTx.estimateGas({ value: '100' }),
            value: '100'
        },
        privateKey

    )
    //Envío la transacción firmada
    const createReceipt = await web3.eth.sendSignedTransaction(createTx.rawTransaction);
    console.log(`Tx del método addCoche realizada hash: ${createReceipt.transactionHash}`);
    //Llamadas a método sin gasto, call
    myContract.methods.precio().call().then(console.log)
    myContract.methods.getCoche().call({from: address}).then(console.log)

}