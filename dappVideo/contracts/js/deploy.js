const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require('web3');
//Se ejecutará la compilación y me devuelve el abi y bytecode
const {abi,bytecode}=require('./compile');
//clave semilla,mnemonic es una frase para no tener que aprender la clave privada
//Lo cojo del ganache en la parte de arriba de la ventana
const nemonic='project boring organ brand share just imitate noodle burden entry vivid hope';
const provider=new HDWalletProvider(nemonic,'http://127.0.0.1:8545');
const web3=new Web3(provider);
const deploy= async () =>{
    const accounts=await web3.eth.getAccounts();
    //Parametros del constructor.
    const argumentsConstructor=[
        21000000,'PACO COIN',18,'PCOIN'
    ];
    const gasEstimate=await new web3.eth.Contract(abi)
    .deploy({data:bytecode, arguments: argumentsConstructor}).estimateGas({from: accounts[0]});

    const result=await new web3.eth.Contract(abi)
       .deploy({data:bytecode, arguments: argumentsConstructor})
       .send({gas: gasEstimate, from: accounts[0]})
    console.log(result.options.address);
}
deploy();
//0x25cc5f156990c6cb54962E5aB6621c90F5335D55