const nodoUrl = 'HTTP://127.0.0.1:8545';
const Web3 = require('web3')
const solc = require('solc')
//librería para leer ficheros.
const fs = require('fs')
var web3 = new Web3(nodoUrl);
const address1 = '0x10000d3E30C7232dD42aA085A7fc0Ee350d28006'
const contentSc = fs.readFileSync('Coches.sol').toString()
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
const output = JSON.parse(solc.compile(JSON.stringify(objectSolc)))
//Obtenemos el bytecode 
const bytecodeContract = output.contracts.coches.Coches.evm.bytecode.object
const abi = output.contracts.coches.Coches.abi;
var scCoches = new web3.eth.Contract(abi);
scCoches.deploy({
    data: '0x' + bytecodeContract,
    arguments: [100]
}).send({
    from: address1,
    gas: 6721975,
    gasPrice: '0'
}, function (error, transactionHash) { })
    .on('error', function (error) { console.log("Error: " + errror) })
    .on('transactionHash', function (transactionHash) { console.log("transactionHash: " + transactionHash) })
    .on('receipt', function (receipt) {
        console.log(receipt.contractAddress) // contains the new contract address

    })
    .then(function (newContractInstance) {
        console.log(newContractInstance.options.address) // instance with the new contract address
        newContractInstance.methods.addCoche('1', 'BMW', '98989', '7777').send({
            from: address1,
            gas: 6721975,
            gasPrice: '0',
            value: '100'
        })
        newContractInstance.methods.precio().call().then(console.log)

    });


