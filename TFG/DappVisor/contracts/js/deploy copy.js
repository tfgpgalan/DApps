//console.log('process.argv', process.argv);
//Contiene la clave privada que firmará la transacción de despliegue del contrato y
//la url del nodo.
const datosProvider = require( "./datosProvider.json");
const contractName=process.argv[2];
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require('web3');
//Se ejecutará la compilación y me devuelve el abi y bytecode
const { abi, bytecode } = require('./compile');
const provider = new HDWalletProvider(datosProvider);
const web3 = new Web3(provider);
(async () => {
    const accounts = await web3.eth.getAccounts();
    //Parametros del constructor.
    const argumentsConstructor = [0, 'kWh', 3];
    const gasEstimate = await new web3.eth.Contract(abi)
        .deploy({ data: bytecode, arguments: argumentsConstructor }).estimateGas({ from: accounts[0] });

    const result = await new web3.eth.Contract(abi)
        .deploy({ data: bytecode, arguments: argumentsConstructor })
        .send({ gas: gasEstimate, from: accounts[0] })
    console.log(`Address contrato: ${result.options.address}`);
    process.exit(0);
})();


//0x25cc5f156990c6cb54962E5aB6621c90F5335D55
//0xe08fBfAD0f9E73806AFe9Df294DB38CC8487a892